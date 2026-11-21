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

type WorkerApplicationService struct {
	db *gorm.DB
}

func NewWorkerApplicationService(db *gorm.DB) *WorkerApplicationService {
	return &WorkerApplicationService{db: db}
}

type PublicApplicationInput struct {
	FullName        string `json:"fullName" binding:"required"`
	Phone           string `json:"phone" binding:"required"`
	Email           string `json:"email"`
	Category        string `json:"category" binding:"required"`
	Skills          string `json:"skills"`
	ExperienceYears int    `json:"experienceYears"`
	City            string `json:"city" binding:"required"`
	Area            string `json:"area"`
	Address         string `json:"address"`
	Bio             string `json:"bio"`
	ProfilePhotoURL string `json:"profilePhotoUrl"`
	DocumentsURL    string `json:"documentsUrl"`
}

func (s *WorkerApplicationService) SubmitApplication(input PublicApplicationInput) (*models.WorkerApplication, error) {
	fullName := strings.TrimSpace(input.FullName)
	phone := strings.TrimSpace(input.Phone)
	category := strings.TrimSpace(input.Category)
	city := strings.TrimSpace(input.City)

	if fullName == "" || phone == "" || category == "" || city == "" {
		return nil, errors.New("full name, phone, service category, and city are required")
	}

	app := models.WorkerApplication{
		FullName:        fullName,
		Phone:           phone,
		Email:           strings.TrimSpace(input.Email),
		Category:        category,
		Skills:          strings.TrimSpace(input.Skills),
		ExperienceYears: input.ExperienceYears,
		City:            city,
		Area:            strings.TrimSpace(input.Area),
		Address:         strings.TrimSpace(input.Address),
		Bio:             strings.TrimSpace(input.Bio),
		ProfilePhotoURL: input.ProfilePhotoURL,
		DocumentsURL:    input.DocumentsURL,
		Status:          "PENDING",
		AppliedAt:       time.Now().UTC(),
		CreatedAt:       time.Now().UTC(),
		UpdatedAt:       time.Now().UTC(),
	}

	if err := s.db.Create(&app).Error; err != nil {
		return nil, errors.New("failed to submit worker application: " + err.Error())
	}

	// Notify admin of new application
	adminID := utils.GetDefaultAdminID(s.db)
	_ = s.db.Create(&models.Notification{
		UserID:    adminID,
		Kind:      "new_worker_application",
		Title:     fmt.Sprintf("New Worker Application: %s (%s, %s)", app.FullName, app.Category, app.City),
		CreatedAt: time.Now().UTC(),
	})

	return &app, nil
}

func (s *WorkerApplicationService) ListApplications(status string, limit, offset int) ([]models.WorkerApplication, int64, error) {
	query := s.db.Model(&models.WorkerApplication{})
	if status != "" && strings.ToUpper(status) != "ALL" {
		query = query.Where("UPPER(status) = ?", strings.ToUpper(status))
	}

	var total int64
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	if limit <= 0 || limit > 100 {
		limit = 50
	}

	var apps []models.WorkerApplication
	err := query.Order("created_at DESC").Limit(limit).Offset(offset).Find(&apps).Error
	return apps, total, err
}

func (s *WorkerApplicationService) GetApplicationByID(id uint) (*models.WorkerApplication, error) {
	var app models.WorkerApplication
	if err := s.db.First(&app, id).Error; err != nil {
		return nil, errors.New("worker application not found")
	}
	return &app, nil
}

func (s *WorkerApplicationService) ApproveApplication(id uint, adminID uint, notes string) (*models.Worker, error) {
	app, err := s.GetApplicationByID(id)
	if err != nil {
		return nil, err
	}

	var worker models.Worker
	now := time.Now().UTC()

	err = s.db.Transaction(func(tx *gorm.DB) error {
		// 1. Update application status
		app.Status = "APPROVED"
		app.ReviewedAt = &now
		app.ReviewedBy = &adminID
		if notes != "" {
			app.AdminNotes = notes
		}
		app.UpdatedAt = now
		if err := tx.Save(app).Error; err != nil {
			return err
		}

		// 2. Create official Worker record
		worker = models.Worker{
			Name:            app.FullName,
			Phone:           app.Phone,
			Email:           app.Email,
			Specialty:       app.Category,
			Skills:          app.Skills,
			ExperienceYears: app.ExperienceYears,
			City:            app.City,
			Area:            app.Area,
			Address:         app.Address,
			VisitFee:        19900, // 199 rupees
			Available:       true,
			ServiceRadiusKm: 15,
			CreatedAt:       now,
			UpdatedAt:       now,
		}

		if err := tx.Create(&worker).Error; err != nil {
			return err
		}

		// 3. Log admin activity
		logEntry := models.AdminActivityLog{
			AdminID:    &adminID,
			Action:     "approve_worker_application",
			EntityType: "worker_application",
			EntityID:   fmt.Sprintf("%d", app.ID),
			Details:    fmt.Sprintf("Approved application for %s (%s). Created worker ID #%d", app.FullName, app.Category, worker.ID),
			CreatedAt:  now,
		}
		return tx.Create(&logEntry).Error
	})

	if err != nil {
		return nil, err
	}

	return &worker, nil
}

func (s *WorkerApplicationService) RejectApplication(id uint, adminID uint, notes string) (*models.WorkerApplication, error) {
	app, err := s.GetApplicationByID(id)
	if err != nil {
		return nil, err
	}

	now := time.Now().UTC()
	app.Status = "REJECTED"
	app.ReviewedAt = &now
	app.ReviewedBy = &adminID
	if notes != "" {
		app.AdminNotes = notes
	}
	app.UpdatedAt = now

	err = s.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Save(app).Error; err != nil {
			return err
		}
		logEntry := models.AdminActivityLog{
			AdminID:    &adminID,
			Action:     "reject_worker_application",
			EntityType: "worker_application",
			EntityID:   fmt.Sprintf("%d", app.ID),
			Details:    fmt.Sprintf("Rejected application for %s. Notes: %s", app.FullName, notes),
			CreatedAt:  now,
		}
		return tx.Create(&logEntry).Error
	})

	if err != nil {
		return nil, err
	}

	return app, nil
}
