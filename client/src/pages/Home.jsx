import { useState, useEffect } from "react";
import api from "../api/axios";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

import Navbar from "../components/Navbar";
import ShopCard from "../components/ShopCard";

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
            <ShopCard key={shop.id} shop={shop} />
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
