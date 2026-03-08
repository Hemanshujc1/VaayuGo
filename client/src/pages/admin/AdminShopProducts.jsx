import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api/axios";
import Pagination from "../../components/shared/common/Pagination";
import SearchBar from "../../components/shared/common/SearchBar";
import SortDropdown from "../../components/shared/common/SortDropdown";
import FilterDropdown from "../../components/shared/common/FilterDropdown";

const AdminShopProducts = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [discounts, setDiscounts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [stockFilter, setStockFilter] = useState("");
  const [sortBy, setSortBy] = useState("name_asc");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchProducts();
  }, [id]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, stockFilter, sortBy]);

  const fetchProducts = async () => {
    try {
      const { data } = await api.get(`/admin/shops/${id}/products`);
      setProducts(data.products || []);
      setDiscounts(data.discounts || []);
    } catch (error) {
      console.error("Error fetching shop products", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading)
    return (
      <div className="text-white text-center p-4">Loading Products...</div>
    );

  const filteredAndSortedProducts = products
    .filter((p) => {
      const matchesSearch = p.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());

      let matchesStock = true;
      if (stockFilter === "in_stock") matchesStock = p.stock_quantity > 0;
      if (stockFilter === "out_of_stock") matchesStock = p.stock_quantity === 0;

      return matchesSearch && matchesStock;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "name_asc":
          return a.name.localeCompare(b.name);
        case "name_desc":
          return b.name.localeCompare(a.name);
        case "price_high":
          return b.price - a.price;
        case "price_low":
          return a.price - b.price;
        case "stock_low":
          return (a.stock_quantity || 0) - (b.stock_quantity || 0);
        case "stock_high":
          return (b.stock_quantity || 0) - (a.stock_quantity || 0);
        default:
          return 0;
      }
    });

  const totalPages =
    Math.ceil(filteredAndSortedProducts.length / itemsPerPage) || 1;
  const currentProducts = filteredAndSortedProducts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">
          Shop Products Inventory
        </h2>
        <button
          onClick={() => navigate(`/admin/shops/${id}`)}
          className="bg-neutral-mid text-white px-4 py-2 rounded-lg hover:bg-neutral-light/20 transition-colors font-bold text-sm"
        >
          ← Back to Shop
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-4">
        <div className="flex-1">
          <SearchBar
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search products by name..."
          />
        </div>
        <div className="flex flex-wrap gap-4">
          <FilterDropdown
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value)}
            options={[
              { value: "in_stock", label: "In Stock" },
              { value: "out_of_stock", label: "Out of Stock" },
            ]}
            placeholder="All Stock Levels"
          />
          <SortDropdown
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            options={[
              { value: "name_asc", label: "Name (A-Z)" },
              { value: "name_desc", label: "Name (Z-A)" },
              { value: "price_high", label: "Price (Highest)" },
              { value: "price_low", label: "Price (Lowest)" },
              { value: "stock_high", label: "Stock (Highest)" },
              { value: "stock_low", label: "Stock (Lowest)" },
            ]}
          />
        </div>
      </div>

      <div className="bg-neutral-dark p-6 rounded-xl shadow border border-neutral-mid">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center justify-between">
          <span>Total Products ({filteredAndSortedProducts.length})</span>
        </h3>
        <div className="space-y-3">
          {currentProducts.length === 0 ? (
            <p className="text-neutral-light text-center py-4 text-sm">
              {products.length === 0
                ? "No products listed by this shop."
                : "No matching products found."}
            </p>
          ) : (
            currentProducts.map((p) => {
              const activeDiscount = (discounts || []).find(
                (d) =>
                  d.target_type === "PRODUCT" &&
                  d.target_id === p.id &&
                  d.is_active,
              );

              return (
                <div
                  key={p.id}
                  className="bg-primary p-3 rounded border border-neutral-mid flex justify-between items-center"
                >
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-medium text-sm">
                        {p.name}
                      </span>
                      {activeDiscount && (
                        <span className="bg-accent/20 text-accent px-1.5 py-0.5 rounded text-[10px] font-black border border-accent/30">
                          {activeDiscount.type === "PERCENTAGE"
                            ? `${Math.round(activeDiscount.value)}% OFF`
                            : `₹${Math.round(activeDiscount.value)} OFF`}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-neutral-500">
                      Stock: {p.stock_quantity || 0}
                    </span>
                  </div>
                  <div className="flex flex-col items-end">
                    {activeDiscount ? (
                      <>
                        <span className="text-neutral-500 line-through text-[10px] font-bold">
                          ₹{p.price}
                        </span>
                        <span className="text-accent font-extrabold text-sm">
                          ₹
                          {activeDiscount.type === "PERCENTAGE"
                            ? (
                                p.price -
                                (p.price * activeDiscount.value) / 100
                              ).toFixed(2)
                            : Math.max(
                                0,
                                p.price - activeDiscount.value,
                              ).toFixed(2)}
                        </span>
                      </>
                    ) : (
                      <span className="text-green-400 font-bold text-sm">
                        ₹{p.price}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {totalPages > 1 && (
          <div className="mt-6 pt-6 border-t border-neutral-mid/40">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminShopProducts;
