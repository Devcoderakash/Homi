package services

import (
	"errors"
	"fmt"
	"mime/multipart"
	"strings"
	"time"

	"gorm.io/gorm"

	"homi-backend/internal/models"
	"homi-backend/internal/utils"
)

type RequestService struct {
	db      *gorm.DB
	storage *StorageService
}

func NewRequestService(db *gorm.DB, storage *StorageService) *RequestService {
	return &RequestService{db: db, storage: storage}
}

type CreateRequestInput struct {
	Category          string   `json:"category" binding:"required"`
	Title             string   `json:"title"`
	Description       string   `json:"description" binding:"required"`
	ContactName       string   `json:"contactName"`
	ContactPhone      string   `json:"contactPhone"`
	Address           string   `json:"address" binding:"required"`
	City              string   `json:"city" binding:"required"`
	Area              string   `json:"area"`
	Latitude          *float64 `json:"latitude"`
	Longitude         *float64 `json:"longitude"`
	LocationLabel     *string  `json:"locationLabel"`
	PreferredDate     string   `json:"preferredDate"`
	PreferredTime     string   `json:"preferredTime"`
	PreferredLanguage string   `json:"preferredLanguage"`
	ImageURLs         []string `json:"imageUrls"`
	Honeypot          string   `json:"website"` // Anti-bot honeypot
}

type RequestFilter struct {
	CustomerID *uint
	Category   string
	Status     string
	Scope      string
	Search     string
	Limit      int
	Offset     int
}

func (s *RequestService) CreateRequest(customerID uint, input CreateRequestInput) (*models.ServiceRequest, error) {
	category := strings.TrimSpace(input.Category)
	description := strings.TrimSpace(input.Description)
	if category == "" || description == "" {
		return nil, errors.New("category and description are required")
	}

	title := strings.TrimSpace(input.Title)
	if title == "" {
		if len(description) > 60 {
			title = description[:60] + "..."
		} else {
			title = description
		}
	}

	prefDate := input.PreferredDate
	if prefDate == "" {
		prefDate = time.Now().Format("2006-01-02")
	}

	prefTime := input.PreferredTime
	if prefTime == "" {
		prefTime = "Morning (8am – 12pm)"
	}

	prefLang := input.PreferredLanguage
	if prefLang == "" {
		prefLang = "en"
	}

	// Fetch customer to fallback contact info if not provided
	var customer models.User
	if err := s.db.First(&customer, customerID).Error; err == nil {
		if input.ContactName == "" {
			input.ContactName = customer.Name
		}
		if input.ContactPhone == "" {
			input.ContactPhone = customer.Phone
		}
	}

	fullAddress := strings.TrimSpace(input.Address)
	if input.Area != "" && !strings.Contains(fullAddress, input.Area) {
		fullAddress = input.Area + ", " + fullAddress
	}

	locationLabel := input.LocationLabel
	if locationLabel == nil || *locationLabel == "" {
		lbl := fmt.Sprintf("%s, %s", fullAddress, input.City)
		locationLabel = &lbl
	}

	req := models.ServiceRequest{
		CustomerID:        customerID,
		Category:          category,
		Title:             title,
		Description:       description,
		ContactName:       strings.TrimSpace(input.ContactName),
		ContactPhone:      strings.TrimSpace(input.ContactPhone),
		Address:           fullAddress,
		City:              strings.TrimSpace(input.City),
		Latitude:          input.Latitude,
		Longitude:         input.Longitude,
		LocationLabel:     locationLabel,
		PreferredDate:     prefDate,
		PreferredTime:     prefTime,
		PreferredLanguage: prefLang,
		Status:            models.StatusNew,
		CreatedAt:         time.Now().UTC(),
		UpdatedAt:         time.Now().UTC(),
	}

	err := s.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(&req).Error; err != nil {
			return err
		}

		// Save image URLs if provided
		for _, url := range input.ImageURLs {
			if strings.TrimSpace(url) != "" {
				img := models.ServiceRequestImage{
					RequestID: req.ID,
					ImageURL:  url,
					CreatedAt: time.Now().UTC(),
				}
				if err := tx.Create(&img).Error; err != nil {
					return err
				}
			}
		}

		// Log status creation history
		hist := models.RequestStatusHistory{
			RequestID:  req.ID,
			FromStatus: "",
			ToStatus:   models.StatusNew,
			ChangedBy:  &customerID,
			Notes:      "Customer submitted service request",
			CreatedAt:  time.Now().UTC(),
		}
		if err := tx.Create(&hist).Error; err != nil {
			return err
		}

		// Create notification for admin (best-effort: skip if no admin user exists yet)
		adminID := utils.GetDefaultAdminID(s.db)
		if adminID > 0 {
			// Verify the admin user actually exists before inserting notification
			var adminExists int64
			tx.Model(&models.User{}).Where("id = ?", adminID).Count(&adminExists)
			if adminExists > 0 {
				notify := models.Notification{
					UserID:    adminID,
					RequestID: &req.ID,
					Kind:      "new_request",
					Title:     fmt.Sprintf("New Request #HOMI-%d: %s in %s", req.ID, req.Category, req.City),
					CreatedAt: time.Now().UTC(),
				}
				// Non-blocking: log error but don't fail the whole request
				if err := tx.Create(&notify).Error; err != nil {
					fmt.Printf("[WARN] Could not create admin notification: %v\n", err)
				}
			}
		}
		return nil
	})

	if err != nil {
		return nil, errors.New("failed to submit service request: " + err.Error())
	}

	return s.GetRequestByID(req.ID)
}

