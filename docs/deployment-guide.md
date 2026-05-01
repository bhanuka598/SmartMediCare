# SmartMediCare Deployment Guide

## Assignment Requirements Met

| Requirement | Implementation |
|-------------|----------------|
| Microservices Architecture | 8 backend services + React frontend |
| Docker | Docker Compose for local |
| Kubernetes | EKS for cloud deployment |
| RESTful APIs | Express.js services with REST endpoints |
| 3 User Roles | Patient, Doctor, Admin with JWT auth |
| Video Consultation | Telemedicine service (Jitsi integration ready) |
| Payment | Payment service (Stripe ready) |
| Notifications | Notification service (SMS/Email ready) |

---

## Option 1: Local Deployment (Docker Compose)

### Prerequisites (Ubuntu)
```bash
# Install Docker
sudo apt update
sudo apt install -y docker.io docker-compose
sudo usermod -aG docker $USER
# Log out and back in

# Install Node.js (for building client)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

### Run Application
```bash
# Clone and navigate to project
git clone <your-repo>
cd SmartMediCare

# Start all services
docker compose up -d --build

# Verify
docker compose ps
docker compose logs gateway

# Access at http://localhost:5173
```

---

## Option 2: Kubernetes on Windows (Minikube)

### Prerequisites
```powershell
# Install Docker Desktop
# Download from https://www.docker.com/get-started and enable WSL 2 / Docker Engine

# Install Chocolatey if not already installed
Set-ExecutionPolicy Bypass -Scope Process -Force;
[System.Net.WebRequest]::DefaultWebProxy.Credentials = [System.Net.CredentialCache]::DefaultCredentials;
iwr https://community.chocolatey.org/install.ps1 -UseBasicParsing | iex

# Install Minikube and kubectl
choco install minikube kubernetes-cli -y

# Start Minikube with Docker driver
minikube start --driver=docker
minikube addons enable ingress
```

### Deploy
```powershell
# Build Docker images
docker compose build

# Load images into Minikube so Kubernetes can use local images
minikube image load smartmedicare-client:prod
minikube image load smartmedicare-gateway:latest
minikube image load smartmedicare-auth-service:latest
minikube image load smartmedicare-patient-service:latest
minikube image load smartmedicare-doctor-service:latest
minikube image load smartmedicare-appointment-service:latest
minikube image load smartmedicare-notification-service:latest
minikube image load smartmedicare-payment-service:latest
minikube image load smartmedicare-telemedicine-service:latest

# Apply Kubernetes manifests
kubectl apply -f kubernetes/00-namespace.yaml
kubectl apply -f kubernetes/01-configmap.yaml
kubectl apply -f kubernetes/02-secrets.yaml
kubectl apply -f kubernetes/03-deployments.yaml
kubectl apply -f kubernetes/04-ingress.yaml

# Check status
kubectl get pods -n smartmedicare
kubectl get svc -n smartmedicare

# Access the gateway API for testing
kubectl port-forward svc/gateway 5000:5000 -n smartmedicare
```
---

## Service Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     React Frontend (Client)                 │
│                    Port: 5173 (dev) / 3000 (prod)           │
└─────────────────────────────┬───────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      API Gateway                             │
│                         Port: 5000                           │
└──────┬──────────────┬──────────────┬──────────────┬────────┘
       │              │              │              │
       ▼              ▼              ▼              ▼
┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐
│   Auth     │ │  Patient   │ │   Doctor   │ │Appointment│
│  Service   │ │  Service   │ │  Service   │ │  Service   │
│  Port:5002 │ │  Port:5005 │ │  Port:5003 │ │  Port:5001 │
└────────────┘ └────────────┘ └────────────┘ └────────────┘
       │              │              │              │
       └──────────────┴──────────────┴──────────────┘
                              │
       ┌──────────────────────┼──────────────────────┐
       ▼                      ▼                      ▼
┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐
│Notification│ │  Payment   │ │Telemedicine│ │  MongoDB   │
│  Service   │ │  Service   │ │  Service   │ │  Database  │
│  Port:5004 │ │  Port:5006 │ │  Port:5007 │ │  Port:27017│
└────────────┘ └────────────┘ └────────────┘ └────────────┘
```

---

## API Endpoints

### Auth Service (Port 5002)
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile

### Patient Service (Port 5005)
- `GET /api/patients` - List patients (admin)
- `GET /api/patients/:id` - Get patient details
- `PUT /api/patients/:id` - Update patient
- `POST /api/patients/reports` - Upload medical report

### Doctor Service (Port 5003)
- `GET /api/doctors` - List doctors
- `GET /api/doctors/:id` - Get doctor details
- `PUT /api/doctors/:id/availability` - Set availability
- `POST /api/doctors/prescriptions` - Create prescription

### Appointment Service (Port 5001)
- `GET /api/appointments` - List appointments
- `POST /api/appointments` - Book appointment
- `PUT /api/appointments/:id` - Update appointment
- `DELETE /api/appointments/:id` - Cancel appointment

### Payment Service (Port 5006)
- `POST /api/payments/create-payment` - Create payment
- `POST /api/payments/webhook` - Payment webhook

### Notification Service (Port 5004)
- `POST /api/notifications/sms` - Send SMS
- `POST /api/notifications/email` - Send Email

### Telemedicine Service (Port 5007)
- `POST /api/telemedicine/create-room` - Create video room
- `GET /api/telemedicine/room/:id` - Get room details

---

---

## Troubleshooting

```powershell
# Check logs
docker compose logs -f gateway
kubectl logs -f deployment/gateway -n smartmedicare

# Restart service
docker compose restart gateway
kubectl rollout restart deployment/gateway -n smartmedicare

# Validate Minikube
minikube status
minikube addons list

# Check network
docker network ls
kubectl get svc -n smartmedicare
kubectl get pods -n smartmedicare
```