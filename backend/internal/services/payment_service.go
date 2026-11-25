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

type PaymentService struct {
	db      *gorm.DB
	storage *StorageService
}

func NewPaymentService(db *gorm.DB, storage *StorageService) *PaymentService {
	return &PaymentService{db: db, storage: storage}
}

type PaymentSettingsInput struct {
	UpiID             string `json:"upiId"`
	PayeeName         string `json:"payeeName"`
	QRCodeURL         string `json:"qrCodeUrl"`
	BankAccountHolder string `json:"bankAccountHolder"`
	BankName          string `json:"bankName"`
	AccountNumber     string `json:"accountNumber"`
	IFSC              string `json:"ifsc"`
	Branch            string `json:"branch"`
	EnableUPI         *bool  `json:"enableUpi"`
	EnableBank        *bool  `json:"enableBank"`
}

type SubmitPaymentInput struct {
	PaymentMethod         string `json:"paymentMethod" binding:"required"`
	TransactionReference  string `json:"transactionReference" binding:"required"`
	PaymentDate           string `json:"paymentDate"`
	PaymentScreenshotPath string `json:"paymentScreenshotPath"`
}

// GetPaymentSettings retrieves the active payment configurations
func (s *PaymentService) GetPaymentSettings() (*models.PaymentSettings, error) {
	var settings models.PaymentSettings
	err := s.db.First(&settings, 1).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			settings = models.PaymentSettings{
				ID:                1,
				UpiID:             "homi@upi",
				PayeeName:         "Homi Everyday Care",
				QRCodeURL:         "/images/payment-qr.jpg",
				QRStoragePath:     "images/payment-qr.jpg",
				BankAccountHolder: "Homi Platform Operations",
				BankName:          "State Bank of India",
				AccountNumber:     "409281726354",
				IFSC:              "SBIN0001234",
				Branch:            "Arera Colony Branch, Bhopal",
				EnableUPI:         true,
				EnableBank:        true,
				CreatedAt:         time.Now().UTC(),
				UpdatedAt:         time.Now().UTC(),
			}
			_ = s.db.Create(&settings)
			return &settings, nil
		}
		return nil, err
	}
	return &settings, nil
}

// UpdatePaymentSettings updates UPI and Bank transfer configurations
func (s *PaymentService) UpdatePaymentSettings(input PaymentSettingsInput) (*models.PaymentSettings, error) {
	settings, err := s.GetPaymentSettings()
	if err != nil {
		return nil, err
	}

	if input.UpiID != "" {
		settings.UpiID = strings.TrimSpace(input.UpiID)
	}
	if input.PayeeName != "" {
		settings.PayeeName = strings.TrimSpace(input.PayeeName)
	}
	if input.QRCodeURL != "" {
		settings.QRCodeURL = strings.TrimSpace(input.QRCodeURL)
	}
	if input.BankAccountHolder != "" {
		settings.BankAccountHolder = strings.TrimSpace(input.BankAccountHolder)
	}
	if input.BankName != "" {
		settings.BankName = strings.TrimSpace(input.BankName)
	}
	if input.AccountNumber != "" {
		settings.AccountNumber = strings.TrimSpace(input.AccountNumber)
	}
	if input.IFSC != "" {
		settings.IFSC = strings.ToUpper(strings.TrimSpace(input.IFSC))
	}
	if input.Branch != "" {
		settings.Branch = strings.TrimSpace(input.Branch)
	}
	if input.EnableUPI != nil {
		settings.EnableUPI = *input.EnableUPI
	}
	if input.EnableBank != nil {
		settings.EnableBank = *input.EnableBank
	}
	settings.UpdatedAt = time.Now().UTC()

	if err := s.db.Save(settings).Error; err != nil {
		return nil, err
	}

	return settings, nil
}

// UploadQRCodeImage uploads a custom UPI QR image and links it to settings
func (s *PaymentService) UploadQRCodeImage(fileHeader *multipart.FileHeader) (string, error) {
	publicURL, storagePath, err := s.storage.UploadFile(fileHeader, "payment-assets")
	if err != nil {
		return "", errors.New("failed to upload QR code: " + err.Error())
	}

	settings, err := s.GetPaymentSettings()
	if err != nil {
		return "", err
	}

	settings.QRStoragePath = storagePath
	settings.QRCodeURL = publicURL
	settings.UpdatedAt = time.Now().UTC()
	if err := s.db.Save(settings).Error; err != nil {
		return "", err
	}

	return publicURL, nil
}

// UploadPaymentScreenshot uploads customer transaction screenshot
func (s *PaymentService) UploadPaymentScreenshot(fileHeader *multipart.FileHeader) (string, error) {
	publicURL, _, err := s.storage.UploadFile(fileHeader, "payment-proofs")
	if err != nil {
		return "", errors.New("failed to upload payment screenshot: " + err.Error())
	}
	return publicURL, nil
}

