# SmartMediCare Deployment Guide

## Assignment Requirements Met

| Requirement | Implementation |
|-------------|----------------|
| Microservices Architecture | 8 backend services + React frontend |
| Docker | Docker Compose for local, ECR for cloud |
| Kubernetes | EKS for cloud deployment |
| RESTful APIs | Express.js services with REST endpoints |
| 3 User Roles | Patient, Doctor, Admin with JWT auth |
| Video Consultation | Telemedicine service (Jitsi/Ago

ra integration ready) |
| Payment | Payment service (Stripe/PayHere ready) |
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

## Option 2: Kubernetes on Ubuntu (Minikube)

### Prerequisites
```bash
# Install Minikube
curl -LO https://storage.googleapis.com/minikube/releases/latest/minikube-linux-amd64
sudo install minikube-linux-amd64 /usr/local/bin/minikube

# Install kubectl
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
chmod +x kubectl
sudo mv kubectl /usr/local/bin/

# Start Minikube
minikube start --driver=docker
minikube addons enable ingress
```

### Deploy
```bash
# Build Docker images
docker compose build

# Load images into Minikube so Kubernetes can use local images
minikube image load smartmedicare-client:latest
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

## Option 3: AWS EKS Deployment

### Prerequisites
```bash
# Install unzip first (required for AWS CLI)
sudo apt update
sudo apt install -y unzip

# Install AWS CLI
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip -q awscliv2.zip
sudo bash ./aws/install

# Verify AWS CLI installation
aws --version

# Install eksctl
curl --silent --location "https://github.com/weaveworks/eksctl/releases/latest/download/eksctl_$(uname -s)_amd64.tar.gz" | tar xz -C /tmp
sudo mv /tmp/eksctl /usr/local/bin/

# Install kubectl
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
chmod +x kubectl
sudo mv kubectl /usr/local/bin/

# Configure AWS
aws configure
# Enter your AWS Access Key ID, Secret Access Key, Region
```

### Deploy
```bash
# Make script executable
chmod +x scripts/deploy-eks.sh

# Update ACCOUNT_ID in script
nano scripts/deploy-eks.sh

# Run deployment
./scripts/deeks.sh

# Get ALB URL
kubectl get ingress -n smartmedicare -o jsonpath='{.status.loadBalancer.ingress[0].hostname}'
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

## Environment Variables

Create `.env` file:
```env
# MongoDB
MONGODB_URI=mongodb://mongo:27017/smartmedicare

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRY=24h

# Services
PORT=5000

# Stripe (Sandbox)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...

# SMS (Twilio)
TWILIO_ACCOUNT_SID=your_sid
TWILIO_AUTH_TOKEN=your_token

# Email
SMTP_HOST=smtp.gmail.com
SMTP_USER=your-email
SMTP_PASS=your-app-password
```

---

## Troubleshooting

```bash
# Check logs
docker compose logs -f gateway
kubectl logs -f deployment/gateway -n smartmedicare

# Restart service
docker compose restart gateway
kubectl rollout restart deployment/gateway -n smartmedicare

# Check network
docker network ls
kubectl get svc -n smartmedicare
```