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

type WorkerHandler struct {
	workerSvc *services.WorkerService
}

func NewWorkerHandler(workerSvc *services.WorkerService) *WorkerHandler {
	return &WorkerHandler{workerSvc: workerSvc}
}

// ListWorkers returns verified technicians (sanitized for public, full details for admins)
func (h *WorkerHandler) ListWorkers(c *gin.Context) {
	specialty := c.Query("specialty")
	if specialty == "" {
		specialty = c.Query("category")
	}
	city := c.Query("city")
	availableStr := c.Query("available")
	availableOnly := availableStr == "true" || availableStr == "1"

	workers, err := h.workerSvc.ListWorkers(specialty, city, availableOnly)
	if err != nil {
		utils.SendInternalError(c, err.Error())
		return
	}

	user := middleware.GetCurrentUser(c)
	isAdmin := user != nil && user.Role == "admin"

	if !isAdmin {
		sanitized := make([]models.Worker, len(workers))
		for i := range workers {
			sanitized[i] = utils.SanitizeWorkerForPublic(&workers[i])
		}
		c.JSON(http.StatusOK, gin.H{
			"ok":      true,
			"workers": sanitized,
			"count":   len(sanitized),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"ok":      true,
		"workers": workers,
		"count":   len(workers),
	})
}

// GetWorkerByID returns worker profile (sanitized for public, full details for admins)
func (h *WorkerHandler) GetWorkerByID(c *gin.Context) {
	idParam := c.Param("id")
	id, err := strconv.ParseUint(idParam, 10, 32)
	if err != nil {
		utils.SendBadRequest(c, "Invalid worker ID")
		return
	}

	worker, err := h.workerSvc.GetWorkerByID(uint(id))
	if err != nil {
		utils.SendNotFound(c, err.Error())
		return
	}

	user := middleware.GetCurrentUser(c)
	isAdmin := user != nil && user.Role == "admin"

	if !isAdmin {
		safeWorker := utils.SanitizeWorkerForPublic(worker)
		c.JSON(http.StatusOK, gin.H{
			"ok":      true,
			"worker":  safeWorker,
			"reviews": []gin.H{},
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"ok":      true,
		"worker":  worker,
		"reviews": []gin.H{},
	})
}

// ToggleAvailability toggles whether worker is currently active/accepting jobs
func (h *WorkerHandler) ToggleAvailability(c *gin.Context) {
	admin := middleware.GetCurrentUser(c)
	if admin == nil || admin.Role != "admin" {
		utils.SendForbidden(c, "Administrator privileges required to toggle worker availability")
		return
	}

	idParam := c.Param("id")
	id, err := strconv.ParseUint(idParam, 10, 32)
	if err != nil {
		utils.SendBadRequest(c, "Invalid worker ID")
		return
	}

	worker, err := h.workerSvc.ToggleAvailability(uint(id))
	if err != nil {
		utils.SendBadRequest(c, err.Error())
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"ok":      true,
		"message": "Worker availability updated",
		"worker":  worker,
	})
}

// DeleteWorker permanently removes a worker from the roster
func (h *WorkerHandler) DeleteWorker(c *gin.Context) {
	admin := middleware.GetCurrentUser(c)
	if admin == nil || admin.Role != "admin" {
		utils.SendForbidden(c, "Administrator privileges required to delete workers")
		return
	}

	idParam := c.Param("id")
	id, err := strconv.ParseUint(idParam, 10, 32)
	if err != nil {
		utils.SendBadRequest(c, "Invalid worker ID")
		return
	}

	if err := h.workerSvc.DeleteWorker(uint(id)); err != nil {
		utils.SendInternalError(c, err.Error())
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"ok":      true,
		"message": "Worker removed successfully",
	})
}
