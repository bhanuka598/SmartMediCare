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
ACCOUNT_ID="your-aws-account-id"
REGION="us-east-1"
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

# Step 6: Install AWS Load Balancer Controller
echo ""
echo "[6/8] Installing AWS Load Balancer Controller..."

if ! kubectl get serviceaccount aws-load-balancer-controller -n kube-system &> /dev/null; then
    eksctl create iamserviceaccount \
        --cluster="$CLUSTER_NAME" \
        --namespace=kube-system \
        --name=aws-load-balancer-controller \
        --attach-policy-arn=arn:aws:iam::aws:policy/AWSLoadBalancerControllerIAMPolicy \
        --approve
    
    helm repo add eks https://aws.github.io/eks-charts
    helm install aws-load-balancer-controller eks/aws-load-balancer-controller \
        --namespace kube-system \
        --set clusterName="$CLUSTER_NAME" \
        --set serviceAccount.create=false \
        --set serviceAccount.name=aws-load-balancer-controller
    echo "  Load Balancer Controller installed"
else
    echo "  Load Balancer Controller already installed"
fi

# Step 7: Deploy to Kubernetes
echo ""
echo "[7/8] Deploying to Kubernetes..."

# Update image tags in deployment file
sed -i "s|<ACCOUNT_ID>|$ACCOUNT_ID|g" eks/03-deployments.yaml

# Apply manifests
kubectl apply -f eks/00-namespace.yaml
kubectl apply -f eks/01-configmap.yaml
kubectl apply -f eks/02-secrets.yaml
kubectl apply -f eks/03-deployments.yaml
kubectl apply -f eks/04-ingress.yaml
kubectl apply -f eks/05-autoscaling.yaml

echo "  Deployment complete"

# Step 8: Verify deployment
echo ""
echo "[8/8] Verifying deployment..."

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