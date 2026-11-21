package utils

import (
	"testing"
)

func TestGenerateAndValidateJWT(t *testing.T) {
	secret := GenerateRandomString(32)
	userID := uint(42)
	email := "customer@homi.local"
	role := "customer"

	token, err := GenerateJWT(userID, email, role, secret)
	if err != nil {
		t.Fatalf("GenerateJWT failed: %v", err)
	}

	if token == "" {
		t.Fatal("expected non-empty token string")
	}

	claims, err := ValidateJWT(token, secret)
	if err != nil {
		t.Fatalf("ValidateJWT failed: %v", err)
	}

	if claims.UserID != userID {
		t.Errorf("expected UserID %d, got %d", userID, claims.UserID)
	}
	if claims.Email != email {
		t.Errorf("expected Email %s, got %s", email, claims.Email)
	}
	if claims.Role != role {
		t.Errorf("expected Role %s, got %s", role, claims.Role)
	}

	// Validate with wrong secret
	_, err = ValidateJWT(token, "wrong-secret-key")
	if err == nil {
		t.Errorf("expected error with invalid secret, got nil")
	}

	// Validate malformed token
	_, err = ValidateJWT("not.a.valid.jwt", secret)
	if err == nil {
		t.Errorf("expected error with malformed token, got nil")
	}
}
