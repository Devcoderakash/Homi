package services

import (
	"bytes"
	"errors"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"

	"homi-backend/internal/config"
	"homi-backend/internal/utils"
)

type StorageService struct {
	cfg *config.Config
}

func NewStorageService(cfg *config.Config) *StorageService {
	// Ensure local uploads directory exists
	_ = os.MkdirAll("./uploads", 0755)
	return &StorageService{cfg: cfg}
}

const (
	MaxUploadSize = 10 * 1024 * 1024 // 10 Megabytes max file size
)

var allowedExtensions = map[string]bool{
	".jpg":  true,
	".jpeg": true,
	".png":  true,
	".webp": true,
	".pdf":  true,
}

var allowedMimeTypes = map[string]bool{
	"image/jpeg":      true,
	"image/png":       true,
	"image/webp":      true,
	"application/pdf": true,
}

// UploadFile validates magic bytes, size, and extensions before storing in Supabase or local fallback
func (s *StorageService) UploadFile(fileHeader *multipart.FileHeader, bucket string) (string, string, error) {
	if fileHeader == nil {
		return "", "", errors.New("no file provided")
	}

	// 1. Enforce strict maximum file size
	if fileHeader.Size > MaxUploadSize {
		return "", "", fmt.Errorf("file size %d bytes exceeds maximum allowed limit of 10MB", fileHeader.Size)
	}

	// 2. Validate file extension against strict whitelist
	ext := strings.ToLower(filepath.Ext(fileHeader.Filename))
	if !allowedExtensions[ext] {
		return "", "", fmt.Errorf("file type '%s' is not permitted. Only JPG, PNG, WEBP, and PDF documents are allowed", ext)
	}

	file, err := fileHeader.Open()
	if err != nil {
		return "", "", err
	}
	defer file.Close()

	buf := bytes.NewBuffer(nil)
	if _, err := io.Copy(buf, file); err != nil {
		return "", "", err
	}

	fileBytes := buf.Bytes()

	// 3. Inspect magic bytes to verify true MIME type (prevent polyglot & disguised executable attacks)
	sniffLength := 512
	if len(fileBytes) < sniffLength {
		sniffLength = len(fileBytes)
	}
	detectMime := http.DetectContentType(fileBytes[:sniffLength])

	// Strip parameters like charset from detected MIME type
	baseMime := strings.TrimSpace(strings.Split(detectMime, ";")[0])
	if !allowedMimeTypes[baseMime] {
		return "", "", fmt.Errorf("invalid file content: detected '%s' which is not an authorized image or document format", baseMime)
	}

	// Generate safe cryptographically random filename with verified extension
	safeFileName := fmt.Sprintf("%d_%s%s", time.Now().UnixNano(), utils.GenerateRandomString(12), ext)
	contentType := baseMime

	// 4. If Supabase Storage credentials are configured, upload to Supabase Storage
	if s.cfg.SupabaseURL != "" && s.cfg.SupabaseServiceRoleKey != "" {
		uploadURL := fmt.Sprintf("%s/storage/v1/object/%s/%s", strings.TrimRight(s.cfg.SupabaseURL, "/"), bucket, safeFileName)
		req, err := http.NewRequest("POST", uploadURL, bytes.NewReader(fileBytes))
		if err == nil {
			req.Header.Set("Authorization", "Bearer "+s.cfg.SupabaseServiceRoleKey)
			req.Header.Set("Content-Type", contentType)

			client := &http.Client{Timeout: 15 * time.Second}
			resp, err := client.Do(req)
			if err == nil && (resp.StatusCode == http.StatusOK || resp.StatusCode == http.StatusCreated) {
				publicURL := fmt.Sprintf("%s/storage/v1/object/public/%s/%s", strings.TrimRight(s.cfg.SupabaseURL, "/"), bucket, safeFileName)
				resp.Body.Close()
				return publicURL, safeFileName, nil
			}
			if resp != nil {
				resp.Body.Close()
			}
		}
	}

	// 5. Local fallback storage (with restricted permissions 0644)
	localPath := filepath.Join("./uploads", safeFileName)
	if err := os.WriteFile(localPath, fileBytes, 0644); err != nil {
		return "", "", err
	}

	publicURL := fmt.Sprintf("/uploads/%s", safeFileName)
	return publicURL, safeFileName, nil
}
