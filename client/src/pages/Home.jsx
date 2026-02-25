import { useState, useEffect, useMemo } from "react";
import api from "../api/axios";
import ShopCard from "../components/ShopCard";
import SearchBar from "../components/common/SearchBar";

const Home = () => {
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [masterCategories, setMasterCategories] = useState([]);

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        const [shopsRes, catsRes] = await Promise.all([
          api.get("/public/shops"),
          api.get("/public/categories"),
        ]);
        setShops(shopsRes.data);
        setMasterCategories(catsRes.data);
      } catch (error) {
        console.error("Error fetching home data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchHomeData();
  }, []);

  // Use master categories for the filter bar
  const categories = useMemo(() => {
    return ["All", ...masterCategories.map((c) => c.name)];
  }, [masterCategories]);

  // Filter shops based on search query and category
  const filteredShops = useMemo(() => {
    return shops.filter((shop) => {
      const shopCats = (shop.Categories || []).map((c) => c.name.toLowerCase());

      const matchesSearch =
        shop.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        shopCats.some((c) => c.includes(searchQuery.toLowerCase()));

      const matchesCategory =
        activeCategory === "All" ||
        shopCats.includes(activeCategory.toLowerCase());

      return matchesSearch && matchesCategory;
    });
  }, [shops, searchQuery, activeCategory]);

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-64px)] items-center justify-center bg-primary">
        <div className="flex flex-col items-center gap-6">
          <div className="relative w-16 h-16 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-accent animate-spin"></div>
            <div className="absolute inset-2 rounded-full border-4 border-transparent border-b-secondary animate-spin-slow"></div>
            <div className="w-4 h-4 rounded-full bg-accent animate-pulse"></div>
          </div>
          <span className="text-xl font-bold text-transparent bg-clip-text bg-linear-to-r from-accent to-secondary animate-pulse tracking-wide">
            Discovering Local Gems...
          </span>
        </div>
      </div>
    );
  }

  // Find Top Rated and Newest shops for special shelves
  const topRatedShops = [...shops]
    .filter((s) => s.rating >= 4.0)
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 5);

  const newestShops = [...shops]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  return (
    <div className="min-h-screen max-w-7xl mx-auto bg-primary pb-20 selection:bg-accent selection:text-primary">
      {/* 1. Dynamic Hero Section */}
      <section className="relative overflow-hidden pt-24 pb-32 px-4 border-b border-neutral-light/10">
        {/* Animated Background Mesh */}
        <div className="absolute inset-0 bg-primary">
          <div className="absolute top-[10%] left-[10%] w-[40%] h-[40%] bg-accent/20 blur-[100px] rounded-full mix-blend-screen animate-pulse duration-8000"></div>
          <div className="absolute bottom-[10%] right-[10%] w-[40%] h-[40%] bg-secondary/20 blur-[100px] rounded-full mix-blend-screen animate-pulse duration-10000"></div>
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 hidden md:block"></div>
        </div>

        <div className="relative z-10 max-w-5xl mx-auto text-center space-y-8 mt-8">
          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white/5 border border-white/10 text-white font-medium text-sm mb-2 backdrop-blur-md shadow-2xl">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
            </span>
            <span className="opacity-90">Live in your neighborhood</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold text-white tracking-tight drop-shadow-2xl">
            Your Local High Street, <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-linear-to-r from-accent to-secondary">
              Delivered Fast.
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-neutral-light max-w-2xl mx-auto leading-relaxed mt-6 font-light">
            Skip the queue. Tap into the best neighborhood stores and get
            everything from groceries to gadgets delivered instantly.
          </p>

          {/* Search Bar directly in Hero */}
          <div className="max-w-2xl mx-auto mt-10 relative group">
            <div className="absolute -inset-1 bg-linear-to-r from-accent to-secondary rounded-full blur opacity-25 group-hover:opacity-50 transition duration-500"></div>
            <div className="relative bg-neutral-dark rounded-full shadow-2xl flex items-center p-2 border border-neutral-mid overflow-hidden">
              <div className="pl-4 text-neutral-light">
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
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  ></path>
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search shops, categories, or items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent border-none text-white px-4 py-3 focus:outline-none placeholder-neutral-light/70 text-lg"
              />
              <button
                onClick={() =>
                  document
                    .getElementById("shop-grid")
                    .scrollIntoView({ behavior: "smooth" })
                }
                className="bg-accent text-primary font-bold px-8 py-3 rounded-full hover:bg-white transition-colors whitespace-nowrap"
              >
                Find Stores
              </button>
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 mt-12 space-y-16">
        {/* 2. Category Pills Navigation */}
        <section className="relative">
          <div className="flex items-center gap-4 overflow-x-auto pb-4 pt-4 mt-2 mb-2 scrollbar-hide snap-x">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`shrink-0 px-6 py-2.5 rounded-full font-bold text-sm transition-all duration-300 snap-center border ${
                  activeCategory === cat
                    ? "bg-accent/20 text-accent border-accent/50 shadow-[0_0_15px_rgba(0,229,255,0.2)] scale-105"
                    : "bg-neutral-dark text-neutral-light border-neutral-mid hover:text-white hover:border-neutral-light/50"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </section>

        {/* 3. Specialized Discovery Shelves (Only show if no search/filter is active) */}
        {!searchQuery && activeCategory === "All" && (
          <div className="space-y-16">
            {/* Top Rated Shelf */}
            {topRatedShops.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <span className="text-warning text-3xl">★</span>
                    Top Rated Places
                  </h2>
                </div>
                <div className="flex gap-6 overflow-x-auto pb-8 pt-2 scrollbar-default snap-x">
                  {topRatedShops.map((shop) => (
                    <div
                      key={shop.id}
                      className="w-[300px] shrink-0 snap-start"
                    >
                      <ShopCard shop={shop} />
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Newest Shops Shelf */}
            {newestShops.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <span className="text-green-400 text-3xl">✨</span>
                    New on VaayuGO
                  </h2>
                </div>
                <div className="flex gap-6 overflow-x-auto pb-8 pt-2 scrollbar-default snap-x">
                  {newestShops.map((shop) => (
                    <div
                      key={shop.id}
                      className="w-[300px] shrink-0 snap-start"
                    >
                      <ShopCard shop={shop} />
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        {/* 4. Main Shop Grid */}
        <section id="shop-grid" className="pt-4 border-t border-neutral-mid/30">
          <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
            <h2 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
              {searchQuery ? (
                <>Search Results for "{searchQuery}"</>
              ) : activeCategory !== "All" ? (
                <>{activeCategory} Stores</>
              ) : (
                <>All Neighborhood Stores</>
              )}
            </h2>
            <span className="text-accent font-bold bg-accent/10 px-4 py-1.5 rounded-full text-sm border border-accent/20">
              {filteredShops.length} Places
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredShops.map((shop) => (
              <div
                key={shop.id}
                className="transform transition duration-300 hover:-translate-y-2"
              >
                <ShopCard shop={shop} />
              </div>
            ))}
          </div>

          {/* Empty State */}
          {filteredShops.length === 0 && (
            <div className="py-24 flex flex-col items-center justify-center text-center bg-neutral-dark/30 rounded-3xl border border-neutral-light/10">
              <div className="w-24 h-24 mb-6 text-neutral-light opacity-30">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  ></path>
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">
                No Shops Found
              </h3>
              <p className="text-neutral-light max-w-md">
                We couldn't find any stores matching your exact criteria. Try
                adjusting your search or category filters.
              </p>
              {(searchQuery || activeCategory !== "All") && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setActiveCategory("All");
                  }}
                  className="mt-6 px-6 py-2 bg-neutral-mid text-white rounded-full hover:bg-neutral-light/20 transition-colors font-medium"
                >
                  Clear Filters
                </button>
              )}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default Home;
