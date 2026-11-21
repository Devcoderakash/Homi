package handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"

	"homi-backend/internal/middleware"
	"homi-backend/internal/models"
	"homi-backend/internal/services"
	"homi-backend/internal/utils"
)

type QuotationHandler struct {
	quotationSvc *services.QuotationService
}

func NewQuotationHandler(quotationSvc *services.QuotationService) *QuotationHandler {
	return &QuotationHandler{quotationSvc: quotationSvc}
}

// CreateWorkerQuote records quotation received from technician via WhatsApp group
func (h *QuotationHandler) CreateWorkerQuote(c *gin.Context) {
	admin := middleware.GetCurrentUser(c)
	if admin == nil || admin.Role != "admin" {
		utils.SendForbidden(c, "Administrator privileges required to record technician quotes")
		return
	}

	idParam := c.Param("id")
	requestID, err := strconv.ParseUint(idParam, 10, 32)
	if err != nil {
		utils.SendBadRequest(c, "Invalid request ID")
		return
	}

	var input services.WorkerQuoteInput
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.SendBadRequest(c, err.Error())
		return
	}

	quote, err := h.quotationSvc.CreateWorkerQuote(uint(requestID), input)
	if err != nil {
		utils.SendBadRequest(c, err.Error())
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"ok":      true,
		"message": "Technician quote recorded successfully",
		"quote":   quote,
	})
}

// ListWorkerQuotes returns all technician quotes submitted for a request
func (h *QuotationHandler) ListWorkerQuotes(c *gin.Context) {
	admin := middleware.GetCurrentUser(c)
	if admin == nil || admin.Role != "admin" {
		utils.SendForbidden(c, "Administrator privileges required to view internal technician quotations")
		return
	}

	idParam := c.Param("id")
	requestID, err := strconv.ParseUint(idParam, 10, 32)
	if err != nil {
		utils.SendBadRequest(c, "Invalid request ID")
		return
	}

	quotes, err := h.quotationSvc.ListWorkerQuotes(uint(requestID))
	if err != nil {
		utils.SendInternalError(c, err.Error())
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"ok":     true,
		"quotes": quotes,
	})
}

// UpdateWorkerQuote modifies an existing worker quote
func (h *QuotationHandler) UpdateWorkerQuote(c *gin.Context) {
	admin := middleware.GetCurrentUser(c)
	if admin == nil || admin.Role != "admin" {
		utils.SendForbidden(c, "Administrator privileges required to modify technician quotes")
		return
	}

	quoteIDParam := c.Param("quoteId")
	if quoteIDParam == "" {
		quoteIDParam = c.Param("id")
	}
	quoteID, err := strconv.ParseUint(quoteIDParam, 10, 32)
	if err != nil {
		utils.SendBadRequest(c, "Invalid quote ID")
		return
	}

	var input services.WorkerQuoteInput
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.SendBadRequest(c, err.Error())
		return
	}

	updated, err := h.quotationSvc.UpdateWorkerQuote(uint(quoteID), input)
	if err != nil {
		utils.SendBadRequest(c, err.Error())
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"ok":    true,
		"quote": updated,
	})
}

// DeleteWorkerQuote removes a worker quote
func (h *QuotationHandler) DeleteWorkerQuote(c *gin.Context) {
	admin := middleware.GetCurrentUser(c)
	if admin == nil || admin.Role != "admin" {
		utils.SendForbidden(c, "Administrator privileges required to delete technician quotes")
		return
	}

	quoteIDParam := c.Param("quoteId")
	if quoteIDParam == "" {
		quoteIDParam = c.Param("id")
	}
	quoteID, err := strconv.ParseUint(quoteIDParam, 10, 32)
	if err != nil {
		utils.SendBadRequest(c, "Invalid quote ID")
		return
	}

	if err := h.quotationSvc.DeleteWorkerQuote(uint(quoteID)); err != nil {
		utils.SendInternalError(c, err.Error())
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"ok":      true,
		"message": "Quote deleted successfully",
	})
}

