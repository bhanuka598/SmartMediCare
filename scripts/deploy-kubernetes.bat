@echo off
REM SmartMediCare Kubernetes Deployment Script for Windows

setlocal enabledelayedexpansion

set NAMESPACE=smartmedicare
set KUBERNETES_DIR=kubernetes

echo.
echo ================================
echo SmartMediCare Kubernetes Deploy
echo ================================
echo.

REM Check if kubectl is installed
where kubectl >nul 2>nul
if errorlevel 1 (
    echo kubectl not found. Please install kubectl.
    pause
    exit /b 1
)

echo Checking Kubernetes connection...
kubectl cluster-info >nul 2>&1
if errorlevel 1 (
    echo Cannot connect to Kubernetes cluster. Please ensure cluster is running.
    pause
    exit /b 1
)
echo [OK] Connected to Kubernetes cluster
echo.

echo Creating namespace: %NAMESPACE%...
kubectl create namespace %NAMESPACE% --dry-run=client -o yaml | kubectl apply -f -
echo [OK] Namespace ready
echo.

echo Applying ConfigMaps...
kubectl apply -f %KUBERNETES_DIR%/configmap.yaml -n %NAMESPACE%
echo [OK] ConfigMaps applied
echo.

echo Applying Secrets...
kubectl apply -f %KUBERNETES_DIR%/secrets.yaml -n %NAMESPACE%
echo [OK] Secrets applied
echo.

echo Deploying services...
kubectl apply -f %KUBERNETES_DIR%/client-deployment.yaml -n %NAMESPACE%
kubectl apply -f %KUBERNETES_DIR%/gateway-deployment.yaml -n %NAMESPACE%
kubectl apply -f %KUBERNETES_DIR%/auth-deployment.yaml -n %NAMESPACE%
kubectl apply -f %KUBERNETES_DIR%/patient-deployment.yaml -n %NAMESPACE%
kubectl apply -f %KUBERNETES_DIR%/doctor-deployment.yaml -n %NAMESPACE%
kubectl apply -f %KUBERNETES_DIR%/appointment-deployment.yaml -n %NAMESPACE%
kubectl apply -f %KUBERNETES_DIR%/notification-deployment.yaml -n %NAMESPACE%
kubectl apply -f %KUBERNETES_DIR%/payment-deployment.yaml -n %NAMESPACE%
kubectl apply -f %KUBERNETES_DIR%/telemedicine-deployment.yaml -n %NAMESPACE%
echo [OK] All deployments applied
echo.

echo Applying Ingress...
kubectl apply -f %KUBERNETES_DIR%/ingress.yaml -n %NAMESPACE%
echo [OK] Ingress applied
echo.

echo Waiting for deployments to be ready...
kubectl rollout status deployment/client -n %NAMESPACE% --timeout=2m 2>nul
kubectl rollout status deployment/gateway -n %NAMESPACE% --timeout=2m 2>nul
echo.

echo ================================
echo Deployment complete!
echo ================================
echo.
echo Status:
echo.
kubectl get deployments -n %NAMESPACE%
echo.
kubectl get services -n %NAMESPACE%
echo.
echo To access services:
echo 1. Port forward client: kubectl port-forward svc/client 3000:3000 -n %NAMESPACE%
echo 2. Port forward gateway: kubectl port-forward svc/gateway 5000:5000 -n %NAMESPACE%
echo.
echo Or use NodePort:
echo - Client: http://localhost:30001
echo - Gateway: http://localhost:30000
echo.
pause
