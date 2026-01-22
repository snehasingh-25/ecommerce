# 🎛️ Admin Panel Guide

## Overview

A fully functional admin panel has been created for managing your e-commerce website. The admin panel is **protected with JWT authentication** and provides easy-to-use interfaces for managing products, categories, orders, and messages.

---

## 🔐 Accessing the Admin Panel

### URL
- **Login Page:** `http://localhost:5173/admin/login`
- **Dashboard:** `http://localhost:5173/admin/dashboard`

### First-Time Setup

1. **Create an Admin User:**
   ```bash
   # Use the register endpoint (or create directly in database)
   POST http://localhost:3000/auth/register
   {
     "email": "admin@example.com",
     "password": "your-secure-password"
   }
   ```

2. **Login:**
   - Go to `/admin/login`
   - Enter your email and password
   - You'll be redirected to the dashboard

---

## 📦 Features

### 1. **Product Management**
- ✅ Add new products with drag-and-drop image upload
- ✅ Edit existing products
- ✅ Delete products
- ✅ Add multiple sizes with different prices
- ✅ Set product badges (e.g., "60 Min Delivery")
- ✅ Mark products as Festival items or New Arrivals
- ✅ Add multilingual keywords for search

### 2. **Category Management**
- ✅ Create categories
- ✅ Edit categories
- ✅ Delete categories
- ✅ Auto-generate URL-friendly slugs

### 3. **Order Management**
- ✅ View all orders
- ✅ Update order status (Pending, Confirmed, Shipped, Delivered, Cancelled)
- ✅ View order details including items and customer information

### 4. **Message Management**
- ✅ View contact form messages
- ✅ Mark messages as read
- ✅ Delete messages

---

## 🎨 Admin Panel Interface

### Dashboard Layout
- **Top Header:** Shows admin email and logout button
- **Tab Navigation:** Switch between Products, Categories, Orders, Messages
- **Content Area:** Form for adding/editing + list of existing items

### Product Form Fields
- **Product Name** (required)**
- **Category** (required)**
- **Description** (required)**
- **Badge** (optional, e.g., "60 Min Delivery")
- **Keywords** (comma-separated, for search)
- **Options:**
  - ☑️ Festival Item
  - ☑️ New Arrival
- **Images:** Drag-and-drop or click to upload
- **Sizes & Prices:** Add multiple size options with prices

---

## 🔧 Backend API Endpoints

### Authentication
- `POST /auth/login` - Admin login
- `POST /auth/register` - Create admin account
- `GET /auth/verify` - Verify JWT token

### Products (Protected)
- `GET /products` - Get all products (public)
- `GET /products/:id` - Get single product (public)
- `POST /products` - Create product (admin only)
- `PUT /products/:id` - Update product (admin only)
- `DELETE /products/:id` - Delete product (admin only)

### Categories (Protected)
- `GET /categories` - Get all categories (public)
- `POST /categories` - Create category (admin only)
- `PUT /categories/:id` - Update category (admin only)
- `DELETE /categories/:id` - Delete category (admin only)

### Orders (Protected)
- `POST /orders` - Create order (public)
- `GET /orders` - Get all orders (admin only)
- `PATCH /orders/:id/status` - Update order status (admin only)

### Messages (Protected)
- `POST /contact` - Submit message (public)
- `GET /contact` - Get all messages (admin only)
- `PATCH /contact/:id/read` - Mark as read (admin only)
- `DELETE /contact/:id` - Delete message (admin only)

---

## 🛡️ Security Features

1. **JWT Authentication:**
   - Tokens stored in localStorage
   - Tokens expire after 7 days
   - Automatic token verification on page load

2. **Protected Routes:**
   - Admin dashboard requires authentication
   - Unauthorized users redirected to login

3. **Backend Protection:**
   - All admin endpoints protected with `verifyToken` middleware
   - JWT secret stored in environment variables

---

## 📝 Usage Instructions

### Adding a Product

1. Go to **Admin Dashboard** → **Products** tab
2. Fill in the product form:
   - Enter product name
   - Select category
   - Add description
   - (Optional) Add badge
   - (Optional) Add keywords (comma-separated)
   - Check "Festival Item" or "New Arrival" if applicable
3. **Upload Images:**
   - Drag and drop images or click to browse
   - Multiple images supported
   - Images upload to Cloudinary (if configured) or local storage
