package handlers

import (
	"encoding/json"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"

	"homi-backend/internal/middleware"
	"homi-backend/internal/services"
	"homi-backend/internal/utils"
)

type AuthHandler struct {
	authSvc *services.AuthService
}

func NewAuthHandler(authSvc *services.AuthService) *AuthHandler {
	return &AuthHandler{authSvc: authSvc}
}

func setSessionCookies(c *gin.Context, token string, isAdmin bool) {
	isSecure := c.Request.TLS != nil || c.GetHeader("X-Forwarded-Proto") == "https"
	c.SetSameSite(http.SameSiteLaxMode)
	c.SetCookie("homi_session", token, 30*24*3600, "/", "", isSecure, true)
	c.SetCookie("token", token, 30*24*3600, "/", "", isSecure, true)
	if isAdmin {
		c.SetCookie("homi_admin_session", token, 30*24*3600, "/", "", isSecure, true)
	}
}

func clearSessionCookies(c *gin.Context) {
	isSecure := c.Request.TLS != nil || c.GetHeader("X-Forwarded-Proto") == "https"
	c.SetSameSite(http.SameSiteLaxMode)
	c.SetCookie("homi_session", "", -1, "/", "", isSecure, true)
	c.SetCookie("homi_admin_session", "", -1, "/", "", isSecure, true)
	c.SetCookie("token", "", -1, "/", "", isSecure, true)
}

// AuthDispatcher routes legacy /api/auth POST requests according to action ("register" vs "login")
func (h *AuthHandler) AuthDispatcher(c *gin.Context) {
	// Read raw body
	bodyBytes, err := c.GetRawData()
	if err != nil {
		utils.SendBadRequest(c, "Invalid request body")
		return
	}

	var peek struct {
		Action string `json:"action"`
	}
	_ = json.Unmarshal(bodyBytes, &peek)

	if strings.ToLower(peek.Action) == "register" {
		var input services.RegisterInput
		if err := json.Unmarshal(bodyBytes, &input); err != nil {
			utils.SendBadRequest(c, err.Error())
			return
		}
		user, token, err := h.authSvc.Register(input)
		if err != nil {
			utils.SendBadRequest(c, err.Error())
			return
		}
		setSessionCookies(c, token, user.Role == "admin")
		c.JSON(http.StatusCreated, gin.H{"ok": true, "user": user, "token": token})
		return
	}

	// Default to login
	var input services.LoginInput
	if err := json.Unmarshal(bodyBytes, &input); err != nil {
		utils.SendBadRequest(c, "Please provide valid credentials")
		return
	}
	user, token, err := h.authSvc.Login(input)
	if err != nil {
		utils.SendUnauthorized(c, err.Error())
		return
	}
	setSessionCookies(c, token, user.Role == "admin")
	c.JSON(http.StatusOK, gin.H{"ok": true, "user": user, "token": token})
}

func (h *AuthHandler) Register(c *gin.Context) {
	var input services.RegisterInput
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.SendBadRequest(c, err.Error())
		return
	}

	user, token, err := h.authSvc.Register(input)
	if err != nil {
		utils.SendBadRequest(c, err.Error())
		return
	}

	// Set session cookies
	setSessionCookies(c, token, user.Role == "admin")

	c.JSON(http.StatusCreated, gin.H{
		"ok":    true,
		"user":  user,
		"token": token,
	})
}

func (h *AuthHandler) Login(c *gin.Context) {
	var input services.LoginInput
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.SendBadRequest(c, "Please provide a valid email and password")
		return
	}

	user, token, err := h.authSvc.Login(input)
	if err != nil {
		utils.SendUnauthorized(c, err.Error())
		return
	}

	// Set session cookies for both customer and admin panels
	setSessionCookies(c, token, user.Role == "admin")

	c.JSON(http.StatusOK, gin.H{
		"ok":    true,
		"user":  user,
		"token": token,
	})
}

func (h *AuthHandler) Logout(c *gin.Context) {
	clearSessionCookies(c)

	c.JSON(http.StatusOK, gin.H{
		"ok":      true,
		"message": "Signed out successfully",
	})
}

func (h *AuthHandler) GetMe(c *gin.Context) {
	user := middleware.GetCurrentUser(c)
	if user == nil {
		c.JSON(http.StatusOK, gin.H{
			"ok":   true,
			"user": nil,
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"ok":   true,
		"user": user,
	})
}
