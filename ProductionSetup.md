# �️ VaayuGo Production Deployment Guide

This document provides a comprehensive, step-by-step guide to deploying the **VaayuGo** ecosystem in a production environment using a DigitalOcean Droplet (Ubuntu) and Vercel.

---

## 🏗️ Architecture Summary

| Component           | Technology            | Target               |
| :------------------ | :-------------------- | :------------------- |
| **Frontend**        | React / Vite          | Vercel               |
| **Backend**         | Node.js / Express     | DigitalOcean Droplet |
| **Database**        | MySQL                 | DigitalOcean Droplet |
| **Reverse Proxy**   | Nginx + Certbot (SSL) | DigitalOcean Droplet |
| **Process Manager** | PM2                   | DigitalOcean Droplet |

---

## 1️⃣ Domain & DNS Configuration --> to done later after getting the domain

Before starting, ensure you have a domain (e.g., `vaayugo.dev`) and configure the following DNS records:

| Record Type | Host  | Points To               |
| :---------- | :---- | :---------------------- |
| **A Case**  | `api` | Your Droplet IP Address |
| **CNAME**   | `@`   | Vercel Deployment Link  |

---

## 2️⃣ Backend Server Preparation

### SSH Connection

```bash
ssh root@your-server-ip
```

### System Updates

```bash
sudo apt update && sudo apt upgrade -y
```

### Install Core Dependencies

# Update system

sudo apt update
sudo apt upgrade -y

# Install Node.js 24 (same major version as local)

curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation

node -v
npm -v

# Install MySQL Server

sudo apt install -y mysql-server

# Verify MySQL

mysql -V

# Install PM2 globally

sudo npm install -g pm2

# Verify PM2

pm2 -v

---

## 3️⃣ MySQL Database Configuration

### Secure MySQL

```bash
sudo mysql_secure_installation
```

_Selection: Remove anonymous users, Disallow root login remotely, Remove test database, Reload privileges._

### Create Production User

```sql
-- Login to MySQL
sudo mysql -u root -p

-- Create Dedicated User
CREATE USER 'vaayugo-admin'@'localhost' IDENTIFIED BY 'vaayugo@123';
GRANT ALL PRIVILEGES ON *.* TO 'vaayugo-admin'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

---

## 4️⃣ Backend Deployment

### Clone & Install

```bash
git clone https://github.com/Hemanshujc1/VaayuGo.git
cd VaayuGo/server
npm install
```

### Environment Configuration (`.env`)

Create a production `.env` file:

```env
# Server
PORT=3001
NODE_ENV=production

# Database
DB_HOST=localhost
DB_USER=vaayugo-admin
DB_PASSWORD=vaayugo@123
DB_NAME=vaayugo

# Security
JWT_SECRET=YOUR_RANDOM_LONG_SECRET_STRING
CORS_ORIGIN=https://vaayugo.dev

# URLs (Crucial for Emails/Images)
FRONTEND_URL=https://vaayugo.dev
BACKEND_URL=https://api.vaayugo.dev

# Email (Gmail/SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### Initialize Database Schema

```bash
# This script creates the database and all required tables
node scripts/initDB.js

# Create the initial Admin account
node scripts/createAdmin.js
```

### Start with PM2

```bash
pm2 start index.js --name vaayugo-backend
pm2 save
pm2 startup
```

---

## 5️⃣ Reverse Proxy (Nginx) & SSL

### Install Nginx

```bash
sudo apt install -y nginx
```

### Configure Nginx for Backend

Create a config file: `/etc/nginx/sites-available/api.vaayugo.dev`

```nginx
server {
    listen 80;
    server_name api.vaayugo.dev;

    # Increase upload limit (matches 50mb in Express index.js)
    client_max_body_size 50M;

    # Serve static files directly via Nginx
    location /uploads/ {
        alias /root/VaayuGo/server/uploads/;
        expires 30d;
        add_header Cache-Control "public, no-transform";
    }

    # Proxy all /api requests to Express
    location /api/ {
        proxy_pass http://localhost:3001/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;

        # Security & IP headers
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Fallback for root or other requests
    location / {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

Link and restart:

```bash
sudo ln -s /etc/nginx/sites-available/api.vaayugo.dev /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Setup SSL with Certbot

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d api.vaayugo.dev
```

---

## 6️⃣ Frontend Deployment (Vercel)

1. **Import Repo**: Select `VaayuGo` on Vercel Dashboard.
2. **Root Directory**: `client`.
3. **Build Settings**: Framework: `Vite`.
4. **Environment Variables**:
   - `VITE_API_URL`: `https://api.vaayugo.dev/api`
   - `VITE_BACKEND_URL`: `https://api.vaayugo.dev`
5. **Deploy**: Vercel will build and host the app automatically.

---

## 🏁 Post-Deployment Checklist

- [ ] Verify that registering as a shopkeeper sends an OTP email.
- [ ] Check if shop images are loading correctly from `BACKEND_URL`.
- [ ] Ensure `ShopStatusCron` is running correctly via PM2 logs ( `pm2 logs`).
- [ ] Test the free delivery threshold logic in the staging environment.

---
