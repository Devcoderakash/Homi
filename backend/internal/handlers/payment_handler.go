package handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"

	"homi-backend/internal/middleware"
	"homi-backend/internal/services"
	"homi-backend/internal/utils"
)

type PaymentHandler struct {
	paymentSvc *services.PaymentService
}

func NewPaymentHandler(paymentSvc *services.PaymentService) *PaymentHandler {
	return &PaymentHandler{paymentSvc: paymentSvc}
}

// GetPaymentSettings returns active UPI and Bank account configurations
func (h *PaymentHandler) GetPaymentSettings(c *gin.Context) {
	settings, err := h.paymentSvc.GetPaymentSettings()
	if err != nil {
		utils.SendInternalError(c, err.Error())
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"ok":       true,
		"settings": settings,
	})
}

// UpdatePaymentSettings allows administrators to update payment details
func (h *PaymentHandler) UpdatePaymentSettings(c *gin.Context) {
	var input services.PaymentSettingsInput
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.SendBadRequest(c, err.Error())
		return
	}

	updated, err := h.paymentSvc.UpdatePaymentSettings(input)
	if err != nil {
		utils.SendBadRequest(c, err.Error())
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"ok":       true,
		"message":  "Payment settings saved successfully",
		"settings": updated,
	})
}

// UploadQRCodeImage allows admin to upload custom QR code image
func (h *PaymentHandler) UploadQRCodeImage(c *gin.Context) {
	file, err := c.FormFile("qr")
	if err != nil {
		file, err = c.FormFile("file")
	}
	if err != nil {
		utils.SendBadRequest(c, "QR code image file is required")
		return
	}

	url, err := h.paymentSvc.UploadQRCodeImage(file)
	if err != nil {
		utils.SendInternalError(c, err.Error())
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"ok":        true,
		"qrCodeUrl": url,
	})
}

// UploadScreenshot allows customer to upload transaction screenshot
func (h *PaymentHandler) UploadScreenshot(c *gin.Context) {
	file, err := c.FormFile("screenshot")
	if err != nil {
		file, err = c.FormFile("file")
	}
	if err != nil {
		utils.SendBadRequest(c, "Payment screenshot file is required")
		return
	}

	url, err := h.paymentSvc.UploadPaymentScreenshot(file)
	if err != nil {
		utils.SendInternalError(c, err.Error())
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"ok":  true,
		"url": url,
	})
}

// GetPayment retrieves the payment status and record for a request
func (h *PaymentHandler) GetPayment(c *gin.Context) {
	idParam := c.Param("id")
	reqID, err := strconv.ParseUint(idParam, 10, 32)
	if err != nil {
		utils.SendBadRequest(c, "Invalid request ID")
		return
	}

	payment, err := h.paymentSvc.GetPaymentByRequestID(uint(reqID))
	if err != nil {
		c.JSON(http.StatusOK, gin.H{
			"ok":      true,
			"payment": nil,
			"status":  "NOT_DUE",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"ok":      true,
		"payment": payment,
		"status":  payment.Status,
	})
}

// SubmitPayment processes customer's payment reference submission
func (h *PaymentHandler) SubmitPayment(c *gin.Context) {
	idParam := c.Param("id")
	reqID, err := strconv.ParseUint(idParam, 10, 32)
	if err != nil {
		utils.SendBadRequest(c, "Invalid request ID")
		return
	}

	var input services.SubmitPaymentInput
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.SendBadRequest(c, err.Error())
		return
	}

	user := middleware.GetCurrentUser(c)
	if user == nil {
		utils.SendUnauthorized(c, "Please sign in to submit payment confirmation")
		return
	}
	customerID := user.ID

	payment, req, err := h.paymentSvc.SubmitCustomerPayment(uint(reqID), customerID, input)
	if err != nil {
		utils.SendBadRequest(c, err.Error())
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"ok":            true,
		"message":       "Payment details submitted successfully. Your payment is awaiting verification by Homi administration.",
		"payment":       payment,
		"paymentStatus": payment.Status,
		"request":       req,
	})
}

// ListPayments returns all payment records for admin review
func (h *PaymentHandler) ListPayments(c *gin.Context) {
	status := c.Query("status")
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	if page < 1 {
		page = 1
	}
	offset := (page - 1) * limit

	payments, total, err := h.paymentSvc.ListPayments(status, limit, offset)
	if err != nil {
		utils.SendInternalError(c, err.Error())
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"ok":       true,
		"payments": payments,
		"total":    total,
		"page":     page,
		"limit":    limit,
	})
}

type RejectInput struct {
	Reason string `json:"reason"`
}

// VerifyPayment allows admin to mark payment as verified/PAID
func (h *PaymentHandler) VerifyPayment(c *gin.Context) {
	idParam := c.Param("id")
	payID, err := strconv.ParseUint(idParam, 10, 32)
	if err != nil {
		utils.SendBadRequest(c, "Invalid payment ID")
		return
	}

	admin := middleware.GetCurrentUser(c)
	if admin == nil || admin.Role != "admin" {
		utils.SendForbidden(c, "Administrator privileges required")
		return
	}
	adminID := admin.ID

	payment, req, err := h.paymentSvc.VerifyPayment(uint(payID), adminID)
	if err != nil {
		utils.SendBadRequest(c, err.Error())
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"ok":            true,
		"message":       "Payment verified and marked as PAID successfully",
		"payment":       payment,
		"paymentStatus": payment.Status,
		"request":       req,
	})
}

// RejectPayment allows admin to reject invalid payment submission
func (h *PaymentHandler) RejectPayment(c *gin.Context) {
	idParam := c.Param("id")
	payID, err := strconv.ParseUint(idParam, 10, 32)
	if err != nil {
		utils.SendBadRequest(c, "Invalid payment ID")
		return
	}

	var input RejectInput
	_ = c.ShouldBindJSON(&input)

	admin := middleware.GetCurrentUser(c)
	if admin == nil || admin.Role != "admin" {
		utils.SendForbidden(c, "Administrator privileges required")
		return
	}
	adminID := admin.ID

	payment, req, err := h.paymentSvc.RejectPayment(uint(payID), adminID, input.Reason)
	if err != nil {
		utils.SendBadRequest(c, err.Error())
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"ok":            true,
		"message":       "Payment submission rejected. Customer notified to resubmit.",
		"payment":       payment,
		"paymentStatus": payment.Status,
		"request":       req,
	})
}
