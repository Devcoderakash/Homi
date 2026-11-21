package services

import (
	"errors"
	"fmt"
	"strings"
	"time"

	"gorm.io/gorm"

	"homi-backend/internal/models"
	"homi-backend/internal/utils"
)

type QuotationService struct {
	db *gorm.DB
}

func NewQuotationService(db *gorm.DB) *QuotationService {
	return &QuotationService{db: db}
}

type WorkerQuoteInput struct {
	WorkerID                *uint  `json:"workerId"`
	WorkerName              string `json:"workerName"`
	WorkerPhone             string `json:"workerPhone"`
	QuotedAmount            int    `json:"quotedAmount"`
	LabourCharges           int    `json:"labourCharges"`
	MaterialCharges         int    `json:"materialCharges"`
	AdditionalCharges       int    `json:"additionalCharges"`
	Availability            string `json:"availability"`
	EstimatedCompletionTime string `json:"estimatedCompletionTime"`
	Notes                   string `json:"notes"`
}

type CustomerQuotationInput struct {
	SelectedWorkerID    *uint  `json:"selectedWorkerId"`
	SelectedWorkerName  string `json:"selectedWorkerName"`
	SelectedWorkerPhone string `json:"selectedWorkerPhone"`
	WorkDescription     string `json:"workDescription"`
	LabourCharges       int    `json:"labourCharges"`
	MaterialCharges     int    `json:"materialCharges"`
	InspectionCharges   int    `json:"inspectionCharges"`
	AdditionalCharges   int    `json:"additionalCharges"`
	Discount            int    `json:"discount"`
	EstimatedDuration   string `json:"estimatedDuration"`
	ProposedVisitDate   string `json:"proposedVisitDate"`
	ProposedVisitTime   string `json:"proposedVisitTime"`
	Notes               string `json:"notes"`
}

// CreateWorkerQuote records a bid received from an existing technician via WhatsApp
func (s *QuotationService) CreateWorkerQuote(requestID uint, input WorkerQuoteInput) (*models.WorkerQuote, error) {
	var req models.ServiceRequest
	if err := s.db.First(&req, requestID).Error; err != nil {
		return nil, errors.New("service request not found")
	}

	normStatus := utils.NormalizeStatus(req.Status)
	if normStatus == models.StatusAssigned || normStatus == models.StatusCustomerConfirmed || normStatus == models.StatusInProgress || normStatus == models.StatusCompleted {
		return nil, errors.New("cannot add worker quotes after quotation has been accepted or assigned")
	}

	var workerID *uint
	workerName := strings.TrimSpace(input.WorkerName)
	workerPhone := strings.TrimSpace(input.WorkerPhone)

	if input.WorkerID != nil && *input.WorkerID > 0 {
		var w models.Worker
		if err := s.db.First(&w, *input.WorkerID).Error; err != nil {
			return nil, errors.New("selected worker not found in directory")
		}
		workerID = &w.ID
		workerName = w.Name
		workerPhone = w.Phone
	} else if workerPhone != "" {
		// Look up existing worker by phone
		var w models.Worker
		if err := s.db.Where("phone = ? OR phone = ?", workerPhone, "+91"+workerPhone).First(&w).Error; err == nil {
			workerID = &w.ID
			if workerName == "" {
				workerName = w.Name
			}
		}
	}

	if workerName == "" || workerPhone == "" {
		return nil, errors.New("please select an existing worker from the directory")
	}

	// Calculate total amount = Labour + Material + Other
	total := input.LabourCharges + input.MaterialCharges + input.AdditionalCharges
	if total <= 0 && input.QuotedAmount > 0 {
		total = input.QuotedAmount
	}

	quote := models.WorkerQuote{
		RequestID:               requestID,
		WorkerID:                workerID,
		WorkerName:              workerName,
		WorkerPhone:             workerPhone,
		QuotedAmount:            total,
		LabourCharges:           input.LabourCharges,
		MaterialCharges:         input.MaterialCharges,
		AdditionalCharges:       input.AdditionalCharges,
		Availability:            strings.TrimSpace(input.Availability),
		EstimatedCompletionTime: strings.TrimSpace(input.EstimatedCompletionTime),
		Notes:                   strings.TrimSpace(input.Notes),
		IsSelected:              false,
		CreatedAt:               time.Now().UTC(),
		UpdatedAt:               time.Now().UTC(),
	}

	if err := s.db.Create(&quote).Error; err != nil {
		return nil, errors.New("failed to save worker quote: " + err.Error())
	}

	return &quote, nil
}

