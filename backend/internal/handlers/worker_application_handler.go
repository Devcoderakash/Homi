package handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"

	"homi-backend/internal/middleware"
	"homi-backend/internal/services"
	"homi-backend/internal/utils"
)

type WorkerApplicationHandler struct {
	appSvc *services.WorkerApplicationService
}

func NewWorkerApplicationHandler(appSvc *services.WorkerApplicationService) *WorkerApplicationHandler {
	return &WorkerApplicationHandler{appSvc: appSvc}
}

// SubmitApplication handles public submissions from "Become a Worker"
func (h *WorkerApplicationHandler) SubmitApplication(c *gin.Context) {
	var input services.PublicApplicationInput
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.SendBadRequest(c, err.Error())
		return
	}

	app, err := h.appSvc.SubmitApplication(input)
	if err != nil {
		utils.SendBadRequest(c, err.Error())
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"ok":            true,
		"message":       "Your application has been received. Our team will review your profile and contact you soon.",
		"application":   app,
		"applicationId": app.ID,
	})
}

// ListApplications retrieves submitted worker applications (admin only)
func (h *WorkerApplicationHandler) ListApplications(c *gin.Context) {
	status := c.Query("status")
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	if page < 1 {
		page = 1
	}
	offset := (page - 1) * limit

	apps, total, err := h.appSvc.ListApplications(status, limit, offset)
	if err != nil {
		utils.SendInternalError(c, err.Error())
		return
	}

	// Also format proposals key for legacy admin frontend compatibility
	c.JSON(http.StatusOK, gin.H{
		"ok":           true,
		"applications": apps,
		"proposals":    apps,
		"total":        total,
		"page":         page,
		"limit":        limit,
	})
}

// GetApplicationByID retrieves single worker application
func (h *WorkerApplicationHandler) GetApplicationByID(c *gin.Context) {
	idParam := c.Param("id")
	id, err := strconv.ParseUint(idParam, 10, 32)
	if err != nil {
		utils.SendBadRequest(c, "Invalid application ID")
		return
	}

	app, err := h.appSvc.GetApplicationByID(uint(id))
	if err != nil {
		utils.SendNotFound(c, err.Error())
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"ok":          true,
		"application": app,
		"proposal":    app,
	})
}

type ReviewApplicationInput struct {
	Notes string `json:"notes"`
}

// ApproveApplication approves an application and registers an active worker
func (h *WorkerApplicationHandler) ApproveApplication(c *gin.Context) {
	idParam := c.Param("id")
	id, err := strconv.ParseUint(idParam, 10, 32)
	if err != nil {
		utils.SendBadRequest(c, "Invalid application ID")
		return
	}

	var input ReviewApplicationInput
	_ = c.ShouldBindJSON(&input)

	admin := middleware.GetCurrentUser(c)
	var adminID uint = 423
	if admin != nil {
		adminID = admin.ID
	}

	worker, err := h.appSvc.ApproveApplication(uint(id), adminID, input.Notes)
	if err != nil {
		utils.SendBadRequest(c, err.Error())
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"ok":      true,
		"message": "Worker application approved successfully. Official worker profile created.",
		"worker":  worker,
	})
}

// RejectApplication marks an application as rejected
func (h *WorkerApplicationHandler) RejectApplication(c *gin.Context) {
	idParam := c.Param("id")
	id, err := strconv.ParseUint(idParam, 10, 32)
	if err != nil {
		utils.SendBadRequest(c, "Invalid application ID")
		return
	}

	var input ReviewApplicationInput
	_ = c.ShouldBindJSON(&input)

	admin := middleware.GetCurrentUser(c)
	var adminID uint = 423
	if admin != nil {
		adminID = admin.ID
	}

	app, err := h.appSvc.RejectApplication(uint(id), adminID, input.Notes)
	if err != nil {
		utils.SendBadRequest(c, err.Error())
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"ok":          true,
		"message":     "Worker application has been marked as rejected.",
		"application": app,
	})
}
