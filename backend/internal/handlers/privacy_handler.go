package handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"

	"homi-backend/internal/middleware"
	"homi-backend/internal/services"
	"homi-backend/internal/utils"
)

type PrivacyHandler struct {
	privacySvc *services.PrivacyService
}

func NewPrivacyHandler(privacySvc *services.PrivacyService) *PrivacyHandler {
	return &PrivacyHandler{privacySvc: privacySvc}
}

// RecordConsent logs a user consent under DPDP Act 2023
func (h *PrivacyHandler) RecordConsent(c *gin.Context) {
	var input services.RecordConsentInput
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.SendBadRequest(c, err.Error())
		return
	}

	user := middleware.GetCurrentUser(c)
	if user != nil {
		input.UserID = &user.ID
	}
	input.IPAddress = c.ClientIP()
	input.UserAgent = c.GetHeader("User-Agent")

	consent, err := h.privacySvc.RecordConsent(input)
	if err != nil {
		utils.SendInternalError(c, err.Error())
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"ok":      true,
		"message": "Consent recorded successfully",
		"consent": consent,
	})
}

// SubmitDataSubjectRequest allows customers to submit an Access, Correction, Erasure or Grievance request
func (h *PrivacyHandler) SubmitDataSubjectRequest(c *gin.Context) {
	var input services.SubmitDSRInput
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.SendBadRequest(c, err.Error())
		return
	}

	user := middleware.GetCurrentUser(c)
	if user != nil {
		input.UserID = &user.ID
		if input.ContactEmail == "" {
			input.ContactEmail = user.Email
		}
		if input.ContactPhone == "" {
			input.ContactPhone = user.Phone
		}
	}

	dsr, err := h.privacySvc.SubmitDataSubjectRequest(input)
	if err != nil {
		utils.SendBadRequest(c, err.Error())
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"ok":        true,
		"message":   "Your privacy request has been recorded. Our Data Protection & Grievance Officer will process it in accordance with the DPDP Act, 2023.",
		"requestId": dsr.ID,
		"request":   dsr,
	})
}

// ExportMyData generates a complete copy of the customer's personal data (DPDP Right to Access)
func (h *PrivacyHandler) ExportMyData(c *gin.Context) {
	user := middleware.GetCurrentUser(c)
	if user == nil {
		utils.SendUnauthorized(c, "Please sign in to export your personal data")
		return
	}

	data, err := h.privacySvc.GetUserDataExport(user.ID)
	if err != nil {
		utils.SendInternalError(c, err.Error())
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"ok":     true,
		"export": data,
	})
}

// GetGrievanceOfficer returns the current Grievance Officer details for public notice
func (h *PrivacyHandler) GetGrievanceOfficer(c *gin.Context) {
	officer, err := h.privacySvc.GetGrievanceOfficer()
	if err != nil {
		utils.SendInternalError(c, err.Error())
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"ok":      true,
		"officer": officer,
	})
}

// UpdateGrievanceOfficer allows admins to update the Grievance Officer contact details
func (h *PrivacyHandler) UpdateGrievanceOfficer(c *gin.Context) {
	admin := middleware.GetCurrentUser(c)
	if admin == nil || admin.Role != "admin" {
		utils.SendForbidden(c, "Administrator privileges required to update Grievance Officer details")
		return
	}

	var input services.GrievanceOfficerInput
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.SendBadRequest(c, err.Error())
		return
	}

	updated, err := h.privacySvc.UpdateGrievanceOfficer(input)
	if err != nil {
		utils.SendInternalError(c, err.Error())
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"ok":      true,
		"message": "Grievance Officer details updated successfully",
		"officer": updated,
	})
}

// ListDataSubjectRequests allows administrators to review privacy requests
func (h *PrivacyHandler) ListDataSubjectRequests(c *gin.Context) {
	status := c.Query("status")
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	if page < 1 {
		page = 1
	}
	offset := (page - 1) * limit

	requests, total, err := h.privacySvc.ListDataSubjectRequests(status, limit, offset)
	if err != nil {
		utils.SendInternalError(c, err.Error())
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"ok":       true,
		"requests": requests,
		"total":    total,
		"page":     page,
		"limit":    limit,
	})
}

type ResolveDSRInput struct {
	Status string `json:"status" binding:"required"`
	Notes  string `json:"notes"`
}

// ResolveDataSubjectRequest allows administrators to update the status of a privacy request
func (h *PrivacyHandler) ResolveDataSubjectRequest(c *gin.Context) {
	idParam := c.Param("id")
	id, err := strconv.ParseUint(idParam, 10, 32)
	if err != nil {
		utils.SendBadRequest(c, "Invalid request ID")
		return
	}

	var input ResolveDSRInput
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.SendBadRequest(c, err.Error())
		return
	}

	admin := middleware.GetCurrentUser(c)
	if admin == nil || admin.Role != "admin" {
		utils.SendForbidden(c, "Administrator privileges required to resolve privacy requests")
		return
	}

	resolved, err := h.privacySvc.ResolveDataSubjectRequest(uint(id), admin.ID, input.Status, input.Notes)
	if err != nil {
		utils.SendBadRequest(c, err.Error())
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"ok":      true,
		"message": "Data subject request updated successfully",
		"request": resolved,
	})
}
