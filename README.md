# 🏥 SmartMediCare

**AI-Enabled Smart Healthcare Appointment & Telemedicine Platform (Microservices Architecture)**

---

## 📌 Project Overview

SmartMediCare is a cloud-native healthcare platform that enables patients to book doctor appointments, attend video consultations, upload medical reports, and receive AI-based health suggestions.

The system is built using a **Microservices Architecture**, ensuring scalability, flexibility, and independent deployment of services.

---

## 🎯 Key Features

### 👤 Patient Features

* Register and manage profile
* Search doctors by specialty
* Book, modify, and cancel appointments
* Upload medical reports
* Attend video consultations
* View prescriptions and medical history

### 🩺 Doctor Features

* Manage profile and availability
* Accept/reject appointments
* Conduct telemedicine sessions
* Issue digital prescriptions
* View patient reports

### 🛠️ Admin Features

* Manage users
* Verify doctor registrations
* Monitor system operations
* Manage financial transactions

### 🤖 AI Features (Optional)

* Symptom checker
* Suggest possible conditions
* Recommend doctor specialties

---

## 🏗️ System Architecture

The system follows a **Microservices Architecture**:

* Client (React + Vite)
* API Gateway
* Independent services:

  * Auth Service
  * Patient Service
  * Doctor Service
  * Appointment Service
  * Payment Service
  * Notification Service
  * Telemedicine Service

Each service is containerized using **Docker** and orchestrated using **Kubernetes**.

---

## 🧰 Tech Stack

### Frontend

* React (Vite)
* Tailwind CSS
* Axios

### Backend (Microservices)

* Node.js
* Express.js

### Database

* MongoDB

### Authentication

* JWT (JSON Web Tokens)
* bcrypt (password hashing)

### DevOps

* Docker
* Kubernetes

### Third-Party Integrations

* Video: Jitsi / Twilio / Agora
* Payments: Stripe / PayHere
* Notifications: Email (Nodemailer), SMS APIs

---

## 📁 Project Structure

```
smart-healthcare-platform/
│
├── client/                 # React frontend
├── services/               # Microservices
│   ├── auth-service/
│   ├── patient-service/
│   ├── doctor-service/
│   ├── appointment-service/
│   ├── payment-service/
│   ├── notification-service/
│   └── telemedicine-service/
│
├── gateway/                # API Gateway
├── kubernetes/             # K8s deployment files
├── scripts/                # Setup & automation scripts
├── database/               # Schemas & seed data
├── docs/                   # Diagrams & documentation
│
├── docker-compose.yml
├── README.md
└── .gitignore
```

---

## ⚙️ Installation & Setup

### 1️⃣ Clone Repository

```
git clone https://github.com/your-repo/smart-healthcare-platform.git
cd smart-healthcare-platform
```

---

### 2️⃣ Install Dependencies

#### Client

```
cd client
npm install
```

#### Services

Repeat for each service:

```
cd services/auth-service
npm install
```

---

### 3️⃣ Environment Variables

Create `.env` file in each service:

Example:

```
PORT=5001
MONGO_URI=mongodb://localhost:27017/auth
JWT_SECRET=your_secret_key
```

---

### 4️⃣ Run Project (Development)

#### Start services manually

```
npm run dev
```

#### Or use Docker

```
docker-compose up --build
```

---

### 5️⃣ Kubernetes Deployment

```
kubectl apply -f kubernetes/
```

---

## 🔐 Authentication & Security

* JWT-based authentication
* Role-based authorization (Patient, Doctor, Admin)
* Password hashing using bcrypt
* Protected API routes

---

## 🔄 Core Workflows

### Appointment Booking Flow

1. Patient logs in
2. Searches doctor
3. Books appointment
4. Makes payment
5. Receives confirmation

### Telemedicine Flow

1. Appointment confirmed
2. Video session created
3. Patient & doctor join
4. Consultation happens
5. Prescription issued

---

## 📡 API Example

```
POST /auth/login
POST /appointments
GET  /doctors
POST /payments/create
```

---

## 👨‍👩‍👧‍👦 Team Members

| Name     | Role     | Contribution                        |
| -------- | -------- | ----------------------------------- |
| Member 1 | Frontend | UI & API integration                |
| Member 2 | Backend  | Auth + Patient + Doctor services    |
| Member 3 | Backend  | Appointment + Telemedicine          |
| Member 4 | DevOps   | Payment + Notification + Deployment |

---

## 🎥 Demo Video

📺 YouTube Link: *(Add your demo link here)*

---

## 📄 Deployment Guide

See `readme.txt` for full deployment instructions.

---

## 📊 Future Enhancements

* AI diagnosis improvement
* Mobile app integration
* Real-time chat
* Advanced analytics dashboard

---

## ⚠️ Notes

* This project is developed for academic purposes
* Ensure plagiarism is below 20%

---

## ⭐ Acknowledgements

Inspired by real-world platforms like:

* Channeling.lk
* oDoc
* mHealth

---

## 🚀 License

This project is for educational use only.
