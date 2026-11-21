package services

import (
	"errors"
	"strings"
	"sync"
	"time"

	"gorm.io/gorm"

	"homi-backend/internal/models"
)

type WorkerService struct {
	db          *gorm.DB
	cacheMu     sync.RWMutex
	cachedAt    time.Time
	cachedItems []models.Worker
}

func NewWorkerService(db *gorm.DB) *WorkerService {
	return &WorkerService{db: db}
}

func (s *WorkerService) InvalidateCache() {
	s.cacheMu.Lock()
	s.cachedItems = nil
	s.cacheMu.Unlock()
}

func (s *WorkerService) ListWorkers(specialty, city string, availableOnly bool) ([]models.Worker, error) {
	// If standard unfiltered query, use in-memory cache
	if specialty == "" && city == "" && !availableOnly {
		s.cacheMu.RLock()
		if time.Since(s.cachedAt) < 15*time.Second && s.cachedItems != nil {
			cached := s.cachedItems
			s.cacheMu.RUnlock()
			return cached, nil
		}
		s.cacheMu.RUnlock()
	}

	query := s.db.Model(&models.Worker{})

	if specialty != "" {
		query = query.Where("LOWER(specialty) = ?", strings.ToLower(specialty))
	}
	if city != "" {
		query = query.Where("LOWER(city) = ?", strings.ToLower(city))
	}
	if availableOnly {
		query = query.Where("available = ?", true)
	}

	var workers []models.Worker
	err := query.Order("created_at DESC").Find(&workers).Error

	if err == nil && specialty == "" && city == "" && !availableOnly {
		s.cacheMu.Lock()
		s.cachedAt = time.Now()
		s.cachedItems = workers
		s.cacheMu.Unlock()
	}

	return workers, err
}

func (s *WorkerService) GetWorkerByID(id uint) (*models.Worker, error) {
	var worker models.Worker
	if err := s.db.First(&worker, id).Error; err != nil {
		return nil, errors.New("worker not found")
	}
	return &worker, nil
}

func (s *WorkerService) ToggleAvailability(id uint) (*models.Worker, error) {
	worker, err := s.GetWorkerByID(id)
	if err != nil {
		return nil, err
	}

	worker.Available = !worker.Available
	worker.UpdatedAt = time.Now().UTC()

	if err := s.db.Save(worker).Error; err != nil {
		return nil, err
	}
	s.InvalidateCache()
	return worker, nil
}

// DeleteWorker removes a worker from the roster and cleans up foreign references safely
func (s *WorkerService) DeleteWorker(id uint) error {
	worker, err := s.GetWorkerByID(id)
	if err != nil {
		return err
	}

	// Safely unlink foreign references so history is retained
	_ = s.db.Model(&models.ServiceRequest{}).Where("worker_id = ?", id).Update("worker_id", nil)
	_ = s.db.Model(&models.WorkerQuote{}).Where("worker_id = ?", id).Update("worker_id", nil)
	_ = s.db.Model(&models.Assignment{}).Where("worker_id = ?", id).Update("worker_id", nil)
	_ = s.db.Model(&models.WorkerApplication{}).Where("worker_id = ?", id).Update("worker_id", nil)

	s.InvalidateCache()
	return s.db.Delete(worker).Error
}