func (i *WorkerQuoteInput) Phone() string {
	return i.WorkerPhone
}

func (s *QuotationService) ListWorkerQuotes(requestID uint) ([]models.WorkerQuote, error) {
	var quotes []models.WorkerQuote
	err := s.db.Where("request_id = ?", requestID).Order("created_at DESC").Find(&quotes).Error
	return quotes, err
}

func (s *QuotationService) UpdateWorkerQuote(quoteID uint, input WorkerQuoteInput) (*models.WorkerQuote, error) {
	var quote models.WorkerQuote
	if err := s.db.First(&quote, quoteID).Error; err != nil {
		return nil, errors.New("worker quote not found")
	}

	var req models.ServiceRequest
	if err := s.db.First(&req, quote.RequestID).Error; err == nil {
		normStatus := utils.NormalizeStatus(req.Status)
		if normStatus == models.StatusAssigned || normStatus == models.StatusCustomerConfirmed || normStatus == models.StatusInProgress || normStatus == models.StatusCompleted {
			return nil, errors.New("cannot edit worker quotes after quotation has been accepted or assigned")
		}
	}

	if input.WorkerID != nil && *input.WorkerID > 0 {
		var w models.Worker
		if err := s.db.First(&w, *input.WorkerID).Error; err == nil {
			quote.WorkerID = &w.ID
			quote.WorkerName = w.Name
			quote.WorkerPhone = w.Phone
		}
	} else {
		if strings.TrimSpace(input.WorkerName) != "" {
			quote.WorkerName = strings.TrimSpace(input.WorkerName)
		}
		if strings.TrimSpace(input.WorkerPhone) != "" {
			quote.WorkerPhone = strings.TrimSpace(input.WorkerPhone)
		}
	}

	total := input.LabourCharges + input.MaterialCharges + input.AdditionalCharges
	if total <= 0 && input.QuotedAmount > 0 {
		total = input.QuotedAmount
	}

	quote.QuotedAmount = total
	quote.LabourCharges = input.LabourCharges
	quote.MaterialCharges = input.MaterialCharges
	quote.AdditionalCharges = input.AdditionalCharges
	quote.Availability = strings.TrimSpace(input.Availability)
	quote.EstimatedCompletionTime = strings.TrimSpace(input.EstimatedCompletionTime)
	quote.Notes = strings.TrimSpace(input.Notes)
	quote.UpdatedAt = time.Now().UTC()

	if err := s.db.Save(&quote).Error; err != nil {
		return nil, err
	}
	return &quote, nil
}

func (s *QuotationService) DeleteWorkerQuote(quoteID uint) error {
	var quote models.WorkerQuote
	if err := s.db.First(&quote, quoteID).Error; err != nil {
		return errors.New("worker quote not found")
	}

	var req models.ServiceRequest
	if err := s.db.First(&req, quote.RequestID).Error; err == nil {
		normStatus := utils.NormalizeStatus(req.Status)
		if normStatus == models.StatusAssigned || normStatus == models.StatusCustomerConfirmed || normStatus == models.StatusInProgress || normStatus == models.StatusCompleted {
			return errors.New("cannot delete worker quotes after quotation has been accepted or assigned")
		}
	}

	return s.db.Delete(&models.WorkerQuote{}, quoteID).Error
}

