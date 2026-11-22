package middleware

import (
	"strings"
	"time"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"homi-backend/internal/config"
)

func CORSMiddleware(cfg *config.Config) gin.HandlerFunc {
	cleanCustomerURL := strings.TrimRight(cfg.CustomerAppURL, "/")
	cleanAdminURL := strings.TrimRight(cfg.AdminAppURL, "/")

	return cors.New(cors.Config{
		AllowOriginFunc: func(origin string) bool {
			if origin == "" {
				return true
			}
			// Exact matches (without trailing slash)
			if cleanCustomerURL != "" && (origin == cleanCustomerURL || strings.TrimRight(origin, "/") == cleanCustomerURL) {
				return true
			}
			if cleanAdminURL != "" && (origin == cleanAdminURL || strings.TrimRight(origin, "/") == cleanAdminURL) {
				return true
			}
			// Localhost and loopback development
			if strings.HasPrefix(origin, "http://localhost:") ||
				strings.HasPrefix(origin, "http://127.0.0.1:") ||
				strings.HasPrefix(origin, "https://localhost:") ||
				origin == "http://localhost" ||
				origin == "http://127.0.0.1" {
				return true
			}
			// Allow all Vercel deployments (production, staging, preview branches)
			if strings.HasSuffix(origin, ".vercel.app") {
				return true
			}
			// Allow Render deployments
			if strings.HasSuffix(origin, ".onrender.com") {
				return true
			}
			return false
		},
		AllowMethods: []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"},
		AllowHeaders: []string{
			"Origin",
			"Content-Type",
			"Content-Length",
			"Accept-Encoding",
			"X-CSRF-Token",
			"Authorization",
			"Accept",
			"Cache-Control",
			"X-Requested-With",
			"Cookie",
		},
		ExposeHeaders:    []string{"Content-Length", "Set-Cookie"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	})
}