func (s *RequestService) ListRequests(filter RequestFilter) ([]models.ServiceRequest, int64, error) {
	baseQuery := s.db.Model(&models.ServiceRequest{})

	if filter.CustomerID != nil {
		baseQuery = baseQuery.Where("customer_id = ?", *filter.CustomerID)
	}

	if filter.Category != "" {
		baseQuery = baseQuery.Where("LOWER(category) = ?", strings.ToLower(filter.Category))
	}

	if filter.Status != "" {
		canonicalStatus := utils.NormalizeStatus(filter.Status)
		baseQuery = baseQuery.Where("status = ? OR UPPER(status) = ?", canonicalStatus, canonicalStatus)
	}

	if filter.Scope == "active" {
		baseQuery = baseQuery.Where("UPPER(status) NOT IN ('COMPLETED', 'CANCELLED', 'REJECTED', 'CUSTOMER_DECLINED')")
	} else if filter.Scope == "completed" {
		baseQuery = baseQuery.Where("UPPER(status) = 'COMPLETED'")
	} else if filter.Scope == "cancelled" {
		baseQuery = baseQuery.Where("UPPER(status) IN ('CANCELLED', 'REJECTED', 'CUSTOMER_DECLINED')")
	} else if filter.Scope == "pending_approval" {
		baseQuery = baseQuery.Where("UPPER(status) = 'CUSTOMER_APPROVAL_PENDING'")
	}

	if filter.Search != "" {
		pattern := "%" + strings.ToLower(filter.Search) + "%"
		baseQuery = baseQuery.Where("LOWER(title) LIKE ? OR LOWER(description) LIKE ? OR LOWER(city) LIKE ? OR contact_phone LIKE ?",
			pattern, pattern, pattern, pattern)
	}

	var total int64
	if err := baseQuery.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	limit := filter.Limit
	if limit <= 0 || limit > 100 {
		limit = 50
	}

	var requests []models.ServiceRequest
	err := baseQuery.
		Preload("Customer").
		Preload("Worker").
		Preload("Images").
		Preload("WorkerQuotes").
		Preload("CustomerQuotations", func(db *gorm.DB) *gorm.DB {
			return db.Order("created_at DESC")
		}).
		Preload("Assignment").
		Preload("Payment").
		Order("created_at DESC").
		Limit(limit).
		Offset(filter.Offset).
		Find(&requests).Error

	for i := range requests {
		requests[i].Status = utils.NormalizeStatus(requests[i].Status)
		if len(requests[i].CustomerQuotations) > 0 {
			requests[i].LatestQuotation = &requests[i].CustomerQuotations[0]
		}
	}

	return requests, total, err
}

func (s *RequestService) GetRequestByID(id uint) (*models.ServiceRequest, error) {
	var req models.ServiceRequest
	err := s.db.Preload("Customer").
		Preload("Worker").
		Preload("Images").
		Preload("WorkerQuotes").
		Preload("CustomerQuotations", func(db *gorm.DB) *gorm.DB {
			return db.Order("created_at DESC")
		}).
		Preload("Assignment").
		Preload("Payment").
		First(&req, id).Error

	if err != nil {
		return nil, errors.New("service request not found")
	}

	// Ensure status is normalized
	req.Status = utils.NormalizeStatus(req.Status)
	if len(req.CustomerQuotations) > 0 {
		req.LatestQuotation = &req.CustomerQuotations[0]
	}
	return &req, nil
}

