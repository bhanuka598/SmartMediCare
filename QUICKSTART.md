# SmartMediCare Quick Start - Docker & Kubernetes

## 🚀 Quick Start (5 minutes)

### 1. Prerequisites
- [ ] Docker Desktop installed and running
- [ ] Kubernetes enabled in Docker Desktop (Settings → Kubernetes → Enable)
- [ ] kubectl installed (test: `kubectl version --client`)

### 2. Build Docker Images (2 min)
```bash
# Windows
.\scripts\build-docker-images.bat

# Mac/Linux
chmod +x scripts/build-docker-images.sh
./scripts/build-docker-images.sh
```

### 3. Deploy to Kubernetes (2 min)
```bash
# Windows
.\scripts\deploy-kubernetes.bat

# Mac/Linux
chmod +x scripts/deploy-kubernetes.sh
./scripts/deploy-kubernetes.sh
```

### 4. Access Your App
```bash
# Terminal 1
kubectl port-forward svc/client 5173:5173 -n smartmedicare

# Terminal 2
kubectl port-forward svc/gateway 5000:5000 -n smartmedicare
```

- **Client:** http://localhost:5173
- **Gateway (API):** http://localhost:5000

---

## 📋 What Was Set Up

### Docker Images Created
- `smartmedicare/client` - React frontend
- `smartmedicare/gateway` - API gateway
- `smartmedicare/auth-service` - Authentication
- `smartmedicare/patient-service` - Patient management
- `smartmedicare/doctor-service` - Doctor management
- `smartmedicare/appointment-service` - Appointments
- `smartmedicare/notification-service` - Notifications
- `smartmedicare/payment-service` - Payments
- `smartmedicare/telemedicine-service` - Telemedicine

### Kubernetes Configuration
- **Namespace:** `smartmedicare`
- **Deployments:** One for each service (2 replicas each)
- **Services:** ClusterIP for inter-service communication + NodePort for external access
- **ConfigMaps:** Service URLs and configuration
- **Secrets:** MongoDB URI, JWT secrets, credentials
- **Ingress:** Optional routing configuration

---

## 🔧 Common Commands

### View Status
```bash
# Check all deployments
kubectl get deployments -n smartmedicare

# Check all pods
kubectl get pods -n smartmedicare

# Check services
kubectl get services -n smartmedicare
```

### View Logs
```bash
# Follow gateway logs
kubectl logs -f deployment/gateway -n smartmedicare

# Follow auth service logs
kubectl logs -f deployment/auth-service -n smartmedicare

# Get logs from specific pod
kubectl logs <pod-name> -n smartmedicare
```

### Debug
```bash
# Get inside a pod
kubectl exec -it <pod-name> -n smartmedicare -- /bin/sh

# Describe pod (for troubleshooting)
kubectl describe pod <pod-name> -n smartmedicare

# Check recent events
kubectl get events -n smartmedicare
```

### Update Configuration
```bash
# Edit ConfigMap
kubectl edit configmap smartmedicare-config -n smartmedicare

# Edit Secrets
kubectl edit secret smartmedicare-secrets -n smartmedicare

# Or update YAML files and apply
kubectl apply -f kubernetes/configmap.yaml -n smartmedicare
kubectl apply -f kubernetes/secrets.yaml -n smartmedicare
```

---

## 🐛 Troubleshooting

### Pod not starting?
```bash
# Check pod status
kubectl describe pod <pod-name> -n smartmedicare

# View logs
kubectl logs <pod-name> -n smartmedicare
```

### Can't reach services?
```bash
# From inside a pod, test connection
kubectl exec -it <pod-name> -n smartmedicare -- curl http://gateway:5000
```

### Port forwarding not working?
```bash
# Make sure pod is running
kubectl get pods -n smartmedicare

# Try different local port
kubectl port-forward svc/client 8000:3000 -n smartmedicare

# Check if ports are in use
# Windows: netstat -ano | findstr :3000
# Mac/Linux: lsof -i :3000
```

### Need to rebuild images?
```bash
# Rebuild specific service
docker build -t smartmedicare/gateway:latest ./gateway

# Restart deployment
kubectl rollout restart deployment/gateway -n smartmedicare
```

---

## 🗑️ Cleanup

### Delete everything (including namespace)
```bash
kubectl delete namespace smartmedicare
```

### Delete and cleanup images
```bash
docker rmi $(docker images -q smartmedicare/*)
```

---

## 📚 Full Documentation

For detailed setup, troubleshooting, and advanced configuration, see:
- [DOCKER_KUBERNETES_COMPLETE_GUIDE.md](./DOCKER_KUBERNETES_COMPLETE_GUIDE.md)
- [KUBERNETES_DEPLOYMENT_GUIDE.md](./KUBERNETES_DEPLOYMENT_GUIDE.md)

---

## 📝 Important Notes

1. **Environment Variables**
   - Update `kubernetes/secrets.yaml` with your MongoDB connection string
   - Change `JWT_SECRET` to a secure value for production

2. **Database**
   - Ensure MongoDB is accessible from the Kubernetes cluster
   - If using MongoDB Atlas, whitelist your IP or use private networking

3. **Image Registry**
   - Currently configured to use local Docker images (`imagePullPolicy: Never`)
   - For shared/production deployment, push to a registry and update image names

4. **Resource Limits**
   - Each service has memory limit of 512Mi and CPU limit of 500m
   - Adjust in deployment YAML files if needed

---

## ✅ Verification Checklist

After deployment:
- [ ] All pods are running (`kubectl get pods -n smartmedicare`)
- [ ] Services are accessible via port forwarding
- [ ] Client loads at http://localhost:3000
- [ ] Gateway API responds at http://localhost:5000
- [ ] Services can communicate with each other (check logs)
- [ ] No error messages in pod logs

---

**Need help?** Check the troubleshooting section of [DOCKER_KUBERNETES_COMPLETE_GUIDE.md](./DOCKER_KUBERNETES_COMPLETE_GUIDE.md) or run:
```bash
kubectl describe pod <pod-name> -n smartmedicare
kubectl logs <pod-name> -n smartmedicare
```
