# MindMate AI - Production Cloud Deployment Guide

This guide details step-by-step instructions to deploy **MindMate AI** across major cloud platforms using Docker containers and Nginx reverse proxies.

---

## ☁️ Supported Cloud Platforms

### 1. AWS EC2 (Docker Compose)
1. **Launch EC2 Instance**: Select Ubuntu Server 22.04 LTS (t3.medium recommended for NLP model loading).
2. **Configure Security Group**: Open inbound ports `80` (HTTP), `443` (HTTPS), and `22` (SSH).
3. **Install Docker & Compose**:
   ```bash
   sudo apt update
   sudo apt install -y docker.io docker-compose-plugin
   sudo systemctl enable --now docker
   ```
4. **Deploy Application Stack**:
   ```bash
   git clone <your-repository-url>
   cd NLP_Mindmate
   docker compose up -d --build
   ```

---

### 2. Google Cloud Run (Serverless Containers)
1. Build and tag images to Google Artifact Registry:
   ```bash
   gcloud builds submit --tag gcr.io/$PROJECT_ID/mindmate-backend ./backend
   gcloud builds submit --tag gcr.io/$PROJECT_ID/mindmate-frontend ./frontend
   ```
2. Deploy Backend with Cloud SQL MySQL instance environment variables:
   ```bash
   gcloud run deploy mindmate-backend \
     --image gcr.io/$PROJECT_ID/mindmate-backend \
     --platform managed \
     --set-env-vars DATABASE_URL="mysql+pymysql://user:pass@/dbname?unix_socket=/cloudsql/connection_name"
   ```

---

### 3. Azure App Service / Web App for Containers
1. Push Docker images to Azure Container Registry (ACR).
2. Create a Web App multi-container deployment referencing `docker-compose.yml`.
3. Set Application Settings for `DATABASE_URL` connecting to Azure Database for MySQL Flexible Server.

---

### 4. Render / Railway PaaS
1. Connect GitHub Repository to **Render** or **Railway**.
2. Deploy **MySQL Database** service and copy the external database URL.
3. Deploy **FastAPI Web Service** (Root directory: `.`, Dockerfile: `backend/Dockerfile`). Set env `DATABASE_URL`.
4. Deploy **React Static Site / Web Service** (Root directory: `./frontend`, Dockerfile: `frontend/Dockerfile`). Set env `VITE_API_URL`.

---

## 🔒 Nginx SSL & Custom Domain Setup (Certbot)

To enable HTTPS with free Let's Encrypt certificates on EC2/DigitalOcean:
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```
Certbot automatically updates `/etc/nginx/nginx.conf` to redirect HTTP traffic to HTTPS securely.
