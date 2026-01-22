import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { API } from "../api";
import ProductCard from "../components/ProductCard";

export default function Occasion() {
  const { slug } = useParams();
  const [occasions, setOccasions] = useState([]);
  const [selectedOccasion, setSelectedOccasion] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOccasionProducts = async (occasionSlug) => {
    try {
      const res = await fetch(`${API}/occasions/${occasionSlug}`);
      const data = await res.json();
      setSelectedOccasion(data);
      setProducts(data.products || []);
    } catch (error) {
      console.error("Error fetching occasion products:", error);
    }
  };

  useEffect(() => {
    // Fetch all occasions
    fetch(`${API}/occasions`)
      .then(res => res.json())
      .then(data => {
        setOccasions(data);
        // If slug is provided, find and set the occasion
        if (slug) {
          const occasion = data.find(o => o.slug === slug);
          if (occasion) {
            setSelectedOccasion(occasion);
            fetchOccasionProducts(occasion.slug);
          }
        }
        setLoading(false);
      })
      .catch(error => {
        console.error("Error fetching occasions:", error);
        setLoading(false);
      });
  }, [slug]);

  const handleOccasionClick = (occasion) => {
    setSelectedOccasion(occasion);
    fetchOccasionProducts(occasion.slug);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white py-16 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading occasions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white py-16">
      <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4" style={{ color: 'oklch(20% .02 340)' }}>
            Shop by Occasion
          </h2>
          <p className="text-lg" style={{ color: 'oklch(60% .02 340)' }}>
            Find the perfect gift for every special moment
          </p>
        </div>

        {/* Occasions Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 mb-12">
          {occasions.map((occasion) => (
            <Link
              key={occasion.id}
              to={`/occasion/${occasion.slug}`}
              onClick={() => handleOccasionClick(occasion)}
              className="group text-center"
            >
              <div
                className="w-full aspect-square rounded-full overflow-hidden mb-3 mx-auto transition-all duration-300 group-hover:scale-125 shadow-md group-hover:shadow-lg"
                style={{ 
                  backgroundColor: 'oklch(92% .04 340)',
                  maxWidth: '150px'
                }}
              >
                {occasion.imageUrl ? (
                  <img
                    src={occasion.imageUrl}
                    alt={occasion.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-5xl">🎉</span>
                  </div>
                )}
              </div>
              <h3 className="font-semibold text-sm" style={{ color: 'oklch(20% .02 340)' }}>
                {occasion.name}
              </h3>
            </Link>
          ))}
        </div>

        {/* Products for Selected Occasion */}
        {selectedOccasion && (
          <div className="mt-12">
            <div className="mb-8">
              <h3 className="text-3xl font-bold mb-2" style={{ color: 'oklch(20% .02 340)' }}>
                {selectedOccasion.name}
              </h3>
              {selectedOccasion.description && (
                <p className="text-lg" style={{ color: 'oklch(60% .02 340)' }}>
                  {selectedOccasion.description}
                </p>
              )}
            </div>
            {products.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="inline-block p-6 rounded-full mb-4" style={{ backgroundColor: 'oklch(92% .04 340)' }}>
                  <span className="text-4xl">🎁</span>
                </div>
                <p className="font-medium" style={{ color: 'oklch(60% .02 340)' }}>
                  No products available for this occasion yet
                </p>
              </div>
            )}
          </div>
        )}

        {/* Show all occasions if none selected */}
        {!selectedOccasion && occasions.length === 0 && (
          <div className="text-center py-16">
            <div className="inline-block p-6 rounded-full mb-4" style={{ backgroundColor: 'oklch(92% .04 340)' }}>
              <span className="text-4xl">🎉</span>
            </div>
            <p className="font-medium" style={{ color: 'oklch(60% .02 340)' }}>
              No occasions available yet
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
