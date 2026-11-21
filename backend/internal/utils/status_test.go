package utils

import (
	"testing"

	"homi-backend/internal/models"
)

func TestNormalizeStatus(t *testing.T) {
	tests := []struct {
		input    string
		expected string
	}{
		{"open", models.StatusNew},
		{"pending", models.StatusNew},
		{"PENDING_ADMIN_REVIEW", models.StatusNew},
		{"", models.StatusNew},
		{"under_review", models.StatusUnderReview},
		{"shared_with_workers", models.StatusSharedWithWorkers},
		{"open_for_applications", models.StatusSharedWithWorkers},
		{"approved", models.StatusSharedWithWorkers},
		{"worker_selected", models.StatusWorkerSelected},
		{"customer_approval_pending", models.StatusCustomerApprovalPending},
		{"customer_confirmed", models.StatusCustomerConfirmed},
		{"accepted_by_customer", models.StatusCustomerConfirmed},
		{"assigned", models.StatusAssigned},
		{"accepted", models.StatusAssigned},
		{"in_progress", models.StatusInProgress},
		{"completed", models.StatusCompleted},
		{"customer_declined", models.StatusCustomerDeclined},
		{"cancelled", models.StatusCancelled},
		{"rejected", models.StatusRejected},
		{"UNKNOWN_CUSTOM_STATUS", "UNKNOWN_CUSTOM_STATUS"},
	}

	for _, tt := range tests {
		got := NormalizeStatus(tt.input)
		if got != tt.expected {
			t.Errorf("NormalizeStatus(%q) = %q; want %q", tt.input, got, tt.expected)
		}
	}
}

func TestValidateStatusTransition(t *testing.T) {
	// 1. Same status is always permitted (no-op)
	if err := ValidateStatusTransition(models.StatusNew, models.StatusNew); err != nil {
		t.Errorf("expected nil for same status transition, got %v", err)
	}

	// 2. Terminal state restrictions
	terminalStates := []string{models.StatusCompleted, models.StatusCancelled, models.StatusRejected}
	for _, term := range terminalStates {
		if err := ValidateStatusTransition(term, models.StatusInProgress); err == nil {
			t.Errorf("expected error transitioning from terminal status %s, got nil", term)
		}
	}

	// 3. Strict business rule: ASSIGNED can only be reached after customer approval
	invalidFroms := []string{
		models.StatusNew,
		models.StatusUnderReview,
		models.StatusSharedWithWorkers,
		models.StatusWorkerSelected,
	}
	for _, from := range invalidFroms {
		if err := ValidateStatusTransition(from, models.StatusAssigned); err == nil {
			t.Errorf("expected error transitioning directly from %s to ASSIGNED without customer confirmation, got nil", from)
		}
	}

	// 4. Valid transitions to ASSIGNED (customer acceptance auto-assigns directly or via customer confirmed)
	if err := ValidateStatusTransition(models.StatusCustomerConfirmed, models.StatusAssigned); err != nil {
		t.Errorf("expected valid transition from CUSTOMER_CONFIRMED to ASSIGNED, got %v", err)
	}
	if err := ValidateStatusTransition(models.StatusCustomerApprovalPending, models.StatusAssigned); err != nil {
		t.Errorf("expected valid transition from CUSTOMER_APPROVAL_PENDING to ASSIGNED on acceptance, got %v", err)
	}

	// 5. Valid standard flow transitions
	validFlow := [][2]string{
		{models.StatusNew, models.StatusUnderReview},
		{models.StatusUnderReview, models.StatusSharedWithWorkers},
		{models.StatusSharedWithWorkers, models.StatusCustomerApprovalPending},
		{models.StatusCustomerApprovalPending, models.StatusCustomerConfirmed},
		{models.StatusCustomerConfirmed, models.StatusAssigned},
		{models.StatusAssigned, models.StatusInProgress},
		{models.StatusInProgress, models.StatusCompleted},
	}

	for _, step := range validFlow {
		if err := ValidateStatusTransition(step[0], step[1]); err != nil {
			t.Errorf("expected valid step %s -> %s, got error: %v", step[0], step[1], err)
		}
	}
}
