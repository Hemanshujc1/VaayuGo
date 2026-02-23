import { useState, useEffect } from "react";
import api from "../api/axios";
import ShopCard from "../components/ShopCard";

const Home = () => {
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-64px)] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-neutral-light border-t-accent"></div>
          <span className="text-xl font-medium text-neutral-light animate-pulse">
            Discovering Local Shops...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-linear-to-br from-primary via-neutral-dark to-neutral-mid pt-20 pb-24 md:pt-28 md:pb-32 px-4 shadow-2xl border-b border-neutral-light/10">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 mix-blend-overlay"></div>
        <div className="relative z-10 max-w-5xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 border border-accent/30 text-accent font-semibold text-sm mb-4 tracking-wide shadow-inner shadow-accent/20">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
            </span>
            Now live in your neighborhood
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold text-white tracking-tight drop-shadow-md">
            Local Shops, <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-linear-to-r from-accent to-secondary">
              Delivered Fast.
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-neutral-light max-w-3xl mx-auto leading-relaxed mt-6">
            Everything you need from your favorite neighborhood stores, right at
            your fingertips. Discover curated products and support local
            businesses.
          </p>

          <div className="pt-8 flex justify-center">
            <button
              onClick={() =>
                document
                  .getElementById("shops-section")
                  .scrollIntoView({ behavior: "smooth" })
              }
              className="group relative px-8 py-4 bg-white text-primary font-bold text-lg rounded-full shadow-[0_0_30px_rgba(0,229,255,0.4)] hover:shadow-[0_0_50px_rgba(0,229,255,0.6)] transition-all overflow-hidden flex items-center gap-3"
            >
              <div className="absolute inset-0 bg-linear-to-r from-accent to-secondary opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <span className="relative z-10 group-hover:text-white transition-colors">
                Start Shopping
              </span>
              <svg
                className="w-5 h-5 relative z-10 group-hover:translate-y-1 transition-transform group-hover:text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19 14l-7 7m0 0l-7-7m7 7V3"
                ></path>
              </svg>
            </button>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <div
        id="shops-section"
        className="container mx-auto px-4 sm:px-6 lg:px-8 mt-16"
      >
        <div className="flex items-center justify-between mb-10 border-b border-neutral-light/20 pb-4">
          <h2 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <span className="bg-accent/20 p-2 rounded-lg text-accent">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                ></path>
              </svg>
            </span>
            Popular Stores Near You
          </h2>
          <span className="text-neutral-light font-medium bg-neutral-mid px-3 py-1 rounded-full text-sm">
            {shops.length} {shops.length === 1 ? "Store" : "Stores"} Available
          </span>
        </div>

        {/* Shop Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {shops.map((shop) => (
            <div
              key={shop.id}
              className="hover:-translate-y-2 transition-transform duration-300"
            >
              <ShopCard shop={shop} />
            </div>
          ))}

          {shops.length === 0 && (
            <div className="col-span-full py-20 flex flex-col items-center justify-center text-center bg-neutral-dark/50 rounded-2xl border border-neutral-light/10">
              <div className="w-24 h-24 mb-6 text-neutral-light opacity-50">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1"
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  ></path>
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">
                No Shops Found
              </h3>
              <p className="text-neutral-light max-w-md">
                We are expanding rapidly! Check back later as more local
                champions join our platform.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;
