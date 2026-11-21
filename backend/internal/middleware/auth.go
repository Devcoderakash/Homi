package middleware

import (
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"homi-backend/internal/config"
	"homi-backend/internal/models"
	"homi-backend/internal/utils"
)

const (
	ContextUserKey     = "currentUser"
	ContextSupabaseKey = "supabaseClaims"
)

// AuthMiddleware validates JWT from header or cookies (supports Supabase Auth & local tokens)
func AuthMiddleware(cfg *config.Config, db *gorm.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		tokenStr := ""

		// 1. Check Authorization header: Bearer <token>
		authHeader := c.GetHeader("Authorization")
		if strings.HasPrefix(authHeader, "Bearer ") {
			tokenStr = strings.TrimPrefix(authHeader, "Bearer ")
		}

		// 2. Check cookies (for browser sessions)
		if tokenStr == "" {
			if cookie, err := c.Cookie("homi_admin_session"); err == nil && cookie != "" {
				tokenStr = cookie
			} else if cookie, err := c.Cookie("homi_session"); err == nil && cookie != "" {
				tokenStr = cookie
			} else if cookie, err := c.Cookie("token"); err == nil && cookie != "" {
				tokenStr = cookie
			} else if cookie, err := c.Cookie("sb-access-token"); err == nil && cookie != "" {
				tokenStr = cookie
			}
		}

		if tokenStr == "" {
			c.Next()
			return
		}

		// 3. First attempt: Validate as Supabase Auth JWT
		sbClaims, sbErr := utils.ValidateSupabaseJWT(tokenStr, cfg.SupabaseJWTSecret, cfg.SupabaseURL, cfg.SupabaseAnonKey)
		if sbErr == nil && sbClaims != nil && sbClaims.Subject != "" {
			c.Set(ContextSupabaseKey, sbClaims)

			// Resolve or sync user from PostgreSQL using supabase_id or email
			var user models.User
			found := false

			// Check by supabase_id
			if err := db.Where("supabase_id = ?", sbClaims.Subject).First(&user).Error; err == nil {
				found = true
			} else if sbClaims.Email != "" {
				// Match existing user by email to link accounts seamlessly
				if err := db.Where("LOWER(email) = ?", strings.ToLower(sbClaims.Email)).First(&user).Error; err == nil {
					found = true
					user.SupabaseID = &sbClaims.Subject
					_ = db.Save(&user)
				}
			}

			// If user does not exist in local database yet, create customer record
			if !found && sbClaims.Email != "" {
				role := "customer"
				// Only trust app_metadata for admin role (never user_metadata)
				if appRole, ok := sbClaims.AppMetadata["role"].(string); ok && strings.ToLower(appRole) == "admin" {
					role = "admin"
				}

				name := "Customer"
				if uName, ok := sbClaims.UserMetadata["name"].(string); ok && uName != "" {
					name = uName
				} else if fName, ok := sbClaims.UserMetadata["full_name"].(string); ok && fName != "" {
					name = fName
				}

				phone := ""
				if uPhone, ok := sbClaims.UserMetadata["phone"].(string); ok {
					phone = uPhone
				}

				city := "Bhopal"
				if uCity, ok := sbClaims.UserMetadata["city"].(string); ok && uCity != "" {
					city = uCity
				}

				newUser := models.User{
					SupabaseID:   &sbClaims.Subject,
					Name:         name,
					Email:        strings.ToLower(sbClaims.Email),
					Phone:        phone,
					Role:         role,
					PasswordHash: "SUPABASE_MANAGED_AUTH",
					City:         &city,
					CreatedAt:    time.Now().UTC(),
					UpdatedAt:    time.Now().UTC(),
				}

				if err := db.Create(&newUser).Error; err == nil {
					user = newUser
					found = true

					// Create matching customer profile
					_ = db.Create(&models.CustomerProfile{
						UserID:    user.ID,
						FullName:  user.Name,
						Phone:     user.Phone,
						City:      city,
						CreatedAt: time.Now().UTC(),
						UpdatedAt: time.Now().UTC(),
					})
				}
			}

			if found {
				c.Set(ContextUserKey, &user)
			}
			c.Next()
			return
		}

		// 4. Second attempt: Legacy/Internal JWT token validation
		claims, err := utils.ValidateJWT(tokenStr, cfg.JWTSecret)
		if err == nil && claims != nil {
			var user models.User
			if err := db.First(&user, claims.UserID).Error; err == nil {
				c.Set(ContextUserKey, &user)
			}
		}

		c.Next()
	}
}

// RequireAuth ensures that a valid authenticated user exists in the request context
func RequireAuth() gin.HandlerFunc {
	return func(c *gin.Context) {
		user, exists := c.Get(ContextUserKey)
		if !exists || user == nil {
			utils.SendUnauthorized(c, "Please sign in to access this resource.")
			c.Abort()
			return
		}
		c.Next()
	}
}

// RequireAdmin ensures the authenticated user is an authorized platform administrator
func RequireAdmin() gin.HandlerFunc {
	return func(c *gin.Context) {
		userVal, exists := c.Get(ContextUserKey)
		if !exists || userVal == nil {
			utils.SendUnauthorized(c, "Admin authorization required. Please sign in.")
			c.Abort()
			return
		}

		user, ok := userVal.(*models.User)
		if !ok || user.Role != "admin" {
			utils.SendForbidden(c, "Access denied. Administrator privileges required.")
			c.Abort()
			return
		}

		// If Supabase claims exist, verify that the token does NOT conflict with non-admin app_metadata
		if sbVal, sbExists := c.Get(ContextSupabaseKey); sbExists && sbVal != nil {
			if sbClaims, ok := sbVal.(*utils.SupabaseClaims); ok {
				// If token has explicit non-admin role in app_metadata, disallow
				if appRole, ok := sbClaims.AppMetadata["role"].(string); ok && appRole != "" && strings.ToLower(appRole) != "admin" {
					utils.SendForbidden(c, "Access denied. Administrator privileges required.")
					c.Abort()
					return
				}
			}
		}

		c.Next()
	}
}

// GetCurrentUser returns the user stored in context or nil
func GetCurrentUser(c *gin.Context) *models.User {
	if val, exists := c.Get(ContextUserKey); exists && val != nil {
		if user, ok := val.(*models.User); ok {
			return user
		}
	}
	return nil
}