// SelectPreferredWorker marks one quote as preferred and updates the request status to WORKER_SELECTED
func (s *QuotationService) SelectPreferredWorkerQuote(requestID uint, quoteID uint, adminID uint) (*models.WorkerQuote, *models.ServiceRequest, error) {
	var quote models.WorkerQuote
	if err := s.db.Where("id = ? AND request_id = ?", quoteID, requestID).First(&quote).Error; err != nil {
		return nil, nil, errors.New("worker quote not found for this request")
	}

	var req models.ServiceRequest
	if err := s.db.First(&req, requestID).Error; err != nil {
		return nil, nil, errors.New("service request not found")
	}

	now := time.Now().UTC()

	err := s.db.Transaction(func(tx *gorm.DB) error {
		// 1. Unselect all other quotes for this request
		if err := tx.Model(&models.WorkerQuote{}).Where("request_id = ?", requestID).Update("is_selected", false).Error; err != nil {
			return err
		}

		// 2. Select this quote
		quote.IsSelected = true
		quote.UpdatedAt = now
		if err := tx.Save(&quote).Error; err != nil {
			return err
		}

		// 3. Update request with selected worker information and transition to WORKER_SELECTED
		req.SelectedWorkerID = quote.WorkerID
		req.SelectedWorkerName = &quote.WorkerName
		req.SelectedWorkerPhone = &quote.WorkerPhone
		req.QuoteLabourCharges = &quote.LabourCharges
		req.QuoteMaterialCharges = &quote.MaterialCharges
		req.QuoteAdditionalCharges = &quote.AdditionalCharges

		currentStatus := utils.NormalizeStatus(req.Status)
		if currentStatus == models.StatusNew || currentStatus == models.StatusUnderReview || currentStatus == models.StatusSharedWithWorkers {
			req.Status = models.StatusWorkerSelected
		}
		req.UpdatedAt = now

		if err := tx.Save(&req).Error; err != nil {
			return err
		}

		// 4. Log status change & admin action
		hist := models.RequestStatusHistory{
			RequestID:  req.ID,
			FromStatus: currentStatus,
			ToStatus:   req.Status,
			ChangedBy:  &adminID,
			Notes:      fmt.Sprintf("Selected %s as preferred technician", quote.WorkerName),
			CreatedAt:  now,
		}
		if err := tx.Create(&hist).Error; err != nil {
			return err
		}

		logEntry := models.AdminActivityLog{
			AdminID:    &adminID,
			Action:     "select_preferred_worker",
			EntityType: "request",
			EntityID:   fmt.Sprintf("%d", req.ID),
			Details:    fmt.Sprintf("Selected worker quote #%d (%s, ₹%d)", quote.ID, quote.WorkerName, quote.QuotedAmount),
			CreatedAt:  now,
		}
		return tx.Create(&logEntry).Error
	})

	if err != nil {
		return nil, nil, err
	}

	return &quote, &req, nil
}

