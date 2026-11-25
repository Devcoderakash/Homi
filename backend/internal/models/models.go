package models

import (
	"time"
)

// Request Status Constants as specified in requirements
const (
	StatusNew                     = "NEW"
	StatusUnderReview             = "UNDER_REVIEW"
	StatusSharedWithWorkers       = "SHARED_WITH_WORKERS"
	StatusWorkerSelected          = "WORKER_SELECTED"
	StatusCustomerApprovalPending = "CUSTOMER_APPROVAL_PENDING"
	StatusCustomerConfirmed       = "CUSTOMER_CONFIRMED"
	StatusAssigned                = "ASSIGNED"
	StatusInProgress              = "IN_PROGRESS"
	StatusCompleted               = "COMPLETED"
	StatusCustomerDeclined        = "CUSTOMER_DECLINED"
	StatusCancelled               = "CANCELLED"
	StatusRejected                = "REJECTED"

	// Payment Status Constants
	PaymentStatusNotDue     = "NOT_DUE"
	PaymentStatusPending    = "PAYMENT_PENDING"
	PaymentStatusSubmitted  = "PAYMENT_SUBMITTED"
	PaymentStatusRejected   = "PAYMENT_REJECTED"
	PaymentStatusPaid       = "PAID"

	// Assignment Status Constants
	AssignmentStatusAssigned   = "ASSIGNED"
	AssignmentStatusInProgress = "IN_PROGRESS"
	AssignmentStatusCompleted  = "COMPLETED"
	AssignmentStatusCancelled  = "CANCELLED"
)

// User represents customers, administrators, and field workers in the system
type User struct {
	ID                uint       `gorm:"primaryKey" json:"id"`
	SupabaseID        *string    `gorm:"size:64;uniqueIndex" json:"supabaseId,omitempty"`
	Name              string     `gorm:"size:120;not null" json:"name"`
	Email             string     `gorm:"size:255;not null;uniqueIndex" json:"email"`
	Phone             string     `gorm:"size:40;not null" json:"phone"`
	Role              string     `gorm:"size:20;not null;default:'customer'" json:"role"` // customer, admin, worker
	PasswordHash      string     `gorm:"type:text;not null" json:"-"`
	City              *string    `gorm:"size:120" json:"city,omitempty"`
	Address           *string    `gorm:"type:text" json:"address,omitempty"`
	Latitude          *float64   `json:"latitude,omitempty"`
	Longitude         *float64   `json:"longitude,omitempty"`
	LocationLabel     *string    `gorm:"size:300" json:"locationLabel,omitempty"`
	LocationSource    *string    `gorm:"size:20" json:"locationSource,omitempty"`
	Specialty         *string    `gorm:"size:80" json:"specialty,omitempty"`
	Bio               *string    `gorm:"type:text" json:"bio,omitempty"`
	ExperienceYears   int        `gorm:"default:0" json:"experienceYears"`
	VisitFee          int        `gorm:"default:19900" json:"visitFee"` // stored in paise
	Available         bool       `gorm:"default:true" json:"available"`
	ServiceRadiusKm   int        `gorm:"default:15" json:"serviceRadiusKm"`
	SpokenLanguages   *string    `gorm:"size:100;default:'hi,en'" json:"spokenLanguages,omitempty"`
	Rating            *float64   `json:"rating,omitempty"`
	ReviewCount       int        `gorm:"default:0" json:"reviewCount"`
	LocationUpdatedAt *time.Time `json:"locationUpdatedAt,omitempty"`
	CreatedAt         time.Time  `json:"createdAt"`
	UpdatedAt         time.Time  `json:"updatedAt"`
}

func (User) TableName() string {
	return "users"
}

