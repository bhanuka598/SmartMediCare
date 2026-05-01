#!/bin/bash
# =============================================================================
# SmartMediCare Kubernetes Deployment Script (Ubuntu)
# =============================================================================
# For Minikube or any Kubernetes cluster
# =============================================================================

set -e

NAMESPACE="smartmedicare"

echo "============================================"
echo "SmartMediCare Kubernetes Deployment"
echo "============================================"

# Step 1: Verify prerequisites
echo ""
echo "[1/5] Verifying prerequisites..."

if ! command -v kubectl &> /dev/null; then
    echo "ERROR: kubectl not found. Please install kubectl."
    exit 1
fi

echo "  - kubectl: OK"

# Step 2: Create namespace
echo ""
echo "[2/5] Creating namespace..."
kubectl apply -f kubernetes/00-namespace.yaml
echo "  Namespace created"

# Step 3: Apply ConfigMap and Secrets
echo ""
echo "[3/5] Applying ConfigMap and Secrets..."
kubectl apply -f kubernetes/01-configmap.yaml
kubectl apply -f kubernetes/02-secrets.yaml
echo "  ConfigMap and Secrets applied"

# Step 4: Build and push Docker images (if using remote registry)
echo ""
echo "[4/5] Building Docker images..."

# Build all services
docker build -t smartmedicare/client:latest ./client
docker build -t smartmedicare/gateway:latest ./gateway
docker build -t smartmedicare/auth-service:latest ./services/auth-service
docker build -t smartmedicare/patient-service:latest ./services/patient-service
docker build -t smartmedicare/doctor-service:latest ./services/doctor-service
docker build -t smartmedicare/appointment-service:latest ./services/appointment-service
docker build -t smartmedicare/notification-service:latest ./services/notification-service
docker build -t smartmedicare/payment-service:latest ./services/payment-service
docker build -t smartmedicare/telemedicine-service:latest ./services/telemedicine-service

echo "  Docker images built"

# For Minikube, load images into cluster
if command -v minikube &> /dev/null; then
    echo "  Loading images into Minikube..."
    minikube image load smartmedicare/client:latest
    minikube image load smartmedicare/gateway:latest
    minikube image load smartmedicare/auth-service:latest
    minikube image load smartmedicare/patient-service:latest
    minikube image load smartmedicare/doctor-service:latest
    minikube image load smartmedicare/appointment-service:latest
    minikube image load smartmedicare/notification-service:latest
    minikube image load smartmedicare/payment-service:latest
    minikube image load smartmedicare/telemedicine-service:latest
fi

# Step 5: Deploy to Kubernetes
echo ""
echo "[5/5] Deploying to Kubernetes..."
kubectl apply -f kubernetes/03-deployments.yaml
kubectl apply -f kubernetes/04-ingress.yaml
echo "  Deployment complete"

# Verify deployment
echo ""
echo "============================================"
echo "Verifying deployment..."
echo "============================================"
echo ""
echo "Pods:"
kubectl get pods -n "$NAMESPACE"
echo ""
echo "Services:"
kubectl get svc -n "$NAMESPACE"
echo ""
echo "Ingress:"
kubectl get ingress -n "$NAMESPACE"

echo ""
echo "============================================"
echo "Deployment Complete!"
echo "============================================"
echo ""
echo "Get ingress IP: kubectl get ingress -n $NAMESPACE -o jsonpath='{.status.loadBalancer.ingress[0].ip}'"
echo "Port forward: kubectl port-forward svc/gateway 5000:5000 -n $NAMESPACE"
echo "View logs: kubectl logs -f deployment/gateway -n $NAMESPACE"
echo ""