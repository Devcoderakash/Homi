package services

import (
	"errors"
	"fmt"
	"time"

	"gorm.io/gorm"

	"homi-backend/internal/models"
	"homi-backend/internal/utils"
)

type AssignmentService struct {
	db *gorm.DB
}

func NewAssignmentService(db *gorm.DB) *AssignmentService {
	return &AssignmentService{db: db}
}

// ConfirmAssignment finalizes the technician dispatch once customer has approved
func (s *AssignmentService) ConfirmAssignment(requestID uint, adminID uint, workerIDOverride *uint) (*models.Assignment, *models.ServiceRequest, error) {
	var req models.ServiceRequest
	if err := s.db.First(&req, requestID).Error; err != nil {
		return nil, nil, errors.New("service request not found")
	}

	// CRITICAL RULE ENFORCEMENT: Cannot assign worker before customer confirmation
	currentStatus := utils.NormalizeStatus(req.Status)
	if currentStatus != models.StatusCustomerConfirmed && currentStatus != models.StatusAssigned {
		return nil, nil, fmt.Errorf("assignment error: customer must approve the quotation before assignment (current status: %s)", currentStatus)
	}

	if currentStatus == models.StatusAssigned {
		var existing models.Assignment
		if err := s.db.Where("request_id = ?", requestID).First(&existing).Error; err == nil {
			return &existing, &req, nil
		}
	}

	// Determine worker ID
	var finalWorkerID uint
	if workerIDOverride != nil && *workerIDOverride > 0 {
		finalWorkerID = *workerIDOverride
	} else if req.SelectedWorkerID != nil && *req.SelectedWorkerID > 0 {
		finalWorkerID = *req.SelectedWorkerID
	} else {
		// Look up worker by phone in workers or users table
		if req.SelectedWorkerPhone != nil && *req.SelectedWorkerPhone != "" {
			var w models.Worker
			if err := s.db.Where("phone = ?", *req.SelectedWorkerPhone).First(&w).Error; err == nil {
				finalWorkerID = w.ID
			} else {
				var u models.User
				if err := s.db.Where("phone = ? AND role = 'worker'", *req.SelectedWorkerPhone).First(&u).Error; err == nil {
					finalWorkerID = u.ID
				}
			}
		}
	}

	now := time.Now().UTC()

	workerName := "Technician"
	if req.SelectedWorkerName != nil && *req.SelectedWorkerName != "" {
		workerName = *req.SelectedWorkerName
	}

	// If no worker ID yet but we have the worker's name and phone from the quote, create/ensure worker record
	if finalWorkerID == 0 && req.SelectedWorkerName != nil && *req.SelectedWorkerName != "" {
		phone := ""
		if req.SelectedWorkerPhone != nil {
			phone = *req.SelectedWorkerPhone
		}
		w := models.Worker{
			Name:      *req.SelectedWorkerName,
			Phone:     phone,
			Specialty: req.Category,
			City:      req.City,
			Available: true,
			CreatedAt: now,
			UpdatedAt: now,
		}
		if err := s.db.Create(&w).Error; err == nil {
			finalWorkerID = w.ID
		}
	}

	var workerIDPtr *uint
	if finalWorkerID > 0 {
		workerIDPtr = &finalWorkerID
	}

	phone := ""
	if req.SelectedWorkerPhone != nil {
		phone = *req.SelectedWorkerPhone
	}

	assignment := models.Assignment{
		RequestID:   requestID,
		WorkerID:    workerIDPtr,
		WorkerName:  workerName,
		WorkerPhone: phone,
		AssignedBy:  adminID,
		Notes:       fmt.Sprintf("Confirmed assignment for %s", workerName),
		Status:      models.AssignmentStatusAssigned,
		AssignedAt:  now,
		CreatedAt:   now,
	}

	err := s.db.Transaction(func(tx *gorm.DB) error {
		if finalWorkerID > 0 {
			req.WorkerID = &finalWorkerID
		}
		req.Status = models.StatusAssigned
		req.UpdatedAt = now

		if err := tx.Save(&req).Error; err != nil {
			return err
		}

		if err := tx.Create(&assignment).Error; err != nil {
			return err
		}

		// Log status history
		hist := models.RequestStatusHistory{
			RequestID:  req.ID,
			FromStatus: currentStatus,
			ToStatus:   models.StatusAssigned,
			ChangedBy:  &adminID,
			Notes:      fmt.Sprintf("Worker assignment confirmed: %s", workerName),
			CreatedAt:  now,
		}
		if err := tx.Create(&hist).Error; err != nil {
			return err
		}

		// Notify customer
		notify := models.Notification{
			UserID:    req.CustomerID,
			RequestID: &req.ID,
			Kind:      "worker_assigned",
			Title:     fmt.Sprintf("Worker Confirmed! %s has been assigned to request #HOMI-%d.", workerName, req.ID),
			CreatedAt: now,
		}
		if err := tx.Create(&notify).Error; err != nil {
			return err
		}

		logEntry := models.AdminActivityLog{
			AdminID:    &adminID,
			Action:     "confirm_worker_assignment",
			EntityType: "request",
			EntityID:   fmt.Sprintf("%d", req.ID),
			Details:    fmt.Sprintf("Confirmed assignment for worker %s (Assignment #%d)", workerName, assignment.ID),
			CreatedAt:  now,
		}
		return tx.Create(&logEntry).Error
	})

	if err != nil {
		return nil, nil, err
	}

	return &assignment, &req, nil
}