// CustomerProfile stores additional customer profile metadata
type CustomerProfile struct {
	ID        uint      `gorm:"primaryKey" json:"id"`
	UserID    uint      `gorm:"uniqueIndex;not null" json:"userId"`
	FullName  string    `gorm:"size:120" json:"fullName"`
	Phone     string    `gorm:"size:40" json:"phone"`
	City      string    `gorm:"size:120" json:"city"`
	Area      string    `gorm:"size:120" json:"area"`
	Address   string    `gorm:"type:text" json:"address"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

func (CustomerProfile) TableName() string {
	return "customer_profiles"
}

// Worker represents an approved local service technician
type Worker struct {
	ID              uint      `gorm:"primaryKey" json:"id"`
	UserID          *uint     `gorm:"index" json:"userId,omitempty"`
	Name            string    `gorm:"size:120;not null" json:"name"`
	Phone           string    `gorm:"size:40;not null;index" json:"phone"`
	Email           string    `gorm:"size:255" json:"email,omitempty"`
	Specialty       string    `gorm:"size:80;not null;index" json:"specialty"`
	Skills          string    `gorm:"type:text" json:"skills,omitempty"`
	ExperienceYears int       `gorm:"default:0" json:"experienceYears"`
	City            string    `gorm:"size:120;index" json:"city"`
	Area            string    `gorm:"size:120" json:"area"`
	Address         string    `gorm:"type:text" json:"address"`
	Bio             string    `gorm:"type:text" json:"bio,omitempty"`
	AvailableFrom   string    `gorm:"size:40" json:"availableFrom,omitempty"`
	AvailableTo     string    `gorm:"size:40" json:"availableTo,omitempty"`
	AvailableDays   string    `gorm:"size:100" json:"availableDays,omitempty"`
	DocumentType    string    `gorm:"size:80" json:"documentType,omitempty"`
	DocumentURL     string    `gorm:"type:text" json:"documentUrl,omitempty"`
	DocumentsURL    string    `gorm:"type:text" json:"documentsUrl,omitempty"`
	ProfilePhotoURL string    `gorm:"type:text" json:"profilePhotoUrl,omitempty"`
	VisitFee        int       `gorm:"default:19900" json:"visitFee"`
	Available       bool      `gorm:"default:true;index" json:"available"`
	Rating          *float64  `json:"rating,omitempty"`
	ReviewCount     int       `gorm:"default:0" json:"reviewCount"`
	ServiceRadiusKm int       `gorm:"default:15" json:"serviceRadiusKm"`
	CreatedAt       time.Time `gorm:"index" json:"createdAt"`
	UpdatedAt       time.Time `json:"updatedAt"`
}

func (Worker) TableName() string {
	return "workers"
}

// WorkerApplication represents a public application from a tradesperson
type WorkerApplication struct {
	ID              uint       `gorm:"primaryKey" json:"id"`
	RequestID       *uint      `json:"requestId,omitempty"` // nullable for backwards compatibility
	WorkerID        *uint      `json:"workerId,omitempty"`  // nullable
	FullName        string     `gorm:"size:120" json:"fullName"`
	Phone           string     `gorm:"size:40" json:"phone"`
	Email           string     `gorm:"size:255" json:"email,omitempty"`
	Category        string     `gorm:"size:80" json:"category"`
	Skills          string     `gorm:"type:text" json:"skills,omitempty"`
	ExperienceYears int        `gorm:"default:0" json:"experienceYears"`
	City            string     `gorm:"size:120" json:"city"`
	Area            string     `gorm:"size:120" json:"area"`
	Address         string     `gorm:"type:text" json:"address"`
	Bio             string     `gorm:"type:text" json:"bio,omitempty"`
	AvailableFrom   string     `gorm:"size:40" json:"availableFrom,omitempty"`
	AvailableTo     string     `gorm:"size:40" json:"availableTo,omitempty"`
	AvailableDays   string     `gorm:"size:100" json:"availableDays,omitempty"`
	DocumentType    string     `gorm:"size:80" json:"documentType,omitempty"`
	DocumentURL     string     `gorm:"type:text" json:"documentUrl,omitempty"`
	ProfilePhotoURL string     `gorm:"type:text" json:"profilePhotoUrl,omitempty"`
	DocumentsURL    string     `gorm:"type:text" json:"documentsUrl,omitempty"`
	Status          string     `gorm:"size:30;not null;default:'PENDING'" json:"status"` // PENDING, APPROVED, REJECTED
	AdminNotes      string     `gorm:"type:text" json:"adminNotes,omitempty"`
	ReviewedAt      *time.Time `json:"reviewedAt,omitempty"`
	ReviewedBy      *uint      `json:"reviewedBy,omitempty"`
	AppliedAt       time.Time  `json:"appliedAt"`
	CreatedAt       time.Time  `json:"createdAt"`
	UpdatedAt       time.Time  `json:"updatedAt"`
}

func (WorkerApplication) TableName() string {
	return "worker_applications"
}

// ServiceRequest represents a customer household service booking
type ServiceRequest struct {
	ID                     uint                  `gorm:"primaryKey" json:"id"`
	CustomerID             uint                  `gorm:"not null;index:idx_requests_customer_created,priority:1;index" json:"customerId"`
	Customer               *User                 `gorm:"foreignKey:CustomerID" json:"customer,omitempty"`
	WorkerID               *uint                 `gorm:"index" json:"workerId,omitempty"`
	Worker                 *Worker               `gorm:"foreignKey:WorkerID" json:"worker,omitempty"`
	Category               string                `gorm:"size:80;not null;index" json:"category"`
	Title                  string                `gorm:"size:160;not null" json:"title"`
	Description            string                `gorm:"type:text;not null" json:"description"`
	ContactName            string                `gorm:"size:120" json:"contactName"`
	ContactPhone           string                `gorm:"size:40" json:"contactPhone"`
	Address                string                `gorm:"type:text;not null" json:"address"`
	City                   string                `gorm:"size:120;not null;index" json:"city"`
	Latitude               *float64              `json:"latitude,omitempty"`
	Longitude              *float64              `json:"longitude,omitempty"`
	LocationLabel          *string               `gorm:"size:300" json:"locationLabel,omitempty"`
	LocationSource         *string               `gorm:"size:20" json:"locationSource,omitempty"`
	PreferredDate          string                `gorm:"size:30;not null" json:"preferredDate"`
	PreferredTime          string                `gorm:"size:50;not null" json:"preferredTime"`
	PreferredLanguage      string                `gorm:"size:10;default:'en'" json:"preferredLanguage"`
	Status                 string                `gorm:"size:40;not null;default:'NEW';index" json:"status"`
	QuotedAmount           *int                  `json:"quotedAmount,omitempty"`
	QuoteNote              *string               `gorm:"type:text" json:"quoteNote,omitempty"`
	QuoteStatus            string                `gorm:"size:20;default:'none'" json:"quoteStatus"`
	PaymentStatus          string                `gorm:"size:25;default:'unpaid'" json:"paymentStatus"`
	PaymentMethod          *string               `gorm:"size:20" json:"paymentMethod,omitempty"`
	PaidAt                 *time.Time            `json:"paidAt,omitempty"`
	WhatsAppSharedAt       *time.Time            `gorm:"column:whatsapp_shared_at" json:"whatsappSharedAt,omitempty"`
	SelectedWorkerID       *uint                 `json:"selectedWorkerId,omitempty"`
	SelectedWorkerName     *string               `gorm:"size:120" json:"selectedWorkerName,omitempty"`
	SelectedWorkerPhone    *string               `gorm:"size:40" json:"selectedWorkerPhone,omitempty"`
	QuoteLabourCharges     *int                  `json:"quoteLabourCharges,omitempty"`
	QuoteMaterialCharges   *int                  `json:"quoteMaterialCharges,omitempty"`
	QuoteInspectionCharges *int                  `json:"quoteInspectionCharges,omitempty"`
	QuoteAdditionalCharges *int                  `json:"quoteAdditionalCharges,omitempty"`
	QuoteDiscount          *int                  `json:"quoteDiscount,omitempty"`
	QuoteFinalTotal        *int                  `json:"quoteFinalTotal,omitempty"`
	QuoteWorkDescription   *string               `gorm:"type:text" json:"quoteWorkDescription,omitempty"`
	QuoteEstimatedDuration *string               `gorm:"size:80" json:"quoteEstimatedDuration,omitempty"`
	QuoteProposedVisitDate *string               `gorm:"size:40" json:"quoteProposedVisitDate,omitempty"`
	QuoteProposedVisitTime *string               `gorm:"size:60" json:"quoteProposedVisitTime,omitempty"`
	QuoteNotes             *string               `gorm:"type:text" json:"quoteNotes,omitempty"`
	QuoteSentAt            *time.Time            `json:"quoteSentAt,omitempty"`
	CustomerApprovedAt     *time.Time            `json:"customerApprovedAt,omitempty"`
	CustomerDeclinedAt     *time.Time            `json:"customerDeclinedAt,omitempty"`
	CustomerDeclineReason  *string               `gorm:"type:text" json:"customerDeclineReason,omitempty"`
	AdminNotes             *string               `gorm:"type:text" json:"adminNotes,omitempty"`
	ApprovedAt             *time.Time            `json:"approvedAt,omitempty"`
	ApprovedBy             *uint                 `json:"approvedBy,omitempty"`
	VisitStartsAt          *time.Time            `json:"visitStartsAt,omitempty"`
	VisitStatus            string                `gorm:"size:20;default:'none'" json:"visitStatus"`
	CompletedAt            *time.Time            `json:"completedAt,omitempty"`
	CompletedBy            *uint                 `json:"completedBy,omitempty"`
	CompletionNote         *string               `gorm:"type:text" json:"completionNote,omitempty"`
	Images                 []ServiceRequestImage `gorm:"foreignKey:RequestID" json:"images,omitempty"`
	WorkerQuotes           []WorkerQuote         `gorm:"foreignKey:RequestID" json:"workerQuotes,omitempty"`
	CustomerQuotations     []CustomerQuotation   `gorm:"foreignKey:RequestID" json:"customerQuotations,omitempty"`
	LatestQuotation        *CustomerQuotation    `gorm:"-" json:"quotation,omitempty"`
	Assignment             *Assignment           `gorm:"foreignKey:RequestID" json:"assignment,omitempty"`
	Payment                *Payment              `gorm:"foreignKey:RequestID" json:"payment,omitempty"`
	CreatedAt              time.Time             `gorm:"index:idx_requests_customer_created,priority:2;index" json:"createdAt"`
	UpdatedAt              time.Time             `json:"updatedAt"`
}

func (ServiceRequest) TableName() string {
	return "service_requests"
}

// ServiceRequestImage stores photos uploaded with a request (in Supabase Storage)
type ServiceRequestImage struct {
	ID          uint      `gorm:"primaryKey" json:"id"`
	RequestID   uint      `gorm:"not null;index" json:"requestId"`
	ImageURL    string    `gorm:"type:text;not null" json:"imageUrl"`
	StoragePath string    `gorm:"type:text" json:"storagePath,omitempty"`
	FileName    string    `gorm:"size:255" json:"fileName,omitempty"`
	FileSize    int64     `json:"fileSize,omitempty"`
	ContentType string    `gorm:"size:100" json:"contentType,omitempty"`
	CreatedAt   time.Time `json:"createdAt"`
}

func (ServiceRequestImage) TableName() string {
	return "service_request_images"
}

// WorkerQuote represents a bid from a worker gathered from WhatsApp
type WorkerQuote struct {
	ID                      uint      `gorm:"primaryKey" json:"id"`
	RequestID               uint      `gorm:"not null;index" json:"requestId"`
	WorkerID                *uint     `gorm:"index" json:"workerId,omitempty"`
	WorkerName              string    `gorm:"size:120;not null" json:"workerName"`
	WorkerPhone             string    `gorm:"size:40;not null" json:"workerPhone"`
	QuotedAmount            int       `gorm:"not null" json:"quotedAmount"`
	LabourCharges           int       `gorm:"default:0" json:"labourCharges"`
	MaterialCharges         int       `gorm:"default:0" json:"materialCharges"`
	AdditionalCharges       int       `gorm:"default:0" json:"additionalCharges"`
	Availability            string    `gorm:"size:120" json:"availability,omitempty"`
	EstimatedCompletionTime string    `gorm:"size:120" json:"estimatedCompletionTime,omitempty"`
	Notes                   string    `gorm:"type:text" json:"notes,omitempty"`
	IsSelected              bool      `gorm:"default:false" json:"isSelected"`
	CreatedAt               time.Time `json:"createdAt"`
	UpdatedAt               time.Time `json:"updatedAt"`
}

func (WorkerQuote) TableName() string {
	return "worker_quotes"
}

// CustomerQuotation records formal quotes generated by Admin for the Customer
type CustomerQuotation struct {
	ID                  uint       `gorm:"primaryKey" json:"id"`
	RequestID           uint       `gorm:"not null;index" json:"requestId"`
	CustomerID          uint       `gorm:"index" json:"customerId"`
	SelectedWorkerID    *uint      `json:"selectedWorkerId,omitempty"`
	SelectedWorkerName  string     `gorm:"size:120" json:"selectedWorkerName"`
	SelectedWorkerPhone string     `gorm:"size:40" json:"selectedWorkerPhone"`
	WorkDescription     string     `gorm:"type:text" json:"workDescription"`
	LabourCharges       int        `gorm:"default:0" json:"labourCharges"`
	MaterialCharges     int        `gorm:"default:0" json:"materialCharges"`
	InspectionCharges   int        `gorm:"default:0" json:"inspectionCharges"`
	AdditionalCharges   int        `gorm:"default:0" json:"additionalCharges"`
	Discount            int        `gorm:"default:0" json:"discount"`
	FinalTotal          int        `gorm:"not null" json:"finalTotal"`
	EstimatedDuration   string     `gorm:"size:80" json:"estimatedDuration"`
	ProposedVisitDate   string     `gorm:"size:40" json:"proposedVisitDate"`
	ProposedVisitTime   string     `gorm:"size:60" json:"proposedVisitTime"`
	Notes               string     `gorm:"type:text" json:"notes,omitempty"`
	Status              string     `gorm:"size:30;not null;default:'PENDING'" json:"status"` // PENDING, ACCEPTED, DECLINED
	DeclineReason       string     `gorm:"type:text" json:"declineReason,omitempty"`
	SentAt              time.Time  `json:"sentAt"`
	DecidedAt           *time.Time `json:"decidedAt,omitempty"`
	CreatedAt           time.Time  `json:"createdAt"`
	UpdatedAt           time.Time  `json:"updatedAt"`
}

func (CustomerQuotation) TableName() string {
	return "customer_quotations"
}

// CustomerFacingQuotation is the clean, customer-facing price proposal containing NO worker identity
type CustomerFacingQuotation struct {
	ID                uint      `json:"id"`
	RequestID         uint      `json:"requestId"`
	WorkDescription   string    `json:"workDescription"`
	LabourCharges     int       `json:"labourCharges"`
	MaterialCharges   int       `json:"materialCharges"`
	InspectionCharges int       `json:"inspectionCharges"`
	AdditionalCharges int       `json:"additionalCharges"`
	Discount          int       `json:"discount"`
	FinalTotal        int       `json:"finalTotal"`
	EstimatedDuration string    `json:"estimatedDuration"`
	ProposedVisitDate string    `json:"proposedVisitDate"`
	ProposedVisitTime string    `json:"proposedVisitTime"`
	Notes             string    `json:"notes,omitempty"`
	Status            string    `json:"status"`
	SentAt            time.Time `json:"sentAt"`
}

func (q *CustomerQuotation) ToCustomerFacing() CustomerFacingQuotation {
	return CustomerFacingQuotation{
		ID:                q.ID,
		RequestID:         q.RequestID,
		WorkDescription:   q.WorkDescription,
		LabourCharges:     q.LabourCharges,
		MaterialCharges:   q.MaterialCharges,
		InspectionCharges: q.InspectionCharges,
		AdditionalCharges: q.AdditionalCharges,
		Discount:          q.Discount,
		FinalTotal:        q.FinalTotal,
		EstimatedDuration: q.EstimatedDuration,
		ProposedVisitDate: q.ProposedVisitDate,
		ProposedVisitTime: q.ProposedVisitTime,
		Notes:             q.Notes,
		Status:            q.Status,
		SentAt:            q.SentAt,
	}
}

// Assignment represents worker dispatch for a service request
type Assignment struct {
	ID             uint       `gorm:"primaryKey" json:"id"`
	RequestID      uint       `gorm:"not null;index" json:"requestId"`
	QuotationID    *uint      `gorm:"index" json:"quotationId,omitempty"`
	WorkerID       *uint      `gorm:"index" json:"workerId,omitempty"`
	WorkerName     string     `gorm:"size:120" json:"workerName"`
	WorkerPhone    string     `gorm:"size:40" json:"workerPhone"`
	AssignedBy     uint       `gorm:"not null" json:"assignedBy"`
	Notes          string     `gorm:"type:text" json:"notes,omitempty"`
	Status         string     `gorm:"size:30;default:'ASSIGNED';index" json:"status"`
	AssignedAt     time.Time  `json:"assignedAt"`
	CompletedAt    *time.Time `json:"completedAt,omitempty"`
	CompletedBy    *uint      `json:"completedBy,omitempty"`
	CompletionNote string     `gorm:"type:text" json:"completionNote,omitempty"`
	CreatedAt      time.Time  `json:"createdAt"`
}

func (Assignment) TableName() string {
	return "assignments"
}

// Payment records customer payment submissions and admin verification
type Payment struct {
	ID                    uint       `gorm:"primaryKey" json:"id"`
	RequestID             uint       `gorm:"not null;index" json:"requestId"`
	QuotationID           *uint      `json:"quotationId,omitempty"`
	CustomerID            uint       `gorm:"not null;index" json:"customerId"`
	Amount                int        `gorm:"not null;default:0" json:"amount"`
	PaymentMethod         string     `gorm:"size:40;not null;default:'UPI'" json:"paymentMethod"`
	TransactionReference  string     `gorm:"size:120" json:"transactionReference,omitempty"`
	PaymentDate           string     `gorm:"size:30" json:"paymentDate,omitempty"`
	PaymentScreenshotPath string     `gorm:"type:text" json:"paymentScreenshotPath,omitempty"`
	Status                string     `gorm:"size:30;not null;default:'PAYMENT_PENDING';index" json:"status"`
	RejectionReason       string     `gorm:"type:text" json:"rejectionReason,omitempty"`
	SubmittedAt           *time.Time `json:"submittedAt,omitempty"`
	VerifiedAt            *time.Time `json:"verifiedAt,omitempty"`
	VerifiedBy            *uint      `json:"verifiedBy,omitempty"`
	CreatedAt             time.Time  `json:"createdAt"`
	UpdatedAt             time.Time  `json:"updatedAt"`

	Customer *User           `gorm:"foreignKey:CustomerID" json:"customer,omitempty"`
	Request  *ServiceRequest `gorm:"foreignKey:RequestID" json:"request,omitempty"`
}

func (Payment) TableName() string {
	return "payments"
}

// PaymentSettings stores admin-configured UPI and bank details
type PaymentSettings struct {
	ID                uint      `gorm:"primaryKey" json:"id"`
	UpiID             string    `gorm:"size:120" json:"upiId"`
	PayeeName         string    `gorm:"size:120" json:"payeeName"`
	QRStoragePath     string    `gorm:"type:text" json:"qrStoragePath,omitempty"`
	QRCodeURL         string    `gorm:"type:text" json:"qrCodeUrl,omitempty"`
	BankAccountHolder string    `gorm:"size:120" json:"bankAccountHolder"`
	BankName          string    `gorm:"size:120" json:"bankName"`
	AccountNumber     string    `gorm:"size:60" json:"accountNumber"`
	IFSC              string    `gorm:"size:30" json:"ifsc"`
	Branch            string    `gorm:"size:120" json:"branch"`
	EnableUPI         bool      `gorm:"not null;default:true" json:"enableUpi"`
	EnableBank        bool      `gorm:"not null;default:true" json:"enableBank"`
	CreatedAt         time.Time `json:"createdAt"`
	UpdatedAt         time.Time `json:"updatedAt"`
}

func (PaymentSettings) TableName() string {
	return "payment_settings"
}

// AppSetting stores platform configurations such as the WhatsApp group invite link
type AppSetting struct {
	Key       string    `gorm:"size:80;primaryKey" json:"key"`
	Value     string    `gorm:"type:text;not null" json:"value"`
	UpdatedAt time.Time `json:"updatedAt"`
}

func (AppSetting) TableName() string {
	return "app_settings"
}

// AdminActivityLog logs sensitive administrator actions
type AdminActivityLog struct {
	ID         uint      `gorm:"primaryKey" json:"id"`
	AdminID    *uint     `json:"adminId,omitempty"`
	Action     string    `gorm:"size:80;not null" json:"action"`
	EntityType string    `gorm:"size:80;not null" json:"entityType"`
	EntityID   string    `gorm:"size:80" json:"entityId,omitempty"`
	Details    string    `gorm:"type:text" json:"details,omitempty"`
	IPAddress  string    `gorm:"size:45" json:"ipAddress,omitempty"`
	CreatedAt  time.Time `json:"createdAt"`
}

func (AdminActivityLog) TableName() string {
	return "admin_activity_logs"
}

// RequestStatusHistory tracks every status change on a request
type RequestStatusHistory struct {
	ID         uint      `gorm:"primaryKey" json:"id"`
	RequestID  uint      `gorm:"not null;index" json:"requestId"`
	FromStatus string    `gorm:"size:40" json:"fromStatus"`
	ToStatus   string    `gorm:"size:40;not null" json:"toStatus"`
	ChangedBy  *uint     `json:"changedBy,omitempty"`
	Notes      string    `gorm:"type:text" json:"notes,omitempty"`
	CreatedAt  time.Time `json:"createdAt"`
}

func (RequestStatusHistory) TableName() string {
	return "request_status_history"
}

// Category represents a household service category
type Category struct {
	ID            uint      `gorm:"primaryKey" json:"id"`
	Name          string    `gorm:"size:80;not null" json:"name"`
	Slug          string    `gorm:"size:80;not null;uniqueIndex" json:"slug"`
	Description   string    `gorm:"type:text" json:"description,omitempty"`
	Icon          string    `gorm:"size:50" json:"icon,omitempty"`
	Color         string    `gorm:"size:30;default:'#e5edee'" json:"color,omitempty"`
	StartingPrice int       `gorm:"default:199" json:"startingPrice"`
	Active        bool      `gorm:"default:true;index" json:"active"`
	SortOrder     int       `gorm:"default:0;index" json:"sortOrder"`
	CreatedAt     time.Time `json:"createdAt"`
	UpdatedAt     time.Time `json:"updatedAt"`
}

func (Category) TableName() string {
	return "categories"
}

// Notification records customer and admin notifications
type Notification struct {
	ID        uint       `gorm:"primaryKey" json:"id"`
	UserID    uint       `gorm:"not null;index" json:"userId"`
	RequestID *uint      `gorm:"index" json:"requestId,omitempty"`
	Kind      string     `gorm:"size:40;not null" json:"kind"`
	Title     string     `gorm:"size:160;not null" json:"title"`
	ReadAt    *time.Time `json:"readAt,omitempty"`
	CreatedAt time.Time  `json:"createdAt"`
}

func (Notification) TableName() string {
	return "notifications"
}

// PrivacyConsent logs granular customer consent under India's DPDP Act 2023
type PrivacyConsent struct {
	ID             uint       `gorm:"primaryKey" json:"id"`
	UserID         *uint      `gorm:"index" json:"userId,omitempty"`
	SessionID      string     `gorm:"size:120;index" json:"sessionId,omitempty"`
	ConsentType    string     `gorm:"size:60;not null;index" json:"consentType"` // service_booking, worker_application, cookies_analytics, cookies_marketing
	Purpose        string     `gorm:"type:text;not null" json:"purpose"`
	ConsentVersion string     `gorm:"size:20;not null;default:'1.0'" json:"consentVersion"`
	Granted        bool       `gorm:"not null;default:true" json:"granted"`
	IPAddress      string     `gorm:"size:45" json:"ipAddress,omitempty"`
	UserAgent      string     `gorm:"type:text" json:"userAgent,omitempty"`
	GrantedAt      time.Time  `json:"grantedAt"`
	RevokedAt      *time.Time `json:"revokedAt,omitempty"`
}

func (PrivacyConsent) TableName() string {
	return "privacy_consents"
}

// DataSubjectRequest tracks Right to Access, Correction, Erasure and Grievances under DPDP Act 2023
type DataSubjectRequest struct {
	ID              uint       `gorm:"primaryKey" json:"id"`
	UserID          *uint      `gorm:"index" json:"userId,omitempty"`
	RequestType     string     `gorm:"size:40;not null;index" json:"requestType"` // ACCESS, CORRECTION, ERASURE, GRIEVANCE
	ContactEmail    string     `gorm:"size:255;not null" json:"contactEmail"`
	ContactPhone    string     `gorm:"size:40" json:"contactPhone,omitempty"`
	Details         string     `gorm:"type:text;not null" json:"details"`
	Status          string     `gorm:"size:30;not null;default:'PENDING';index" json:"status"` // PENDING, IN_REVIEW, RESOLVED, REJECTED
	ResolutionNotes string     `gorm:"type:text" json:"resolutionNotes,omitempty"`
	ResolvedBy      *uint      `json:"resolvedBy,omitempty"`
	ResolvedAt      *time.Time `json:"resolvedAt,omitempty"`
	CreatedAt       time.Time  `json:"createdAt"`
	UpdatedAt       time.Time  `json:"updatedAt"`
}

func (DataSubjectRequest) TableName() string {
	return "data_subject_requests"
}

// GrievanceOfficer stores configurable Data Protection & Grievance Officer details
type GrievanceOfficer struct {
	ID           uint      `gorm:"primaryKey" json:"id"`
	Name         string    `gorm:"size:120;not null" json:"name"`
	Designation  string    `gorm:"size:120;not null" json:"designation"`
	Email        string    `gorm:"size:255;not null" json:"email"`
	Phone        string    `gorm:"size:40;not null" json:"phone"`
	Address      string    `gorm:"type:text;not null" json:"address"`
	Instructions string    `gorm:"type:text;not null" json:"instructions"`
	UpdatedAt    time.Time `json:"updatedAt"`
}

func (GrievanceOfficer) TableName() string {
	return "grievance_officers"
}
