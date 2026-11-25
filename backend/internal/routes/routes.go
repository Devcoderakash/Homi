package routes

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"homi-backend/internal/config"
	"homi-backend/internal/handlers"
	"homi-backend/internal/middleware"
	"homi-backend/internal/services"
)

type RouterDependencies struct {
	DB      *gorm.DB
	Config  *config.Config
	Storage *services.StorageService

	AuthService              *services.AuthService
	RequestService           *services.RequestService
	WorkerApplicationService *services.WorkerApplicationService
	WorkerService            *services.WorkerService
	WhatsAppService          *services.WhatsAppService
	QuotationService         *services.QuotationService
	AssignmentService        *services.AssignmentService
	PaymentService           *services.PaymentService
	AdminService             *services.AdminService
	PrivacyService           *services.PrivacyService
}

func SetupRouter(deps *RouterDependencies) *gin.Engine {
	r := gin.New()
	_ = r.SetTrustedProxies([]string{"127.0.0.1", "::1"})
	r.Use(gin.Logger())
	r.Use(gin.Recovery())
	r.Use(middleware.CORSMiddleware(deps.Config))
	r.Use(middleware.SecurityHeadersMiddleware())
	r.Use(middleware.RateLimitMiddleware())
	r.Use(middleware.AuthMiddleware(deps.Config, deps.DB))

	// Static files serving (e.g. uploaded request photos)
	r.Static("/uploads", "./uploads")

	// Root endpoint for friendly browser verification
	r.GET("/", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"service": "homi-backend-api",
			"status":  "running",
			"message": "Welcome to Homi Backend API",
			"health":  "/api/health",
			"version": "1.0.0",
		})
	})

	// Global Health check
	healthHandler := func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status":  "healthy",
			"service": "homi-backend-go",
			"version": "1.0.0",
		})
	}
	r.GET("/health", healthHandler)
	r.HEAD("/health", healthHandler)

	// Instantiate Handlers
	authH := handlers.NewAuthHandler(deps.AuthService)
	custH := handlers.NewCustomerHandler(deps.DB, deps.AuthService, deps.RequestService)
	reqH := handlers.NewRequestHandler(deps.RequestService, deps.AuthService)
	appH := handlers.NewWorkerApplicationHandler(deps.WorkerApplicationService)
	workerH := handlers.NewWorkerHandler(deps.WorkerService)
	whatsappH := handlers.NewWhatsAppHandler(deps.WhatsAppService)
	quoteH := handlers.NewQuotationHandler(deps.QuotationService)
	assignH := handlers.NewAssignmentHandler(deps.AssignmentService)
	adminH := handlers.NewAdminHandler(deps.AdminService, deps.WhatsAppService)
	paymentH := handlers.NewPaymentHandler(deps.PaymentService)
	privacyH := handlers.NewPrivacyHandler(deps.PrivacyService)

	// Helper to attach routes to a router group (used for both /api/v1 and /api)
	registerCoreRoutes := func(rg *gin.RouterGroup) {
		healthFunc := func(c *gin.Context) {
			c.JSON(http.StatusOK, gin.H{"status": "ok", "api": "homi-v1"})
		}
		rg.GET("/health", healthFunc)
		rg.HEAD("/health", healthFunc)

		// --- AUTH ---
		rg.POST("/auth/register", authH.Register)
		rg.POST("/auth/login", authH.Login)
		rg.POST("/auth/logout", authH.Logout)
		rg.GET("/auth/me", authH.GetMe)
		rg.GET("/me", authH.GetMe)
		rg.PATCH("/me", custH.UpdateProfile)
		rg.POST("/auth", authH.AuthDispatcher)

		// --- PUBLIC DATA & UTILITIES ---
		rg.GET("/categories", adminH.ListPublicCategories)
		rg.GET("/workers", workerH.ListWorkers)
		rg.GET("/workers/:id", workerH.GetWorkerByID)
		rg.DELETE("/workers/:id", workerH.DeleteWorker)
		rg.POST("/workers/apply", appH.SubmitApplication)
		rg.POST("/worker-applications", appH.SubmitApplication)
		rg.GET("/location", custH.GetLocation)
		rg.GET("/overview", custH.GetOverview)

		// --- CUSTOMER & USER ---
		rg.GET("/customer/profile", custH.GetProfile)
		rg.PUT("/customer/profile", custH.UpdateProfile)
		rg.GET("/customer/requests", custH.GetMyRequests)
		rg.GET("/notifications", custH.GetNotifications)
		rg.POST("/notifications", custH.MarkNotificationsRead)

		// --- REQUESTS ---
		rg.POST("/requests", reqH.CreateRequest)
		rg.GET("/requests", reqH.ListRequests)
		rg.GET("/requests/:id", reqH.GetRequestByID)
		rg.PATCH("/requests/:id", reqH.PatchRequest)
		rg.PATCH("/requests/:id/status", reqH.UpdateStatus)
		rg.POST("/requests/:id/status", reqH.UpdateStatus)
		rg.POST("/requests/:id/photos", reqH.UploadPhotos)
		rg.GET("/requests/:id/receipt", custH.GetReceipt)
		rg.GET("/requests/:id/quotation", quoteH.GetLatestQuotation)
		rg.GET("/customer/quotations", quoteH.ListCustomerQuotations)
		rg.POST("/requests/:id/customer-decision", quoteH.CustomerDecision)
		rg.POST("/requests/:id/quotation/accept", quoteH.CustomerDecision)
		rg.POST("/requests/:id/quotation/decline", quoteH.CustomerDecision)
		rg.POST("/customer-quotations/:id/accept", quoteH.CustomerDecision)
		rg.POST("/customer-quotations/:id/decline", quoteH.CustomerDecision)

		// --- WHATSAPP & QUOTATION FLOW ---
		rg.GET("/requests/:id/whatsapp-message", whatsappH.GetJobMessage)
		rg.POST("/requests/:id/mark-shared", whatsappH.MarkShared)
		rg.GET("/requests/:id/worker-quotes", quoteH.ListWorkerQuotes)
		rg.POST("/requests/:id/worker-quotes", quoteH.CreateWorkerQuote)
		rg.PUT("/worker-quotes/:quoteId", quoteH.UpdateWorkerQuote)
		rg.DELETE("/worker-quotes/:quoteId", quoteH.DeleteWorkerQuote)
		rg.POST("/requests/:id/worker-quotes/:quoteId/select", quoteH.SelectPreferredQuote)
		rg.POST("/requests/:id/customer-quotation", quoteH.SendCustomerQuotation)
		rg.POST("/requests/:id/confirm-assignment", assignH.ConfirmAssignment)

		// --- WORK STATUS & PAYMENT FLOW ---
		rg.POST("/requests/:id/in-progress", assignH.MarkWorkInProgress)
		rg.POST("/requests/:id/complete", assignH.MarkWorkCompleted)
		rg.GET("/settings/payment", paymentH.GetPaymentSettings)
		rg.GET("/requests/:id/payment", paymentH.GetPayment)
		rg.POST("/requests/:id/payment", paymentH.SubmitPayment)
		rg.POST("/requests/:id/payment/screenshot", paymentH.UploadScreenshot)

		// --- SETTINGS ---
		rg.GET("/settings/whatsapp-group", whatsappH.GetGroupLink)
		rg.PUT("/settings/whatsapp-group", whatsappH.UpdateGroupLink)
		rg.POST("/settings/whatsapp-group", whatsappH.UpdateGroupLink)

		// --- DPDP PRIVACY & CONSENT (DPDP Act 2023) ---
		rg.POST("/privacy/consent", privacyH.RecordConsent)
		rg.POST("/privacy/requests", privacyH.SubmitDataSubjectRequest)
		rg.GET("/privacy/export", privacyH.ExportMyData)
		rg.GET("/privacy/grievance-officer", privacyH.GetGrievanceOfficer)

		// --- ADMIN GROUP (Strictly protected with RequireAdmin) ---
		admin := rg.Group("/admin")
		admin.Use(middleware.RequireAdmin())
		{
			admin.GET("/dashboard", adminH.GetDashboard)
			admin.GET("/stats", adminH.GetDashboard)
			admin.GET("/dashboard/recent-requests", adminH.GetDashboard)
			admin.GET("/dashboard/recent-applications", adminH.GetDashboard)

			admin.GET("/requests", reqH.ListRequests)
			admin.GET("/requests/:id", reqH.GetRequestByID)
			admin.PATCH("/requests/:id/status", reqH.UpdateStatus)
			admin.POST("/requests/:id/status", reqH.UpdateStatus)
			admin.POST("/requests/:id/publish", reqH.PublishRequest)
			admin.POST("/requests/:id/reject", reqH.RejectRequest)
			admin.POST("/requests/:id/assign", assignH.ConfirmAssignment)
			admin.GET("/requests/:id/whatsapp-message", whatsappH.GetJobMessage)
			admin.POST("/requests/:id/mark-shared", whatsappH.MarkShared)

			admin.GET("/requests/:id/quotes", quoteH.ListWorkerQuotes)
			admin.POST("/requests/:id/quotes", quoteH.CreateWorkerQuote)
			admin.PUT("/requests/:id/quotes/:quoteId", quoteH.UpdateWorkerQuote)
			admin.DELETE("/requests/:id/quotes/:quoteId", quoteH.DeleteWorkerQuote)
			admin.POST("/requests/:id/quotes/:quoteId/select", quoteH.SelectPreferredQuote)
			admin.POST("/requests/:id/customer-quote", quoteH.SendCustomerQuotation)
			admin.POST("/requests/:id/confirm-assignment", assignH.ConfirmAssignment)
			admin.POST("/requests/:id/in-progress", assignH.MarkWorkInProgress)
			admin.POST("/requests/:id/complete", assignH.MarkWorkCompleted)
			admin.GET("/assignments", assignH.ListAssignments)

			// Admin Payments & Verification
			admin.GET("/payments", paymentH.ListPayments)
			admin.POST("/payments/:id/verify", paymentH.VerifyPayment)
			admin.POST("/payments/:id/reject", paymentH.RejectPayment)
			admin.POST("/requests/:id/verify-payment", paymentH.VerifyPayment)
			admin.POST("/requests/:id/mark-payment-done", paymentH.VerifyPayment)
			admin.POST("/requests/:id/reject-payment", paymentH.RejectPayment)
			admin.GET("/settings/payment", paymentH.GetPaymentSettings)
			admin.PUT("/settings/payment", paymentH.UpdatePaymentSettings)
			admin.POST("/settings/payment", paymentH.UpdatePaymentSettings)
			admin.POST("/settings/payment/qr", paymentH.UploadQRCodeImage)

			admin.GET("/worker-applications", appH.ListApplications)
			admin.GET("/applications", appH.ListApplications)
			admin.GET("/worker-applications/:id", appH.GetApplicationByID)
			admin.GET("/applications/:id", appH.GetApplicationByID)
			admin.POST("/worker-applications/:id/approve", appH.ApproveApplication)
			admin.POST("/applications/:id/approve", appH.ApproveApplication)
			admin.POST("/applications/:id/shortlist", appH.ApproveApplication)
			admin.POST("/worker-applications/:id/reject", appH.RejectApplication)
			admin.POST("/applications/:id/reject", appH.RejectApplication)

			admin.GET("/workers", workerH.ListWorkers)
			admin.PATCH("/workers/:id/toggle", workerH.ToggleAvailability)
			admin.DELETE("/workers/:id", workerH.DeleteWorker)
			admin.GET("/customers", adminH.ListCustomers)
			admin.GET("/activity-logs", adminH.ListActivityLogs)
			admin.GET("/audit-logs", adminH.ListActivityLogs)

			admin.GET("/settings/whatsapp-group", whatsappH.GetGroupLink)
			admin.PUT("/settings/whatsapp-group", whatsappH.UpdateGroupLink)
			admin.POST("/settings/whatsapp-group", whatsappH.UpdateGroupLink)
			admin.GET("/settings", adminH.GetSettings)

			admin.GET("/categories", adminH.ListCategories)
			admin.POST("/categories", adminH.CreateCategory)
			admin.PUT("/categories/:id", adminH.UpdateCategory)
			admin.PATCH("/categories/:id/toggle", adminH.ToggleCategory)
			admin.DELETE("/categories/:id", adminH.DeleteCategory)

			admin.GET("/notifications", custH.GetNotifications)
			admin.PATCH("/notifications/:id/read", custH.MarkNotificationsRead)
			admin.POST("/notifications/mark-all-read", custH.MarkNotificationsRead)

			// Admin DPDP Privacy Requests & Grievance Redressal
			admin.GET("/privacy/requests", privacyH.ListDataSubjectRequests)
			admin.PATCH("/privacy/requests/:id", privacyH.ResolveDataSubjectRequest)
			admin.PUT("/privacy/grievance-officer", privacyH.UpdateGrievanceOfficer)
		}
	}

	// 1. Primary REST API prefix /api/v1
	v1Group := r.Group("/api/v1")
	registerCoreRoutes(v1Group)

	// 2. Backward-compatible alias /api for frontend components
	compatGroup := r.Group("/api")
	registerCoreRoutes(compatGroup)

	return r
}
