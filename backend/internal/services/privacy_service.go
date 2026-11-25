package services

import (
	"errors"
	"strings"
	"time"

	"gorm.io/gorm"

	"homi-backend/internal/models"
)

type PrivacyService struct {
	db *gorm.DB
}

func NewPrivacyService(db *gorm.DB) *PrivacyService {
	return &PrivacyService{db: db}
}

type RecordConsentInput struct {
	UserID         *uint  `json:"userId"`
	SessionID      string `json:"sessionId"`
	ConsentType    string `json:"consentType" binding:"required"` // service_booking, worker_application, cookies_analytics, cookies_marketing
	Purpose        string `json:"purpose" binding:"required"`
	ConsentVersion string `json:"consentVersion"`
	Granted        bool   `json:"granted"`
	IPAddress      string `json:"ipAddress"`
	UserAgent      string `json:"userAgent"`
}

func (s *PrivacyService) RecordConsent(input RecordConsentInput) (*models.PrivacyConsent, error) {
	version := input.ConsentVersion
	if version == "" {
		version = "1.0"
	}

	consent := models.PrivacyConsent{
		UserID:         input.UserID,
		SessionID:      input.SessionID,
		ConsentType:    input.ConsentType,
		Purpose:        input.Purpose,
		ConsentVersion: version,
		Granted:        input.Granted,
		IPAddress:      input.IPAddress,
		UserAgent:      input.UserAgent,
		GrantedAt:      time.Now().UTC(),
	}

	if !input.Granted {
		now := time.Now().UTC()
		consent.RevokedAt = &now
	}

	if err := s.db.Create(&consent).Error; err != nil {
		return nil, err
	}
	return &consent, nil
}

type SubmitDSRInput struct {
	UserID       *uint  `json:"userId"`
	RequestType  string `json:"requestType" binding:"required"` // ACCESS, CORRECTION, ERASURE, GRIEVANCE
	ContactEmail string `json:"contactEmail" binding:"required,email"`
	ContactPhone string `json:"contactPhone"`
	Details      string `json:"details" binding:"required"`
}

func (s *PrivacyService) SubmitDataSubjectRequest(input SubmitDSRInput) (*models.DataSubjectRequest, error) {
	reqType := strings.ToUpper(strings.TrimSpace(input.RequestType))
	validTypes := map[string]bool{
		"ACCESS":     true,
		"CORRECTION": true,
		"ERASURE":    true,
		"GRIEVANCE":  true,
	}
	if !validTypes[reqType] {
		return nil, errors.New("invalid requestType: must be ACCESS, CORRECTION, ERASURE, or GRIEVANCE")
	}

	dsr := models.DataSubjectRequest{
		UserID:       input.UserID,
		RequestType:  reqType,
		ContactEmail: strings.ToLower(strings.TrimSpace(input.ContactEmail)),
		ContactPhone: strings.TrimSpace(input.ContactPhone),
		Details:      strings.TrimSpace(input.Details),
		Status:       "PENDING",
		CreatedAt:    time.Now().UTC(),
		UpdatedAt:    time.Now().UTC(),
	}

	if err := s.db.Create(&dsr).Error; err != nil {
		return nil, err
	}
	return &dsr, nil
}

func (s *PrivacyService) ListDataSubjectRequests(status string, limit, offset int) ([]models.DataSubjectRequest, int64, error) {
	query := s.db.Model(&models.DataSubjectRequest{})
	if status != "" && strings.ToUpper(status) != "ALL" {
		query = query.Where("UPPER(status) = ?", strings.ToUpper(status))
	}

	var total int64
	query.Count(&total)

	if limit <= 0 || limit > 100 {
		limit = 50
	}

	var requests []models.DataSubjectRequest
	err := query.Order("created_at DESC").Limit(limit).Offset(offset).Find(&requests).Error
	return requests, total, err
}