type AssignmentDetail struct {
	ID           uint      `json:"id"`
	RequestID    uint      `json:"requestId"`
	BookingID    uint      `json:"bookingId"`
	WorkerID     uint      `json:"workerId"`
	WorkerName   string    `json:"workerName"`
	WorkerPhone  string    `json:"workerPhone"`
	CustomerName string    `json:"customerName"`
	Category     string    `json:"category"`
	Status       string    `json:"status"`
	AssignedAt   time.Time `json:"assignedAt"`
	Notes        string    `json:"notes"`
	DistanceKm   int       `json:"distanceKm"`
}

func (s *AssignmentService) ListAssignments(limit, offset int) ([]AssignmentDetail, int64, error) {
	var assignments []models.Assignment
	var total int64
	s.db.Model(&models.Assignment{}).Count(&total)

	if limit <= 0 || limit > 100 {
		limit = 50
	}

	if err := s.db.Order("created_at DESC").Limit(limit).Offset(offset).Find(&assignments).Error; err != nil {
		return nil, 0, err
	}

	details := make([]AssignmentDetail, 0, len(assignments))
	for _, a := range assignments {
		var req models.ServiceRequest
		_ = s.db.First(&req, a.RequestID)

		wName := a.WorkerName
		if wName == "" && req.SelectedWorkerName != nil && *req.SelectedWorkerName != "" {
			wName = *req.SelectedWorkerName
		}
		if wName == "" {
			wName = "Technician"
		}

		wPhone := a.WorkerPhone
		if wPhone == "" && req.SelectedWorkerPhone != nil {
			wPhone = *req.SelectedWorkerPhone
		}

		cName := req.ContactName
		if cName == "" {
			var u models.User
			if err := s.db.First(&u, req.CustomerID).Error; err == nil {
				cName = u.Name
			}
		}

		wID := uint(0)
		if a.WorkerID != nil {
			wID = *a.WorkerID
		}

		details = append(details, AssignmentDetail{
			ID:           a.ID,
			RequestID:    a.RequestID,
			BookingID:    a.RequestID,
			WorkerID:     wID,
			WorkerName:   wName,
			WorkerPhone:  wPhone,
			CustomerName: cName,
			Category:     req.Category,
			Status:       a.Status,
			AssignedAt:   a.AssignedAt,
			Notes:        a.Notes,
			DistanceKm:   3,
		})
	}

	return details, total, nil
}

