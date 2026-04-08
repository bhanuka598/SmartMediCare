@echo off
REM SmartMediCare Docker Build Script for Windows
REM Builds Docker images for all services

setlocal enabledelayedexpansion

echo.
echo ================================
echo Building SmartMediCare Images
echo ================================
echo.

REM Get the script directory
for %%I in ("%~dp0..") do set "PROJECT_DIR=%%~fI"
cd /d "%PROJECT_DIR%"

if errorlevel 1 (
    echo Error: Could not change to project directory
    exit /b 1
)

echo Building client...
docker build -t smartmedicare/client:latest -f client/Dockerfile client/
if errorlevel 1 (
    echo Error building client image
    exit /b 1
)
echo [OK] Client built successfully
echo.

echo Building gateway...
docker build -t smartmedicare/gateway:latest -f gateway/Dockerfile gateway/
if errorlevel 1 (
    echo Error building gateway image
    exit /b 1
)
echo [OK] Gateway built successfully
echo.

echo Building auth-service...
docker build -t smartmedicare/auth-service:latest -f services/auth-service/Dockerfile services/auth-service/
if errorlevel 1 (
    echo Error building auth-service image
    exit /b 1
)
echo [OK] Auth service built successfully
echo.

echo Building patient-service...
docker build -t smartmedicare/patient-service:latest -f services/patient-service/Dockerfile services/patient-service/
if errorlevel 1 (
    echo Error building patient-service image
    exit /b 1
)
echo [OK] Patient service built successfully
echo.

echo Building doctor-service...
docker build -t smartmedicare/doctor-service:latest -f services/doctor-service/Dockerfile services/doctor-service/
if errorlevel 1 (
    echo Error building doctor-service image
    exit /b 1
)
echo [OK] Doctor service built successfully
echo.

echo Building appointment-service...
docker build -t smartmedicare/appointment-service:latest -f services/appointment-service/Dockerfile services/appointment-service/
if errorlevel 1 (
    echo Error building appointment-service image
    exit /b 1
)
echo [OK] Appointment service built successfully
echo.

echo Building notification-service...
docker build -t smartmedicare/notification-service:latest -f services/notification-service/Dockerfile services/notification-service/
if errorlevel 1 (
    echo Error building notification-service image
    exit /b 1
)
echo [OK] Notification service built successfully
echo.

echo Building payment-service...
docker build -t smartmedicare/payment-service:latest -f services/payment-service/Dockerfile services/payment-service/
if errorlevel 1 (
    echo Error building payment-service image
    exit /b 1
)
echo [OK] Payment service built successfully
echo.

if exist "services/telemedicine-service/Dockerfile" (
    echo Building telemedicine-service...
    docker build -t smartmedicare/telemedicine-service:latest -f services/telemedicine-service/Dockerfile services/telemedicine-service/
    if errorlevel 1 (
        echo Error building telemedicine-service image
        exit /b 1
    )
    echo [OK] Telemedicine service built successfully
    echo.
)

echo ================================
echo All images built successfully!
echo ================================
echo.
echo Next steps:
echo 1. Create namespace: kubectl create namespace smartmedicare
echo 2. Apply configs: kubectl apply -f kubernetes/configmap.yaml -n smartmedicare
echo 3. Apply secrets: kubectl apply -f kubernetes/secrets.yaml -n smartmedicare
echo 4. Deploy services: kubectl apply -f kubernetes/ -n smartmedicare
echo.
pause
