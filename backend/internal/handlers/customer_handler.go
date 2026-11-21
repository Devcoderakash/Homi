package handlers

import (
	"encoding/csv"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"homi-backend/internal/middleware"
	"homi-backend/internal/models"
	"homi-backend/internal/services"
	"homi-backend/internal/utils"
)

type CustomerHandler struct {
	db         *gorm.DB
	authSvc    *services.AuthService
	requestSvc *services.RequestService
}

func NewCustomerHandler(db *gorm.DB, authSvc *services.AuthService, requestSvc *services.RequestService) *CustomerHandler {
	return &CustomerHandler{db: db, authSvc: authSvc, requestSvc: requestSvc}
}

func (h *CustomerHandler) GetProfile(c *gin.Context) {
	user := middleware.GetCurrentUser(c)
	if user == nil {
		utils.SendUnauthorized(c, "Please sign in")
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"ok":   true,
		"user": user,
	})
}

type UpdateProfileInput struct {
	Name    string  `json:"name"`
	Phone   string  `json:"phone"`
	City    *string `json:"city"`
	Address *string `json:"address"`
}

func (h *CustomerHandler) UpdateProfile(c *gin.Context) {
	user := middleware.GetCurrentUser(c)
	if user == nil {
		utils.SendUnauthorized(c, "Please sign in")
		return
	}

	var input UpdateProfileInput
	if err := c.ShouldBindJSON(&input); err != nil {
		utils.SendBadRequest(c, err.Error())
		return
	}

	updated, err := h.authSvc.UpdateProfile(user.ID, input.Name, input.Phone, input.City, input.Address)
	if err != nil {
		utils.SendBadRequest(c, err.Error())
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"ok":   true,
		"user": updated,
	})
}

func (h *CustomerHandler) GetMyRequests(c *gin.Context) {
	user := middleware.GetCurrentUser(c)
	if user == nil {
		utils.SendUnauthorized(c, "Please sign in")
		return
	}

	requests, total, err := h.requestSvc.ListRequests(services.RequestFilter{
		CustomerID: &user.ID,
		Limit:      100,
	})
	if err != nil {
		utils.SendInternalError(c, err.Error())
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"ok":       true,
		"requests": requests,
		"total":    total,
	})
}

// GetReceipt generates an official customer receipt for a request
func (h *CustomerHandler) GetReceipt(c *gin.Context) {
	idParam := c.Param("id")
	id, err := strconv.ParseUint(idParam, 10, 32)
	if err != nil {
		utils.SendBadRequest(c, "Invalid request ID")
		return
	}

	req, err := h.requestSvc.GetRequestByID(uint(id))
	if err != nil {
		utils.SendNotFound(c, err.Error())
		return
	}

	user := middleware.GetCurrentUser(c)
	if user == nil {
		utils.SendUnauthorized(c, "Please sign in to view receipt")
		return
	}
	if user.Role != "admin" && req.CustomerID != user.ID {
		utils.SendForbidden(c, "Access denied: this receipt belongs to another customer")
		return
	}

	workerName := "Assigned Technician"
	if req.SelectedWorkerName != nil && *req.SelectedWorkerName != "" {
		workerName = *req.SelectedWorkerName
	}

	customerName := req.ContactName
	if customerName == "" && req.Customer != nil {
		customerName = req.Customer.Name
	}

	totalAmount := 0
	if req.QuoteFinalTotal != nil && *req.QuoteFinalTotal > 0 {
		totalAmount = *req.QuoteFinalTotal * 100 // paise
	}

	receipt := gin.H{
		"id":            req.ID,
		"number":        fmt.Sprintf("HOMI-REC-%04d", req.ID),
		"completedAt":   req.UpdatedAt.Format(time.RFC3339),
		"customerName":  customerName,
		"address":       req.Address,
		"city":          req.City,
		"workerName":    workerName,
		"category":      req.Category,
		"title":         req.Title,
		"description":   req.Description,
		"quoteNote":     req.QuoteNotes,
		"amount":        totalAmount,
		"paymentStatus": "received",
		"paymentMethod": "cash",
		"paidAt":        req.UpdatedAt.Format(time.RFC3339),
		"visitStartsAt": req.PreferredDate,
		"isDemo":        false,
	}

	c.JSON(http.StatusOK, gin.H{
		"ok":      true,
		"receipt": receipt,
	})
}