// MarkWorkCompleted updates request and assignment status to COMPLETED and activates payment (PAYMENT_PENDING)
func (s *AssignmentService) MarkWorkCompleted(requestID uint, adminID uint, completionNote string) (*models.ServiceRequest, *models.Assignment, *models.Payment, error) {
	var req models.ServiceRequest
	if err := s.db.First(&req, requestID).Error; err != nil {
		return nil, nil, nil, errors.New("service request not found")
	}

	currentStatus := utils.NormalizeStatus(req.Status)
	if currentStatus != models.StatusAssigned && currentStatus != models.StatusInProgress {
		return nil, nil, nil, fmt.Errorf("cannot mark as completed: request must be ASSIGNED or IN_PROGRESS (current status: %s)", currentStatus)
	}

	now := time.Now().UTC()
	var assignment models.Assignment
	_ = s.db.Where("request_id = ?", requestID).First(&assignment)

	// Fetch latest accepted quotation or quoted amount to determine payable amount
	var quotation models.CustomerQuotation
	_ = s.db.Where("request_id = ? AND status = 'ACCEPTED'", requestID).Order("created_at DESC").First(&quotation)

	amount := quotation.FinalTotal
	if amount <= 0 && req.QuoteFinalTotal != nil && *req.QuoteFinalTotal > 0 {
		amount = *req.QuoteFinalTotal
	}
	if amount <= 0 && req.QuotedAmount != nil && *req.QuotedAmount > 0 {
		amount = *req.QuotedAmount / 100
	}
	if amount <= 0 {
		amount = 120 // fallback reasonable default
	}

	var payment models.Payment

	err := s.db.Transaction(func(tx *gorm.DB) error {
		// 1. Update Request
		req.Status = models.StatusCompleted
		req.CompletedAt = &now
		req.CompletedBy = &adminID
		if completionNote != "" {
			req.CompletionNote = &completionNote
		}
		req.PaymentStatus = models.PaymentStatusPending
		req.UpdatedAt = now
		if err := tx.Save(&req).Error; err != nil {
			return err
		}

		// 2. Update Assignment
		if assignment.ID > 0 {
			assignment.Status = models.AssignmentStatusCompleted
			assignment.CompletedAt = &now
			assignment.CompletedBy = &adminID
			if completionNote != "" {
				assignment.CompletionNote = completionNote
			}
			if err := tx.Save(&assignment).Error; err != nil {
				return err
			}
		}

		// 3. Create or ensure Payment record in PAYMENT_PENDING
		var existingPay models.Payment
		payErr := tx.Where("request_id = ?", requestID).First(&existingPay).Error
		if payErr != nil {
			var qID *uint
			if quotation.ID > 0 {
				qID = &quotation.ID
			}
			payment = models.Payment{
				RequestID:     req.ID,
				QuotationID:   qID,
				CustomerID:    req.CustomerID,
				Amount:        amount,
				PaymentMethod: "UPI",
				Status:        models.PaymentStatusPending,
				CreatedAt:     now,
				UpdatedAt:     now,
			}
			if err := tx.Create(&payment).Error; err != nil {
				return err
			}
		} else {
			payment = existingPay
			payment.Status = models.PaymentStatusPending
			payment.Amount = amount
			payment.UpdatedAt = now
			if err := tx.Save(&payment).Error; err != nil {
				return err
			}
		}

		// 4. Status History
		hist := models.RequestStatusHistory{
			RequestID:  req.ID,
			FromStatus: currentStatus,
			ToStatus:   models.StatusCompleted,
			ChangedBy:  &adminID,
			Notes:      fmt.Sprintf("Admin marked work as COMPLETED. Note: %s", completionNote),
			CreatedAt:  now,
		}
		if err := tx.Create(&hist).Error; err != nil {
			return err
		}

		// 5. Customer Notification
		notify := models.Notification{
			UserID:    req.CustomerID,
			RequestID: &req.ID,
			Kind:      "work_completed",
			Title:     fmt.Sprintf("Service Completed for #HOMI-%d. Please complete payment of ₹%d.", req.ID, amount),
			CreatedAt: now,
		}
		if err := tx.Create(&notify).Error; err != nil {
			return err
		}

		// 6. Admin Activity Log
		logEntry := models.AdminActivityLog{
			AdminID:    &adminID,
			Action:     "mark_work_completed",
			EntityType: "request",
			EntityID:   fmt.Sprintf("%d", req.ID),
			Details:    fmt.Sprintf("Marked request #HOMI-%d as COMPLETED. Payment required: ₹%d", req.ID, amount),
			CreatedAt:  now,
		}
		return tx.Create(&logEntry).Error
	})

	if err != nil {
		return nil, nil, nil, err
	}

	return &req, &assignment, &payment, nil
}

// MarkWorkInProgress updates request and assignment status to IN_PROGRESS
func (s *AssignmentService) MarkWorkInProgress(requestID uint, adminID uint, note string) (*models.ServiceRequest, *models.Assignment, error) {
	var req models.ServiceRequest
	if err := s.db.First(&req, requestID).Error; err != nil {
		return nil, nil, errors.New("service request not found")
	}

	currentStatus := utils.NormalizeStatus(req.Status)
	if currentStatus != models.StatusAssigned {
		return nil, nil, fmt.Errorf("cannot transition to IN_PROGRESS from status '%s' (must be ASSIGNED)", currentStatus)
	}

	now := time.Now().UTC()
	var assignment models.Assignment
	_ = s.db.Where("request_id = ?", requestID).First(&assignment)

	err := s.db.Transaction(func(tx *gorm.DB) error {
		req.Status = models.StatusInProgress
		req.UpdatedAt = now
		if err := tx.Save(&req).Error; err != nil {
			return err
		}

		if assignment.ID > 0 {
			assignment.Status = models.AssignmentStatusInProgress
			_ = tx.Save(&assignment)
		}

		hist := models.RequestStatusHistory{
			RequestID:  req.ID,
			FromStatus: currentStatus,
			ToStatus:   models.StatusInProgress,
			ChangedBy:  &adminID,
			Notes:      fmt.Sprintf("Work marked in progress. %s", note),
			CreatedAt:  now,
		}
		return tx.Create(&hist).Error
	})

	if err != nil {
		return nil, nil, err
	}

	return &req, &assignment, nil
}