// GetPaymentByRequestID fetches the payment record for a request
func (s *PaymentService) GetPaymentByRequestID(requestID uint) (*models.Payment, error) {
	var payment models.Payment
	err := s.db.Where("request_id = ?", requestID).Order("created_at DESC").First(&payment).Error
	if err != nil {
		return nil, err
	}
	return &payment, nil
}

// SubmitCustomerPayment saves customer's payment reference and moves status to PAYMENT_SUBMITTED
func (s *PaymentService) SubmitCustomerPayment(requestID uint, customerID uint, input SubmitPaymentInput) (*models.Payment, *models.ServiceRequest, error) {
	var req models.ServiceRequest
	if err := s.db.First(&req, requestID).Error; err != nil {
		return nil, nil, errors.New("service request not found")
	}

	// Verify caller ownership (or admin)
	if req.CustomerID != customerID {
		var user models.User
		if err := s.db.First(&user, customerID).Error; err != nil || user.Role != "admin" {
			return nil, nil, errors.New("unauthorized: request belongs to another customer account")
		}
	}

	// Work must be COMPLETED before payment is accepted
	currentStatus := utils.NormalizeStatus(req.Status)
	if currentStatus != models.StatusCompleted {
		return nil, nil, fmt.Errorf("payment error: work must be marked COMPLETED before submitting payment (current status: %s)", currentStatus)
	}

	// Verify payment is currently pending or rejected (prevent duplicate submissions if already submitted or paid)
	currentPayStatus := strings.ToUpper(strings.TrimSpace(req.PaymentStatus))
	if currentPayStatus == models.PaymentStatusSubmitted {
		return nil, nil, errors.New("payment confirmation is already submitted and awaiting admin verification")
	}
	if currentPayStatus == models.PaymentStatusPaid {
		return nil, nil, errors.New("payment for this request has already been verified and marked as PAID")
	}

	ref := strings.TrimSpace(input.TransactionReference)
	if ref == "" {
		return nil, nil, errors.New("transaction reference or UTR number is required")
	}

	method := strings.ToUpper(strings.TrimSpace(input.PaymentMethod))
	if method == "" {
		method = "UPI"
	}

	now := time.Now().UTC()
	payDate := strings.TrimSpace(input.PaymentDate)
	if payDate == "" {
		payDate = now.Format("2006-01-02")
	}

	var payment models.Payment

	err := s.db.Transaction(func(tx *gorm.DB) error {
		var existing models.Payment
		payErr := tx.Where("request_id = ?", requestID).First(&existing).Error

		amount := 120
		if req.QuoteFinalTotal != nil && *req.QuoteFinalTotal > 0 {
			amount = *req.QuoteFinalTotal
		}

		if payErr != nil {
			payment = models.Payment{
				RequestID:             req.ID,
				CustomerID:            req.CustomerID,
				Amount:                amount,
				PaymentMethod:         method,
				TransactionReference:  ref,
				PaymentDate:           payDate,
				PaymentScreenshotPath: input.PaymentScreenshotPath,
				Status:                models.PaymentStatusSubmitted,
				SubmittedAt:           &now,
				CreatedAt:             now,
				UpdatedAt:             now,
			}
			if err := tx.Create(&payment).Error; err != nil {
				return err
			}
		} else {
			payment = existing
			payment.Amount = amount
			payment.PaymentMethod = method
			payment.TransactionReference = ref
			payment.PaymentDate = payDate
			if input.PaymentScreenshotPath != "" {
				payment.PaymentScreenshotPath = input.PaymentScreenshotPath
			}
			payment.Status = models.PaymentStatusSubmitted
			payment.SubmittedAt = &now
			payment.UpdatedAt = now
			if err := tx.Save(&payment).Error; err != nil {
				return err
			}
		}

		req.PaymentStatus = models.PaymentStatusSubmitted
		req.PaymentMethod = &method
		req.UpdatedAt = now
		if err := tx.Save(&req).Error; err != nil {
			return err
		}

		// Admin Notification
		adminID := utils.GetDefaultAdminID(s.db)
		notify := models.Notification{
			UserID:    adminID,
			RequestID: &req.ID,
			Kind:      "payment_submitted",
			Title:     fmt.Sprintf("Payment Submitted for #HOMI-%d: ₹%d (Ref: %s). Pending verification.", req.ID, payment.Amount, ref),
			CreatedAt: now,
		}
		_ = tx.Create(&notify)

		return nil
	})

	if err != nil {
		return nil, nil, err
	}

	return &payment, &req, nil
}

