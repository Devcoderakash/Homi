package services

import (
	"errors"
	"fmt"
	"regexp"
	"strings"
	"sync"
	"time"

	"gorm.io/gorm"

	"homi-backend/internal/models"
)

var slugSanitizer = regexp.MustCompile(`[^a-z0-9-]+`)

type CategoryInput struct {
	Name          *string `json:"name"`
	Slug          *string `json:"slug"`
	Description   *string `json:"description"`
	Icon          *string `json:"icon"`
	Color         *string `json:"color"`
	StartingPrice *int    `json:"startingPrice"`
	Active        *bool   `json:"active"`
	SortOrder     *int    `json:"sortOrder"`
}

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

func normalizeCategorySlug(raw, fallbackName string) string {
	base := strings.TrimSpace(raw)
	if base == "" {
		base = strings.TrimSpace(fallbackName)
	}
	base = strings.ToLower(strings.ReplaceAll(base, " ", "-"))
	base = slugSanitizer.ReplaceAllString(base, "-")
	base = strings.Trim(base, "-")
	if len(base) > 80 {
		base = strings.TrimRight(base[:80], "-")
	}
	if base == "" {
		base = fmt.Sprintf("service-%d", time.Now().Unix())
	}
	return base
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
	err := s.db.Order("sort_order ASC, id ASC").Find(&cats).Error
	if err == nil {
		s.cacheMu.Lock()
		s.catsCachedAt = time.Now()
		s.cachedCats = cats
		s.cacheMu.Unlock()
	}
	return cats, err
}

func (s *AdminService) ListActiveCategories() ([]models.Category, error) {
	all, err := s.ListCategories()
	if err != nil {
		return nil, err
	}
	active := make([]models.Category, 0, len(all))
	for _, cat := range all {
		if cat.Active {
			active = append(active, cat)
		}
	}
	return active, nil
}

func (s *AdminService) InvalidateCategoryCache() {
	s.cacheMu.Lock()
	s.cachedCats = nil
	s.cacheMu.Unlock()
}

func (s *AdminService) logCategoryAction(adminID *uint, ip, action string, catID uint, details string) {
	_ = s.db.Create(&models.AdminActivityLog{
		AdminID:    adminID,
		Action:     action,
		EntityType: "category",
		EntityID:   fmt.Sprintf("%d", catID),
		Details:    details,
		IPAddress:  ip,
		CreatedAt:  time.Now().UTC(),
	})
}

func (s *AdminService) CreateCategory(input CategoryInput, adminID *uint, ip string) (*models.Category, error) {
	name := ""
	if input.Name != nil {
		name = strings.TrimSpace(*input.Name)
	}
	if name == "" {
		return nil, errors.New("category name is required")
	}
	if len(name) > 80 {
		return nil, errors.New("category name must be 80 characters or fewer")
	}

	rawSlug := ""
	if input.Slug != nil {
		rawSlug = *input.Slug
	}
	slug := normalizeCategorySlug(rawSlug, name)

	var existingSlug models.Category
	if err := s.db.Where("LOWER(slug) = ?", slug).First(&existingSlug).Error; err == nil {
		return nil, fmt.Errorf("a service category with slug '%s' already exists", slug)
	}

	startingPrice := 199
	if input.StartingPrice != nil {
		if *input.StartingPrice < 0 {
			return nil, errors.New("base visit fee cannot be negative")
		}
		startingPrice = *input.StartingPrice
	}

	icon := "Wrench"
	if input.Icon != nil && strings.TrimSpace(*input.Icon) != "" {
		icon = strings.TrimSpace(*input.Icon)
	}

	color := "#e5edee"
	if input.Color != nil && strings.TrimSpace(*input.Color) != "" {
		color = strings.TrimSpace(*input.Color)
	}

	description := ""
	if input.Description != nil {
		description = strings.TrimSpace(*input.Description)
	}

	active := true
	if input.Active != nil {
		active = *input.Active
	}

	sortOrder := 0
	if input.SortOrder != nil {
		sortOrder = *input.SortOrder
	} else {
		var maxOrder int
		_ = s.db.Model(&models.Category{}).Select("COALESCE(MAX(sort_order), 0)").Scan(&maxOrder).Error
		sortOrder = maxOrder + 1
	}

	cat := models.Category{
		Name:          name,
		Slug:          slug,
		Description:   description,
		Icon:          icon,
		Color:         color,
		StartingPrice: startingPrice,
		Active:        active,
		SortOrder:     sortOrder,
	}

	if err := s.db.Create(&cat).Error; err != nil {
		return nil, err
	}
	s.InvalidateCategoryCache()
	s.logCategoryAction(adminID, ip, "create_category", cat.ID, fmt.Sprintf("Created service category '%s' (%s)", cat.Name, cat.Slug))
	return &cat, nil
}

