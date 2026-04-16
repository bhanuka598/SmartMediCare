# Deploying SmartMediCare on AWS EC2

This project can be deployed on a single EC2 instance with Docker Compose.

## 1. Create the EC2 instance

- Launch `Ubuntu 22.04 LTS`.
- Use at least `t3.medium`.
- Open inbound ports `22`, `80`, and `443`.

## 2. Connect to the server

```bash
ssh -i /path/to/key.pem ubuntu@YOUR_EC2_PUBLIC_IP
```

## 3. Install Docker and Docker Compose

```bash
sudo apt update
sudo apt install -y ca-certificates curl git
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo $VERSION_CODENAME) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo usermod -aG docker $USER
newgrp docker
```

## 4. Clone the project

```bash
git clone <your-repository-url>
cd SmartMediCare
```

## 5. Create the environment file

```bash
cp .env.ec2.example .env
nano .env
```

Set real values for MongoDB, JWT secrets, Stripe keys, and `CORS_ORIGINS`.

## 6. Start the stack

```bash
docker compose --env-file .env -f docker-compose.ec2.yml up -d --build
```

## 7. Verify

```bash
docker compose -f docker-compose.ec2.yml ps
docker compose -f docker-compose.ec2.yml logs gateway --tail 100
```

Visit:

```text
http://YOUR_EC2_PUBLIC_IP
```

## 8. Update later

```bash
git pull
docker compose --env-file .env -f docker-compose.ec2.yml up -d --build
```

## Recommended next step

Add a domain and HTTPS once the basic EC2 deployment is working.
