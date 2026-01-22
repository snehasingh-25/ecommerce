import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { API } from "../api";
import { Link } from "react-router-dom";
import ProductCard from "../components/ProductCard";

export default function CategoriesPage() {
  const { slug } = useParams();
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/categories`)
      .then(res => res.json())
      .then(data => {
        setCategories(data);
        if (slug) {
          const category = data.find(cat => cat.slug === slug);
          if (category) {
            setSelectedCategory(category);
          } else if (data.length > 0) {
            setSelectedCategory(data[0]);
          }
        } else if (data.length > 0) {
          setSelectedCategory(data[0]);
        }
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching categories:", error);
        setLoading(false);
      });
  }, [slug]);

  useEffect(() => {
    if (selectedCategory && slug) {
      const fetchProducts = async () => {
        setLoading(true);
        try {
          const res = await fetch(`${API}/products?category=${selectedCategory.slug}`);
          const data = await res.json();
          setProducts(data);
        } catch (error) {
          console.error("Error fetching products:", error);
        } finally {
          setLoading(false);
        }
      };
      fetchProducts();
    } else {
      setProducts([]);
      setLoading(false);
    }
  }, [selectedCategory, slug]);

  const getCategoryEmoji = (categoryName) => {
    const emojiMap = {
      "Bottles": "🍼",
      "Soft Toys": "🧸",
      "Gifts": "🎁",
      "Anniversary Gifts": "💍",
      "Birthday Gifts": "🎂",
      "Wedding Gifts": "💒",
      "Engagement Gifts": "💑",
      "Valentines Day": "❤️",
      "Retirement Gifts": "🎊",
      "Rakhi": "🧧",
      "Diwali": "🪔",
    };
    return emojiMap[categoryName] || "🎁";
  };

  if (slug && selectedCategory) {
    // Show products for specific category
    return (
      <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <Link
              to="/categories"
              className="text-pink-600 hover:text-pink-700 text-sm font-semibold inline-flex items-center gap-1 mb-4"
            >
              ← Back to Categories
            </Link>
            <div className="flex items-center gap-6 mb-4">
              {selectedCategory.imageUrl && (
                <div className="w-24 h-24 rounded-xl overflow-hidden bg-gradient-to-br from-pink-50 to-pink-100 flex items-center justify-center">
                  <img
                    src={selectedCategory.imageUrl}
                    alt={selectedCategory.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div>
                <h1 className="text-4xl font-bold text-gray-900">
                  {selectedCategory.name} <span className="text-pink-600">Collection</span>
                </h1>
                {selectedCategory.description && (
                  <p className="text-gray-600 mt-2">{selectedCategory.description}</p>
                )}
              </div>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading products...</p>
            </div>
          ) : products.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">📦</div>
              <p className="text-gray-600 font-medium text-lg">No products in this category</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Show all categories
  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-8 text-center">
          All <span className="text-pink-600">Categories</span>
        </h1>

        {categories.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {categories.map((category) => (
              <Link
                key={category.id}
                to={`/category/${category.slug}`}
                className="bg-white rounded-xl shadow-md p-6 text-center hover:shadow-lg hover:scale-105 transition-all border-2 border-transparent hover:border-pink-300 overflow-hidden"
              >
                <div className="w-full h-32 mb-4 rounded-lg overflow-hidden bg-gradient-to-br from-pink-50 to-pink-100 flex items-center justify-center">
                  {category.imageUrl ? (
                    <img
                      src={category.imageUrl}
                      alt={category.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-6xl">{getCategoryEmoji(category.name)}</div>
                  )}
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{category.name}</h3>
                <p className="text-sm text-gray-600">
                  {category._count?.products || 0} products
                </p>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📦</div>
            <p className="text-gray-600 font-medium text-lg">No categories available</p>
            <p className="text-gray-500 text-sm mt-2">Add categories from the admin panel</p>
          </div>
        )}
      </div>
    </div>
  );
}
