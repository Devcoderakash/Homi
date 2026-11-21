package utils

import (
	"fmt"
	"strings"

	"gorm.io/gorm"

	"homi-backend/internal/models"
)

// GetDefaultAdminID returns the first admin user ID from the database
func GetDefaultAdminID(db *gorm.DB) uint {
	var admin models.User
	if err := db.Where("role = 'admin'").First(&admin).Error; err == nil && admin.ID > 0 {
		return admin.ID
	}
	return 423
}

// NormalizeStatus converts legacy and varied case status strings into the canonical uppercase status
func NormalizeStatus(status string) string {
	s := strings.ToUpper(strings.TrimSpace(status))
	switch s {
	case "OPEN", "PENDING_ADMIN_REVIEW", "PENDING", "":
		return models.StatusNew
	case "UNDER_REVIEW":
		return models.StatusUnderReview
	case "SHARED_WITH_WORKERS", "FINDING_WORKER", "OPEN_FOR_APPLICATIONS", "APPROVED":
		return models.StatusSharedWithWorkers
	case "WORKER_SELECTED":
		return models.StatusWorkerSelected
	case "CUSTOMER_APPROVAL_PENDING":
		return models.StatusCustomerApprovalPending
	case "CUSTOMER_CONFIRMED", "ACCEPTED_BY_CUSTOMER":
		return models.StatusCustomerConfirmed
	case "ASSIGNED", "ACCEPTED":
		return models.StatusAssigned
	case "IN_PROGRESS", "ON_THE_WAY", "AWAITING_CONFIRMATION":
		return models.StatusInProgress
	case "COMPLETED":
		return models.StatusCompleted
	case "CUSTOMER_DECLINED":
		return models.StatusCustomerDeclined
	case "CANCELLED":
		return models.StatusCancelled
	case "REJECTED":
		return models.StatusRejected
	default:
		return s
	}
}

// ValidateStatusTransition verifies that moving from currentStatus to nextStatus is allowed
func ValidateStatusTransition(currentStatus, nextStatus string) error {
	from := NormalizeStatus(currentStatus)
	to := NormalizeStatus(nextStatus)

	if from == to {
		return nil
	}

	// Terminal states
	if from == models.StatusCompleted || from == models.StatusCancelled || from == models.StatusRejected {
		return fmt.Errorf("cannot transition from terminal status '%s' to '%s'", from, to)
	}

	// Strict Business Rule: ASSIGNED can ONLY be reached from CUSTOMER_CONFIRMED or CUSTOMER_APPROVAL_PENDING (auto-assignment on customer acceptance)
	if to == models.StatusAssigned && from != models.StatusCustomerConfirmed && from != models.StatusCustomerApprovalPending {
		return fmt.Errorf("critical restriction: cannot assign worker before customer has approved the quotation (current status: '%s')", from)
	}

	// Allowed transitions map
	allowed := map[string][]string{
		models.StatusNew: {
			models.StatusUnderReview,
			models.StatusSharedWithWorkers,
			models.StatusCancelled,
			models.StatusRejected,
		},
		models.StatusUnderReview: {
			models.StatusSharedWithWorkers,
			models.StatusCancelled,
			models.StatusRejected,
		},
		models.StatusSharedWithWorkers: {
			models.StatusWorkerSelected,
			models.StatusCustomerApprovalPending,
			models.StatusCancelled,
			models.StatusRejected,
		},
		models.StatusWorkerSelected: {
			models.StatusCustomerApprovalPending,
			models.StatusSharedWithWorkers, // allow going back to find another worker
			models.StatusCancelled,
		},
		models.StatusCustomerApprovalPending: {
			models.StatusCustomerConfirmed,
			models.StatusAssigned, // Auto-assignment on customer acceptance!
			models.StatusCustomerDeclined,
			models.StatusCancelled,
		},
		models.StatusCustomerDeclined: {
			models.StatusCustomerApprovalPending, // allow admin to revise quotation
			models.StatusWorkerSelected,
			models.StatusSharedWithWorkers,
			models.StatusCancelled,
		},
		models.StatusCustomerConfirmed: {
			models.StatusAssigned,
			models.StatusCancelled,
		},
		models.StatusAssigned: {
			models.StatusInProgress,
			models.StatusCompleted,
			models.StatusCancelled,
		},
		models.StatusInProgress: {
			models.StatusCompleted,
			models.StatusCancelled,
		},
	}

	validDestinations, ok := allowed[from]
	if !ok {
		return fmt.Errorf("unknown source status '%s'", from)
	}

	for _, v := range validDestinations {
		if v == to {
			return nil
		}
	}

	return fmt.Errorf("invalid status transition from '%s' to '%s'", from, to)
}
