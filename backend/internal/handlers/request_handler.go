package handlers

import (
	"fmt"
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"

	"homi-backend/internal/middleware"
	"homi-backend/internal/models"
	"homi-backend/internal/services"
	"homi-backend/internal/utils"
)

type RequestHandler struct {
	requestSvc *services.RequestService
	authSvc    *services.AuthService
}

func NewRequestHandler(requestSvc *services.RequestService, authSvc *services.AuthService) *RequestHandler {
	return &RequestHandler{requestSvc: requestSvc, authSvc: authSvc}
}

func (h *RequestHandler) CreateRequest(c *gin.Context) {
	var input services.CreateRequestInput
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.SendBadRequest(c, err.Error())
		return
	}

	// Anti-bot honeypot check
	if strings.TrimSpace(input.Honeypot) != "" {
		c.JSON(http.StatusOK, gin.H{
			"id":     999999,
			"status": "submitted",
			"isDemo": false,
		})
		return
	}

	user := middleware.GetCurrentUser(c)
	var customerID uint
	var sessionToken string

	if user != nil {
		customerID = user.ID
	} else {
		// Guest submission: register temporary customer user
		contactName := input.ContactName
		if contactName == "" {
			contactName = "Guest Customer"
		}
		contactPhone := input.ContactPhone
		if contactPhone == "" {
			contactPhone = "+919999999999"
		}

		guestEmail := fmt.Sprintf("guest-%s@homi.local", utils.GenerateRandomString(6))
		guestUser, token, err := h.authSvc.Register(services.RegisterInput{
			Name:     contactName,
			Email:    guestEmail,
			Phone:    contactPhone,
			Password: utils.GenerateRandomString(12),
			City:     &input.City,
			Address:  &input.Address,
		})
		if err != nil {
			utils.SendBadRequest(c, "Failed to create customer session: "+err.Error())
			return
		}
		customerID = guestUser.ID
		sessionToken = token
		isSecure := c.Request.TLS != nil || c.GetHeader("X-Forwarded-Proto") == "https"
		c.SetSameSite(http.SameSiteLaxMode)
		c.SetCookie("homi_session", token, 30*24*3600, "/", "", isSecure, true)
		c.SetCookie("token", token, 30*24*3600, "/", "", isSecure, true)
	}

	req, err := h.requestSvc.CreateRequest(customerID, input)
	if err != nil {
		utils.SendBadRequest(c, err.Error())
		return
	}

	resp := gin.H{
		"ok":      true,
		"id":      req.ID,
		"request": req,
	}
	if sessionToken != "" {
		resp["token"] = sessionToken
	}

	c.JSON(http.StatusCreated, resp)
}

func (h *RequestHandler) ListRequests(c *gin.Context) {
	user := middleware.GetCurrentUser(c)

	scope := c.Query("scope")
	category := c.Query("category")
	if category == "" {
		category = c.Query("service")
	}
	status := c.Query("status")
	search := c.Query("q")
	if search == "" {
		search = c.Query("search")
	}

	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	if page < 1 {
		page = 1
	}
	offset := (page - 1) * limit

	filter := services.RequestFilter{
		Scope:    scope,
		Category: category,
		Status:   status,
		Search:   search,
		Limit:    limit,
		Offset:   offset,
	}

	// Enforce authentication & role scoping
	if user == nil {
		utils.SendUnauthorized(c, "Authentication required to view requests")
		return
	}
	if user.Role != "admin" {
		filter.CustomerID = &user.ID
	}

	requests, total, err := h.requestSvc.ListRequests(filter)
	if err != nil {
		utils.SendInternalError(c, err.Error())
		return
	}

	var customerIDFilter *uint
	if user != nil && user.Role != "admin" {
		customerIDFilter = &user.ID
	}

	counts := h.requestSvc.GetCounts(customerIDFilter)
	pendingQuotations, _ := h.requestSvc.ListPendingQuotations(customerIDFilter)
	hasMore := total > int64(offset+len(requests))

	// Privacy enforcement: non-admins must never receive internal worker details or WhatsApp bids
	if user == nil || user.Role != "admin" {
		sanitizedRequests := make([]models.ServiceRequest, len(requests))
		for i := range requests {
			sanitizedRequests[i] = utils.SanitizeRequestForCustomer(&requests[i])
		}
		requests = sanitizedRequests

		sanitizedPending := make([]models.ServiceRequest, len(pendingQuotations))
		for i := range pendingQuotations {
			sanitizedPending[i] = utils.SanitizeRequestForCustomer(&pendingQuotations[i])
		}
		pendingQuotations = sanitizedPending
	}

	c.JSON(http.StatusOK, gin.H{
		"ok":                true,
		"requests":          requests,
		"pendingQuotations": pendingQuotations,
		"counts":            counts,
		"total":             total,
		"page":              page,
		"limit":             limit,
		"hasMore":           hasMore,
	})
}