func (s *RequestService) UpdateStatus(id uint, newStatus string, adminID *uint, notes string) (*models.ServiceRequest, error) {
	req, err := s.GetRequestByID(id)
	if err != nil {
		return nil, err
	}

	normalizedNew := utils.NormalizeStatus(newStatus)
	if err := utils.ValidateStatusTransition(req.Status, normalizedNew); err != nil {
		return nil, err
	}

	oldStatus := req.Status
	req.Status = normalizedNew
	if notes != "" {
		if req.AdminNotes != nil && *req.AdminNotes != "" {
			combined := *req.AdminNotes + "\n" + notes
			req.AdminNotes = &combined
		} else {
			req.AdminNotes = &notes
		}
	}
	req.UpdatedAt = time.Now().UTC()

	err = s.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Save(req).Error; err != nil {
			return err
		}

		hist := models.RequestStatusHistory{
			RequestID:  req.ID,
			FromStatus: oldStatus,
			ToStatus:   normalizedNew,
			ChangedBy:  adminID,
			Notes:      notes,
			CreatedAt:  time.Now().UTC(),
		}
		if err := tx.Create(&hist).Error; err != nil {
			return err
		}

		adminLog := models.AdminActivityLog{
			AdminID:    adminID,
			Action:     "update_status",
			EntityType: "request",
			EntityID:   fmt.Sprintf("%d", req.ID),
			Details:    fmt.Sprintf("Changed status from %s to %s", oldStatus, normalizedNew),
			CreatedAt:  time.Now().UTC(),
		}
		return tx.Create(&adminLog).Error
	})

	if err != nil {
		return nil, err
	}

	return s.GetRequestByID(id)
}

func (s *RequestService) UploadRequestImages(requestID uint, files []*multipart.FileHeader) ([]models.ServiceRequestImage, error) {
	req, err := s.GetRequestByID(requestID)
	if err != nil {
		return nil, err
	}

	var savedImages []models.ServiceRequestImage

	for _, fileHeader := range files {
		publicURL, storagePath, err := s.storage.UploadFile(fileHeader, "request-photos")
		if err != nil {
			return nil, fmt.Errorf("failed to upload image: %w", err)
		}

		img := models.ServiceRequestImage{
			RequestID:   req.ID,
			ImageURL:    publicURL,
			StoragePath: storagePath,
			FileName:    fileHeader.Filename,
			FileSize:    fileHeader.Size,
			ContentType: fileHeader.Header.Get("Content-Type"),
			CreatedAt:   time.Now().UTC(),
		}

		if err := s.db.Create(&img).Error; err != nil {
			return nil, err
		}
		savedImages = append(savedImages, img)
	}

	return savedImages, nil
}

type RequestCounts struct {
	Total         int64 `json:"total"`
	Active        int64 `json:"active"`
	Completed     int64 `json:"completed"`
	Cancelled     int64 `json:"cancelled"`
	Available     int64 `json:"available"`
	PendingQuotes int64 `json:"pendingQuotes"`
}

func (s *RequestService) GetCounts(customerID *uint) RequestCounts {
	var counts RequestCounts

	rawSQL := `
		SELECT
			COUNT(*) AS total,
			COUNT(*) FILTER (WHERE UPPER(status) NOT IN ('COMPLETED', 'CANCELLED', 'REJECTED', 'CUSTOMER_DECLINED')) AS active,
			COUNT(*) FILTER (WHERE UPPER(status) = 'COMPLETED') AS completed,
			COUNT(*) FILTER (WHERE UPPER(status) IN ('CANCELLED', 'REJECTED', 'CUSTOMER_DECLINED')) AS cancelled,
			COUNT(*) FILTER (WHERE UPPER(status) IN ('NEW', 'PENDING_ADMIN_REVIEW', 'SHARED_WITH_WORKERS', 'OPEN_FOR_APPLICATIONS')) AS available,
			COUNT(*) FILTER (WHERE UPPER(status) = 'CUSTOMER_APPROVAL_PENDING') AS pending_quotes
		FROM service_requests
	`

	var row struct {
		Total         int64
		Active        int64
		Completed     int64
		Cancelled     int64
		Available     int64
		PendingQuotes int64
	}

	if customerID != nil {
		rawSQL += " WHERE customer_id = ?"
		_ = s.db.Raw(rawSQL, *customerID).Scan(&row).Error
	} else {
		_ = s.db.Raw(rawSQL).Scan(&row).Error
	}

	counts.Total = row.Total
	counts.Active = row.Active
	counts.Completed = row.Completed
	counts.Cancelled = row.Cancelled
	counts.Available = row.Available
	counts.PendingQuotes = row.PendingQuotes

	return counts
}

func (s *RequestService) ListPendingQuotations(customerID *uint) ([]models.ServiceRequest, error) {
	query := s.db.Model(&models.ServiceRequest{}).
		Where("UPPER(status) = 'CUSTOMER_APPROVAL_PENDING'").
		Preload("Customer").
		Preload("CustomerQuotations", func(db *gorm.DB) *gorm.DB {
			return db.Order("created_at DESC")
		}).
		Order("created_at DESC")

	if customerID != nil {
		query = query.Where("customer_id = ?", *customerID)
	}

	var reqs []models.ServiceRequest
	if err := query.Find(&reqs).Error; err != nil {
		return nil, err
	}

	for i := range reqs {
		reqs[i].Status = utils.NormalizeStatus(reqs[i].Status)
		if len(reqs[i].CustomerQuotations) > 0 {
			reqs[i].LatestQuotation = &reqs[i].CustomerQuotations[0]
		}
	}

	return reqs, nil
}