func (s *AdminService) UpdateCategory(id uint, input CategoryInput, adminID *uint, ip string) (*models.Category, error) {
	var existing models.Category
	if err := s.db.First(&existing, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("service category not found")
		}
		return nil, err
	}

	if input.Name != nil {
		name := strings.TrimSpace(*input.Name)
		if name == "" {
			return nil, errors.New("category name cannot be empty")
		}
		if len(name) > 80 {
			return nil, errors.New("category name must be 80 characters or fewer")
		}
		existing.Name = name
	}

	if input.Slug != nil {
		slug := normalizeCategorySlug(*input.Slug, existing.Name)
		var duplicate models.Category
		if err := s.db.Where("LOWER(slug) = ? AND id <> ?", slug, existing.ID).First(&duplicate).Error; err == nil {
			return nil, fmt.Errorf("a service category with slug '%s' already exists", slug)
		}
		existing.Slug = slug
	}

	if input.Description != nil {
		existing.Description = strings.TrimSpace(*input.Description)
	}
	if input.Icon != nil && strings.TrimSpace(*input.Icon) != "" {
		existing.Icon = strings.TrimSpace(*input.Icon)
	}
	if input.Color != nil && strings.TrimSpace(*input.Color) != "" {
		existing.Color = strings.TrimSpace(*input.Color)
	}
	if input.StartingPrice != nil {
		if *input.StartingPrice < 0 {
			return nil, errors.New("base visit fee cannot be negative")
		}
		existing.StartingPrice = *input.StartingPrice
	}
	if input.Active != nil {
		existing.Active = *input.Active
	}
	if input.SortOrder != nil {
		existing.SortOrder = *input.SortOrder
	}

	if err := s.db.Save(&existing).Error; err != nil {
		return nil, err
	}
	s.InvalidateCategoryCache()
	s.logCategoryAction(adminID, ip, "update_category", existing.ID, fmt.Sprintf("Updated service category '%s' (%s)", existing.Name, existing.Slug))
	return &existing, nil
}

func (s *AdminService) ToggleCategory(id uint, adminID *uint, ip string) (*models.Category, error) {
	var existing models.Category
	if err := s.db.First(&existing, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errors.New("service category not found")
		}
		return nil, err
	}
	existing.Active = !existing.Active
	if err := s.db.Save(&existing).Error; err != nil {
		return nil, err
	}
	s.InvalidateCategoryCache()
	s.logCategoryAction(adminID, ip, "toggle_category", existing.ID, fmt.Sprintf("Toggled '%s' active=%v", existing.Name, existing.Active))
	return &existing, nil
}

func (s *AdminService) DeleteCategory(id uint, adminID *uint, ip string) error {
	var existing models.Category
	if err := s.db.First(&existing, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errors.New("service category not found")
		}
		return err
	}
	if err := s.db.Delete(&existing).Error; err != nil {
		return err
	}
	s.InvalidateCategoryCache()
	s.logCategoryAction(adminID, ip, "delete_category", id, fmt.Sprintf("Removed service category '%s' (%s)", existing.Name, existing.Slug))
	return nil
}
