# Multi-stage Docker build for Homi Go Backend
FROM golang:1.24-alpine AS builder

WORKDIR /app

# Download dependencies
COPY go.mod go.sum ./
RUN go mod download

# Copy source and build static binary
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o /app/bin/api cmd/api/main.go

# Production runner image
FROM alpine:latest AS runner

WORKDIR /app

RUN apk --no-cache add ca-certificates tzdata

COPY --from=builder /app/bin/api ./bin/api
COPY --from=builder /app/.env.example ./.env.example

EXPOSE 4000

CMD ["./bin/api"]
