# 🚀 Step-by-Step Deployment Guide

## ✅ You've Completed:
- [x] Frontend build (`npm run build`)

---

## 📋 Next Steps:

### Step 1: Prepare Environment Variables

**1.1 Create Frontend `.env.production` file:**
```bash
cd ecommerce-frontend
```

Create file: `.env.production`
```env
VITE_API_URL=https://api.yourdomain.com
```
*(Replace `yourdomain.com` with your actual domain or subdomain for backend)*

**1.2 Rebuild Frontend with Production API URL:**
```bash
npm run build
```
*(This rebuilds with the correct API URL)*

---

### Step 2: Set Up Database on Hostinger

1. **Login to Hostinger hPanel**
2. Go to **MySQL Databases**
3. **Create a new database:**
   - Database name: `u123456789_giftchoice` (example)
   - Note down the full database name
4. **Create a database user:**
   - Username: `u123456789_admin` (example)
   - Password: (create a strong password)
   - Note down both
5. **Assign user to database** (give all privileges)
6. **Note the database host** (usually `localhost` or provided by Hostinger)

**Your DATABASE_URL will be:**
```
mysql://username:password@host:3306/database_name
```

---

### Step 3: Prepare Backend for Deployment

**3.1 Create Backend `.env` file:**
```bash
cd ecommerce-backend
```

Create file: `.env`
```env
# Database (from Step 2)
DATABASE_URL="mysql://u123456789_admin:your_password@localhost:3306/u123456789_giftchoice"

# JWT Secret (generate a random string)
JWT_SECRET="your-super-secret-jwt-key-change-this-to-random-string"

# Cloudinary
CLOUDINARY_URL="cloudinary://748892294178158:A_bBmvai4lqf0zPyC0kuHrCl_qc@dgha7rmvi"

# Server Port (Hostinger will provide this, usually 3000 or specific port)
PORT=3000

# Frontend URL (your domain)
FRONTEND_URL="https://yourdomain.com"
```

**3.2 Test Backend Locally (Optional but Recommended):**
```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Test if it starts
npm start
```
*(Press Ctrl+C to stop)*

---

### Step 4: Upload Files to Hostinger

**Option A: Using File Manager (Easier)**

1. **Login to Hostinger hPanel**
2. Go to **File Manager**
3. Navigate to `public_html` (or your domain folder)

**Upload Frontend:**
- Upload ALL contents of `ecommerce-frontend/dist/` folder
- Make sure `index.html` is in the root of `public_html/`
- Upload all files from `dist/` directly to `public_html/`

**Upload Backend:**
- Create a folder: `api` (or `backend`)
- Upload entire `ecommerce-backend/` folder contents to `api/` folder
- Make sure `.env` file is uploaded (or create it on server)

**Option B: Using SSH (More Control)**

```bash
# Connect via SSH
ssh username@your-server-ip

# Navigate to your domain folder
cd ~/domains/yourdomain.com/public_html

# Upload frontend files (use SCP or FTP)
# Upload all contents of dist/ folder here

# Create backend folder
mkdir api
cd api

# Upload backend files here
# Or clone from Git if you have a repository
```

---

### Step 5: Set Up Backend on Hostinger

**5.1 Install Node.js Dependencies:**

**Via SSH:**
```bash
cd ~/domains/yourdomain.com/public_html/api
npm install --production
```

**Via File Manager:**
- Use Hostinger's **Node.js App Manager** in hPanel

**5.2 Configure Node.js App (in hPanel):**

1. Go to **Node.js** section in hPanel
2. Click **Create Node.js App**
3. Configure:
   - **App name:** `ecommerce-backend`
   - **Node version:** `18.x` or `20.x`
   - **App root:** `api` (or wherever you uploaded backend)
   - **App URL:** `yourdomain.com/api` (or use subdomain)
   - **Startup file:** `index.js`
4. **Add Environment Variables:**
   - Click on your app → **Environment Variables**
   - Add all variables from your `.env` file:
     - `DATABASE_URL`
     - `JWT_SECRET`
     - `CLOUDINARY_URL`
     - `PORT`
     - `FRONTEND_URL`

**5.3 Run Database Migrations:**

**Via SSH:**
```bash
cd ~/domains/yourdomain.com/public_html/api
npx prisma generate
npx prisma migrate deploy
```

