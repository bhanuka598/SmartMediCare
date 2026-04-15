# Auth Service

Authentication and authorization microservice for SmartMediCare.

## Features

- User registration (Patient, Doctor, Admin)
- JWT-based authentication
- Password hashing with bcrypt
- Token verification for API Gateway
- Role-based access control

## API Endpoints

### Public Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | User login |
| POST | `/api/auth/verify-token` | Verify JWT token |

### Protected Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/auth/me` | Get current user |
| POST | `/api/auth/change-password` | Change password |

| GET | `/health` | Health check |

## Environment Variables

```
PORT=5002
MONGO_URI=
JWT_SECRET=your_secret_key
```

## Usage

```bash
# Development
npm run dev

# Production
npm start
```

## Request Examples

### Register
```json
POST /api/auth/register
{
  "email": "user@example.com",
  "password": "password123",
  "role": "patient"
}
```

### Login
```json
POST /api/auth/login
{
  "email": "user@example.com",
  "password": "password123"
}
```
