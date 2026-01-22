# 🚀 Deployment Guide for Hostinger

This guide will help you deploy your e-commerce website to Hostinger.

## 📋 Prerequisites

1. **Hostinger Account** with:
   - Shared Hosting or VPS (Node.js support required)
   - MySQL Database
   - SSH Access (for VPS) or File Manager access

2. **GitHub Account** (for code repository)

3. **Domain Name** (optional, but recommended)

---

## 🔍 Pre-Deployment Checklist

### ✅ Backend Requirements
- [x] Node.js backend (Express)
- [x] MySQL database with Prisma ORM
- [x] Environment variables configured
- [x] File upload support (Cloudinary/local)
- [x] CORS configured

### ✅ Frontend Requirements
- [x] React + Vite build
- [x] Production build script
- [x] API endpoint configuration

---

## 📦 Step 1: Prepare Your Code

### 1.1 Update Backend Package.json

Add production scripts to `ecommerce-backend/package.json`:

```json
{
  "scripts": {
    "start": "node index.js",
    "dev": "nodemon index.js",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate deploy"
  }
}
```

### 1.2 Update Frontend API Configuration

Update `ecommerce-frontend/src/api.js` to use environment variable:

```javascript
export const API = import.meta.env.VITE_API_URL || "http://localhost:3000";
```

### 1.3 Create Environment Files

**Backend `.env` (ecommerce-backend/.env):**
```env
# Database (Hostinger MySQL)
DATABASE_URL="mysql://username:password@host:3306/database_name"

# JWT Secret
JWT_SECRET="your-very-secure-secret-key-change-this"

# Cloudinary (Optional)
CLOUDINARY_URL="cloudinary://748892294178158:A_bBmvai4lqf0zPyC0kuHrCl_qc@dgha7rmvi"

# Server Port (Hostinger usually provides a port)
PORT=3000
```

**Frontend `.env.production` (ecommerce-frontend/.env.production):**
```env
VITE_API_URL=https://your-backend-domain.com
```

### 1.4 Add Missing Dependencies

Your backend needs these packages. Update `ecommerce-backend/package.json`:

```json
{
  "dependencies": {
    "@prisma/client": "^6.19.2",
    "bcryptjs": "^2.4.3",
    "cloudinary": "^1.47.0",
    "cors": "^2.8.5",
    "dotenv": "^17.2.3",
    "express": "^5.2.1",
    "fuse.js": "^7.0.0",
    "jsonwebtoken": "^9.0.2",
    "multer": "^1.4.5-lts.1",
    "mysql2": "^3.16.1",
    "prisma": "^6.19.2"
  }
}
```

---

## 🗄️ Step 2: Set Up MySQL Database on Hostinger

1. **Login to Hostinger hPanel**
2. Go to **MySQL Databases**
3. Create a new database (e.g., `u123456789_giftchoice`)
4. Create a database user and assign it to the database
5. Note down:
   - Database name
   - Database username
   - Database password
   - Database host (usually `localhost` or provided by Hostinger)

6. **Update your DATABASE_URL:**
   ```
   mysql://username:password@host:3306/database_name
   ```

---

## 🔧 Step 3: Deploy Backend

### Option A: Using SSH (VPS/Dedicated Hosting)

1. **Connect via SSH:**
   ```bash
   ssh username@your-server-ip
   ```

2. **Clone your repository:**
   ```bash
   cd ~/domains/yourdomain.com/public_html
   git clone https://github.com/yourusername/ecommerce.git
   cd ecommerce/ecommerce-backend
   ```

3. **Install dependencies:**
   ```bash
   npm install --production
   ```

4. **Set up environment:**
   ```bash
   cp .env.example .env
   nano .env  # Edit with your credentials
   ```

5. **Run Prisma migrations:**
   ```bash
   npx prisma generate
   npx prisma migrate deploy
   ```

6. **Start the server with PM2:**
   ```bash
   npm install -g pm2
   pm2 start index.js --name ecommerce-backend
   pm2 save
   pm2 startup
   ```

### Option B: Using File Manager (Shared Hosting)

1. **Upload files via File Manager:**
   - Navigate to `public_html` or `domains/yourdomain.com`
   - Upload `ecommerce-backend` folder

2. **Install dependencies via SSH:**
   - Hostinger usually provides SSH access even on shared hosting
   - Follow steps 3-6 from Option A

3. **Configure Node.js App:**
   - In hPanel, go to **Node.js** section
   - Create a new Node.js app
   - Set:
     - App name: `ecommerce-backend`
     - Node version: `18.x` or `20.x`
     - App root: `ecommerce-backend`
     - App URL: `yourdomain.com/api` (or subdomain)
     - Startup file: `index.js`

---

## 🎨 Step 4: Deploy Frontend

### 4.1 Build Frontend

On your local machine:

```bash
cd ecommerce-frontend
npm install
npm run build
```

This creates a `dist` folder with production-ready files.

### 4.2 Upload Frontend Files

**Option A: Via File Manager**
1. Go to Hostinger File Manager
2. Navigate to `public_html` (or your domain folder)
3. Upload all contents of `ecommerce-frontend/dist` folder
4. Make sure `index.html` is in the root

