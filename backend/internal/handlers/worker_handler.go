package handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"

	"homi-backend/internal/services"
	"homi-backend/internal/utils"
)

type WorkerHandler struct {
	workerSvc *services.WorkerService
}

func NewWorkerHandler(workerSvc *services.WorkerService) *WorkerHandler {
	return &WorkerHandler{workerSvc: workerSvc}
}

// ListWorkers returns verified technicians
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

	c.JSON(http.StatusOK, gin.H{
		"ok":      true,
		"workers": workers,
		"count":   len(workers),
	})
}

// GetWorkerByID returns worker profile
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

	c.JSON(http.StatusOK, gin.H{
		"ok":     true,
		"worker": worker,
	})
}

// ToggleAvailability toggles whether worker is currently active/accepting jobs
func (h *WorkerHandler) ToggleAvailability(c *gin.Context) {
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
