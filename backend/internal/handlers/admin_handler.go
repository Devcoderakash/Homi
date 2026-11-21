package handlers

import (
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"

	"homi-backend/internal/models"
	"homi-backend/internal/services"
	"homi-backend/internal/utils"
)

type AdminHandler struct {
	adminSvc    *services.AdminService
	whatsappSvc *services.WhatsAppService
}

func NewAdminHandler(adminSvc *services.AdminService, whatsappSvc *services.WhatsAppService) *AdminHandler {
	return &AdminHandler{adminSvc: adminSvc, whatsappSvc: whatsappSvc}
}

// GetDashboard returns summary statistics for admin overview
func (h *AdminHandler) GetDashboard(c *gin.Context) {
	stats, err := h.adminSvc.GetDashboardStats()
	if err != nil {
		utils.SendInternalError(c, err.Error())
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"ok":                 true,
		"stats":              stats,
		"data":               stats,
		"requests":           stats["recentRequests"],
		"recentRequests":     stats["recentRequests"],
		"applications":       stats["recentApplications"],
		"recentApplications": stats["recentApplications"],
		"users":              stats["users"],
	})
}

// ListCustomers returns registered customer accounts
func (h *AdminHandler) ListCustomers(c *gin.Context) {
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

	customers, total, err := h.adminSvc.ListCustomers(search, limit, offset)
	if err != nil {
		utils.SendInternalError(c, err.Error())
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"ok":        true,
		"customers": customers,
		"total":     total,
		"page":      page,
		"limit":     limit,
	})
}

// ListActivityLogs returns administrator audit trail
func (h *AdminHandler) ListActivityLogs(c *gin.Context) {
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "50"))
	logs, err := h.adminSvc.ListActivityLogs(limit)
	if err != nil {
		utils.SendInternalError(c, err.Error())
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"ok":   true,
		"logs": logs,
	})
}

// ListCategories returns available service categories
func (h *AdminHandler) ListCategories(c *gin.Context) {
	categories, err := h.adminSvc.ListCategories()
	if err != nil {
		utils.SendInternalError(c, err.Error())
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"ok":         true,
		"categories": categories,
	})
}

// CreateCategory adds a new service category
func (h *AdminHandler) CreateCategory(c *gin.Context) {
	var cat models.Category
	if err := c.ShouldBindJSON(&cat); err != nil {
		utils.SendBadRequest(c, err.Error())
		return
	}

	created, err := h.adminSvc.CreateCategory(cat)
	if err != nil {
		utils.SendBadRequest(c, err.Error())
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"ok":       true,
		"category": created,
	})
}

// UpdateCategory edits a service category
func (h *AdminHandler) UpdateCategory(c *gin.Context) {
	idParam := c.Param("id")
	id, err := strconv.ParseUint(idParam, 10, 32)
	if err != nil {
		utils.SendBadRequest(c, "Invalid category ID")
		return
	}

	var cat models.Category
	if err := c.ShouldBindJSON(&cat); err != nil {
		utils.SendBadRequest(c, err.Error())
		return
	}

	updated, err := h.adminSvc.UpdateCategory(uint(id), cat)
	if err != nil {
		utils.SendBadRequest(c, err.Error())
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"ok":       true,
		"category": updated,
	})
}

// ToggleCategory toggles category active status
func (h *AdminHandler) ToggleCategory(c *gin.Context) {
	idParam := c.Param("id")
	id, err := strconv.ParseUint(idParam, 10, 32)
	if err != nil {
		utils.SendBadRequest(c, "Invalid category ID")
		return
	}

	cat, err := h.adminSvc.ToggleCategory(uint(id))
	if err != nil {
		utils.SendBadRequest(c, err.Error())
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"ok":       true,
		"category": cat,
	})
}

// GetSettings returns platform configuration including WhatsApp group link
func (h *AdminHandler) GetSettings(c *gin.Context) {
	link, _ := h.whatsappSvc.GetGroupLink()

	c.JSON(http.StatusOK, gin.H{
		"ok": true,
		"settings": gin.H{
			"whatsappWorkersGroupLink": link,
		},
	})
}