func (h *RequestHandler) GetRequestByID(c *gin.Context) {
	idParam := c.Param("id")
	id, err := strconv.ParseUint(idParam, 10, 32)
	if err != nil {
		utils.SendBadRequest(c, "Invalid request ID")
		return
	}

	req, err := h.requestSvc.GetRequestByID(uint(id))
	if err != nil {
		utils.SendNotFound(c, err.Error())
		return
	}

	user := middleware.GetCurrentUser(c)
	if user == nil {
		utils.SendUnauthorized(c, "Authentication required to view service request details")
		return
	}
	// If authenticated non-admin, verify ownership
	if user.Role != "admin" && req.CustomerID != user.ID {
		utils.SendForbidden(c, "Access denied: this request belongs to another account")
		return
	}

	isAdmin := user != nil && user.Role == "admin"
	if !isAdmin {
		// Strict Customer Privacy:
		// Worker identity is completely stripped before official technician assignment.
		// Internal WhatsApp quotes are never sent to the customer.
		sanitizedReq := utils.SanitizeRequestForCustomer(req)

		var customerQuotation *models.CustomerFacingQuotation
		if req.LatestQuotation != nil {
			cfq := req.LatestQuotation.ToCustomerFacing()
			customerQuotation = &cfq
		}

		c.JSON(http.StatusOK, gin.H{
			"ok":          true,
			"request":     sanitizedReq,
			"quotation":   customerQuotation,
			"assignment":  sanitizedReq.Assignment,
			"payment":     sanitizedReq.Payment,
			"quotes":      nil,
			"photos":      sanitizedReq.Images,
			"participant": true,
			"messages":    []gin.H{},
			"events":      []gin.H{},
		})
		return
	}

	// Admin receives full internal operational data including all technician quotes & details
	c.JSON(http.StatusOK, gin.H{
		"ok":          true,
		"request":     req,
		"quotation":   req.LatestQuotation,
		"assignment":  req.Assignment,
		"payment":     req.Payment,
		"quotes":      req.WorkerQuotes,
		"photos":      req.Images,
		"participant": true,
		"messages":    []gin.H{},
		"events":      []gin.H{},
	})
}

type UpdateStatusInput struct {
	Status string `json:"status" binding:"required"`
	Notes  string `json:"notes"`
}

func (h *RequestHandler) UpdateStatus(c *gin.Context) {
	idParam := c.Param("id")
	id, err := strconv.ParseUint(idParam, 10, 32)
	if err != nil {
		utils.SendBadRequest(c, "Invalid request ID")
		return
	}

	var input UpdateStatusInput
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.SendBadRequest(c, "Status is required")
		return
	}

	user := middleware.GetCurrentUser(c)
	if user == nil {
		utils.SendUnauthorized(c, "Authentication required to update request status")
		return
	}

	normalizedInput := utils.NormalizeStatus(input.Status)
	var adminID *uint
	if user.Role == "admin" {
		adminID = &user.ID
	} else {
		// Non-admins can only cancel their own request
		req, err := h.requestSvc.GetRequestByID(uint(id))
		if err != nil {
			utils.SendNotFound(c, "Service request not found")
			return
		}
		if req.CustomerID != user.ID {
			utils.SendForbidden(c, "Access denied: cannot change status of another customer's request")
			return
		}
		if normalizedInput != models.StatusCancelled {
			utils.SendForbidden(c, "Customers may only cancel requests. Operational status changes require administrator privileges.")
			return
		}
	}

	updated, err := h.requestSvc.UpdateStatus(uint(id), input.Status, adminID, input.Notes)
	if err != nil {
		utils.SendBadRequest(c, err.Error())
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"ok":      true,
		"request": updated,
	})
}

