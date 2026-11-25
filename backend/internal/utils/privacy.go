package utils

import (
	"homi-backend/internal/models"
)

// SanitizeRequestForCustomer strips internal worker identity and worker WhatsApp quotes
// for customer-facing responses, keeping worker details completely private until official assignment.
func SanitizeRequestForCustomer(req *models.ServiceRequest) models.ServiceRequest {
	if req == nil {
		return models.ServiceRequest{}
	}

	copyReq := *req
	// Never expose internal WhatsApp quotes to customers
	copyReq.WorkerQuotes = nil

	// Strip worker identity from all customer quotations
	if len(copyReq.CustomerQuotations) > 0 {
		sanitizedQuotes := make([]models.CustomerQuotation, len(copyReq.CustomerQuotations))
		for i, cq := range copyReq.CustomerQuotations {
			sanitizedQuotes[i] = cq
			sanitizedQuotes[i].SelectedWorkerID = nil
			sanitizedQuotes[i].SelectedWorkerName = ""
			sanitizedQuotes[i].SelectedWorkerPhone = ""
		}
		copyReq.CustomerQuotations = sanitizedQuotes
	}

	// Strip worker identity from latest quotation
	if copyReq.LatestQuotation != nil {
		sanitizedLatest := *copyReq.LatestQuotation
		sanitizedLatest.SelectedWorkerID = nil
		sanitizedLatest.SelectedWorkerName = ""
		sanitizedLatest.SelectedWorkerPhone = ""
		copyReq.LatestQuotation = &sanitizedLatest
	}

	normStatus := NormalizeStatus(copyReq.Status)
	isAssignedOrBeyond := normStatus == models.StatusAssigned || normStatus == models.StatusInProgress || normStatus == models.StatusCompleted

	// Before official assignment, worker identity must NEVER be revealed
	if !isAssignedOrBeyond {
		copyReq.SelectedWorkerID = nil
		copyReq.SelectedWorkerName = nil
		copyReq.SelectedWorkerPhone = nil
		copyReq.WorkerID = nil
		copyReq.Worker = nil
		copyReq.Assignment = nil
	}

	return copyReq
}

// SanitizeWorkerForPublic strips private verification documents, home address, email,
// and masks phone numbers for the public directory to ensure DPDP Act 2023 compliance.
func SanitizeWorkerForPublic(w *models.Worker) models.Worker {
	if w == nil {
		return models.Worker{}
	}

	safe := *w
	// Strictly redact sensitive personal verification documents and private contact info
	safe.Email = ""
	safe.Address = "" // Keep Area and City, redact full private street address
	safe.DocumentType = ""
	safe.DocumentURL = ""
	safe.DocumentsURL = ""
	safe.UserID = nil

	// Mask phone number for public display (e.g. "+91 98*** ***12")
	if len(safe.Phone) >= 7 {
		prefix := safe.Phone[:3]
		suffix := safe.Phone[len(safe.Phone)-2:]
		safe.Phone = prefix + "******" + suffix
	} else if len(safe.Phone) > 0 {
		safe.Phone = "******"
	}

	return safe
}
