# ✅ Pre-Deployment Checklist

## 🔍 Code Review

### Backend Issues Fixed:
- [x] Added missing dependencies (bcryptjs, jsonwebtoken, multer, cloudinary, fuse.js)
- [x] Added contact routes import
- [x] Added dotenv configuration
- [x] Added file upload serving
- [x] Added PORT environment variable
- [x] Added CORS configuration with FRONTEND_URL
- [x] Added production scripts to package.json

### Frontend Issues Fixed:
- [x] Updated API configuration to use environment variables
- [x] Ready for production build

### Missing Files to Create:
- [ ] Create `ecommerce-backend/routes/contact.js` if it doesn't exist
- [ ] Create `uploads` folder in backend
- [ ] Create `.env` files (use `.env.example` as template)

---

## 📦 Dependencies Check

### Backend Dependencies:
```bash
cd ecommerce-backend
npm install
```

Required packages:
- ✅ @prisma/client
- ✅ bcryptjs
- ✅ cloudinary
- ✅ cors
- ✅ dotenv
- ✅ express
- ✅ fuse.js
- ✅ jsonwebtoken
- ✅ multer
- ✅ mysql2
- ✅ prisma

### Frontend Dependencies:
```bash
cd ecommerce-frontend
npm install
```

All dependencies are present.

---

## 🗄️ Database Setup

### Prisma Schema Status:
- ✅ User model
- ✅ Category model
- ✅ Product model
- ✅ ProductSize model
- ✅ Order model
- ✅ ContactMessage model

### Database Migration:
```bash
cd ecommerce-backend
npx prisma generate
npx prisma migrate deploy
```

---

## 🔐 Security Checklist

- [ ] Change JWT_SECRET to a strong random string
- [ ] Update DATABASE_URL with real credentials
- [ ] Set FRONTEND_URL in backend .env
- [ ] Ensure .env files are in .gitignore
- [ ] Remove any hardcoded credentials
- [ ] Enable SSL/HTTPS on Hostinger

---

## 📝 Environment Variables

### Backend (.env):
```env
DATABASE_URL="mysql://user:pass@host:3306/db"
JWT_SECRET="random-secret-key"
CLOUDINARY_URL="your-cloudinary-url"
PORT=3000
FRONTEND_URL="https://yourdomain.com"
```

### Frontend (.env.production):
```env
VITE_API_URL="https://api.yourdomain.com"
```

---

## 🚀 Deployment Steps Summary

1. **Prepare Code:**
   - Install all dependencies
   - Create .env files
   - Test locally

2. **Database:**
   - Create MySQL database on Hostinger
   - Update DATABASE_URL
   - Run Prisma migrations

3. **Backend:**
   - Upload backend files
   - Install dependencies
   - Configure .env
   - Start server (PM2 or Node.js app manager)

4. **Frontend:**
   - Build: `npm run build`
   - Upload `dist` folder to `public_html`
   - Configure API URL

5. **Verify:**
   - Test backend API
   - Test frontend
   - Test admin login
   - Test file uploads

---

## ⚠️ Common Issues to Watch For

1. **Port Configuration:** Hostinger may assign a specific port
2. **Database Host:** May not be `localhost`, check Hostinger docs
3. **File Permissions:** Ensure `uploads` folder has write permissions
4. **Node.js Version:** Ensure Hostinger supports Node 18+
5. **CORS Errors:** Update FRONTEND_URL in backend .env

---

## 📞 Need Help?

Refer to `DEPLOYMENT.md` for detailed step-by-step instructions.