// GetNotifications returns user's notification list
func (h *CustomerHandler) GetNotifications(c *gin.Context) {
	user := middleware.GetCurrentUser(c)
	var userID uint = 1
	if user != nil {
		userID = user.ID
	}

	var notifications []models.Notification
	h.db.Where("user_id = ?", userID).Order("created_at DESC").Limit(30).Find(&notifications)

	var unreadCount int64
	h.db.Model(&models.Notification{}).Where("user_id = ? AND read_at IS NULL", userID).Count(&unreadCount)

	c.JSON(http.StatusOK, gin.H{
		"ok":            true,
		"notifications": notifications,
		"unread":        unreadCount,
	})
}

// MarkNotificationsRead marks notifications as read
func (h *CustomerHandler) MarkNotificationsRead(c *gin.Context) {
	user := middleware.GetCurrentUser(c)
	var userID uint = 1
	if user != nil {
		userID = user.ID
	}

	var body struct {
		ID  *uint `json:"id"`
		All bool  `json:"all"`
	}
	_ = c.ShouldBindJSON(&body)

	now := time.Now().UTC()
	if body.ID != nil && *body.ID > 0 {
		h.db.Model(&models.Notification{}).Where("id = ? AND user_id = ?", *body.ID, userID).Update("read_at", now)
	} else {
		h.db.Model(&models.Notification{}).Where("user_id = ? AND read_at IS NULL", userID).Update("read_at", now)
	}

	c.JSON(http.StatusOK, gin.H{"ok": true})
}

// GetLocation provides geocoding fallback
func (h *CustomerHandler) GetLocation(c *gin.Context) {
	query := c.Query("q")
	lat := c.Query("lat")
	lon := c.Query("lon")

	if lat != "" && lon != "" {
		c.JSON(http.StatusOK, gin.H{
			"ok":          true,
			"displayName": "Bhopal, Madhya Pradesh, India",
			"city":        "Bhopal",
			"state":       "Madhya Pradesh",
			"country":     "India",
			"latitude":    23.2599,
			"longitude":   77.4126,
		})
		return
	}

	if query == "" {
		query = "Bhopal"
	}

	c.JSON(http.StatusOK, gin.H{
		"ok": true,
		"results": []gin.H{
			{
				"displayName": query + ", Bhopal, Madhya Pradesh",
				"city":        "Bhopal",
				"latitude":    23.2599,
				"longitude":   77.4126,
			},
		},
	})
}

