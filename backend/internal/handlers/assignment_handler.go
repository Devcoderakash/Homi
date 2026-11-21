package handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"

	"homi-backend/internal/middleware"
	"homi-backend/internal/services"
	"homi-backend/internal/utils"
)

type AssignmentHandler struct {
	assignmentSvc *services.AssignmentService
}

func NewAssignmentHandler(assignmentSvc *services.AssignmentService) *AssignmentHandler {
	return &AssignmentHandler{assignmentSvc: assignmentSvc}
}

type ConfirmAssignmentInput struct {
	WorkerID *uint `json:"workerId"`
}

// ConfirmAssignment confirms technician assignment after customer approval
func (h *AssignmentHandler) ConfirmAssignment(c *gin.Context) {
	reqIDParam := c.Param("id")
	reqID, err := strconv.ParseUint(reqIDParam, 10, 32)
	if err != nil {
		utils.SendBadRequest(c, "Invalid request ID")
		return
	}

	var input ConfirmAssignmentInput
	_ = c.ShouldBindJSON(&input)

	admin := middleware.GetCurrentUser(c)
	var adminID uint = 423
	if admin != nil {
		adminID = admin.ID
	}

	assignment, req, err := h.assignmentSvc.ConfirmAssignment(uint(reqID), adminID, input.WorkerID)
	if err != nil {
		utils.SendBadRequest(c, err.Error())
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"ok":            true,
		"message":       "Worker assignment confirmed successfully. Request is now ASSIGNED.",
		"assignment":    assignment,
		"request":       req,
		"requestStatus": req.Status,
	})
}

// ListAssignments returns confirmed technician assignments
func (h *AssignmentHandler) ListAssignments(c *gin.Context) {
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	if page < 1 {
		page = 1
	}
	offset := (page - 1) * limit

	assignments, total, err := h.assignmentSvc.ListAssignments(limit, offset)
	if err != nil {
		utils.SendInternalError(c, err.Error())
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"ok":          true,
		"assignments": assignments,
		"total":       total,
		"page":        page,
		"limit":       limit,
	})
}

type CompleteWorkInput struct {
	CompletionNote string `json:"completionNote"`
}

// MarkWorkCompleted allows admin to complete the service work and activate customer payment
func (h *AssignmentHandler) MarkWorkCompleted(c *gin.Context) {
	reqIDParam := c.Param("id")
	reqID, err := strconv.ParseUint(reqIDParam, 10, 32)
	if err != nil {
		utils.SendBadRequest(c, "Invalid request ID")
		return
	}

	var input CompleteWorkInput
	_ = c.ShouldBindJSON(&input)

	admin := middleware.GetCurrentUser(c)
	var adminID uint = 423
	if admin != nil {
		adminID = admin.ID
	}

	req, assign, payment, err := h.assignmentSvc.MarkWorkCompleted(uint(reqID), adminID, input.CompletionNote)
	if err != nil {
		utils.SendBadRequest(c, err.Error())
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"ok":            true,
		"message":       "Work marked as COMPLETED. Customer payment section activated.",
		"request":       req,
		"requestStatus": req.Status,
		"assignment":    assign,
		"payment":       payment,
		"paymentStatus": req.PaymentStatus,
	})
}

// MarkWorkInProgress allows admin to mark work in progress
func (h *AssignmentHandler) MarkWorkInProgress(c *gin.Context) {
	reqIDParam := c.Param("id")
	reqID, err := strconv.ParseUint(reqIDParam, 10, 32)
	if err != nil {
		utils.SendBadRequest(c, "Invalid request ID")
		return
	}

	var input CompleteWorkInput
	_ = c.ShouldBindJSON(&input)

	admin := middleware.GetCurrentUser(c)
	var adminID uint = 423
	if admin != nil {
		adminID = admin.ID
	}

	req, assign, err := h.assignmentSvc.MarkWorkInProgress(uint(reqID), adminID, input.CompletionNote)
	if err != nil {
		utils.SendBadRequest(c, err.Error())
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"ok":            true,
		"message":       "Work marked as IN_PROGRESS.",
		"request":       req,
		"requestStatus": req.Status,
		"assignment":    assign,
	})
}