type PaymentListItem struct {
	ID                    uint       `json:"id"`
	RequestID             uint       `json:"requestId"`
	QuotationID           *uint      `json:"quotationId,omitempty"`
	CustomerID            uint       `json:"customerId"`
	CustomerName          string     `json:"customerName"`
	CustomerPhone         string     `json:"customerPhone"`
	WorkerName            string     `json:"workerName"`
	WorkerPhone           string     `json:"workerPhone"`
	Category              string     `json:"category"`
	Amount                int        `json:"amount"`
	PaymentMethod         string     `json:"paymentMethod"`
	TransactionReference  string     `json:"transactionReference"`
	PaymentScreenshotPath string     `json:"paymentScreenshotPath,omitempty"`
	Status                string     `json:"status"`
	RejectionReason       string     `json:"rejectionReason,omitempty"`
	SubmittedAt           *time.Time `json:"submittedAt,omitempty"`
	VerifiedAt            *time.Time `json:"verifiedAt,omitempty"`
	CreatedAt             time.Time  `json:"createdAt"`
}

// ListPayments returns all payment records for admin inspection
func (s *PaymentService) ListPayments(status string, limit, offset int) ([]PaymentListItem, int64, error) {
	query := s.db.Model(&models.Payment{})
	if status != "" && strings.ToUpper(status) != "ALL" {
		query = query.Where("UPPER(status) = ?", strings.ToUpper(status))
	}

	var total int64
	query.Count(&total)

	if limit <= 0 || limit > 100 {
		limit = 50
	}

	var payments []models.Payment
	if err := query.Order("created_at DESC").Limit(limit).Offset(offset).Find(&payments).Error; err != nil {
		return nil, 0, err
	}

	items := make([]PaymentListItem, 0, len(payments))
	for _, p := range payments {
		var req models.ServiceRequest
		_ = s.db.First(&req, p.RequestID)

		var cust models.User
		_ = s.db.First(&cust, p.CustomerID)

		cName := req.ContactName
		if cName == "" {
			cName = cust.Name
		}
		cPhone := req.ContactPhone
		if cPhone == "" {
			cPhone = cust.Phone
		}

		wName := "Technician"
		if req.SelectedWorkerName != nil && *req.SelectedWorkerName != "" {
			wName = *req.SelectedWorkerName
		}
		wPhone := ""
		if req.SelectedWorkerPhone != nil {
			wPhone = *req.SelectedWorkerPhone
		}

		items = append(items, PaymentListItem{
			ID:                    p.ID,
			RequestID:             p.RequestID,
			QuotationID:           p.QuotationID,
			CustomerID:            p.CustomerID,
			CustomerName:          cName,
			CustomerPhone:         cPhone,
			WorkerName:            wName,
			WorkerPhone:           wPhone,
			Category:              req.Category,
			Amount:                p.Amount,
			PaymentMethod:         p.PaymentMethod,
			TransactionReference:  p.TransactionReference,
			PaymentScreenshotPath: p.PaymentScreenshotPath,
			Status:                p.Status,
			RejectionReason:       p.RejectionReason,
			SubmittedAt:           p.SubmittedAt,
			VerifiedAt:            p.VerifiedAt,
			CreatedAt:             p.CreatedAt,
		})
	}

	return items, total, nil
}

