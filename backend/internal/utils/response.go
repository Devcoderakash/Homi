package utils

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

type APIResponse struct {
	OK      bool        `json:"ok"`
	Data    interface{} `json:"data,omitempty"`
	Message string      `json:"message,omitempty"`
	Error   string      `json:"error,omitempty"`
}

func SendSuccess(c *gin.Context, statusCode int, data interface{}, message ...string) {
	msg := ""
	if len(message) > 0 {
		msg = message[0]
	}
	c.JSON(statusCode, gin.H{
		"ok":      true,
		"data":    data,
		"message": msg,
	})
}

func SendError(c *gin.Context, statusCode int, errMessage string) {
	c.JSON(statusCode, gin.H{
		"ok":    false,
		"error": errMessage,
	})
}

func SendBadRequest(c *gin.Context, message string) {
	SendError(c, http.StatusBadRequest, message)
}

func SendUnauthorized(c *gin.Context, message string) {
	SendError(c, http.StatusUnauthorized, message)
}

func SendForbidden(c *gin.Context, message string) {
	SendError(c, http.StatusForbidden, message)
}

func SendNotFound(c *gin.Context, message string) {
	SendError(c, http.StatusNotFound, message)
}

func SendInternalError(c *gin.Context, message string) {
	SendError(c, http.StatusInternalServerError, message)
}
