import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ProtectedRoute from "./components/ProtectedRoute";

import Home from "./pages/Home";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Festival from "./pages/Festival";
import NewArrivals from "./pages/NewArrivals";
import CategoriesPage from "./pages/CategoriesPage";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";

function PublicLayout() {
  return (
    <>
      <Navbar />
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/shop" element={<Home />} />
                  <Route path="/categories" element={<CategoriesPage />} />
                  <Route path="/category/:slug" element={<CategoriesPage />} />
                  <Route path="/festival" element={<Festival />} />
                  <Route path="/new" element={<NewArrivals />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/contact" element={<Contact />} />
                </Routes>
      <Footer />
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Admin Routes (no navbar/footer) */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route path="/admin" element={<Navigate to="/admin/login" replace />} />

          {/* Public Routes */}
          <Route path="/*" element={<PublicLayout />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
