package handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"

	"homi-backend/internal/middleware"
	"homi-backend/internal/services"
	"homi-backend/internal/utils"
)

type WhatsAppHandler struct {
	whatsappSvc *services.WhatsAppService
}

func NewWhatsAppHandler(whatsappSvc *services.WhatsAppService) *WhatsAppHandler {
	return &WhatsAppHandler{whatsappSvc: whatsappSvc}
}

type UpdateGroupLinkInput struct {
	URL  string `json:"url"`
	Link string `json:"link"`
}

// GetGroupLink returns currently configured WhatsApp group invite URL
func (h *WhatsAppHandler) GetGroupLink(c *gin.Context) {
	link, err := h.whatsappSvc.GetGroupLink()
	if err != nil {
		utils.SendInternalError(c, err.Error())
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"ok":   true,
		"link": link,
		"url":  link,
	})
}

// UpdateGroupLink saves validated WhatsApp group invite link
func (h *WhatsAppHandler) UpdateGroupLink(c *gin.Context) {
	admin := middleware.GetCurrentUser(c)
	if admin == nil || admin.Role != "admin" {
		utils.SendForbidden(c, "Administrator privileges required to update WhatsApp group link")
		return
	}

	var input UpdateGroupLinkInput
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.SendBadRequest(c, err.Error())
		return
	}

	targetURL := input.URL
	if targetURL == "" {
		targetURL = input.Link
	}

	adminID := admin.ID
	savedLink, err := h.whatsappSvc.UpdateGroupLink(targetURL, adminID)
	if err != nil {
		utils.SendBadRequest(c, err.Error())
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"ok":      true,
		"message": "WhatsApp workers group invite link updated successfully",
		"link":    savedLink,
		"url":     savedLink,
	})
}

// GetJobMessage generates privacy-masked WhatsApp job message and retrieves group link (Admins Only)
func (h *WhatsAppHandler) GetJobMessage(c *gin.Context) {
	admin := middleware.GetCurrentUser(c)
	if admin == nil || admin.Role != "admin" {
		utils.SendForbidden(c, "Administrator privileges required to view WhatsApp dispatch message")
		return
	}

	reqIDParam := c.Param("id")
	reqID, err := strconv.ParseUint(reqIDParam, 10, 32)
	if err != nil {
		utils.SendBadRequest(c, "Invalid request ID")
		return
	}

	msg, link, shared, sharedAt, err := h.whatsappSvc.GenerateJobMessage(uint(reqID))
	if err != nil {
		utils.SendNotFound(c, err.Error())
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"ok":              true,
		"message":         msg,
		"whatsappMessage": msg,
		"groupLink":       link,
		"url":             link,
		"alreadyShared":   shared,
		"sharedAt":        sharedAt,
	})
}

// MarkShared records sharing timestamp and advances status to SHARED_WITH_WORKERS
func (h *WhatsAppHandler) MarkShared(c *gin.Context) {
	admin := middleware.GetCurrentUser(c)
	if admin == nil || admin.Role != "admin" {
		utils.SendForbidden(c, "Administrator privileges required to mark request shared")
		return
	}

	reqIDParam := c.Param("id")
	reqID, err := strconv.ParseUint(reqIDParam, 10, 32)
	if err != nil {
		utils.SendBadRequest(c, "Invalid request ID")
		return
	}

	adminID := admin.ID
	req, err := h.whatsappSvc.MarkShared(uint(reqID), adminID)
	if err != nil {
		utils.SendBadRequest(c, err.Error())
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"ok":            true,
		"message":       "Request marked as shared with WhatsApp workers group",
		"request":       req,
		"requestStatus": req.Status,
		"sharedAt":      req.WhatsAppSharedAt,
	})
}
