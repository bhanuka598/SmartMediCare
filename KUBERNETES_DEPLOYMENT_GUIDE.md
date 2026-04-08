# Kubernetes Deployment Complete Guide

## Prerequisites

Before deploying to Kubernetes, ensure you have:

1. **Docker installed** - https://www.docker.com/products/docker-desktop
2. **Kubernetes enabled** on Docker Desktop:
   - Go to Docker Desktop → Settings → Kubernetes → Enable Kubernetes
   - Wait for it to fully initialize (check status in the system tray)
3. **kubectl installed** - Comes with Docker Desktop, or install separately
4. **Optional: Minikube** - If you prefer using Minikube instead of Docker Desktop K8s

## Quick Start

### 1. Build Docker Images

```bash
# Build all services
docker build -t smartmedicare/client:latest ./client
docker build -t smartmedicare/gateway:latest ./gateway
docker build -t smartmedicare/auth-service:latest ./services/auth-service
docker build -t smartmedicare/patient-service:latest ./services/patient-service
docker build -t smartmedicare/doctor-service:latest ./services/doctor-service
docker build -t smartmedicare/appointment-service:latest ./services/appointment-service
docker build -t smartmedicare/notification-service:latest ./services/notification-service
docker build -t smartmedicare/payment-service:latest ./services/payment-service
```

Or use the provided build script:
```bash
./scripts/build-docker-images.sh
```

### 2. Create Kubernetes Namespace

```bash
kubectl create namespace smartmedicare
```

### 3. Set Up Configuration

Create ConfigMaps and Secrets for your services:

```bash
# Apply ConfigMap for service URLs
kubectl apply -f kubernetes/configmap.yaml -n smartmedicare

# Apply Secrets (update with your actual credentials)
kubectl apply -f kubernetes/secrets.yaml -n smartmedicare
```

### 4. Deploy Services

```bash
# Deploy all services
kubectl apply -f kubernetes/ -n smartmedicare

# Verify deployments
kubectl get deployments -n smartmedicare
kubectl get pods -n smartmedicare
kubectl get services -n smartmedicare
```

### 5. Access Your Application

#### Using Port Forwarding (simple method):
```bash
# Forward client port
kubectl port-forward svc/client 5173:5173 -n smartmedicare

# In another terminal, forward gateway
kubectl port-forward svc/gateway 5000:5000 -n smartmedicare
```

Then access:
- **Client:** http://localhost:5173
- **Gateway:** http://localhost:5000

#### Using Ingress (if exposed):
```bash
# Get the ingress IP
kubectl get ingress -n smartmedicare

# Access via the ingress host configured in ingress.yaml
```

## Troubleshooting

### Check Logs
```bash
# Check specific pod logs
kubectl logs <pod-name> -n smartmedicare

# Follow logs
kubectl logs -f <pod-name> -n smartmedicare
```

### Debug Services
```bash
# Describe pod for events
kubectl describe pod <pod-name> -n smartmedicare

# Execute command in pod
kubectl exec -it <pod-name> -n smartmedicare -- /bin/bash
```

### Common Issues

1. **Image Pull Errors**: Ensure Docker images are built and tagged correctly
2. **Connection Refused**: Check if services are fully started and endpoints are correct
3. **Pending Pods**: Check resource availability (`kubectl describe pod`)
4. **Crash Loop**: Review pod logs for errors in application startup

## Environment Variables by Service

**Gateway:**
- PORT=5000
- APPOINTMENT_SERVICE_URL=http://appointment-service:5001
- AUTH_SERVICE_URL=http://auth-service:5002
- DOCTOR_SERVICE_URL=http://doctor-service:5003
- NOTIFICATION_SERVICE_URL=http://notification-service:5004
- PATIENT_SERVICE_URL=http://patient-service:5005
- PAYMENT_SERVICE_URL=http://payment-service:5006
- TELEMEDICINE_SERVICE_URL=http://telemedicine-service:5007

**Client:**
- VITE_API_BASE_URL=http://gateway:5000

**Services:**
- PORT=<service-specific-port>
- MONGO_URI=<mongodb-connection-string>
- JWT_SECRET=<your-jwt-secret>

## Cleanup

To remove all deployments:
```bash
kubectl delete namespace smartmedicare
```

This will delete all resources in the namespace.
