package main

import (
	"fmt"
	"log"
	"os"

	"homi-backend/internal/config"
	"homi-backend/internal/database"
	"homi-backend/internal/routes"
	"homi-backend/internal/services"
)

func main() {
	log.Println("==================================================")
	log.Println("🚀 Starting HOMI Backend (Go + Gin + Supabase/GORM)")
	log.Println("==================================================")

	// 1. Load configuration from environment / .env
	cfg := config.LoadConfig()

	// Ensure uploads directory exists
	if err := os.MkdirAll("./uploads", 0755); err != nil {
		log.Printf("⚠️ Warning: could not create ./uploads directory: %v", err)
	}

	// 2. Initialize PostgreSQL / Supabase Database
	db := database.InitDB(cfg)

	// 3. Initialize Services
	storageService := services.NewStorageService(cfg)
	authService := services.NewAuthService(db, cfg)
	requestService := services.NewRequestService(db, storageService)
	workerAppService := services.NewWorkerApplicationService(db)
	workerService := services.NewWorkerService(db)
	whatsAppService := services.NewWhatsAppService(db, cfg)
	quotationService := services.NewQuotationService(db)
	assignmentService := services.NewAssignmentService(db)
	paymentService := services.NewPaymentService(db, storageService)
	adminService := services.NewAdminService(db)

	// 4. Setup Routes and Middleware
	router := routes.SetupRouter(&routes.RouterDependencies{
		DB:                       db,
		Config:                   cfg,
		Storage:                  storageService,
		AuthService:              authService,
		RequestService:           requestService,
		WorkerApplicationService: workerAppService,
		WorkerService:            workerService,
		WhatsAppService:          whatsAppService,
		QuotationService:         quotationService,
		AssignmentService:        assignmentService,
		PaymentService:           paymentService,
		AdminService:             adminService,
	})

	// 5. Start Server
	addr := fmt.Sprintf(":%s", cfg.Port)
	log.Printf("📡 HOMI API Server listening at http://localhost%s", addr)
	log.Printf("🔗 Primary API Prefix: http://localhost%s/api/v1", addr)
	log.Printf("🔗 Compatibility Prefix: http://localhost%s/api", addr)

	if err := router.Run(addr); err != nil {
		log.Fatalf("❌ Server stopped unexpectedly: %v", err)
	}
}
