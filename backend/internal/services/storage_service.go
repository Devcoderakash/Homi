package services

import (
	"bytes"
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

// UploadFile uploads a file to Supabase Storage or falls back to local storage
func (s *StorageService) UploadFile(fileHeader *multipart.FileHeader, bucket string) (string, string, error) {
	file, err := fileHeader.Open()
	if err != nil {
		return "", "", err
	}
	defer file.Close()

	buf := bytes.NewBuffer(nil)
	if _, err := io.Copy(buf, file); err != nil {
		return "", "", err
	}

	ext := filepath.Ext(fileHeader.Filename)
	safeFileName := fmt.Sprintf("%d_%s%s", time.Now().UnixNano(), utils.GenerateRandomString(8), ext)
	contentType := fileHeader.Header.Get("Content-Type")
	if contentType == "" {
		contentType = "application/octet-stream"
	}

	// 1. If Supabase Storage credentials are configured, upload to Supabase Storage
	if s.cfg.SupabaseURL != "" && s.cfg.SupabaseServiceRoleKey != "" {
		uploadURL := fmt.Sprintf("%s/storage/v1/object/%s/%s", strings.TrimRight(s.cfg.SupabaseURL, "/"), bucket, safeFileName)
		req, err := http.NewRequest("POST", uploadURL, bytes.NewReader(buf.Bytes()))
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

	// 2. Local fallback storage
	localPath := filepath.Join("./uploads", safeFileName)
	if err := os.WriteFile(localPath, buf.Bytes(), 0644); err != nil {
		return "", "", err
	}

	publicURL := fmt.Sprintf("/uploads/%s", safeFileName)
	return publicURL, safeFileName, nil
}
