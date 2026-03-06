import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/axios";

const AdminShopProducts = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [discounts, setDiscounts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, [id]);

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
      <div className="bg-neutral-dark p-6 rounded-xl shadow border border-neutral-mid">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center justify-between">
          <span>Total Products ({products.length})</span>
        </h3>
        <div className="space-y-3">
          {products.length === 0 ? (
            <p className="text-neutral-light text-center py-4 text-sm">
              No products listed by this shop.
            </p>
          ) : (
            products.map((p) => {
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
      </div>
    </div>
  );
};

export default AdminShopProducts;
