import { useEffect, useState, useRef } from "react";
import { API } from "../api";
import ProductCard from "../components/ProductCard";
import { Link } from "react-router-dom";

export default function Home() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const scrollRef = useRef(null);

  useEffect(() => {
    fetch(`${API}/products`)
      .then(res => res.json())
      .then(data => setProducts(data));

    fetch(`${API}/categories`)
      .then(res => res.json())
      .then(data => setCategories(data));
  }, []);

  // Map category names to emojis (fallback if no emoji in category)
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

  const scrollCategories = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = 300;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Shop By Category Section */}
      {categories.length > 0 ? (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-gray-900">Shop By Category</h2>
            <Link 
              to="/categories" 
              className="text-pink-600 hover:text-pink-700 text-sm font-semibold inline-flex items-center gap-1 transition-colors"
            >
              View All
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
          <div className="relative">
            <button
              onClick={() => scrollCategories("left")}
              className="absolute left-0 top-1/2 transform -translate-y-1/2 z-10 bg-white rounded-full p-3 shadow-lg hover:shadow-xl hover:scale-110 transition-all border border-gray-100"
            >
              <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div
              ref={scrollRef}
              className="flex gap-5 overflow-x-auto scrollbar-hide pb-4 px-2"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {categories.map((category) => (
                <Link
                  key={category.id}
                  to={`/category/${category.slug}`}
                  className="flex-shrink-0 flex flex-col items-center gap-3 min-w-[130px] group"
                >
                  <div className="w-28 h-28 bg-gradient-to-br from-pink-50 to-pink-100 rounded-xl flex items-center justify-center text-5xl border-2 border-pink-200 group-hover:border-pink-400 group-hover:shadow-lg group-hover:scale-110 transition-all duration-300 overflow-hidden">
                    {category.imageUrl ? (
                      <img
                        src={category.imageUrl}
                        alt={category.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      getCategoryEmoji(category.name)
                    )}
                  </div>
                  <span className="text-sm font-semibold text-gray-700 text-center group-hover:text-pink-600 transition-colors">
                    {category.name}
                  </span>
                </Link>
              ))}
            </div>
            <button
              onClick={() => scrollCategories("right")}
              className="absolute right-0 top-1/2 transform -translate-y-1/2 z-10 bg-white rounded-full p-3 shadow-lg hover:shadow-xl hover:scale-110 transition-all border border-gray-100"
            >
              <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      ) : (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center py-8">
            <div className="inline-flex items-center gap-2 text-gray-500 bg-gray-50 px-4 py-2 rounded-lg">
              <span className="text-xl">📦</span>
              <p className="text-sm font-medium">No categories available</p>
            </div>
          </div>
        </div>
      )}

      {/* Trending Gifts Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 bg-white">
        <div className="flex items-center justify-between mb-10">
          <h2 className="text-3xl font-bold text-gray-900">Trending Gifts</h2>
          {products.length > 0 && (
            <Link
              to="/shop"
              className="text-pink-600 hover:text-pink-700 text-sm font-semibold inline-flex items-center gap-1 transition-colors"
            >
              View All
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.length > 0 ? (
            products.map(p => (
              <ProductCard key={p.id} product={p} />
            ))
          ) : (
            <div className="col-span-full text-center py-16">
              <div className="inline-block p-6 bg-gray-50 rounded-full mb-4">
                <span className="text-4xl">🎁</span>
              </div>
              <p className="text-gray-500 font-medium">No products available</p>
            </div>
          )}
        </div>
      </div>

      {/* Floating Chat Button */}
      <div className="fixed bottom-8 right-8 z-50">
        <button className="bg-gradient-to-br from-pink-500 to-pink-600 text-white rounded-full w-16 h-16 shadow-2xl hover:shadow-pink-500/50 hover:scale-110 transition-all flex items-center justify-center group">
          <svg className="w-6 h-6 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
