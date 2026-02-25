import { useState, useEffect } from "react";
import api from "../api/axios";
import toast from "react-hot-toast";
import { Plus, Trash2, FolderTree, ChevronLeft, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";

const AdminCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newCatName, setNewCatName] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await api.get("/admin/categories");
      setCategories(res.data);
    } catch (error) {
      toast.error("Failed to load categories");
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    setIsAdding(true);
    try {
      await api.post("/admin/categories", { name: newCatName.trim() });
      toast.success("Category added");
      setNewCatName("");
      fetchCategories();
    } catch (error) {
      toast.error(error.response?.data?.message || "Error adding category");
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteCategory = async (id) => {
    if (
      !window.confirm(
        "Are you sure? Existing shops in this category won't be deleted but will lose this category reference.",
      )
    )
      return;

    try {
      await api.delete(`/admin/categories/${id}`);
      toast.success("Category deleted");
      fetchCategories();
    } catch (error) {
      toast.error("Error deleting category");
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <Link
        to="/admin/dashboard"
        className="flex items-center gap-2 text-neutral-light hover:text-accent mb-6 transition-colors group"
      >
        <ChevronLeft
          size={20}
          className="group-hover:-translate-x-1 transition-transform"
        />
        Back to Dashboard
      </Link>

      <div className="bg-neutral-dark rounded-2xl border border-neutral-mid overflow-hidden shadow-2xl">
        <div className="p-8 border-b border-neutral-mid bg-neutral-mid/10">
          <div className="flex items-center gap-4">
            <div className="bg-accent/10 p-3 rounded-lg text-accent">
              <FolderTree size={24} />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Categories</h1>
              <p className="text-neutral-light">
                Manage the master list of shop categories.
              </p>
            </div>
          </div>
        </div>

        <div className="p-8">
          {/* Add Form */}
          <form onSubmit={handleAddCategory} className="flex gap-4 mb-8">
            <input
              type="text"
              placeholder="Enter new category name (e.g. Pharmacy)"
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              className="flex-1 bg-neutral-mid text-white border border-neutral-mid p-3 rounded-lg focus:outline-none focus:ring-1 focus:ring-accent"
              required
            />
            <button
              type="submit"
              disabled={isAdding}
              className="bg-accent text-primary px-6 py-3 rounded-lg font-bold hover:bg-white transition-colors flex items-center gap-2"
            >
              {isAdding ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <Plus size={20} />
              )}
              Add
            </button>
          </form>

          {/* List */}
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="animate-spin text-accent" size={40} />
            </div>
          ) : categories.length === 0 ? (
            <p className="text-center text-neutral-light py-10 bg-primary/50 rounded-xl border border-neutral-mid italic">
              No categories defined yet.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className="flex items-center justify-between p-4 bg-primary/50 rounded-xl border border-neutral-mid hover:border-accent/50 transition-all group"
                >
                  <span className="text-white font-medium">{cat.name}</span>
                  <button
                    onClick={() => handleDeleteCategory(cat.id)}
                    className="text-neutral-light hover:text-danger p-2 transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminCategories;
