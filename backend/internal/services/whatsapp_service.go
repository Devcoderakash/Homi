package services

import (
	"errors"
	"fmt"
	"strings"
	"time"

	"gorm.io/gorm"

	"homi-backend/internal/config"
	"homi-backend/internal/models"
	"homi-backend/internal/utils"
)

type WhatsAppService struct {
	db  *gorm.DB
	cfg *config.Config
}

func NewWhatsAppService(db *gorm.DB, cfg *config.Config) *WhatsAppService {
	return &WhatsAppService{db: db, cfg: cfg}
}

func (s *WhatsAppService) GetGroupLink() (string, error) {
	var setting models.AppSetting
	if err := s.db.Where("key = ?", "whatsapp_workers_group_link").First(&setting).Error; err != nil {
		return s.cfg.WhatsAppGroupInviteURL, nil
	}
	if strings.TrimSpace(setting.Value) == "" {
		return s.cfg.WhatsAppGroupInviteURL, nil
	}
	return setting.Value, nil
}

func (s *WhatsAppService) UpdateGroupLink(link string, adminID uint) (string, error) {
	trimmed := strings.TrimSpace(link)
	if trimmed == "" {
		return "", errors.New("WhatsApp group invite URL cannot be empty")
	}
	if !strings.HasPrefix(trimmed, "https://chat.whatsapp.com/") && !strings.HasPrefix(trimmed, "https://wa.me/") {
		return "", errors.New("invalid WhatsApp group invite URL format (must start with https://chat.whatsapp.com/)")
	}

	setting := models.AppSetting{
		Key:       "whatsapp_workers_group_link",
		Value:     trimmed,
		UpdatedAt: time.Now().UTC(),
	}

	if err := s.db.Save(&setting).Error; err != nil {
		return "", err
	}

	// Also sync platform_settings table if present
	_ = s.db.Exec("INSERT INTO platform_settings (key, value, updated_at) VALUES ('whatsapp_workers_group_link', ?, NOW()) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()", trimmed)

	_ = s.db.Create(&models.AdminActivityLog{
		AdminID:    &adminID,
		Action:     "update_whatsapp_group_link",
		EntityType: "setting",
		EntityID:   "whatsapp_workers_group_link",
		Details:    "Updated WhatsApp workers group invite link",
		CreatedAt:  time.Now().UTC(),
	})

	return trimmed, nil
}

// FormatLocationSummary masks exact house/flat numbers and shows only neighborhood and city.
func FormatLocationSummary(address, city string) string {
	locationText := city
	if address != "" {
		parts := strings.Split(address, ",")
		var cleaned []string
		for _, p := range parts {
			trimmed := strings.TrimSpace(p)
			if trimmed != "" {
				cleaned = append(cleaned, trimmed)
			}
		}
		if len(cleaned) > 0 {
			last := cleaned[len(cleaned)-1]
			if strings.EqualFold(last, city) && len(cleaned) > 1 {
				locationText = cleaned[len(cleaned)-2] + ", " + city
			} else if !strings.EqualFold(last, city) {
				locationText = last + ", " + city
			}
		}
	}
	return locationText
}

func (s *WhatsAppService) GenerateJobMessage(requestID uint) (string, string, bool, *time.Time, error) {
	var req models.ServiceRequest
	if err := s.db.First(&req, requestID).Error; err != nil {
		return "", "", false, nil, errors.New("service request not found")
	}

	link, _ := s.GetGroupLink()
	locationText := FormatLocationSummary(req.Address, req.City)

	prefTime := req.PreferredDate
	if req.PreferredTime != "" {
		prefTime += " · " + req.PreferredTime
	}

	message := fmt.Sprintf(`🏠 HOMI – NEW SERVICE REQUEST

Request ID: #HOMI-%d

Service: %s

Problem: %s

Description:
%s

Location: %s

Preferred Time: %s

Photos: View photos in the Homi Admin Panel.

💰 AVAILABLE WORKERS:

If you are interested, please contact Homi Admin and share:

1. Your name
2. Your estimated price
3. Your availability
4. Material charges, if any
5. Estimated completion time

Homi Admin will select the suitable worker and confirm the work.`,
		req.ID,
		req.Category,
		req.Title,
		req.Description,
		locationText,
		prefTime,
	)

	isShared := req.WhatsAppSharedAt != nil
	return message, link, isShared, req.WhatsAppSharedAt, nil
}

func (s *WhatsAppService) MarkShared(requestID uint, adminID uint) (*models.ServiceRequest, error) {
	var req models.ServiceRequest
	if err := s.db.First(&req, requestID).Error; err != nil {
		return nil, errors.New("service request not found")
	}

	now := time.Now().UTC()
	req.WhatsAppSharedAt = &now

	// Status progression: transitions from NEW / UNDER_REVIEW to SHARED_WITH_WORKERS
	currentStatus := utils.NormalizeStatus(req.Status)
	if currentStatus == models.StatusNew || currentStatus == models.StatusUnderReview {
		req.Status = models.StatusSharedWithWorkers
	}
	req.UpdatedAt = now

	err := s.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Save(&req).Error; err != nil {
			return err
		}

		hist := models.RequestStatusHistory{
			RequestID:  req.ID,
			FromStatus: currentStatus,
			ToStatus:   req.Status,
			ChangedBy:  &adminID,
			Notes:      "Request broadcasted to WhatsApp workers group",
			CreatedAt:  now,
		}
		if err := tx.Create(&hist).Error; err != nil {
			return err
		}

		logEntry := models.AdminActivityLog{
			AdminID:    &adminID,
			Action:     "whatsapp_shared",
			EntityType: "request",
			EntityID:   fmt.Sprintf("%d", req.ID),
			Details:    "Shared job details to WhatsApp workers group",
			CreatedAt:  now,
		}
		return tx.Create(&logEntry).Error
	})

	if err != nil {
		return nil, err
	}

	return &req, nil
}