func (h *RequestHandler) applyAdminStatus(c *gin.Context, targetStatus, notes string) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 32)
	if err != nil {
		utils.SendBadRequest(c, "Invalid request ID")
		return
	}
	user := middleware.GetCurrentUser(c)
	if user == nil || user.Role != "admin" {
		utils.SendForbidden(c, "Administrator privileges required")
		return
	}
	adminID := user.ID
	updated, err := h.requestSvc.UpdateStatus(uint(id), targetStatus, &adminID, notes)
	if err != nil {
		utils.SendBadRequest(c, err.Error())
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"ok":      true,
		"request": updated,
	})
}

// PublishRequest approves and shares a service request with local workers
func (h *RequestHandler) PublishRequest(c *gin.Context) {
	var body struct {
		Notes string `json:"notes"`
	}
	_ = c.ShouldBindJSON(&body)
	h.applyAdminStatus(c, models.StatusSharedWithWorkers, body.Notes)
}

// RejectRequest declines a service request with an admin reason
func (h *RequestHandler) RejectRequest(c *gin.Context) {
	var body struct {
		Reason string `json:"reason"`
		Notes  string `json:"notes"`
	}
	_ = c.ShouldBindJSON(&body)
	reason := strings.TrimSpace(body.Reason)
	if reason == "" {
		reason = strings.TrimSpace(body.Notes)
	}
	h.applyAdminStatus(c, models.StatusRejected, reason)
}

func (h *RequestHandler) UploadPhotos(c *gin.Context) {
	idParam := c.Param("id")
	id, err := strconv.ParseUint(idParam, 10, 32)
	if err != nil {
		utils.SendBadRequest(c, "Invalid request ID")
		return
	}

	req, err := h.requestSvc.GetRequestByID(uint(id))
	if err != nil {
		utils.SendNotFound(c, "Service request not found")
		return
	}

	user := middleware.GetCurrentUser(c)
	if user == nil {
		utils.SendUnauthorized(c, "Authentication required to upload photos")
		return
	}
	if user.Role != "admin" && req.CustomerID != user.ID {
		utils.SendForbidden(c, "Access denied: cannot upload photos to another customer's request")
		return
	}

	form, err := c.MultipartForm()
	if err != nil {
		utils.SendBadRequest(c, "Failed to parse multipart form")
		return
	}

	files := form.File["photos"]
	if len(files) == 0 {
		files = form.File["file"]
	}
	if len(files) == 0 {
		utils.SendBadRequest(c, "No photo files provided")
		return
	}

	saved, err := h.requestSvc.UploadRequestImages(uint(id), files)
	if err != nil {
		utils.SendInternalError(c, err.Error())
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"ok":     true,
		"photos": saved,
	})
}

func (h *RequestHandler) PatchRequest(c *gin.Context) {
	// Compatibility handler for legacy PATCH /api/requests/:id
	idParam := c.Param("id")
	id, err := strconv.ParseUint(idParam, 10, 32)
	if err != nil {
		utils.SendBadRequest(c, "Invalid request ID")
		return
	}

	req, err := h.requestSvc.GetRequestByID(uint(id))
	if err != nil {
		utils.SendNotFound(c, "Service request not found")
		return
	}

	user := middleware.GetCurrentUser(c)
	if user == nil {
		utils.SendUnauthorized(c, "Authentication required to modify request")
		return
	}

	// Non-admin can only act on their own requests
	if user.Role != "admin" && req.CustomerID != user.ID {
		utils.SendForbidden(c, "Access denied: cannot modify another customer's request")
		return
	}

	var body map[string]interface{}
	_ = c.ShouldBindJSON(&body)

	action, _ := body["action"].(string)
	if action == "cancel" {
		uid := user.ID
		updated, err := h.requestSvc.UpdateStatus(uint(id), models.StatusCancelled, &uid, "Cancelled by user")
		if err != nil {
			utils.SendBadRequest(c, err.Error())
			return
		}
		c.JSON(http.StatusOK, gin.H{"ok": true, "request": updated})
		return
	}

	c.JSON(http.StatusOK, gin.H{"ok": true})
}