// SendCustomerQuotation computes the final verified quotation and moves status to CUSTOMER_APPROVAL_PENDING
func (s *QuotationService) SendCustomerQuotation(requestID uint, input CustomerQuotationInput, adminID uint) (*models.CustomerQuotation, *models.ServiceRequest, error) {
	var req models.ServiceRequest
	if err := s.db.First(&req, requestID).Error; err != nil {
		return nil, nil, errors.New("service request not found")
	}

	// Backend mathematical validation:
	// finalTotal = (labour + material + inspection + additional) - discount
	subtotal := input.LabourCharges + input.MaterialCharges + input.InspectionCharges + input.AdditionalCharges
	finalTotal := subtotal - input.Discount
	if finalTotal < 0 {
		finalTotal = 0
	}

	now := time.Now().UTC()

	var workerID *uint = input.SelectedWorkerID
	if workerID == nil && req.SelectedWorkerID != nil {
		workerID = req.SelectedWorkerID
	}
	workerName := strings.TrimSpace(input.SelectedWorkerName)
	workerPhone := strings.TrimSpace(input.SelectedWorkerPhone)
	if workerID != nil && *workerID > 0 {
		var w models.Worker
		if err := s.db.First(&w, *workerID).Error; err == nil {
			workerName = w.Name
			workerPhone = w.Phone
		}
	}
	if workerName == "" && req.SelectedWorkerName != nil {
		workerName = *req.SelectedWorkerName
	}
	if workerPhone == "" && req.SelectedWorkerPhone != nil {
		workerPhone = *req.SelectedWorkerPhone
	}

	quotation := models.CustomerQuotation{
		RequestID:           requestID,
		CustomerID:          req.CustomerID,
		SelectedWorkerID:    workerID,
		SelectedWorkerName:  workerName,
		SelectedWorkerPhone: workerPhone,
		WorkDescription:     strings.TrimSpace(input.WorkDescription),
		LabourCharges:       input.LabourCharges,
		MaterialCharges:     input.MaterialCharges,
		InspectionCharges:   input.InspectionCharges,
		AdditionalCharges:   input.AdditionalCharges,
		Discount:            input.Discount,
		FinalTotal:          finalTotal,
		EstimatedDuration:   strings.TrimSpace(input.EstimatedDuration),
		ProposedVisitDate:   strings.TrimSpace(input.ProposedVisitDate),
		ProposedVisitTime:   strings.TrimSpace(input.ProposedVisitTime),
		Notes:               strings.TrimSpace(input.Notes),
		Status:              "PENDING",
		SentAt:              now,
		CreatedAt:           now,
		UpdatedAt:           now,
	}

	err := s.db.Transaction(func(tx *gorm.DB) error {
		// Supersede any older pending quotation for this request to avoid duplicate active quotes
		_ = tx.Model(&models.CustomerQuotation{}).
			Where("request_id = ? AND status = 'PENDING'", requestID).
			Update("status", "SUPERSEDED")

		if err := tx.Create(&quotation).Error; err != nil {
			return err
		}

		// Update service request fields
		req.SelectedWorkerID = workerID
		req.SelectedWorkerName = &quotation.SelectedWorkerName
		req.SelectedWorkerPhone = &quotation.SelectedWorkerPhone
		req.QuoteLabourCharges = &quotation.LabourCharges
		req.QuoteMaterialCharges = &quotation.MaterialCharges
		req.QuoteInspectionCharges = &quotation.InspectionCharges
		req.QuoteAdditionalCharges = &quotation.AdditionalCharges
		req.QuoteDiscount = &quotation.Discount
		req.QuoteFinalTotal = &quotation.FinalTotal
		req.QuoteWorkDescription = &quotation.WorkDescription
		req.QuoteEstimatedDuration = &quotation.EstimatedDuration
		req.QuoteProposedVisitDate = &quotation.ProposedVisitDate
		req.QuoteProposedVisitTime = &quotation.ProposedVisitTime
		req.QuoteNotes = &quotation.Notes
		req.QuoteSentAt = &now
		oldStatus := req.Status
		req.Status = models.StatusCustomerApprovalPending
		req.UpdatedAt = now

		if err := tx.Save(&req).Error; err != nil {
			return err
		}

		// Log status change
		hist := models.RequestStatusHistory{
			RequestID:  req.ID,
			FromStatus: oldStatus,
			ToStatus:   models.StatusCustomerApprovalPending,
			ChangedBy:  &adminID,
			Notes:      fmt.Sprintf("Official quotation sent for ₹%d", finalTotal),
			CreatedAt:  now,
		}
		if err := tx.Create(&hist).Error; err != nil {
			return err
		}

		// Send notification to Customer
		notify := models.Notification{
			UserID:    req.CustomerID,
			RequestID: &req.ID,
			Kind:      "quotation_ready",
			Title:     fmt.Sprintf("Your quotation for #HOMI-%d is ready: ₹%d. Please review and confirm.", req.ID, finalTotal),
			CreatedAt: now,
		}
		if err := tx.Create(&notify).Error; err != nil {
			return err
		}

		logEntry := models.AdminActivityLog{
			AdminID:    &adminID,
			Action:     "send_customer_quotation",
			EntityType: "request",
			EntityID:   fmt.Sprintf("%d", req.ID),
			Details:    fmt.Sprintf("Sent customer quotation of ₹%d (Quote #%d)", finalTotal, quotation.ID),
			CreatedAt:  now,
		}
		return tx.Create(&logEntry).Error
	})

	if err != nil {
		return nil, nil, err
	}

	return &quotation, &req, nil
}

