package services

import (
	"errors"
	"strings"
	"time"

	"gorm.io/gorm"

	"homi-backend/internal/config"
	"homi-backend/internal/models"
	"homi-backend/internal/utils"
)

type AuthService struct {
	db  *gorm.DB
	cfg *config.Config
}

func NewAuthService(db *gorm.DB, cfg *config.Config) *AuthService {
	return &AuthService{db: db, cfg: cfg}
}

type RegisterInput struct {
	Name     string  `json:"name" binding:"required"`
	Email    string  `json:"email" binding:"required,email"`
	Phone    string  `json:"phone" binding:"required"`
	Password string  `json:"password" binding:"required,min=6"`
	City     *string `json:"city"`
	Address  *string `json:"address"`
}

type LoginInput struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

func (s *AuthService) Register(input RegisterInput) (*models.User, string, error) {
	email := strings.ToLower(strings.TrimSpace(input.Email))
	phone := strings.TrimSpace(input.Phone)

	var existing models.User
	if err := s.db.Where("LOWER(email) = ?", email).First(&existing).Error; err == nil {
		return nil, "", errors.New("an account with this email address already exists")
	}

	hashedPassword, err := utils.HashPassword(input.Password)
	if err != nil {
		return nil, "", errors.New("failed to secure password")
	}

	user := models.User{
		Name:         strings.TrimSpace(input.Name),
		Email:        email,
		Phone:        phone,
		Role:         "customer",
		PasswordHash: hashedPassword,
		City:         input.City,
		Address:      input.Address,
		CreatedAt:    time.Now().UTC(),
		UpdatedAt:    time.Now().UTC(),
	}

	if err := s.db.Create(&user).Error; err != nil {
		return nil, "", errors.New("could not create customer account: " + err.Error())
	}

	// Create customer profile record
	cityName := ""
	if input.City != nil {
		cityName = *input.City
	}
	addr := ""
	if input.Address != nil {
		addr = *input.Address
	}

	_ = s.db.Create(&models.CustomerProfile{
		UserID:    user.ID,
		FullName:  user.Name,
		Phone:     user.Phone,
		City:      cityName,
		Address:   addr,
		CreatedAt: time.Now().UTC(),
		UpdatedAt: time.Now().UTC(),
	})

	token, err := utils.GenerateJWT(user.ID, user.Email, user.Role, s.cfg.JWTSecret)
	if err != nil {
		return nil, "", errors.New("failed to generate access token")
	}

	return &user, token, nil
}

func (s *AuthService) Login(input LoginInput) (*models.User, string, error) {
	email := strings.ToLower(strings.TrimSpace(input.Email))

	var user models.User
	if err := s.db.Where("LOWER(email) = ?", email).First(&user).Error; err != nil {
		return nil, "", errors.New("invalid email address or password")
	}

	if !utils.VerifyPassword(input.Password, user.PasswordHash) {
		return nil, "", errors.New("invalid email address or password")
	}

	token, err := utils.GenerateJWT(user.ID, user.Email, user.Role, s.cfg.JWTSecret)
	if err != nil {
		return nil, "", errors.New("failed to generate session token")
	}

	return &user, token, nil
}

func (s *AuthService) GetUserByID(id uint) (*models.User, error) {
	var user models.User
	if err := s.db.First(&user, id).Error; err != nil {
		return nil, errors.New("user not found")
	}
	return &user, nil
}

func (s *AuthService) UpdateProfile(userID uint, name, phone string, city, address *string) (*models.User, error) {
	var user models.User
	if err := s.db.First(&user, userID).Error; err != nil {
		return nil, errors.New("user not found")
	}

	if name != "" {
		user.Name = strings.TrimSpace(name)
	}
	if phone != "" {
		user.Phone = strings.TrimSpace(phone)
	}
	if city != nil {
		user.City = city
	}
	if address != nil {
		user.Address = address
	}
	user.UpdatedAt = time.Now().UTC()

	if err := s.db.Save(&user).Error; err != nil {
		return nil, err
	}

	// Update customer profile
	var profile models.CustomerProfile
	if err := s.db.Where("user_id = ?", userID).First(&profile).Error; err == nil {
		profile.FullName = user.Name
		profile.Phone = user.Phone
		if city != nil {
			profile.City = *city
		}
		if address != nil {
			profile.Address = *address
		}
		profile.UpdatedAt = time.Now().UTC()
		_ = s.db.Save(&profile)
	}

	return &user, nil
}
