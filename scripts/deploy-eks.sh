#!/bin/bash
# =============================================================================
# SmartMediCare EKS Deployment Script (Linux/Mac)
# =============================================================================
# Prerequisites:
# - AWS CLI installed and configured
# - kubectl installed
# - eksctl installed
# - Docker installed
# =============================================================================

set -e

# Configuration - UPDATE THESE VALUES
ACCOUNT_ID="325087565177"
REGION="ap-south-1"
CLUSTER_NAME="smartmedicare"
NAMESPACE="smartmedicare"

echo "============================================"
echo "SmartMediCare EKS Deployment"
echo "============================================"

# Step 1: Verify prerequisites
echo ""
echo "[1/8] Verifying prerequisites..."

if ! command -v aws &> /dev/null; then
    echo "ERROR: AWS CLI not found. Please install AWS CLI."
    exit 1
fi

if ! command -v kubectl &> /dev/null; then
    echo "ERROR: kubectl not found. Please install kubectl."
    exit 1
fi

if ! command -v eksctl &> /dev/null; then
    echo "ERROR: eksctl not found. Please install eksctl."
    exit 1
fi

echo "  - AWS CLI: OK"
echo "  - kubectl: OK"
echo "  - eksctl: OK"

# Step 2: Create EKS Cluster (if not exists)
echo ""
echo "[2/8] Checking EKS cluster..."

if ! eksctl get cluster "$CLUSTER_NAME" --region "$REGION" &> /dev/null; then
    echo "  Creating EKS cluster $CLUSTER_NAME..."
    eksctl create cluster \
      --name "$CLUSTER_NAME" \
      --region "$REGION" \
      --nodegroup-name managed-nodes \
      --node-type t3.micro \
      --nodes 1 \
      --nodes-min 1 \
      --nodes-max 1 \
      --managed
    
    echo "  Cluster created successfully"
else
    echo "  Cluster already exists"
fi

# Step 3: Update kubeconfig
echo ""
echo "[3/8] Updating kubeconfig..."
aws eks update-kubeconfig --name "$CLUSTER_NAME" --region "$REGION"
echo "  Kubeconfig updated"

# Step 4: Create ECR repositories
echo ""
echo "[4/8] Creating ECR repositories..."

SERVICES=("client" "gateway" "auth-service" "patient-service" "doctor-service" "appointment-service" "notification-service" "payment-service" "telemedicine-service")

for svc in "${SERVICES[@]}"; do
    if ! aws ecr describe-repositories --repository-name "smartmedicare/$svc" --region "$REGION" &> /dev/null; then
        echo "  Creating repository: smartmedicare/$svc"
        aws ecr create-repository --repository-name "smartmedicare/$svc" --region "$REGION" &> /dev/null
    else
        echo "  Repository exists: smartmedicare/$svc"
    fi
done

# Step 5: Build and push Docker images
echo ""
echo "[5/8] Building and pushing Docker images..."

# Login to ECR
aws ecr get-login-password --region "$REGION" | docker login --username AWS --password-stdin "$ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com"

# Build and push each service
for svc in "${SERVICES[@]}"; do
    echo "  Building smartmedicare/$svc..."
    
    case "$svc" in
        client)
            docker build -t smartmedicare/"$svc":latest ./client
            ;;
        gateway)
            docker build -t smartmedicare/"$svc":latest ./gateway
            ;;
        *)
            docker build -t smartmedicare/"$svc":latest ./services/"$svc"
            ;;
    esac
    
    docker tag smartmedicare/"$svc":latest "$ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/smartmedicare/$svc:latest"
    docker push "$ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/smartmedicare/$svc:latest"
    echo "  Pushed smartmedicare/$svc"
done

# Step 6: Deploy to Kubernetes (Skipping ALB Controller - using NodePort)
echo ""
echo "[6/8] Deploying to Kubernetes..."

# Update image tags in deployment file
sed -i "s|<ACCOUNT_ID>|$ACCOUNT_ID|g" eks/03-deployments.yaml

# Apply manifests
kubectl apply -f eks/00-namespace.yaml
kubectl apply -f eks/01-configmap.yaml
kubectl apply -f eks/02-secrets.yaml
kubectl apply -f eks/03-deployments.yaml

echo "  Deployment complete"

# Step 7: Verify deployment
echo ""
echo "[7/7] Verifying deployment..."

echo ""
echo "Checking pods..."
kubectl get pods -n "$NAMESPACE"

echo ""
echo "Checking services..."
kubectl get svc -n "$NAMESPACE"

echo ""
echo "Checking ingress..."
kubectl get ingress -n "$NAMESPACE"

echo ""
echo "============================================"
echo "Deployment Complete!"
echo "============================================"
echo ""
echo "Get ALB DNS: kubectl get ingress -n $NAMESPACE smartmedicare-ingress -o jsonpath='{.status.loadBalancer.ingress[0].hostname}'"
echo "View logs: kubectl logs -f deployment/gateway -n $NAMESPACE"
echo "Check status: kubectl get all -n $NAMESPACE"
echo ""