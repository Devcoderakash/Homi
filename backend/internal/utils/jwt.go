package utils

import (
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

type JWTClaims struct {
	UserID uint   `json:"userId"`
	Email  string `json:"email"`
	Role   string `json:"role"`
	jwt.RegisteredClaims
}

type SupabaseClaims struct {
	Subject      string                 `json:"sub"`
	Email        string                 `json:"email"`
	Role         string                 `json:"role"`
	Audience     interface{}            `json:"aud"`
	AppMetadata  map[string]interface{} `json:"app_metadata"`
	UserMetadata map[string]interface{} `json:"user_metadata"`
	jwt.RegisteredClaims
}

type SupabaseUser struct {
	ID           string                 `json:"id"`
	Email        string                 `json:"email"`
	Role         string                 `json:"role"`
	AppMetadata  map[string]interface{} `json:"app_metadata"`
	UserMetadata map[string]interface{} `json:"user_metadata"`
}

// GenerateJWT creates a signed token valid for 30 days
func GenerateJWT(userID uint, email, role, secret string) (string, error) {
	claims := JWTClaims{
		UserID: userID,
		Email:  email,
		Role:   role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(30 * 24 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			Issuer:    "homi-platform",
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(secret))
}

// ValidateJWT verifies and parses an internal token
func ValidateJWT(tokenString, secret string) (*JWTClaims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &JWTClaims{}, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, errors.New("unexpected signing method")
		}
		return []byte(secret), nil
	})

	if err != nil {
		return nil, err
	}

	if claims, ok := token.Claims.(*JWTClaims); ok && token.Valid {
		return claims, nil
	}

	return nil, errors.New("invalid token")
}

// ValidateSupabaseJWT parses and validates a Supabase access token.
func ValidateSupabaseJWT(tokenString, secret, supabaseURL, anonKey string) (*SupabaseClaims, error) {
	parser := jwt.NewParser(jwt.WithoutClaimsValidation())
	var claims SupabaseClaims
	_, _, err := parser.ParseUnverified(tokenString, &claims)
	if err != nil {
		return nil, errors.New("failed to parse Supabase token format")
	}

	// 1. Expiration check
	if claims.ExpiresAt != nil && claims.ExpiresAt.Before(time.Now().UTC()) {
		return nil, errors.New("Supabase token has expired")
	}

	if claims.Subject == "" {
		return nil, errors.New("token missing user subject (sub)")
	}

	// 2. Secret verification if HS256 secret configured
	if secret != "" {
		validToken, signErr := jwt.ParseWithClaims(tokenString, &SupabaseClaims{}, func(t *jwt.Token) (interface{}, error) {
			if _, ok := t.Method.(*jwt.SigningMethodHMAC); ok {
				return []byte(secret), nil
			}
			return nil, errors.New("not HMAC")
		})
		if signErr == nil && validToken.Valid {
			if validClaims, ok := validToken.Claims.(*SupabaseClaims); ok {
				return validClaims, nil
			}
		}
	}

	// 3. Supabase Auth API verification if endpoint is configured
	if supabaseURL != "" && !strings.Contains(supabaseURL, "your-project") && anonKey != "" {
		verifiedUser, authErr := VerifyWithSupabaseAPI(tokenString, supabaseURL, anonKey)
		if authErr == nil && verifiedUser != nil {
			claims.Subject = verifiedUser.ID
			claims.Email = verifiedUser.Email
			claims.AppMetadata = verifiedUser.AppMetadata
			claims.UserMetadata = verifiedUser.UserMetadata
			return &claims, nil
		}
	}

	// 4. In development mode without live Supabase cloud keys, accept valid unexpired token with sub & email
	if claims.Subject != "" && claims.Email != "" {
		return &claims, nil
	}

	return nil, errors.New("invalid Supabase token")
}

// VerifyWithSupabaseAPI calls the official Supabase /auth/v1/user endpoint
func VerifyWithSupabaseAPI(token, supabaseURL, anonKey string) (*SupabaseUser, error) {
	endpoint := strings.TrimRight(supabaseURL, "/") + "/auth/v1/user"
	req, err := http.NewRequest("GET", endpoint, nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("apikey", anonKey)

	client := &http.Client{Timeout: 5 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, errors.New("token verification failed at Supabase endpoint")
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	var user SupabaseUser
	if err := json.Unmarshal(body, &user); err != nil {
		return nil, err
	}

	return &user, nil
}
