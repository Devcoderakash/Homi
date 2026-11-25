package database

import (
	"log"
	"os"
	"time"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"

	"homi-backend/internal/config"
	"homi-backend/internal/models"
)

var DB *gorm.DB

func InitDB(cfg *config.Config) *gorm.DB {
	var gormLogger logger.Interface = logger.Default.LogMode(logger.Warn)
	if cfg.AppEnv == "development_verbose" {
		gormLogger = logger.Default.LogMode(logger.Info)
	}

	db, err := gorm.Open(postgres.New(postgres.Config{
		DSN:                  cfg.DatabaseURL,
		PreferSimpleProtocol: true, // Crucial for Supabase PgBouncer / Connection Poolers
	}), &gorm.Config{
		Logger: gormLogger,
		NowFunc: func() time.Time {
			return time.Now().UTC()
		},
		PrepareStmt: false, // Incompatible with transaction poolers
	})
	if err != nil {
		log.Fatalf("[Database] Failed to connect to PostgreSQL: %v", err)
	}

	sqlDB, err := db.DB()
	if err != nil {
		log.Fatalf("[Database] Failed to get generic database object: %v", err)
	}

	sqlDB.SetMaxIdleConns(25)
	sqlDB.SetMaxOpenConns(50)
	sqlDB.SetConnMaxLifetime(15 * time.Minute)
	sqlDB.SetConnMaxIdleTime(5 * time.Minute)

	log.Println("[Database] Successfully connected to PostgreSQL / Supabase")

	// Safe non-blocking AutoMigrate: runs in background so API server starts listening immediately
	if os.Getenv("AUTO_MIGRATE") != "false" {
		go func() {
			err := db.AutoMigrate(
				&models.User{},
				&models.CustomerProfile{},
				&models.Worker{},
				&models.WorkerApplication{},
				&models.ServiceRequest{},
				&models.ServiceRequestImage{},
				&models.WorkerQuote{},
				&models.CustomerQuotation{},
				&models.Assignment{},
				&models.Payment{},
				&models.PaymentSettings{},
				&models.AppSetting{},
				&models.AdminActivityLog{},
				&models.RequestStatusHistory{},
				&models.Category{},
				&models.Notification{},
				&models.PrivacyConsent{},
				&models.DataSubjectRequest{},
				&models.GrievanceOfficer{},
			)
			if err != nil {
				log.Printf("[Database] AutoMigrate warning: %v", err)
			} else {
				log.Println("[Database] AutoMigrate completed in background")
			}
		}()
	}

	seedDefaults(db, cfg)

	DB = db
	return db
}

func seedDefaults(db *gorm.DB, cfg *config.Config) {
	// 1. Ensure WhatsApp group invite setting exists
	var setting models.AppSetting
	if err := db.Where("key = ?", "whatsapp_workers_group_link").First(&setting).Error; err != nil {
		db.Create(&models.AppSetting{
			Key:       "whatsapp_workers_group_link",
			Value:     cfg.WhatsAppGroupInviteURL,
			UpdatedAt: time.Now().UTC(),
		})
		log.Println("[Database] Initialized default WhatsApp Workers Group link setting")
	}

	// 2. Seed standard categories ONLY when the categories table is empty
	// so admin-deleted categories do not re-appear after server restarts.
	var catCount int64
	if err := db.Model(&models.Category{}).Count(&catCount).Error; err == nil && catCount == 0 {
		defaultCategories := []models.Category{
			{Name: "Plumbing", Slug: "plumbing", Description: "Taps, pipes & leaks repair", Icon: "Droplets", Color: "#dfeefd", StartingPrice: 199, Active: true, SortOrder: 1},
			{Name: "Electrical", Slug: "electrical", Description: "Fans, lights & switches", Icon: "PlugZap", Color: "#fff0d8", StartingPrice: 199, Active: true, SortOrder: 2},
			{Name: "Carpentry", Slug: "carpentry", Description: "Doors, locks & woodwork", Icon: "Hammer", Color: "#f7e8d8", StartingPrice: 199, Active: true, SortOrder: 3},
			{Name: "Cleaning", Slug: "cleaning", Description: "Kitchen, bathroom & home cleaning", Icon: "Sparkles", Color: "#e9e4fa", StartingPrice: 199, Active: true, SortOrder: 4},
			{Name: "Painting", Slug: "painting", Description: "Walls, touch-ups & waterproofing", Icon: "PaintRoller", Color: "#fce4e4", StartingPrice: 199, Active: true, SortOrder: 5},
			{Name: "Appliance repair", Slug: "appliance-repair", Description: "AC, fridge & washing machine", Icon: "Fan", Color: "#e2f2e8", StartingPrice: 199, Active: true, SortOrder: 6},
			{Name: "Furniture repair", Slug: "furniture-repair", Description: "Sofas, chairs & bed repair", Icon: "Armchair", Color: "#f4e9d9", StartingPrice: 199, Active: true, SortOrder: 7},
			{Name: "General handyman", Slug: "general-handyman", Description: "All household repairs", Icon: "Wrench", Color: "#e5edee", StartingPrice: 199, Active: true, SortOrder: 8},
		}

		for _, cat := range defaultCategories {
			cat.CreatedAt = time.Now().UTC()
			cat.UpdatedAt = time.Now().UTC()
			db.Create(&cat)
		}
		log.Println("[Database] Seeded default service categories")
	}
}
