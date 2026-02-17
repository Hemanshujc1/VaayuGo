import { useState, useEffect } from "react";
import api from "../api/axios";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

import Navbar from "../components/Navbar";

const Home = () => {
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user, logout } = useAuth();

  useEffect(() => {
    const fetchShops = async () => {
      try {
        const res = await api.get("/public/shops");
        setShops(res.data);
      } catch (error) {
        console.error("Error fetching shops", error);
      } finally {
        setLoading(false);
      }
    };
    fetchShops();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="min-h-screen bg-neutral-dark">
      <Navbar />
      <div className="container mx-auto p-4 md:p-8">
        <header className="mb-8 text-center md:text-left">
          <h1 className="text-4xl font-extrabold text-white mb-2">
            Local Shops, <span className="text-accent">Delivered Fast.</span>
          </h1>
          <p className="text-neutral-light text-lg">
            Order from your favorite neighborhood stores.
          </p>
        </header>

        {/* Shop Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {shops.map((shop) => (
            <Link
              to={`/shop/${shop.id}`}
              key={shop.id}
              className="bg-neutral-dark rounded-lg shadow hover:shadow-lg transition block overflow-hidden border border-neutral-mid hover:border-accent group"
            >
              <div className="h-40 bg-neutral-mid flex items-center justify-center text-neutral-light">
                {/* Placeholder for Image */}
                {shop.image_url ? (
                  <img
                    src={shop.image_url}
                    alt={shop.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <span>No Image</span>
                )}
              </div>
              <div className="p-4">
                <h2 className="text-xl font-bold text-white group-hover:text-accent transition-colors">
                  {shop.name}
                </h2>
                <p className="text-sm text-neutral-light mb-2">
                  {shop.category}
                </p>
                <div className="flex justify-between items-center">
                  <span className="bg-green-900/30 text-green-400 border border-green-800 text-xs px-2 py-1 rounded">
                    {shop.rating > 0 ? `${shop.rating} ★` : "New"}
                  </span>
                  <span className="text-xs text-neutral-light">
                    {shop.location_address}
                  </span>
                </div>
              </div>
            </Link>
          ))}
          {shops.length === 0 && (
            <p className="col-span-3 text-center text-gray-500 py-10">
              No shops available right now. Check back later!
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;