// VerifyPayment marks the payment as PAID and updates request payment_status.
// It accepts either a paymentID or requestID and ensures a payment record is finalized.
func (s *PaymentService) VerifyPayment(identifier uint, adminID uint) (*models.Payment, *models.ServiceRequest, error) {
	var payment models.Payment
	var req models.ServiceRequest

	// 1. Try finding payment by payment ID
	foundPayment := false
	if err := s.db.First(&payment, identifier).Error; err == nil {
		foundPayment = true
		if err := s.db.First(&req, payment.RequestID).Error; err != nil {
			return nil, nil, errors.New("associated service request not found")
		}
	} else {
		// 2. Try finding payment by request ID
		if err := s.db.Where("request_id = ?", identifier).Order("created_at DESC").First(&payment).Error; err == nil {
			foundPayment = true
			if err := s.db.First(&req, identifier).Error; err != nil {
				return nil, nil, errors.New("service request not found")
			}
		} else {
			// 3. Try finding request directly
			if err := s.db.First(&req, identifier).Error; err != nil {
				return nil, nil, errors.New("neither payment nor service request found for the given ID")
			}
		}
	}

	now := time.Now().UTC()

	err := s.db.Transaction(func(tx *gorm.DB) error {
		if foundPayment {
			payment.Status = models.PaymentStatusPaid
			payment.VerifiedAt = &now
			payment.VerifiedBy = &adminID
			payment.UpdatedAt = now
			if err := tx.Save(&payment).Error; err != nil {
				return err
			}
		} else {
			// Create a new verified payment record if customer paid worker directly without submitting form
			finalTotal := 0
			if req.QuoteFinalTotal != nil && *req.QuoteFinalTotal > 0 {
				finalTotal = *req.QuoteFinalTotal
			} else if req.QuotedAmount != nil {
				if *req.QuotedAmount > 5000 {
					finalTotal = *req.QuotedAmount / 100
				} else {
					finalTotal = *req.QuotedAmount
				}
			}

			payment = models.Payment{
				RequestID:            req.ID,
				CustomerID:           req.CustomerID,
				Amount:               finalTotal,
				PaymentMethod:        "DIRECT",
				TransactionReference: "CONFIRMED_BY_ADMIN",
				Status:               models.PaymentStatusPaid,
				SubmittedAt:          &now,
				VerifiedAt:           &now,
				VerifiedBy:           &adminID,
				CreatedAt:            now,
				UpdatedAt:            now,
			}
			if err := tx.Create(&payment).Error; err != nil {
				return err
			}
		}

		req.PaymentStatus = models.PaymentStatusPaid
		req.PaidAt = &now
		req.UpdatedAt = now
		if err := tx.Save(&req).Error; err != nil {
			return err
		}

		// Record payment confirmation in request status history
		hist := models.RequestStatusHistory{
			RequestID:  req.ID,
			FromStatus: req.Status,
			ToStatus:   req.Status,
			ChangedBy:  &adminID,
			Notes:      fmt.Sprintf("Payment of ₹%d confirmed by admin. Status: PAID.", payment.Amount),
			CreatedAt:  now,
		}
		_ = tx.Create(&hist)

		// Customer Notification
		notify := models.Notification{
			UserID:    req.CustomerID,
			RequestID: &req.ID,
			Kind:      "payment_verified",
			Title:     fmt.Sprintf("Payment Confirmed! Your payment of ₹%d for #HOMI-%d has been verified.", payment.Amount, req.ID),
			CreatedAt: now,
		}
		_ = tx.Create(&notify)

		// Admin Log
		logEntry := models.AdminActivityLog{
			AdminID:    &adminID,
			Action:     "verify_payment",
			EntityType: "payment",
			EntityID:   fmt.Sprintf("%d", payment.ID),
			Details:    fmt.Sprintf("Verified payment for Request #HOMI-%d (₹%d)", req.ID, payment.Amount),
			CreatedAt:  now,
		}
		return tx.Create(&logEntry).Error
	})

	if err != nil {
		return nil, nil, err
	}

	return &payment, &req, nil
}

// RejectPayment sets the payment status to PAYMENT_REJECTED with an admin reason
func (s *PaymentService) RejectPayment(paymentID uint, adminID uint, reason string) (*models.Payment, *models.ServiceRequest, error) {
	var payment models.Payment
	if err := s.db.First(&payment, paymentID).Error; err != nil {
		return nil, nil, errors.New("payment record not found")
	}

	var req models.ServiceRequest
	if err := s.db.First(&req, payment.RequestID).Error; err != nil {
		return nil, nil, errors.New("service request not found")
	}

	reason = strings.TrimSpace(reason)
	if reason == "" {
		reason = "Transaction reference or amount mismatch"
	}

	now := time.Now().UTC()

	err := s.db.Transaction(func(tx *gorm.DB) error {
		payment.Status = models.PaymentStatusRejected
		payment.RejectionReason = reason
		payment.UpdatedAt = now
		if err := tx.Save(&payment).Error; err != nil {
			return err
		}

		req.PaymentStatus = models.PaymentStatusRejected
		req.UpdatedAt = now
		if err := tx.Save(&req).Error; err != nil {
			return err
		}

		// Customer Notification
		notify := models.Notification{
			UserID:    req.CustomerID,
			RequestID: &req.ID,
			Kind:      "payment_rejected",
			Title:     fmt.Sprintf("Payment Issue for #HOMI-%d: %s. Please resubmit your payment details.", req.ID, reason),
			CreatedAt: now,
		}
		_ = tx.Create(&notify)

		// Admin Log
		logEntry := models.AdminActivityLog{
			AdminID:    &adminID,
			Action:     "reject_payment",
			EntityType: "payment",
			EntityID:   fmt.Sprintf("%d", payment.ID),
			Details:    fmt.Sprintf("Rejected payment #%d for Request #HOMI-%d: %s", payment.ID, req.ID, reason),
			CreatedAt:  now,
		}
		return tx.Create(&logEntry).Error
	})

	if err != nil {
		return nil, nil, err
	}

	return &payment, &req, nil
}
