package config

import (
	"log"
	"os"
	"strings"

	"github.com/joho/godotenv"
)

type Config struct {
	AppEnv                 string
	Port                   string
	DatabaseURL            string
	SupabaseURL            string
	SupabaseAnonKey        string
	SupabaseServiceRoleKey string
	SupabaseJWTSecret      string
	JWTSecret              string
	CustomerAppURL         string
	AdminAppURL            string
	WhatsAppGroupInviteURL string
}

func LoadConfig() *Config {
	// Try loading .env from current directory, parent directory, etc.
	_ = godotenv.Load(".env")
	_ = godotenv.Load("../.env")
	_ = godotenv.Load("../../.env")

	port := getEnv("PORT", "4000")
	appEnv := getEnv("APP_ENV", "development")
	dbURL := getEnv("DATABASE_URL", "postgresql://akashlodhi@localhost:5432/homi")
	jwtSecret := getEnv("JWT_SECRET", "homi-secret-jwt-key-32-chars-long-minimum-secure")
	supabaseJWTSecret := getEnv("SUPABASE_JWT_SECRET", jwtSecret)
	customerAppURL := strings.TrimRight(getEnv("CUSTOMER_APP_URL", "http://localhost:3000"), "/")
	adminAppURL := strings.TrimRight(getEnv("ADMIN_APP_URL", "http://localhost:3001"), "/")
	whatsappURL := getEnv("WHATSAPP_GROUP_INVITE_URL", "https://chat.whatsapp.com/ISoKOfnlJEe1MowRiGGlGb?s=cl&p=a&iam=2")

	cfg := &Config{
		AppEnv:                 appEnv,
		Port:                   port,
		DatabaseURL:            dbURL,
		SupabaseURL:            os.Getenv("SUPABASE_URL"),
		SupabaseAnonKey:        os.Getenv("SUPABASE_ANON_KEY"),
		SupabaseServiceRoleKey: os.Getenv("SUPABASE_SERVICE_ROLE_KEY"),
		SupabaseJWTSecret:      supabaseJWTSecret,
		JWTSecret:              jwtSecret,
		CustomerAppURL:         customerAppURL,
		AdminAppURL:            adminAppURL,
		WhatsAppGroupInviteURL: whatsappURL,
	}

	log.Printf("[Config] Loaded configuration (AppEnv: %s, Port: %s)", cfg.AppEnv, cfg.Port)
	return cfg
}

func getEnv(key, defaultVal string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return defaultVal
}
