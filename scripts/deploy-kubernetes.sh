#!/bin/bash

# SmartMediCare Kubernetes Deployment Script
# Deploys all services to Kubernetes

set -e

NAMESPACE="smartmedicare"
KUBERNETES_DIR="kubernetes"

# Color codes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "================================"
echo "SmartMediCare Kubernetes Deploy"
echo "================================"
echo ""

# Check if kubectl is installed
if ! command -v kubectl &> /dev/null; then
    echo -e "${YELLOW}kubectl not found. Please install kubectl.${NC}"
    exit 1
fi

# Check kubectl connection
echo -e "${BLUE}Checking Kubernetes connection...${NC}"
if ! kubectl cluster-info &> /dev/null; then
    echo -e "${YELLOW}Cannot connect to Kubernetes cluster. Please ensure cluster is running.${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Connected to Kubernetes cluster${NC}"
echo ""

# Create namespace
echo -e "${BLUE}Creating namespace: $NAMESPACE${NC}"
kubectl create namespace $NAMESPACE --dry-run=client -o yaml | kubectl apply -f -
echo -e "${GREEN}✓ Namespace ready${NC}"
echo ""

# Apply ConfigMaps
echo -e "${BLUE}Applying ConfigMaps...${NC}"
kubectl apply -f $KUBERNETES_DIR/configmap.yaml -n $NAMESPACE
echo -e "${GREEN}✓ ConfigMaps applied${NC}"
echo ""

# Apply Secrets
echo -e "${BLUE}Applying Secrets...${NC}"
kubectl apply -f $KUBERNETES_DIR/secrets.yaml -n $NAMESPACE
echo -e "${GREEN}✓ Secrets applied${NC}"
echo ""

# Apply Deployments
echo -e "${BLUE}Deploying services...${NC}"
kubectl apply -f $KUBERNETES_DIR/client-deployment.yaml -n $NAMESPACE
kubectl apply -f $KUBERNETES_DIR/gateway-deployment.yaml -n $NAMESPACE
kubectl apply -f $KUBERNETES_DIR/auth-deployment.yaml -n $NAMESPACE
kubectl apply -f $KUBERNETES_DIR/patient-deployment.yaml -n $NAMESPACE
kubectl apply -f $KUBERNETES_DIR/doctor-deployment.yaml -n $NAMESPACE
kubectl apply -f $KUBERNETES_DIR/appointment-deployment.yaml -n $NAMESPACE
kubectl apply -f $KUBERNETES_DIR/notification-deployment.yaml -n $NAMESPACE
kubectl apply -f $KUBERNETES_DIR/payment-deployment.yaml -n $NAMESPACE
kubectl apply -f $KUBERNETES_DIR/telemedicine-deployment.yaml -n $NAMESPACE
echo -e "${GREEN}✓ All deployments applied${NC}"
echo ""

# Apply Ingress
echo -e "${BLUE}Applying Ingress...${NC}"
kubectl apply -f $KUBERNETES_DIR/ingress.yaml -n $NAMESPACE
echo -e "${GREEN}✓ Ingress applied${NC}"
echo ""

# Wait for deployments
echo -e "${BLUE}Waiting for deployments to be ready...${NC}"
kubectl rollout status deployment/client -n $NAMESPACE --timeout=2m || true
kubectl rollout status deployment/gateway -n $NAMESPACE --timeout=2m || true
echo ""

# Show status
echo "================================"
echo -e "${GREEN}Deployment complete!${NC}"
echo "================================"
echo ""
echo "Status:"
echo ""
kubectl get deployments -n $NAMESPACE
echo ""
kubectl get services -n $NAMESPACE
echo ""
echo "To access services:"
echo "1. Port forward client: kubectl port-forward svc/client 3000:3000 -n $NAMESPACE"
echo "2. Port forward gateway: kubectl port-forward svc/gateway 5000:5000 -n $NAMESPACE"
echo ""
echo "Or use NodePort:"
echo "- Client: http://localhost:30001"
echo "- Gateway: http://localhost:30000"
echo ""
