import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">

        {/* Top Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-14">

          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-4xl">🎁</span>
              <h3 className="text-2xl font-extrabold tracking-wide">
                Gift<span className="text-pink-400">Choice</span>
              </h3>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed max-w-md">
              Your one-stop destination for thoughtful gifts for every occasion.  
              Enfolding your emotions with carefully curated selections that speak from the heart.
            </p>

            {/* Trust Badges */}
            <div className="flex gap-4 mt-6 text-sm text-gray-400">
              <span className="flex items-center gap-2">🔒 Secure Payments</span>
              <span className="flex items-center gap-2">🚚 Fast Delivery</span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-bold mb-5 text-white">Quick Links</h4>
            <div className="space-y-3 text-sm">
              {["Home", "About", "Contact", "Shop", "New Arrivals"].map((item) => (
                <Link
                  key={item}
                  to={`/${item.toLowerCase().replace(" ", "")}`}
                  className="block text-gray-400 hover:text-pink-400 transition-colors"
                >
                  {item}
                </Link>
              ))}
            </div>
          </div>

          {/* Contact + Social */}
          <div>
            <h4 className="font-bold mb-5 text-white">Connect With Us</h4>

            <div className="space-y-3 text-sm text-gray-400">
              <p className="flex items-center gap-2">📧 info@giftchoice.com</p>
              <p className="flex items-center gap-2">📱 +91 9799964364</p>
            </div>

            {/* Social Icons */}
            <div className="flex gap-4 mt-6">
              {["📘", "📷", "▶️"].map((icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center 
                             hover:bg-pink-500 hover:scale-110 transition-all shadow-md"
                >
                  <span className="text-lg">{icon}</span>
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Newsletter */}
        <div className="bg-gray-800/60 rounded-xl p-8 mb-12 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h4 className="text-lg font-bold">Stay in the loop 💌</h4>
            <p className="text-sm text-gray-400">
              Get exclusive offers & gift ideas straight to your inbox.
            </p>
          </div>

          <div className="flex w-full md:w-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="px-4 py-2.5 rounded-l-lg bg-gray-900 border border-gray-700 
                         text-sm text-white focus:outline-none w-full md:w-64"
            />
            <button className="bg-pink-500 hover:bg-pink-600 px-5 py-2.5 rounded-r-lg 
                               text-sm font-semibold transition-colors">
              Subscribe
            </button>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-700 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-400 text-sm">
            © {new Date().getFullYear()} GiftChoice. All rights reserved.
          </p>

          <div className="flex gap-6 text-sm">
            <Link to="#" className="text-gray-400 hover:text-pink-400 transition-colors">
              Privacy Policy
            </Link>
            <Link to="#" className="text-gray-400 hover:text-pink-400 transition-colors">
              Terms & Conditions
            </Link>
          </div>
        </div>

      </div>
    </footer>
  );
}