// SelectPreferredQuote marks one technician quote as preferred and sets request to WORKER_SELECTED
func (h *QuotationHandler) SelectPreferredQuote(c *gin.Context) {
	reqIDParam := c.Param("id")
	reqID, err := strconv.ParseUint(reqIDParam, 10, 32)
	if err != nil {
		utils.SendBadRequest(c, "Invalid request ID")
		return
	}

	quoteIDParam := c.Param("quoteId")
	quoteID, err := strconv.ParseUint(quoteIDParam, 10, 32)
	if err != nil {
		utils.SendBadRequest(c, "Invalid quote ID")
		return
	}

	admin := middleware.GetCurrentUser(c)
	if admin == nil || admin.Role != "admin" {
		utils.SendForbidden(c, "Administrator privileges required to prepare customer quotation")
		return
	}
	adminID := admin.ID

	quote, req, err := h.quotationSvc.SelectPreferredWorkerQuote(uint(reqID), uint(quoteID), adminID)
	if err != nil {
		utils.SendBadRequest(c, err.Error())
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"ok":            true,
		"message":       "Preferred worker selected successfully. You can now prepare and send the final customer quotation.",
		"quote":         quote,
		"request":       req,
		"requestStatus": req.Status,
	})
}

// SendCustomerQuotation performs backend math validation and sends quotation to customer
func (h *QuotationHandler) SendCustomerQuotation(c *gin.Context) {
	reqIDParam := c.Param("id")
	reqID, err := strconv.ParseUint(reqIDParam, 10, 32)
	if err != nil {
		utils.SendBadRequest(c, "Invalid request ID")
		return
	}

	var input services.CustomerQuotationInput
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.SendBadRequest(c, err.Error())
		return
	}

	admin := middleware.GetCurrentUser(c)
	if admin == nil || admin.Role != "admin" {
		utils.SendForbidden(c, "Administrator privileges required to prepare customer quotation")
		return
	}
	adminID := admin.ID

	quotation, req, err := h.quotationSvc.SendCustomerQuotation(uint(reqID), input, adminID)
	if err != nil {
		utils.SendBadRequest(c, err.Error())
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"ok":            true,
		"message":       "Official quotation created and sent to customer for review.",
		"quotation":     quotation,
		"request":       req,
		"requestStatus": req.Status,
	})
}

type CustomerDecisionInput struct {
	Decision string `json:"decision" binding:"required"` // accept or decline
	Reason   string `json:"reason"`
}

// CustomerDecision processes customer acceptance or decline
func (h *QuotationHandler) CustomerDecision(c *gin.Context) {
	reqIDParam := c.Param("id")
	reqID, err := strconv.ParseUint(reqIDParam, 10, 32)
	if err != nil {
		utils.SendBadRequest(c, "Invalid request ID")
		return
	}

	var input CustomerDecisionInput
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.SendBadRequest(c, "Decision ('accept' or 'decline') is required")
		return
	}

	user := middleware.GetCurrentUser(c)
	if user == nil {
		utils.SendUnauthorized(c, "Authentication required to review quotation")
		return
	}

	req, err := h.quotationSvc.CustomerDecision(uint(reqID), user.ID, input.Decision, input.Reason)
	if err != nil {
		utils.SendBadRequest(c, err.Error())
		return
	}

	var responseReq any = req
	if user.Role != "admin" {
		sanitized := utils.SanitizeRequestForCustomer(req)
		responseReq = sanitized
	}

	c.JSON(http.StatusOK, gin.H{
		"ok":            true,
		"decision":      input.Decision,
		"request":       responseReq,
		"requestStatus": req.Status,
	})
}

// GetLatestQuotation returns the latest customer quotation for a given request
func (h *QuotationHandler) GetLatestQuotation(c *gin.Context) {
	idParam := c.Param("id")
	requestID, err := strconv.ParseUint(idParam, 10, 32)
	if err != nil {
		utils.SendBadRequest(c, "Invalid request ID")
		return
	}

	quote, err := h.quotationSvc.GetLatestQuotation(uint(requestID))
	if err != nil {
		utils.SendNotFound(c, "Quotation not found for this request")
		return
	}

	user := middleware.GetCurrentUser(c)
	if user == nil || user.Role != "admin" {
		c.JSON(http.StatusOK, gin.H{
			"ok":        true,
			"quotation": quote.ToCustomerFacing(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"ok":        true,
		"quotation": quote,
	})
}

// ListCustomerQuotations returns all quotations sent to the logged-in customer
func (h *QuotationHandler) ListCustomerQuotations(c *gin.Context) {
	user := middleware.GetCurrentUser(c)
	if user == nil {
		utils.SendUnauthorized(c, "Authentication required")
		return
	}

	quotes, err := h.quotationSvc.ListCustomerQuotations(user.ID)
	if err != nil {
		utils.SendInternalError(c, err.Error())
		return
	}

	customerQuotes := make([]models.CustomerFacingQuotation, len(quotes))
	for i, q := range quotes {
		customerQuotes[i] = q.ToCustomerFacing()
	}

	c.JSON(http.StatusOK, gin.H{
		"ok":         true,
		"quotations": customerQuotes,
	})
}
