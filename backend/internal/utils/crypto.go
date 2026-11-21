package utils

import (
	"crypto/rand"
	"crypto/subtle"
	"encoding/hex"
	"errors"
	"fmt"
	"strings"

	"golang.org/x/crypto/bcrypt"
	"golang.org/x/crypto/scrypt"
)

// HashPassword hashes a password using bcrypt
func HashPassword(password string) (string, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return "", err
	}
	return string(bytes), nil
}

// VerifyPassword checks if a plain text password matches a stored hash.
// Supports both bcrypt hashes AND existing legacy Node.js scrypt hashes ("salt:hashHex").
func VerifyPassword(password, storedHash string) bool {
	if storedHash == "" || password == "" {
		return false
	}

	// 1. Check if hash is in legacy Node.js scrypt format (salt:keyHex)
	if strings.Contains(storedHash, ":") {
		parts := strings.Split(storedHash, ":")
		if len(parts) == 2 {
			saltHex := parts[0]
			keyHex := parts[1]

			expectedKey, err := hex.DecodeString(keyHex)
			if err != nil {
				return false
			}

			// Node.js crypto.scrypt default: N=16384, r=8, p=1, keyLen=64
			derivedKey, err := scrypt.Key([]byte(password), []byte(saltHex), 16384, 8, 1, len(expectedKey))
			if err != nil {
				return false
			}

			return subtle.ConstantTimeCompare(derivedKey, expectedKey) == 1
		}
	}

	// 2. Check if hash is standard bcrypt
	err := bcrypt.CompareHashAndPassword([]byte(storedHash), []byte(password))
	return err == nil
}

// GenerateRandomString generates a secure hex string
func GenerateRandomString(n int) string {
	bytes := make([]byte, n)
	if _, err := rand.Read(bytes); err != nil {
		return fmt.Sprintf("%d", err)
	}
	return hex.EncodeToString(bytes)
}

// ScryptHash creates a Node.js-compatible scrypt hash (for exact parity if required)
func ScryptHash(password string) (string, error) {
	salt := make([]byte, 16)
	if _, err := rand.Read(salt); err != nil {
		return "", err
	}
	saltHex := hex.EncodeToString(salt)
	key, err := scrypt.Key([]byte(password), []byte(saltHex), 16384, 8, 1, 64)
	if err != nil {
		return "", errors.New("scrypt generation failed")
	}
	return fmt.Sprintf("%s:%s", saltHex, hex.EncodeToString(key)), nil
}
