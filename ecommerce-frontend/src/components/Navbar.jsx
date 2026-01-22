import { Link, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";

export default function Navbar() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  const navItems = [
    { path: "/", label: "Home" },
    { path: "/shop", label: "Shop" },
    { path: "/categories", label: "Categories" },
    { path: "/new", label: "New Arrivals"},
    { path: "/festival", label: "Festival" },
    { path: "/about", label: "About" },
    { path: "/contact", label: "Contact" },
  ];

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav
      className={`sticky top-0 z-50 backdrop-blur-sm transition-all ${
        scrolled
          ? "bg-white shadow-lg border-b border-gray-100"
          : "bg-white/95"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="text-4xl transform group-hover:scale-110 group-hover:rotate-12 transition-all">
              🎁
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-wide text-gray-900">
                Gift<span className="text-pink-500">Choice</span>
              </h1>
              <p className="text-xs text-gray-500 italic">
                Enfolding Your Emotions
              </p>
            </div>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden lg:flex items-center gap-2">
            {navItems.map((item) => (
              <div key={item.path} className="relative group">
                <Link
                  to={item.path}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive(item.path)
                      ? "text-pink-600"
                      : "text-gray-700 hover:text-pink-600"
                  }`}
                >
                  {item.label}
                  {item.badge && (
                    <span className="ml-2 text-xs bg-pink-500 text-white px-2 py-0.5 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </Link>

                {isActive(item.path) && (
                  <span className="absolute bottom-1 left-4 w-6 h-0.5 bg-pink-500 rounded-full"></span>
                )}
              </div>
            ))}
          </div>

          {/* Search + Cart + Mobile Button */}
          <div className="flex items-center gap-3">
            
            {/* Search */}
            <div className="relative hidden md:block">
              <input
                type="text"
                placeholder="Find the perfect gift..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-gray-50 border border-gray-200 rounded-full px-5 py-2.5 pr-10 w-60 text-sm focus:ring-2 focus:ring-pink-300 focus:border-pink-400 transition-all"
              />
              <svg
                className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>

            {/* Cart */}
            <div className="relative group">
              <button className="p-2.5 rounded-full hover:bg-pink-100 hover:scale-110 transition-all">
                <span className="text-2xl">🛒</span>
                <span className="absolute top-0 right-0 w-5 h-5 bg-pink-500 text-white text-xs rounded-full flex items-center justify-center font-semibold">
                  0
                </span>
              </button>
              <span className="absolute -top-9 right-0 text-xs bg-gray-800 text-white px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition">
                Your Cart
              </span>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition"
            >
              <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <div
          className={`lg:hidden overflow-hidden transition-all duration-300 ${
            isMobileMenuOpen ? "max-h-96 py-4" : "max-h-0"
          }`}
        >
          <div className="flex flex-col gap-1 border-t border-gray-100 pt-4">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`px-4 py-2.5 rounded-lg text-sm font-medium transition ${
                  isActive(item.path)
                    ? "text-pink-600 bg-pink-50"
                    : "text-gray-700 hover:text-pink-600 hover:bg-pink-50"
                }`}
              >
                {item.label}
                {item.badge && (
                  <span className="ml-2 text-xs bg-pink-500 text-white px-2 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                )}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}