// GetOverview returns summary stats and report data for the customer dashboard
func (h *CustomerHandler) GetOverview(c *gin.Context) {
	user := middleware.GetCurrentUser(c)

	var reqs []models.ServiceRequest
	q := h.db.Order("created_at DESC")
	if user != nil && user.Role != "admin" {
		q = q.Where("customer_id = ?", user.ID)
	}
	q.Find(&reqs)

	var totalWorkers int64
	var totalRequests int64
	h.db.Model(&models.Worker{}).Where("available = true").Count(&totalWorkers)
	h.db.Model(&models.ServiceRequest{}).Count(&totalRequests)

	// Calculate totals
	var activeCount, completedCount int
	var agreedAmount, acknowledgedAmount, outstandingAmount, reportedAmount int

	type WorkRecord struct {
		ID            uint       `json:"id"`
		Title         string     `json:"title"`
		Category      string     `json:"category"`
		Status        string     `json:"status"`
		QuoteStatus   string     `json:"quoteStatus"`
		QuotedAmount  *int       `json:"quotedAmount"`
		PaymentStatus string     `json:"paymentStatus"`
		PaymentMethod *string    `json:"paymentMethod"`
		PaidAt        *time.Time `json:"paidAt"`
		UpdatedAt     time.Time  `json:"updatedAt"`
		VisitStartsAt *time.Time `json:"visitStartsAt"`
		CustomerName  string     `json:"customerName"`
		WorkerName    *string    `json:"workerName"`
		IsDemo        bool       `json:"isDemo"`
	}

	var recent []WorkRecord
	var visits []WorkRecord
	var outstanding []WorkRecord

	// Monthly aggregates (last 6 months)
	now := time.Now()
	monthsMap := make(map[string]*struct {
		amount int
		jobs   int
	})
	var monthsOrder []string
	for i := 5; i >= 0; i-- {
		m := now.AddDate(0, -i, 0).Format("2006-01")
		monthsMap[m] = &struct {
			amount int
			jobs   int
		}{}
		monthsOrder = append(monthsOrder, m)
	}

	for _, r := range reqs {
		amt := 0
		if r.QuoteFinalTotal != nil {
			amt = *r.QuoteFinalTotal
		} else if r.QuotedAmount != nil {
			amt = *r.QuotedAmount / 100
		}

		wName := r.SelectedWorkerName
		cName := r.ContactName
		if cName == "" && user != nil {
			cName = user.Name
		}

		record := WorkRecord{
			ID:            r.ID,
			Title:         r.Title,
			Category:      r.Category,
			Status:        r.Status,
			QuoteStatus:   r.QuoteStatus,
			QuotedAmount:  r.QuoteFinalTotal,
			PaymentStatus: r.PaymentStatus,
			PaymentMethod: r.PaymentMethod,
			PaidAt:        r.PaidAt,
			UpdatedAt:     r.UpdatedAt,
			VisitStartsAt: r.VisitStartsAt,
			CustomerName:  cName,
			WorkerName:    wName,
			IsDemo:        false,
		}

		if len(recent) < 15 {
			recent = append(recent, record)
		}

		// Status categorization
		st := utils.NormalizeStatus(r.Status)
		if st == models.StatusCompleted {
			completedCount++
			reportedAmount += amt
			if r.PaymentStatus == "paid" {
				acknowledgedAmount += amt
			} else {
				outstandingAmount += amt
			}
		} else if st != models.StatusCancelled && st != models.StatusRejected {
			activeCount++
			if amt > 0 {
				outstandingAmount += amt
			}
		}

		if amt > 0 {
			agreedAmount += amt
		}

		// Upcoming visits
		if (st == models.StatusAssigned || st == models.StatusCustomerConfirmed || r.VisitStartsAt != nil) && st != models.StatusCompleted && st != models.StatusCancelled {
			if len(visits) < 5 {
				visits = append(visits, record)
			}
		}

		// Outstanding payments
		if r.PaymentStatus != "paid" && amt > 0 && st != models.StatusCancelled && st != models.StatusRejected {
			if len(outstanding) < 5 {
				outstanding = append(outstanding, record)
			}
		}

		// Monthly bucket
		mKey := r.CreatedAt.Format("2006-01")
		if mData, exists := monthsMap[mKey]; exists {
			mData.amount += amt
			mData.jobs++
		}
	}

	// CSV Export handler
	if c.Query("format") == "csv" {
		c.Header("Content-Type", "text/csv")
		c.Header("Content-Disposition", "attachment;filename=homi-records.csv")
		w := csv.NewWriter(c.Writer)
		_ = w.Write([]string{"ID", "Title", "Category", "Status", "Amount", "Customer", "Worker", "Date"})
		for _, r := range recent {
			amt := 0
			if r.QuotedAmount != nil {
				amt = *r.QuotedAmount
			}
			wWorker := ""
			if r.WorkerName != nil {
				wWorker = *r.WorkerName
			}
			_ = w.Write([]string{
				fmt.Sprintf("%d", r.ID),
				r.Title,
				r.Category,
				r.Status,
				fmt.Sprintf("%d", amt),
				r.CustomerName,
				wWorker,
				r.UpdatedAt.Format("2006-01-02"),
			})
		}
		w.Flush()
		return
	}

	type MonthStat struct {
		Month  string `json:"month"`
		Amount int    `json:"amount"`
		Jobs   int    `json:"jobs"`
	}
	var months []MonthStat
	for _, m := range monthsOrder {
		mData := monthsMap[m]
		months = append(months, MonthStat{
			Month:  m,
			Amount: mData.amount,
			Jobs:   mData.jobs,
		})
	}

	userRole := "customer"
	if user != nil {
		userRole = user.Role
	}

	c.JSON(http.StatusOK, gin.H{
		"ok":   true,
		"role": userRole,
		"totals": gin.H{
			"requests":           len(reqs),
			"active":             activeCount,
			"completed":          completedCount,
			"agreedAmount":       agreedAmount,
			"acknowledgedAmount": acknowledgedAmount,
			"outstandingAmount":  outstandingAmount,
			"reportedAmount":     reportedAmount,
		},
		"months":        months,
		"visits":        visits,
		"outstanding":   outstanding,
		"recent":        recent,
		"activeWorkers": totalWorkers,
		"totalRequests": totalRequests,
		"servingCities": []string{"Bhopal"},
	})
}
