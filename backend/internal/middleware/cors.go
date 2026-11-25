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

	// Whitelist of approved production origins
	trustedProductionOrigins := map[string]bool{
		"https://homi-kappa.vercel.app": true,
		"https://homi-v3nj.onrender.com": true,
	}

	return cors.New(cors.Config{
		AllowOriginFunc: func(origin string) bool {
			if origin == "" {
				return true
			}
			cleanOrigin := strings.TrimRight(origin, "/")

			// 1. Configured Frontend URLs from environment variables
			if cleanCustomerURL != "" && cleanOrigin == cleanCustomerURL {
				return true
			}
			if cleanAdminURL != "" && cleanOrigin == cleanAdminURL {
				return true
			}

			// 2. Explicitly trusted production deployment domains
			if trustedProductionOrigins[cleanOrigin] {
				return true
			}

			// 3. Official Homi Vercel project preview deployments only (strictly match 'homi-' prefix on vercel.app)
			if strings.HasPrefix(cleanOrigin, "https://homi-") && strings.HasSuffix(cleanOrigin, ".vercel.app") {
				return true
			}

			// 4. Localhost and loopback development (only in development environment)
			if cfg.AppEnv != "production" {
				if strings.HasPrefix(origin, "http://localhost:") ||
					strings.HasPrefix(origin, "http://127.0.0.1:") ||
					strings.HasPrefix(origin, "https://localhost:") ||
					origin == "http://localhost" ||
					origin == "http://127.0.0.1" {
					return true
				}
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

