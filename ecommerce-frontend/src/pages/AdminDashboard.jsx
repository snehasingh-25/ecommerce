import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { API } from "../api";
import ProductForm from "../components/admin/ProductForm";
import CategoryForm from "../components/admin/CategoryForm";
import ProductList from "../components/admin/ProductList";
import CategoryList from "../components/admin/CategoryList";
import OrderList from "../components/admin/OrderList";
import MessageList from "../components/admin/MessageList";

export default function AdminDashboard() {
  const { logout, user } = useAuth();
  const [activeTab, setActiveTab] = useState("products");
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [orders, setOrders] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("adminToken");
      const headers = { Authorization: `Bearer ${token}` };

      if (activeTab === "products") {
        const res = await fetch(`${API}/products`, { headers });
        const data = await res.json();
        setProducts(data);
      } else if (activeTab === "categories") {
        const res = await fetch(`${API}/categories`, { headers });
        const data = await res.json();
        setCategories(data);
      } else if (activeTab === "orders") {
        const res = await fetch(`${API}/orders`, { headers });
        const data = await res.json();
        setOrders(data);
      } else if (activeTab === "messages") {
        const res = await fetch(`${API}/contact`, { headers });
        const data = await res.json();
        setMessages(data);
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleProductSave = () => {
    setEditingProduct(null);
    loadData();
  };

  const handleCategorySave = () => {
    setEditingCategory(null);
    loadData();
  };

  const tabs = [
    { id: "products", label: "Products", icon: "📦" },
    { id: "categories", label: "Categories", icon: "🏷️" },
    { id: "orders", label: "Orders", icon: "🛒" },
    { id: "messages", label: "Messages", icon: "📩" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Admin <span className="text-pink-600">Dashboard</span>
              </h1>
              <p className="text-sm text-gray-600 mt-1">Welcome, {user?.email}</p>
            </div>
            <button
              onClick={logout}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="flex space-x-1 mb-6 bg-white rounded-lg p-1 shadow-sm border border-gray-200">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setEditingProduct(null);
                setEditingCategory(null);
              }}
              className={`flex-1 px-4 py-3 rounded-lg font-semibold transition-all ${
                activeTab === tab.id
                  ? "bg-pink-500 text-white shadow-md"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        ) : (
          <>
            {activeTab === "products" && (
              <div>
                <ProductForm
                  product={editingProduct}
                  categories={categories}
                  onSave={handleProductSave}
                />
                <ProductList
                  products={products}
                  onEdit={setEditingProduct}
                  onDelete={loadData}
                />
              </div>
            )}

            {activeTab === "categories" && (
              <div>
                <CategoryForm
                  category={editingCategory}
                  onSave={handleCategorySave}
                />
                <CategoryList
                  categories={categories}
                  onEdit={setEditingCategory}
                  onDelete={loadData}
                />
              </div>
            )}

            {activeTab === "orders" && (
              <OrderList orders={orders} onUpdate={loadData} />
            )}

            {activeTab === "messages" && (
              <MessageList messages={messages} onUpdate={loadData} />
            )}
          </>
        )}
      </div>
    </div>
  );
}