**Option B: Via FTP**
1. Use FileZilla or similar FTP client
2. Connect to your Hostinger FTP
3. Upload `dist` folder contents to `public_html`

**Option C: Via Git + Build on Server**
1. Clone repo on server
2. Build on server:
   ```bash
   cd ecommerce-frontend
   npm install
   npm run build
   ```
3. Copy `dist` contents to `public_html`

---

## ⚙️ Step 5: Configure Hostinger Settings

### 5.1 Update Frontend API URL

After deployment, update your frontend build with production API URL:

1. Create `ecommerce-frontend/.env.production`:
   ```env
   VITE_API_URL=https://api.yourdomain.com
   ```

2. Rebuild:
   ```bash
   npm run build
   ```

3. Re-upload `dist` folder

### 5.2 Configure CORS

Update `ecommerce-backend/index.js` to allow your frontend domain:

```javascript
app.use(cors({
  origin: ['https://yourdomain.com', 'https://www.yourdomain.com'],
  credentials: true
}));
```

### 5.3 Set Up File Uploads Directory

If using local storage (not Cloudinary):

1. Create `uploads` folder in backend:
   ```bash
   mkdir ecommerce-backend/uploads
   chmod 755 ecommerce-backend/uploads
   ```

2. Update backend to serve static files:
   ```javascript
   app.use('/uploads', express.static('uploads'));
   ```

---

## 🔐 Step 6: Security & Environment Variables

### 6.1 Create .env File on Server

**Never commit .env to Git!**

Create `.env` in `ecommerce-backend/`:

```env
DATABASE_URL="mysql://username:password@localhost:3306/database_name"
JWT_SECRET="generate-a-random-secret-key-here"
CLOUDINARY_URL="cloudinary://748892294178158:A_bBmvai4lqf0zPyC0kuHrCl_qc@dgha7rmvi"
PORT=3000
```

### 6.2 Update .gitignore

Ensure `.gitignore` includes:
```
.env
.env.local
node_modules/
uploads/
dist/
*.log
```

---

## 🚀 Step 7: Start Your Application

### For VPS/Dedicated:

```bash
# Using PM2 (recommended)
pm2 start index.js --name ecommerce-backend
pm2 logs ecommerce-backend

# Or using nohup
nohup node index.js > server.log 2>&1 &
```

### For Shared Hosting:

Use Hostinger's Node.js App Manager in hPanel to start your app.

---

## ✅ Step 8: Verify Deployment

1. **Check Backend:**
   - Visit: `https://yourdomain.com/api` or `https://api.yourdomain.com`
   - Should see: "Backend is alive 🌱"

2. **Check Frontend:**
   - Visit: `https://yourdomain.com`
   - Should see your website

3. **Test API Endpoints:**
   - `https://yourdomain.com/api/products`
   - `https://yourdomain.com/api/categories`

4. **Test Admin Login:**
   - Visit: `https://yourdomain.com/admin`
   - Login with admin credentials

---

## 🔧 Troubleshooting

### Backend Not Starting
- Check Node.js version: `node --version` (need 18+)
- Check logs: `pm2 logs` or check error logs
- Verify database connection
- Check port availability

### Database Connection Errors
- Verify DATABASE_URL format
- Check database credentials
- Ensure database user has proper permissions
- Check if database host is correct (might not be `localhost`)

### Frontend API Errors
- Verify `VITE_API_URL` in production build
- Check CORS settings
- Verify backend is running
- Check browser console for errors

### File Upload Issues
- Check `uploads` folder permissions: `chmod 755 uploads`
- Verify Cloudinary credentials if using Cloudinary
- Check file size limits

### Prisma Errors
- Run: `npx prisma generate`
- Run: `npx prisma migrate deploy`
- Check database connection

---

## 📝 Additional Notes

### Using Subdomain for API

If you want `api.yourdomain.com` for backend:

1. In Hostinger, create subdomain `api`
2. Point it to `ecommerce-backend` folder
3. Update frontend API URL to `https://api.yourdomain.com`

### SSL Certificate

Hostinger usually provides free SSL. Enable it in hPanel under **SSL**.

### Domain Configuration

1. Point your domain to Hostinger nameservers
2. Wait for DNS propagation (24-48 hours)
3. Configure domain in hPanel

### Performance Optimization

1. Enable Gzip compression
2. Use CDN for static assets
3. Optimize images
4. Enable caching headers

---

## 🆘 Support

If you encounter issues:
1. Check Hostinger documentation
2. Review server logs
3. Check Node.js version compatibility
4. Verify all environment variables are set

---

## 📦 Quick Deployment Checklist

- [ ] Database created on Hostinger
- [ ] Backend code uploaded
- [ ] Backend dependencies installed
- [ ] `.env` file configured
- [ ] Prisma migrations run
- [ ] Backend server running
- [ ] Frontend built (`npm run build`)
- [ ] Frontend files uploaded to `public_html`
- [ ] API URL updated in frontend
- [ ] CORS configured
- [ ] SSL certificate enabled
- [ ] Tested all functionality

---

**Good luck with your deployment! 🎉**
