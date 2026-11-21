package services

import (
	"testing"
)

func TestFormatLocationSummary(t *testing.T) {
	tests := []struct {
		address  string
		city     string
		expected string
	}{
		{
			address:  "Flat 302, Green Heights, Arera Colony, Bhopal",
			city:     "Bhopal",
			expected: "Arera Colony, Bhopal",
		},
		{
			address:  "Airport Road, CHC GANDHINAGAR, Bairagarh, Bhopal",
			city:     "Bhopal",
			expected: "Bairagarh, Bhopal",
		},
		{
			address:  "Indrapuri",
			city:     "Bhopal",
			expected: "Indrapuri, Bhopal",
		},
		{
			address:  "",
			city:     "Bhopal",
			expected: "Bhopal",
		},
		{
			address:  "Bhopal",
			city:     "Bhopal",
			expected: "Bhopal",
		},
	}

	for _, tt := range tests {
		got := FormatLocationSummary(tt.address, tt.city)
		if got != tt.expected {
			t.Errorf("FormatLocationSummary(%q, %q) = %q; want %q", tt.address, tt.city, got, tt.expected)
		}
	}
}
