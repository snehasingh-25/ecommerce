export default function ProductCard({ product }) {
  const images = product.images ? (Array.isArray(product.images) ? product.images : JSON.parse(product.images)) : [];

  return (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 overflow-hidden group">
      {/* Product Image */}
      <div className="relative h-52 bg-gradient-to-br from-pink-50 to-pink-100 flex items-center justify-center overflow-hidden">
        {images.length > 0 ? (
          <img
            src={images[0]}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
        ) : (
          <span className="text-7xl text-pink-200 group-hover:scale-110 transition-transform">🎁</span>
        )}
        
        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          {product.isFestival && (
            <span className="px-2.5 py-1 bg-pink-600 text-white text-xs rounded-full font-semibold shadow-md backdrop-blur-sm">
              Festival
            </span>
          )}
          {product.isNew && (
            <span className="px-2.5 py-1 bg-pink-600 text-white text-xs rounded-full font-semibold shadow-md backdrop-blur-sm">
              New
            </span>
          )}
        </div>
        {product.badge && (
          <span className="absolute top-3 right-3 px-2.5 py-1 bg-pink-600 text-white text-xs rounded-full font-semibold shadow-md backdrop-blur-sm">
            {product.badge}
          </span>
        )}
      </div>

      {/* Product Info */}
      <div className="p-5">
        <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-1 group-hover:text-pink-600 transition-colors">
          {product.name}
        </h3>
        <p className="text-sm text-gray-600 mb-4 line-clamp-2 min-h-[2.5rem]">{product.description}</p>

        {/* Sizes */}
        {product.sizes && product.sizes.length > 0 && (
          <div className="space-y-2 mb-5">
            {product.sizes.slice(0, 2).map(size => (
              <div
                key={size.id}
                className="flex justify-between items-center text-sm bg-gray-50 px-4 py-2.5 rounded-lg hover:bg-pink-50 transition-colors border border-gray-100"
              >
                <span className="text-gray-700 font-medium">{size.label}</span>
                <span className="font-bold text-pink-600">₹{size.price}</span>
              </div>
            ))}
            {product.sizes.length > 2 && (
              <p className="text-xs text-gray-500 text-center font-medium">
                +{product.sizes.length - 2} more sizes
              </p>
            )}
          </div>
        )}

        {/* Button */}
        <button
          className="w-full bg-gradient-to-r from-pink-500 to-pink-600 text-white py-3 rounded-lg font-semibold hover:from-pink-600 hover:to-pink-700 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5 text-sm"
          onClick={() => {
            const msg = `Product: ${product.name}`;
            window.open(
              `https://wa.me/919799964364?text=${encodeURIComponent(msg)}`
            );
          }}
        >
          Order on WhatsApp
        </button>
      </div>
    </div>
  );
}
  