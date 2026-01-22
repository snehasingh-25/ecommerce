# 🚀 Quick Deployment Guide for Hostinger

## ⚡ Quick Start (5 Steps)

### 1️⃣ Install Missing Dependencies

**Backend:**
```bash
cd ecommerce-backend
npm install bcryptjs jsonwebtoken multer cloudinary fuse.js
```

### 2️⃣ Create Environment Files

**Backend `.env`:**
```env
DATABASE_URL="mysql://username:password@localhost:3306/database_name"
JWT_SECRET="your-random-secret-key"
CLOUDINARY_URL="cloudinary://748892294178158:A_bBmvai4lqf0zPyC0kuHrCl_qc@dgha7rmvi"
PORT=3000
FRONTEND_URL="https://yourdomain.com"
```

**Frontend `.env.production`:**
```env
VITE_API_URL="https://api.yourdomain.com"
```

### 3️⃣ Database Setup on Hostinger

1. Login to Hostinger hPanel
2. Go to **MySQL Databases**
3. Create database and user
4. Copy connection details to `DATABASE_URL`

### 4️⃣ Deploy Backend

**Via SSH:**
```bash
# Upload files to server
cd ~/domains/yourdomain.com
git clone your-repo-url
cd ecommerce-backend

# Install and setup
npm install --production
cp .env.example .env
# Edit .env with your credentials

# Database
npx prisma generate
npx prisma migrate deploy

# Start with PM2
npm install -g pm2
pm2 start index.js --name backend
pm2 save
```

**Via File Manager:**
- Upload `ecommerce-backend` folder
- Use Hostinger's Node.js App Manager
- Set startup file: `index.js`

### 5️⃣ Deploy Frontend

```bash
# Build locally
cd ecommerce-frontend
npm install
npm run build

# Upload dist/ folder contents to public_html/
```

---

## 🔧 Configuration

### Update API URL in Frontend

After building, the API URL is baked in. Rebuild after setting `.env.production`:

```bash
VITE_API_URL="https://your-backend-url.com" npm run build
```

### CORS Setup

Backend already configured in `index.js` - just set `FRONTEND_URL` in `.env`

---

## ✅ Test Your Deployment

1. **Backend:** `https://yourdomain.com/api` → Should see "Backend is alive 🌱"
2. **Frontend:** `https://yourdomain.com` → Should see your website
3. **API Test:** `https://yourdomain.com/api/products` → Should return products

---

## 📋 Full Details

See `DEPLOYMENT.md` for complete step-by-step instructions.

---

## 🆘 Troubleshooting

**Backend not starting?**
- Check Node.js version (need 18+)
- Check `.env` file exists
- Check database connection
- Check port availability

**Database errors?**
- Verify `DATABASE_URL` format
- Check user permissions
- Run `npx prisma generate`

**Frontend API errors?**
- Check `VITE_API_URL` in build
- Check CORS settings
- Check backend is running

---

**Ready to deploy! 🎉**