func (s *PrivacyService) ResolveDataSubjectRequest(id uint, adminID uint, status, notes string) (*models.DataSubjectRequest, error) {
	var dsr models.DataSubjectRequest
	if err := s.db.First(&dsr, id).Error; err != nil {
		return nil, errors.New("data subject request not found")
	}

	now := time.Now().UTC()
	dsr.Status = strings.ToUpper(strings.TrimSpace(status))
	dsr.ResolutionNotes = strings.TrimSpace(notes)
	dsr.ResolvedBy = &adminID
	dsr.ResolvedAt = &now
	dsr.UpdatedAt = now

	if err := s.db.Save(&dsr).Error; err != nil {
		return nil, err
	}
	return &dsr, nil
}

func (s *PrivacyService) GetUserDataExport(userID uint) (map[string]interface{}, error) {
	var user models.User
	if err := s.db.First(&user, userID).Error; err != nil {
		return nil, errors.New("user account not found")
	}

	var profile models.CustomerProfile
	_ = s.db.Where("user_id = ?", userID).First(&profile)

	var requests []models.ServiceRequest
	_ = s.db.Where("customer_id = ?", userID).Order("created_at DESC").Find(&requests)

	var payments []models.Payment
	_ = s.db.Where("customer_id = ?", userID).Order("created_at DESC").Find(&payments)

	var consents []models.PrivacyConsent
	_ = s.db.Where("user_id = ?", userID).Order("granted_at DESC").Find(&consents)

	data := map[string]interface{}{
		"exportDate": time.Now().UTC().Format(time.RFC3339),
		"userData": map[string]interface{}{
			"id":        user.ID,
			"name":      user.Name,
			"email":     user.Email,
			"phone":     user.Phone,
			"city":      user.City,
			"address":   user.Address,
			"createdAt": user.CreatedAt,
		},
		"profile":         profile,
		"serviceRequests": requests,
		"payments":        payments,
		"privacyConsents": consents,
	}

	return data, nil
}

type GrievanceOfficerInput struct {
	Name         string `json:"name"`
	Designation  string `json:"designation"`
	Email        string `json:"email"`
	Phone        string `json:"phone"`
	Address      string `json:"address"`
	Instructions string `json:"instructions"`
}

func (s *PrivacyService) GetGrievanceOfficer() (*models.GrievanceOfficer, error) {
	var officer models.GrievanceOfficer
	err := s.db.First(&officer, 1).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			officer = models.GrievanceOfficer{
				ID:           1,
				Name:         "Grievance Redressal Officer",
				Designation:  "Data Protection & Grievance Officer",
				Email:        "grievance@homi.local",
				Phone:        "+91 755 000 0000",
				Address:      "Homi Platform Operations, Arera Colony, Bhopal, Madhya Pradesh - 462016, India",
				Instructions: "Complaints will be acknowledged within 24 hours and resolved within 15 days in accordance with the Digital Personal Data Protection Act, 2023.",
				UpdatedAt:    time.Now().UTC(),
			}
			_ = s.db.Create(&officer)
			return &officer, nil
		}
		return nil, err
	}
	return &officer, nil
}

func (s *PrivacyService) UpdateGrievanceOfficer(input GrievanceOfficerInput) (*models.GrievanceOfficer, error) {
	officer, err := s.GetGrievanceOfficer()
	if err != nil {
		return nil, err
	}

	if input.Name != "" {
		officer.Name = strings.TrimSpace(input.Name)
	}
	if input.Designation != "" {
		officer.Designation = strings.TrimSpace(input.Designation)
	}
	if input.Email != "" {
		officer.Email = strings.TrimSpace(input.Email)
	}
	if input.Phone != "" {
		officer.Phone = strings.TrimSpace(input.Phone)
	}
	if input.Address != "" {
		officer.Address = strings.TrimSpace(input.Address)
	}
	if input.Instructions != "" {
		officer.Instructions = strings.TrimSpace(input.Instructions)
	}
	officer.UpdatedAt = time.Now().UTC()

	if err := s.db.Save(officer).Error; err != nil {
		return nil, err
	}
	return officer, nil
}
