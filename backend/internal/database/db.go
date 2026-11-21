package database

import (
	"log"
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
	if cfg.AppEnv == "development" {
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
	})
	if err != nil {
		log.Fatalf("[Database] Failed to connect to PostgreSQL: %v", err)
	}

	sqlDB, err := db.DB()
	if err != nil {
		log.Fatalf("[Database] Failed to get generic database object: %v", err)
	}

	sqlDB.SetMaxIdleConns(10)
	sqlDB.SetMaxOpenConns(50)
	sqlDB.SetConnMaxLifetime(time.Hour)

	log.Println("[Database] Successfully connected to PostgreSQL / Supabase")

	// Safe AutoMigrate: adds any missing columns or tables without dropping existing data
	err = db.AutoMigrate(
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
	)
	if err != nil {
		log.Printf("[Database] AutoMigrate warning: %v", err)
	} else {
		log.Println("[Database] AutoMigrate completed successfully")
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

	// 2. Ensure standard categories exist
	defaultCategories := []models.Category{
		{Name: "Plumbing", Slug: "plumbing", Description: "Taps, pipes & leaks repair", Icon: "Droplets", Active: true, SortOrder: 1},
		{Name: "Electrical", Slug: "electrical", Description: "Fans, lights & switches", Icon: "PlugZap", Active: true, SortOrder: 2},
		{Name: "Carpentry", Slug: "carpentry", Description: "Doors, locks & woodwork", Icon: "Hammer", Active: true, SortOrder: 3},
		{Name: "Cleaning", Slug: "cleaning", Description: "Kitchen, bathroom & home cleaning", Icon: "Sparkles", Active: true, SortOrder: 4},
		{Name: "Painting", Slug: "painting", Description: "Walls, touch-ups & waterproofing", Icon: "PaintRoller", Active: true, SortOrder: 5},
		{Name: "Appliance repair", Slug: "appliance-repair", Description: "AC, fridge & washing machine", Icon: "Fan", Active: true, SortOrder: 6},
		{Name: "Furniture repair", Slug: "furniture-repair", Description: "Sofas, chairs & bed repair", Icon: "Armchair", Active: true, SortOrder: 7},
		{Name: "General handyman", Slug: "general-handyman", Description: "All household repairs", Icon: "Wrench", Active: true, SortOrder: 8},
	}

	for _, cat := range defaultCategories {
		var existing models.Category
		if err := db.Where("slug = ?", cat.Slug).First(&existing).Error; err != nil {
			cat.CreatedAt = time.Now().UTC()
			cat.UpdatedAt = time.Now().UTC()
			db.Create(&cat)
		}
	}
}