**5.4 Start Backend:**

**Via Node.js App Manager:**
- Click **Start** button in hPanel

**Via SSH (using PM2):**
```bash
npm install -g pm2
cd ~/domains/yourdomain.com/public_html/api
pm2 start index.js --name ecommerce-backend
pm2 save
pm2 startup
```

---

### Step 6: Configure Frontend

**6.1 Update API URL in Frontend Build:**

If you haven't set `.env.production` yet:
1. Create `ecommerce-frontend/.env.production`
2. Add: `VITE_API_URL=https://yourdomain.com/api`
3. Rebuild: `npm run build`
4. Re-upload `dist/` folder contents

**6.2 Upload Frontend Files:**

- Upload all contents of `ecommerce-frontend/dist/` to `public_html/`
- Ensure `index.html` is in the root

---

### Step 7: Set Up File Permissions

**Via SSH:**
```bash
# Create uploads directory
mkdir -p ~/domains/yourdomain.com/public_html/api/uploads
chmod 755 ~/domains/yourdomain.com/public_html/api/uploads
```

---

### Step 8: Create Admin User

**Via SSH or API:**

```bash
# Using curl (replace with your backend URL)
curl -X POST https://yourdomain.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@yourdomain.com",
    "password": "your-secure-password"
  }'
```

Or use Postman/Thunder Client to call:
- `POST https://yourdomain.com/api/auth/register`
- Body: `{ "email": "admin@example.com", "password": "password123" }`

---

### Step 9: Test Your Deployment

1. **Test Frontend:**
   - Visit: `https://yourdomain.com`
   - Should see your website

2. **Test Backend:**
   - Visit: `https://yourdomain.com/api`
   - Should see: "Backend is alive 🌱"

3. **Test API:**
   - Visit: `https://yourdomain.com/api/products`
   - Should return JSON array (may be empty)

4. **Test Admin Login:**
   - Visit: `https://yourdomain.com/admin/login`
   - Login with credentials from Step 8

---

### Step 10: Enable SSL (Important!)

1. Go to **SSL** section in hPanel
2. Enable **Free SSL** (Let's Encrypt)
3. Wait for activation (usually instant)
4. Force HTTPS redirect if available

---

## 🔧 Common Issues & Fixes

### Backend Not Starting
- ✅ Check Node.js version (need 18+)
- ✅ Verify `.env` file exists and has correct values
- ✅ Check database connection string
- ✅ Check port number (Hostinger may assign specific port)

### Database Connection Error
- ✅ Verify `DATABASE_URL` format
- ✅ Check database host (may not be `localhost`)
- ✅ Verify database user has proper permissions
- ✅ Test connection from Hostinger's phpMyAdmin

### Frontend Shows Blank Page
- ✅ Check browser console for errors
- ✅ Verify API URL in build
- ✅ Check if backend is running
- ✅ Verify CORS settings

### Images Not Uploading
- ✅ Check `uploads/` folder permissions (755)
- ✅ Verify Cloudinary credentials
- ✅ Check file size limits

### 404 Errors
- ✅ Check `.htaccess` file for React Router (if needed)
- ✅ Verify file paths
- ✅ Check if files uploaded correctly

---

## 📝 Quick Checklist

- [ ] Frontend built with production API URL
- [ ] Database created on Hostinger
- [ ] Backend `.env` file created with correct values
- [ ] Backend files uploaded to server
- [ ] Frontend files uploaded to `public_html/`
- [ ] Node.js app configured in hPanel
- [ ] Environment variables set in Node.js app
- [ ] Prisma migrations run (`npx prisma migrate deploy`)
- [ ] Backend started (Node.js App Manager or PM2)
- [ ] Admin user created
- [ ] SSL certificate enabled
- [ ] Tested frontend and backend
- [ ] Tested admin login

---

## 🎯 Final Steps

1. **Test everything:**
   - Browse products
   - Add to cart
   - Contact form
   - Admin login
   - Add/edit products

2. **Monitor:**
   - Check server logs
   - Monitor PM2 status (if using)
   - Check error logs in hPanel

3. **Optimize:**
   - Enable caching
   - Optimize images
   - Set up CDN (optional)

---

**Your website should now be live! 🎉**

If you encounter any issues, check the troubleshooting section or refer to `DEPLOYMENT.md` for detailed instructions.
