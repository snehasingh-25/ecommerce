import { useEffect, useState } from "react";
import { API } from "../api";
import ProductCard from "../components/ProductCard";

export default function NewArrivals() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    fetch(`${API}/products`)
      .then(res => res.json())
      .then(data => setProducts(data.filter(p => p.isNew)));
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white py-16">
      <div className="px-8 max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4 text-pink-400">New Arrivals ✨</h2>
          <p className="text-gray-600 text-lg">Discover our latest and most exciting gift collections</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {products.map(p => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </div>
    </div>
  );
}