4. **Add Sizes:**
   - Click "+ Add Size"
   - Enter size label (e.g., "Small", "Large", "10x12 inch")
   - Enter price
   - Add more sizes as needed
5. Click **"Create Product"**

### Editing a Product

1. Find the product in the list
2. Click **"Edit"** button
3. Modify fields as needed
4. Add/remove images
5. Update sizes
6. Click **"Update Product"**

### Managing Categories

1. Go to **Categories** tab
2. Fill in category form:
   - Category name (slug auto-generates)
   - (Optional) Description
3. Click **"Create Category"**
4. Edit or delete categories from the list below

### Managing Orders

1. Go to **Orders** tab
2. View all orders with customer details
3. Update status using the dropdown:
   - Pending → Confirmed → Shipped → Delivered
   - Or mark as Cancelled

### Managing Messages

1. Go to **Messages** tab
2. View all contact form submissions
3. Mark messages as read
4. Delete messages when done

---

## 🖼️ Image Upload

### Cloudinary (Recommended)
If `CLOUDINARY_URL` is set in backend `.env`, images upload to Cloudinary cloud storage.

### Local Storage
If Cloudinary is not configured, images save to `ecommerce-backend/uploads/` folder.

**Note:** Make sure the `uploads` folder has write permissions:
```bash
chmod 755 ecommerce-backend/uploads
```

---

## 🔄 Database Schema Updates

The Prisma schema has been updated to include:
- `images` field (JSON array) in Product model
- `keywords` field (JSON array) in Product model
- `description` field in Category model
- `read` field in ContactMessage model
- Enhanced Order and OrderItem models

**Run migrations:**
```bash
cd ecommerce-backend
npx prisma migrate dev --name add_admin_features
npx prisma generate
```

---

## 🐛 Troubleshooting

### Can't Login
- Check if admin user exists in database
- Verify password is hashed with bcrypt
- Check backend logs for errors
- Verify JWT_SECRET is set in backend `.env`

### Images Not Uploading
- Check file permissions on `uploads` folder
- Verify Cloudinary credentials (if using)
- Check file size limits (max 5MB per file)
- Check browser console for errors

### Products Not Saving
- Check if category exists
- Verify all required fields are filled
- Check backend logs for validation errors
- Ensure JWT token is valid

### Protected Routes Not Working
- Verify token is stored in localStorage
- Check if token is expired
- Verify backend `verifyToken` middleware is working
- Check CORS settings

---

## 📚 Files Created

### Frontend
- `src/context/AuthContext.jsx` - Authentication context
- `src/components/ProtectedRoute.jsx` - Route protection
- `src/pages/AdminLogin.jsx` - Login page
- `src/pages/AdminDashboard.jsx` - Main dashboard
- `src/components/admin/ProductForm.jsx` - Product form
- `src/components/admin/ProductList.jsx` - Product list
- `src/components/admin/CategoryForm.jsx` - Category form
- `src/components/admin/CategoryList.jsx` - Category list
- `src/components/admin/OrderList.jsx` - Order list
- `src/components/admin/MessageList.jsx` - Message list
- `src/components/admin/ImageUpload.jsx` - Image upload component

### Backend
- `utils/auth.js` - JWT verification middleware
- `utils/upload.js` - File upload utility (Cloudinary/local)
- Updated `routes/auth.js` - JWT authentication
- Updated `routes/products.js` - Protected CRUD operations
- Updated `routes/categories.js` - Protected CRUD operations
- Updated `routes/orders.js` - Protected order management
- Updated `routes/contact.js` - Protected message management
- Updated `prisma/schema.prisma` - Enhanced database schema

---

## ✅ Checklist

- [x] JWT authentication implemented
- [x] Protected routes on frontend
- [x] Protected endpoints on backend
- [x] Product CRUD operations
- [x] Category CRUD operations
- [x] Order management
- [x] Message management
- [x] Image upload (Cloudinary/local)
- [x] Drag-and-drop file upload
- [x] Multiple sizes per product
- [x] Product badges
- [x] Festival/New Arrival flags
- [x] Multilingual keywords
- [x] Responsive admin UI

---

## 🚀 Next Steps

1. **Create your first admin user** using the register endpoint
2. **Login** at `/admin/login`
3. **Create categories** first (Products need categories)
4. **Add products** with images and sizes
5. **Test the full workflow**

---

**Your admin panel is ready to use! 🎉**
