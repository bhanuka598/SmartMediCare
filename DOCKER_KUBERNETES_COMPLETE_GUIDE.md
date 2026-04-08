# SmartMediCare Docker & Kubernetes Setup Guide

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Docker Setup](#docker-setup)
3. [Building Docker Images](#building-docker-images)
4. [Kubernetes Setup](#kubernetes-setup)
5. [Deployment](#deployment)
6. [Accessing Your Application](#accessing-your-application)
7. [Troubleshooting](#troubleshooting)
8. [Cleanup](#cleanup)

---

## Prerequisites

### Windows
1. **Docker Desktop for Windows**
   - Download: https://www.docker.com/products/docker-desktop
   - Install with default options
   - Restart your computer after installation

2. **Enable Kubernetes in Docker Desktop**
   - Open Docker Desktop
   - Go to Settings → Kubernetes
   - Check "Enable Kubernetes"
   - Wait 2-5 minutes for initialization (check bottom left status)

3. **kubectl** (usually included with Docker Desktop)
   - Verify: `kubectl version --client`

### Mac
1. **Docker Desktop for Mac**
   - Download: https://www.docker.com/products/docker-desktop
   - Install with Apple Silicon or Intel version as appropriate
   
2. **Enable Kubernetes**
   - Open Docker Desktop
   - Preferences → Kubernetes
   - Check "Enable Kubernetes"
   - Wait for initialization

3. **kubectl**
   - Usually included, verify: `kubectl version --client`

### Linux
1. **Docker Engine**
   ```bash
   curl -fsSL https://get.docker.com -o get-docker.sh
   sudo sh get-docker.sh
   ```

2. **kubectl**
   ```bash
   curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
   sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl
   ```

3. **Minikube** (Local Kubernetes)
   ```bash
   curl -LO https://github.com/kubernetes/minikube/releases/latest/download/minikube-linux-amd64
   sudo install minikube-linux-amd64 /usr/local/bin/minikube
   minikube start
   ```

---

## Docker Setup

### Verify Docker Installation
```bash
docker --version
docker run hello-world
```

If you see a welcome message, Docker is properly installed.

---

## Building Docker Images

### Option 1: Using Build Scripts (Recommended)

#### Windows (PowerShell)
```powershell
# Navigate to project directory
cd "e:\SLIIT\Assignments - Practical\Year 3\Semester 1\DS\Projects\SmartMediCare"

# Run build script
.\scripts\build-docker-images.bat
```

#### Windows (Command Prompt)
```cmd
cd "e:\SLIIT\Assignments - Practical\Year 3\Semester 1\DS\Projects\SmartMediCare"
scripts\build-docker-images.bat
```

#### Mac/Linux (Bash)
```bash
cd ~/path/to/SmartMediCare
chmod +x scripts/build-docker-images.sh
./scripts/build-docker-images.sh
```

### Option 2: Manual Build Commands

```bash
# From project root

# Build each service
docker build -t smartmedicare/client:latest ./client
docker build -t smartmedicare/gateway:latest ./gateway
docker build -t smartmedicare/auth-service:latest ./services/auth-service
docker build -t smartmedicare/patient-service:latest ./services/patient-service
docker build -t smartmedicare/doctor-service:latest ./services/doctor-service
docker build -t smartmedicare/appointment-service:latest ./services/appointment-service
docker build -t smartmedicare/notification-service:latest ./services/notification-service
docker build -t smartmedicare/payment-service:latest ./services/payment-service
docker build -t smartmedicare/telemedicine-service:latest ./services/telemedicine-service
```

### Verify Images Built
```bash
docker images | grep smartmedicare
```

---

## Kubernetes Setup

### Verify Kubernetes is Running

```bash
# Check cluster info
kubectl cluster-info

# Check nodes
kubectl get nodes

# Check system pods
kubectl get pods -n kube-system
```

All commands should return information without errors.

---

## Deployment

### Step 1: Create Kubernetes Namespace
```bash
kubectl create namespace smartmedicare
```

### Step 2: Configure Environment Variables

Update `kubernetes/secrets.yaml` with your actual values:

```yaml
MONGO_URI: "mongodb://mongodb:27017/smartmedicare"  # Or your MongoDB URL
JWT_SECRET: "your-secure-secret-key"
DB_USERNAME: "admin"
DB_PASSWORD: "secure-password"
```

If using MongoDB Atlas, update MONGO_URI:
```yaml
MONGO_URI: "mongodb+srv://username:password@cluster.mongodb.net/dbname"
```

### Step 3: Apply Configuration

```bash
# Apply ConfigMaps
kubectl apply -f kubernetes/configmap.yaml -n smartmedicare

# Apply Secrets
kubectl apply -f kubernetes/secrets.yaml -n smartmedicare
```

### Step 4: Deploy Services

#### Using Deploy Script (Windows)
```cmd
scripts\deploy-kubernetes.bat
```

#### Using Deploy Script (Mac/Linux)
```bash
chmod +x scripts/deploy-kubernetes.sh
./scripts/deploy-kubernetes.sh
```

#### Manual Deployment
```bash
# Deploy all services
kubectl apply -f kubernetes/ -n smartmedicare

# Verify deployments
kubectl get deployments -n smartmedicare
kubectl get pods -n smartmedicare
kubectl get services -n smartmedicare
```

---

## Accessing Your Application

### Method 1: Port Forwarding (Recommended for Development)

#### In Terminal 1 - Forward Client
```bash
kubectl port-forward svc/client 5173:5173 -n smartmedicare
```

#### In Terminal 2 - Forward Gateway
```bash
kubectl port-forward svc/gateway 5000:5000 -n smartmedicare
```

Then access:
- **Client (Frontend):** http://localhost:5173
- **Gateway (API):** http://localhost:5000

### Method 2: NodePort (Alternative)

The NodePort services are already configured:
- **Client:** http://localhost:30001 (forwards to 5173)
- **Gateway:** http://localhost:30000 (forwards to 5000)

### Method 3: Ingress (Requires Ingress Controller)

If you have an Ingress controller installed (e.g., nginx-ingress):

1. Add to your `/etc/hosts` (Mac/Linux) or `C:\Windows\System32\drivers\etc\hosts` (Windows):
   ```
   127.0.0.1 smartmedicare.local
   127.0.0.1 gateway.smartmedicare.local
   127.0.0.1 auth.smartmedicare.local
   127.0.0.1 patient.smartmedicare.local
   127.0.0.1 doctor.smartmedicare.local
   127.0.0.1 appointment.smartmedicare.local
   127.0.0.1 notification.smartmedicare.local
   127.0.0.1 payment.smartmedicare.local
   ```

2. Then access: http://smartmedicare.local

---

## Troubleshooting

### Check Deployment Status
```bash
# Check all deployments
kubectl get deployments -n smartmedicare

# Check all pods (with more details)
kubectl get pods -n smartmedicare -o wide

# Check services
kubectl get services -n smartmedicare

# Check events
kubectl get events -n smartmedicare
```

### View Pod Logs
```bash
# View logs for a specific service
kubectl logs -f deployment/gateway -n smartmedicare

# View logs from multiple replicas
kubectl logs -f deployment/auth-service -n smartmedicare --all-containers=true

# Previous logs (if pod restarted)
kubectl logs <pod-name> -n smartmedicare --previous
```

### Debug a Pod
```bash
# Get inside a pod
kubectl exec -it <pod-name> -n smartmedicare -- /bin/sh

# From inside the pod, test connectivity to services
wget -O - http://gateway:5000/health
curl http://auth-service:5002/health
```

### Common Issues

#### 1. **Pod Status: ImagePullBackOff**
```
Issue: Docker image not found
Solution:
- Rebuild the image: docker build -t smartmedicare/service-name:latest .
- Verify image exists: docker images | grep smartmedicare
- Check imagePullPolicy in YAML (should be "Never" for local development)
```

#### 2. **Pod Status: Pending**
```
Issue: Insufficient resources
Solution:
- Check resource availability: kubectl describe node
- Check pod events: kubectl describe pod <pod-name> -n smartmedicare
- Adjust resource requests in deployment YAML if needed
```

#### 3. **Pod Status: CrashLoopBackOff**
```
Issue: Application error
Solution:
- View logs: kubectl logs <pod-name> -n smartmedicare
- Check application configuration in ConfigMap/Secrets
- Verify environment variables are set correctly
```

#### 4. **Services Can't Reach Each Other**
```
Issue: Inter-service communication failing
Solution:
- Verify service names in environment variables match Kubernetes service names
- Test from pod: kubectl exec -it <pod-name> -n smartmedicare -- wget http://gateway:5000
- Check ConfigMap URL configuration
```

#### 5. **Port Forwarding Not Working**
```
Issue: Cannot access http://localhost:3000
Solution:
- Ensure port forwarding command is running
- Check if ports are already in use: 
  (Windows) netstat -ano | findstr :3000
  (Mac/Linux) lsof -i :3000
- Change local port: kubectl port-forward svc/client 8000:3000 -n smartmedicare
```

### View Configuration
```bash
# View ConfigMap
kubectl get configmap -n smartmedicare
kubectl describe configmap smartmedicare-config -n smartmedicare

# View Secrets (values won't be shown)
kubectl get secrets -n smartmedicare
kubectl describe secret smartmedicare-secrets -n smartmedicare
```

---

## Performance & Monitoring

### Check Resource Usage
```bash
# Pod resource usage
kubectl top pods -n smartmedicare

# Node resource usage
kubectl top nodes
```

### View Pod Details
```bash
# Detailed pod information
kubectl describe pod <pod-name> -n smartmedicare

# Watch pod status
kubectl get pods -n smartmedicare -w
```

---

## Cleanup

### Stop All Services (Keep Namespace)
```bash
kubectl delete all --all -n smartmedicare
```

### Delete Everything (Including Namespace)
```bash
kubectl delete namespace smartmedicare
```

### Remove Docker Images
```bash
# Remove all smartmedicare images
docker rmi $(docker images -q smartmedicare/*)

# Or individually
docker rmi smartmedicare/client:latest
docker rmi smartmedicare/gateway:latest
# ... etc
```

---

## Next Steps

1. **Update MongoDB Connection**
   - Edit `kubernetes/secrets.yaml`
   - Add your MongoDB connection string
   - Re-apply: `kubectl apply -f kubernetes/secrets.yaml -n smartmedicare`

2. **Configure Additional Services**
   - Add any other required services (databases, caches, etc.)
   - Create corresponding Kubernetes manifests

3. **Set Up CI/CD**
   - Configure automatic image builds when code changes
   - Automate deployment pipeline

4. **Monitor & Logging**
   - Consider adding ELK Stack or similar for log aggregation
   - Set up Prometheus/Grafana for monitoring

5. **Production Deployment**
   - Use a container registry (Docker Hub, Azure ACR, etc.)
   - Implement proper RBAC policies
   - Set up resource quotas and limits
   - Configure persistent volumes for databases

---

## Additional Resources

- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Docker Documentation](https://docs.docker.com/)
- [kubectl Cheat Sheet](https://kubernetes.io/docs/reference/kubectl/cheatsheet/)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
