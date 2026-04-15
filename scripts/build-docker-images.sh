#!/bin/bash

# SmartMediCare Docker Build Script
# Builds Docker images for all services

set -e

echo "================================"
echo "Building SmartMediCare Images"
echo "================================"
echo ""

PROJECT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$PROJECT_DIR"

# Color codes for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Build Client
echo -e "${BLUE}Building client...${NC}"
docker build -t smartmedicare/client:latest -f client/Dockerfile client/
echo -e "${GREEN}✓ Client built successfully${NC}"
echo ""

# Build Gateway
echo -e "${BLUE}Building gateway...${NC}"
docker build -t smartmedicare/gateway:latest -f gateway/Dockerfile gateway/
echo -e "${GREEN}✓ Gateway built successfully${NC}"
echo ""

# Build Auth Service
echo -e "${BLUE}Building auth-service...${NC}"
docker build -t smartmedicare/auth-service:latest -f services/auth-service/Dockerfile services/auth-service/
echo -e "${GREEN}✓ Auth service built successfully${NC}"
echo ""

# Build Patient Service
echo -e "${BLUE}Building patient-service...${NC}"
docker build -t smartmedicare/patient-service:latest -f services/patient-service/Dockerfile services/patient-service/
echo -e "${GREEN}✓ Patient service built successfully${NC}"
echo ""

# Build Doctor Service
echo -e "${BLUE}Building doctor-service...${NC}"
docker build -t smartmedicare/doctor-service:latest -f services/doctor-service/Dockerfile services/doctor-service/
echo -e "${GREEN}✓ Doctor service built successfully${NC}"
echo ""

# Build Appointment Service
echo -e "${BLUE}Building appointment-service...${NC}"
docker build -t smartmedicare/appointment-service:latest -f services/appointment-service/Dockerfile services/appointment-service/
echo -e "${GREEN}✓ Appointment service built successfully${NC}"
echo ""

# Build Notification Service
echo -e "${BLUE}Building notification-service...${NC}"
docker build -t smartmedicare/notification-service:latest -f services/notification-service/Dockerfile services/notification-service/
echo -e "${GREEN}✓ Notification service built successfully${NC}"
echo ""

# Build Payment Service
echo -e "${BLUE}Building payment-service...${NC}"
docker build -t smartmedicare/payment-service:latest -f services/payment-service/Dockerfile services/payment-service/
echo -e "${GREEN}✓ Payment service built successfully${NC}"
echo ""

# Build Telemedicine Service (if Dockerfile exists)
if [ -f "services/telemedicine-service/Dockerfile" ]; then
    echo -e "${BLUE}Building telemedicine-service...${NC}"
    docker build -t smartmedicare/telemedicine-service:latest -f services/telemedicine-service/Dockerfile services/telemedicine-service/
    echo -e "${GREEN}✓ Telemedicine service built successfully${NC}"
    echo ""
fi

echo "================================"
echo -e "${GREEN}All images built successfully!${NC}"
echo "================================"
echo ""
echo "Next steps:"
echo "1. Create namespace: kubectl create namespace smartmedicare"
echo "2. Apply configs: kubectl apply -f kubernetes/configmap.yaml -n smartmedicare"
echo "3. Apply secrets: kubectl apply -f kubernetes/secrets.yaml -n smartmedicare"
echo "4. Deploy services: kubectl apply -f kubernetes/ -n smartmedicare"
echo ""