// CustomerDecision records whether the customer Accepted or Declined the quotation
func (s *QuotationService) CustomerDecision(requestID uint, customerID uint, decision string, reason string) (*models.ServiceRequest, error) {
	var req models.ServiceRequest
	if err := s.db.First(&req, requestID).Error; err != nil {
		return nil, errors.New("service request not found")
	}

	if req.CustomerID != customerID {
		var caller models.User
		if err := s.db.First(&caller, customerID).Error; err != nil || caller.Role != "admin" {
			return nil, errors.New("unauthorized: this request belongs to another customer account")
		}
	}

	now := time.Now().UTC()
	normalizedDecision := strings.ToLower(strings.TrimSpace(decision))
	if normalizedDecision != "accept" && normalizedDecision != "decline" {
		return nil, errors.New("invalid decision: must be 'accept' or 'decline'")
	}

	err := s.db.Transaction(func(tx *gorm.DB) error {
		// Find active pending quotation record
		var quote models.CustomerQuotation
		if err := tx.Where("request_id = ? AND status = 'PENDING'", requestID).Order("created_at DESC").First(&quote).Error; err != nil {
			return errors.New("no active pending quotation found for this request")
		}

		quote.DecidedAt = &now
		if normalizedDecision == "accept" {
			quote.Status = "ACCEPTED"
		} else {
			quote.Status = "DECLINED"
			quote.DeclineReason = reason
		}
		quote.UpdatedAt = now
		if err := tx.Save(&quote).Error; err != nil {
			return err
		}

		oldStatus := req.Status
		if normalizedDecision == "accept" {
			// 4. Verify a valid preferred worker is selected in quote or request
			workerName := strings.TrimSpace(quote.SelectedWorkerName)
			if workerName == "" && req.SelectedWorkerName != nil {
				workerName = strings.TrimSpace(*req.SelectedWorkerName)
			}
			if workerName == "" {
				return errors.New("cannot accept quotation: no preferred worker selected")
			}

			workerPhone := strings.TrimSpace(quote.SelectedWorkerPhone)
			if workerPhone == "" && req.SelectedWorkerPhone != nil {
				workerPhone = strings.TrimSpace(*req.SelectedWorkerPhone)
			}

			// 5. Update quotation status to ACCEPTED
			quote.Status = "ACCEPTED"
			quote.DecidedAt = &now
			quote.UpdatedAt = now
			if err := tx.Save(&quote).Error; err != nil {
				return err
			}

			// 6. Record customer acceptance timestamp
			req.CustomerApprovedAt = &now

			// 7. Find or determine worker ID (using stored worker_id)
			var workerID *uint
			if quote.SelectedWorkerID != nil && *quote.SelectedWorkerID > 0 {
				workerID = quote.SelectedWorkerID
			} else if req.SelectedWorkerID != nil && *req.SelectedWorkerID > 0 {
				workerID = req.SelectedWorkerID
			} else if req.WorkerID != nil && *req.WorkerID > 0 {
				workerID = req.WorkerID
			} else if workerPhone != "" {
				var w models.Worker
				if err := tx.Where("phone = ?", workerPhone).First(&w).Error; err == nil && w.ID > 0 {
					workerID = &w.ID
				}
			}

			// Retrieve full worker details using stored worker_id
			if workerID != nil && *workerID > 0 {
				var w models.Worker
				if err := tx.First(&w, *workerID).Error; err == nil {
					workerName = w.Name
					workerPhone = w.Phone
				}
			}

			// If still no worker ID in directory, create a worker record so foreign references succeed
			if workerID == nil && workerName != "" {
				w := models.Worker{
					Name:      workerName,
					Phone:     workerPhone,
					Specialty: req.Category,
					City:      req.City,
					Available: true,
					CreatedAt: now,
					UpdatedAt: now,
				}
				if err := tx.Create(&w).Error; err == nil && w.ID > 0 {
					workerID = &w.ID
				}
			}

			finalTotal := quote.FinalTotal
			if req.QuoteFinalTotal != nil && *req.QuoteFinalTotal > 0 {
				finalTotal = *req.QuoteFinalTotal
			}

			// 8. Automatically create or update the worker assignment
			adminID := utils.GetDefaultAdminID(s.db)
			var existingAssign models.Assignment
			assignErr := tx.Where("request_id = ?", req.ID).First(&existingAssign).Error

			if assignErr != nil {
				assignment := models.Assignment{
					RequestID:   req.ID,
					QuotationID: &quote.ID,
					WorkerID:    workerID,
					WorkerName:  workerName,
					WorkerPhone: workerPhone,
					AssignedBy:  adminID,
					Notes:       fmt.Sprintf("Auto-assigned to %s on customer acceptance of Quote #%d (₹%d)", workerName, quote.ID, finalTotal),
					Status:      models.AssignmentStatusAssigned,
					AssignedAt:  now,
					CreatedAt:   now,
				}
				if err := tx.Create(&assignment).Error; err != nil {
					return err
				}
			} else {
				existingAssign.QuotationID = &quote.ID
				existingAssign.WorkerID = workerID
				existingAssign.WorkerName = workerName
				existingAssign.WorkerPhone = workerPhone
				existingAssign.Status = models.AssignmentStatusAssigned
				existingAssign.AssignedAt = now
				existingAssign.Notes = fmt.Sprintf("Auto-assigned to %s on customer acceptance of Quote #%d (₹%d)", workerName, quote.ID, finalTotal)
				if err := tx.Save(&existingAssign).Error; err != nil {
					return err
				}
			}

			// 9. Update service request status directly to ASSIGNED
			req.WorkerID = workerID
			req.SelectedWorkerID = workerID
			req.SelectedWorkerName = &workerName
			if workerPhone != "" {
				req.SelectedWorkerPhone = &workerPhone
			}
			req.Status = models.StatusAssigned
			req.PaymentStatus = models.PaymentStatusNotDue
			req.UpdatedAt = now

			hist := models.RequestStatusHistory{
				RequestID:  req.ID,
				FromStatus: oldStatus,
				ToStatus:   models.StatusAssigned,
				ChangedBy:  &customerID,
				Notes:      fmt.Sprintf("Customer accepted quotation of ₹%d. Worker %s automatically assigned.", finalTotal, workerName),
				CreatedAt:  now,
			}
			if err := tx.Create(&hist).Error; err != nil {
				return err
			}

			// Admin notification
			adminNotify := models.Notification{
				UserID:    adminID,
				RequestID: &req.ID,
				Kind:      "worker_assigned",
				Title:     fmt.Sprintf("Customer accepted quote of ₹%d for #HOMI-%d. Worker %s is now ASSIGNED.", finalTotal, req.ID, workerName),
				CreatedAt: now,
			}
			_ = tx.Create(&adminNotify)

		} else if normalizedDecision == "decline" {
			req.Status = models.StatusCustomerDeclined
			req.CustomerDeclinedAt = &now
			req.CustomerDeclineReason = &reason
			req.UpdatedAt = now

			hist := models.RequestStatusHistory{
				RequestID:  req.ID,
				FromStatus: oldStatus,
				ToStatus:   models.StatusCustomerDeclined,
				ChangedBy:  &customerID,
				Notes:      fmt.Sprintf("Customer declined quotation. Reason: %s", reason),
				CreatedAt:  now,
			}
			if err := tx.Create(&hist).Error; err != nil {
				return err
			}

			// Admin notification
			adminID := utils.GetDefaultAdminID(s.db)
			adminNotify := models.Notification{
				UserID:    adminID,
				RequestID: &req.ID,
				Kind:      "customer_declined",
				Title:     fmt.Sprintf("Customer DECLINED quote for #HOMI-%d. Reason: %s", req.ID, reason),
				CreatedAt: now,
			}
			_ = tx.Create(&adminNotify)
		} else {
			return errors.New("decision must be 'accept' or 'decline'")
		}

		return tx.Save(&req).Error
	})

	if err != nil {
		return nil, err
	}

	return &req, nil
}

// GetLatestQuotation returns the most recent customer quotation for a request
func (s *QuotationService) GetLatestQuotation(requestID uint) (*models.CustomerQuotation, error) {
	var quote models.CustomerQuotation
	err := s.db.Where("request_id = ?", requestID).Order("created_at DESC").First(&quote).Error
	if err != nil {
		return nil, err
	}
	return &quote, nil
}

// ListCustomerQuotations returns all customer quotations for a specific customer
func (s *QuotationService) ListCustomerQuotations(customerID uint) ([]models.CustomerQuotation, error) {
	var quotes []models.CustomerQuotation
	err := s.db.Where("customer_id = ?", customerID).Order("created_at DESC").Find(&quotes).Error
	return quotes, err
}
