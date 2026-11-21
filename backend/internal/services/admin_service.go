package services

import (
	"strings"
	"sync"
	"time"

	"gorm.io/gorm"

	"homi-backend/internal/models"
)

type AdminService struct {
	db            *gorm.DB
	cacheMu       sync.RWMutex
	statsCachedAt time.Time
	cachedStats   map[string]interface{}
	catsCachedAt  time.Time
	cachedCats    []models.Category
}

func NewAdminService(db *gorm.DB) *AdminService {
	return &AdminService{db: db}
}

func (s *AdminService) GetDashboardStats() (map[string]interface{}, error) {
	s.cacheMu.RLock()
	if time.Since(s.statsCachedAt) < 3*time.Second && s.cachedStats != nil {
		cached := s.cachedStats
		s.cacheMu.RUnlock()
		return cached, nil
	}
	s.cacheMu.RUnlock()
	var totalRequests int64
	var pendingRequests int64
	var activeJobs int64
	var completedJobs int64
	var totalWorkerApps int64
	var pendingWorkerApps int64
	var totalWorkers int64
	var activeWorkers int64
	var totalCustomers int64

	s.db.Model(&models.ServiceRequest{}).Count(&totalRequests)
	s.db.Model(&models.ServiceRequest{}).
		Where("status IN ?", []string{models.StatusNew, models.StatusUnderReview, models.StatusSharedWithWorkers, "open", "pending_admin_review"}).
		Count(&pendingRequests)

	s.db.Model(&models.ServiceRequest{}).
		Where("status IN ?", []string{
			models.StatusAssigned,
			models.StatusInProgress,
			models.StatusCustomerApprovalPending,
			models.StatusCustomerConfirmed,
			"assigned", "in_progress", "on_the_way", "customer_approval_pending", "customer_confirmed",
		}).
		Count(&activeJobs)

	s.db.Model(&models.ServiceRequest{}).
		Where("status IN ?", []string{models.StatusCompleted, "completed"}).
		Count(&completedJobs)

	s.db.Model(&models.WorkerApplication{}).Count(&totalWorkerApps)
	s.db.Model(&models.WorkerApplication{}).
		Where("UPPER(status) = ?", "PENDING").
		Count(&pendingWorkerApps)

	s.db.Model(&models.Worker{}).Count(&totalWorkers)
	s.db.Model(&models.Worker{}).Where("available = ?", true).Count(&activeWorkers)

	s.db.Model(&models.User{}).Where("role = 'customer'").Count(&totalCustomers)

	var recentRequests []models.ServiceRequest
	s.db.Order("created_at DESC").Limit(8).Find(&recentRequests)

	var recentApplications []models.WorkerApplication
	s.db.Order("created_at DESC").Limit(8).Find(&recentApplications)

	res := map[string]interface{}{
		"totalRequests":      totalRequests,
		"pendingRequests":    pendingRequests,
		"activeJobs":         activeJobs,
		"completedJobs":      completedJobs,
		"totalWorkerApps":    totalWorkerApps,
		"pendingWorkerApps":  pendingWorkerApps,
		"totalWorkers":       totalWorkers,
		"activeWorkers":      activeWorkers,
		"totalCustomers":     totalCustomers,
		"recentRequests":     recentRequests,
		"recentApplications": recentApplications,
		"requests": map[string]interface{}{
			"total":         totalRequests,
			"pendingReview": pendingRequests,
			"active":        activeJobs,
			"completed":     completedJobs,
		},
		"applications": map[string]interface{}{
			"total":   totalWorkerApps,
			"pending": pendingWorkerApps,
		},
		"users": map[string]interface{}{
			"workers":       totalWorkers,
			"activeWorkers": activeWorkers,
			"customers":     totalCustomers,
		},
	}

	s.cacheMu.Lock()
	s.statsCachedAt = time.Now()
	s.cachedStats = res
	s.cacheMu.Unlock()

	return res, nil
}

func (s *AdminService) ListCustomers(search string, limit, offset int) ([]models.User, int64, error) {
	query := s.db.Model(&models.User{}).Where("role = 'customer'")
	if search != "" {
		p := "%" + strings.ToLower(search) + "%"
		query = query.Where("LOWER(name) LIKE ? OR LOWER(email) LIKE ? OR phone LIKE ?", p, p, p)
	}

	var total int64
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	if limit <= 0 || limit > 100 {
		limit = 50
	}

	var customers []models.User
	err := query.Order("created_at DESC").Limit(limit).Offset(offset).Find(&customers).Error
	return customers, total, err
}

func (s *AdminService) ListActivityLogs(limit int) ([]models.AdminActivityLog, error) {
	if limit <= 0 || limit > 100 {
		limit = 50
	}
	var logs []models.AdminActivityLog
	err := s.db.Order("created_at DESC").Limit(limit).Find(&logs).Error
	return logs, err
}

func (s *AdminService) ListCategories() ([]models.Category, error) {
	s.cacheMu.RLock()
	if time.Since(s.catsCachedAt) < 30*time.Second && s.cachedCats != nil {
		cached := s.cachedCats
		s.cacheMu.RUnlock()
		return cached, nil
	}
	s.cacheMu.RUnlock()

	var cats []models.Category
	err := s.db.Order("sort_order ASC").Find(&cats).Error
	if err == nil {
		s.cacheMu.Lock()
		s.catsCachedAt = time.Now()
		s.cachedCats = cats
		s.cacheMu.Unlock()
	}
	return cats, err
}

func (s *AdminService) InvalidateCategoryCache() {
	s.cacheMu.Lock()
	s.cachedCats = nil
	s.cacheMu.Unlock()
}

func (s *AdminService) CreateCategory(cat models.Category) (*models.Category, error) {
	if err := s.db.Create(&cat).Error; err != nil {
		return nil, err
	}
	s.InvalidateCategoryCache()
	return &cat, nil
}

func (s *AdminService) UpdateCategory(id uint, cat models.Category) (*models.Category, error) {
	var existing models.Category
	if err := s.db.First(&existing, id).Error; err != nil {
		return nil, err
	}
	existing.Name = cat.Name
	existing.Slug = cat.Slug
	existing.Description = cat.Description
	existing.Icon = cat.Icon
	existing.Active = cat.Active
	existing.SortOrder = cat.SortOrder
	if err := s.db.Save(&existing).Error; err != nil {
		return nil, err
	}
	s.InvalidateCategoryCache()
	return &existing, nil
}

func (s *AdminService) ToggleCategory(id uint) (*models.Category, error) {
	var existing models.Category
	if err := s.db.First(&existing, id).Error; err != nil {
		return nil, err
	}
	existing.Active = !existing.Active
	if err := s.db.Save(&existing).Error; err != nil {
		return nil, err
	}
	s.InvalidateCategoryCache()
	return &existing, nil
}
