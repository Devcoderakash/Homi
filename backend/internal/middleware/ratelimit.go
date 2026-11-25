package middleware

import (
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
)

type clientBucket struct {
	tokens     float64
	lastRefill time.Time
}

type IPRateLimiter struct {
	mu       sync.Mutex
	clients  map[string]*clientBucket
	rate     float64 // tokens per second
	capacity float64
}

func NewIPRateLimiter(rate float64, capacity float64) *IPRateLimiter {
	limiter := &IPRateLimiter{
		clients:  make(map[string]*clientBucket),
		rate:     rate,
		capacity: capacity,
	}

	// Periodically cleanup stale entries every 5 minutes
	go func() {
		for {
			time.Sleep(5 * time.Minute)
			limiter.mu.Lock()
			now := time.Now()
			for ip, b := range limiter.clients {
				if now.Sub(b.lastRefill) > 10*time.Minute {
					delete(limiter.clients, ip)
				}
			}
			limiter.mu.Unlock()
		}
	}()

	return limiter
}

func (limiter *IPRateLimiter) Allow(ip string) bool {
	limiter.mu.Lock()
	defer limiter.mu.Unlock()

	now := time.Now()
	b, exists := limiter.clients[ip]
	if !exists {
		limiter.clients[ip] = &clientBucket{
			tokens:     limiter.capacity - 1,
			lastRefill: now,
		}
		return true
	}

	elapsed := now.Sub(b.lastRefill).Seconds()
	b.lastRefill = now
	b.tokens += elapsed * limiter.rate
	if b.tokens > limiter.capacity {
		b.tokens = limiter.capacity
	}

	if b.tokens >= 1 {
		b.tokens -= 1
		return true
	}

	return false
}

// GlobalRateLimiter allows up to 2000 requests/sec with burst of 5000 for local high-throughput testing & production resilience
var globalLimiter = NewIPRateLimiter(2000, 5000)

// AuthRateLimiter restricts login/registration to 15 attempts per minute per IP
var authLimiter = NewIPRateLimiter(0.25, 15)

// RequestSubmissionLimiter restricts new service request submissions to 10 per minute per IP
var requestSubmissionLimiter = NewIPRateLimiter(0.2, 10)

// WorkerApplicationLimiter restricts worker registration attempts to 5 per 5 minutes per IP
var workerApplicationLimiter = NewIPRateLimiter(0.05, 5)

func RateLimitMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		path := c.Request.URL.Path
		method := c.Request.Method

		// Health endpoints are never rate limited (vital for load balancer health probes)
		if path == "/health" || path == "/api/health" || path == "/api/v1/health" {
			c.Next()
			return
		}

		ip := c.ClientIP()

		// 1. Authentication endpoints rate limiting
		if strings.Contains(path, "/auth/login") || strings.Contains(path, "/auth/register") || (path == "/api/auth" && method == "POST") {
			if !authLimiter.Allow(ip) {
				c.AbortWithStatusJSON(http.StatusTooManyRequests, gin.H{
					"ok":    false,
					"error": "Too many authentication attempts. Please wait a moment before trying again.",
				})
				return
			}
		}

		// 2. Worker application rate limiting
		if (strings.Contains(path, "/workers/apply") || strings.Contains(path, "/worker-applications")) && method == "POST" {
			if !workerApplicationLimiter.Allow(ip) {
				c.AbortWithStatusJSON(http.StatusTooManyRequests, gin.H{
					"ok":    false,
					"error": "Too many worker applications submitted from this IP. Please try again later.",
				})
				return
			}
		}

		// 3. Service request submission rate limiting
		if (path == "/api/requests" || path == "/api/v1/requests") && method == "POST" {
			if !requestSubmissionLimiter.Allow(ip) {
				c.AbortWithStatusJSON(http.StatusTooManyRequests, gin.H{
					"ok":    false,
					"error": "Request submission rate limit reached. Please wait before submitting another request.",
				})
				return
			}
		}

		// 4. Global fallback limiter
		if !globalLimiter.Allow(ip) {
			c.AbortWithStatusJSON(http.StatusTooManyRequests, gin.H{
				"ok":    false,
				"error": "Rate limit exceeded. Please throttle your requests.",
			})
			return
		}

		c.Next()
	}
}
