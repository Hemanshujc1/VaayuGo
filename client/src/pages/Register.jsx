import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";

const Register = () => {
  const [formData, setFormData] = useState({
    name: "",
    mobile_number: "",
    email: "",
    password: "",
    confirmPassword: "",
    location: "IIIT Trichy",
    address: "",
    role: "customer",
    // Shopkeeper specific fields
    shopName: "",
    category: "Street Food",
  });

  const { register } = useAuth();
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    const success = await register(formData);
    if (!success) {
      setError("Registration failed. Try again.");
    }
  };

  return (
    <div className="flex bg-primary min-h-screen">
      {/* Left Column: Branding / Graphic */}
      <div className="hidden lg:flex lg:w-1/2 bg-neutral-dark border-r border-neutral-mid items-center justify-center p-12 overflow-hidden fixed h-screen top-0">
        {/* Dynamic decorative elements */}
        <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-accent to-blue-500"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-accent rounded-full opacity-10 blur-3xl"></div>
        <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-blue-500 rounded-full opacity-10 blur-3xl"></div>

        <div className="relative z-10 text-center space-y-6">
          <h1 className="text-6xl font-extrabold text-white tracking-tight">
            Vaayu<span className="text-accent">GO</span>
          </h1>
          <p className="text-xl text-neutral-light max-w-md mx-auto leading-relaxed">
            Join the community today. Experience the smartest way to shop across
            campus.
          </p>
          <div className="pt-8">
            <div className="inline-flex gap-2">
              <div className="w-16 h-2 bg-accent rounded-full opacity-80"></div>
              <div className="w-4 h-2 bg-neutral-mid rounded-full"></div>
              <div className="w-4 h-2 bg-neutral-mid rounded-full"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Registration Form */}
      <div className="w-full lg:w-1/2 lg:ml-auto flex items-center justify-center p-8 relative min-h-screen">
        <div className="w-full max-w-xl space-y-8 my-auto">
          <div className="text-center lg:text-left space-y-2">
            <h2 className="text-3xl font-bold tracking-tight text-white mb-2 lg:hidden">
              Vaayu<span className="text-accent">GO</span>
            </h2>
            <h3 className="text-3xl font-bold tracking-tight text-white">
              Create Account
            </h3>
            <p className="text-neutral-light">
              Fill out your details to get started
            </p>
          </div>

          {/* Dedicated Error Message Box */}
          {error && (
            <div className="bg-red-900/30 border-l-4 border-red-500 p-4 rounded animate-pulse">
              <div className="flex">
                <div className="shrink-0">
                  <span className="text-red-400 text-lg">⚠️</span>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-red-300">{error}</p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2 space-y-1">
                <label className="block text-neutral-light text-sm font-semibold ml-1">
                  Register as
                </label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-neutral-mid rounded-lg focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent bg-neutral-dark text-white transition-colors"
                >
                  <option value="customer">Student / Customer</option>
                  <option value="shopkeeper">ShopKeeper</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-neutral-light text-sm font-semibold ml-1">
                  {formData.role === "shopkeeper" ? "Owner Name" : "Full Name"}
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-neutral-mid rounded-lg focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent bg-neutral-dark text-white placeholder-neutral-500 transition-colors"
                  placeholder="John Doe"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block text-neutral-light text-sm font-semibold ml-1">
                  Mobile Number
                </label>
                <input
                  type="tel"
                  name="mobile_number"
                  value={formData.mobile_number}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-neutral-mid rounded-lg focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent bg-neutral-dark text-white placeholder-neutral-500 transition-colors"
                  placeholder="9876543210"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block text-neutral-light text-sm font-semibold ml-1">
                  Email Address
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-neutral-mid rounded-lg focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent bg-neutral-dark text-white placeholder-neutral-500 transition-colors"
                  placeholder="name@example.com"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block text-neutral-light text-sm font-semibold ml-1">
                  Location Zone
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-neutral-mid rounded-lg focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent bg-neutral-dark text-neutral-500 cursor-not-allowed transition-colors"
                  required
                  disabled
                />
              </div>

              <div className="space-y-1">
                <label className="block text-neutral-light text-sm font-semibold ml-1">
                  Password
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-neutral-mid rounded-lg focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent bg-neutral-dark text-white placeholder-neutral-500 transition-colors"
                  placeholder="••••••••"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block text-neutral-light text-sm font-semibold ml-1">
                  Confirm Password
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-neutral-mid rounded-lg focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent bg-neutral-dark text-white placeholder-neutral-500 transition-colors"
                  placeholder="••••••••"
                  required
                />
              </div>

              {formData.role === "shopkeeper" && (
                <>
                  <div className="space-y-1">
                    <label className="block text-neutral-light text-sm font-semibold ml-1">
                      Shop Name
                    </label>
                    <input
                      type="text"
                      name="shopName"
                      value={formData.shopName}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-neutral-mid rounded-lg focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent bg-neutral-dark text-white placeholder-neutral-500 transition-colors"
                      placeholder="My Store"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-neutral-light text-sm font-semibold ml-1">
                      Shop Category
                    </label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-neutral-mid rounded-lg focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent bg-neutral-dark text-white transition-colors"
                    >
                      <option value="Street Food">Street Food</option>
                      <option value="Grocery">Grocery</option>
                      <option value="Medical">Medical</option>
                      <option value="Xerox">Xerox Document Center</option>
                    </select>
                  </div>
                </>
              )}

              <div className="md:col-span-2 space-y-1">
                <label className="block text-neutral-light text-sm font-semibold ml-1">
                  {formData.role === "shopkeeper"
                    ? "Exact Shop Location"
                    : "Full Delivery Address"}
                </label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-neutral-mid rounded-lg focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent bg-neutral-dark text-white placeholder-neutral-500 transition-colors resize-none"
                  placeholder={
                    formData.role === "shopkeeper"
                      ? "e.g. Near Main Gate, Building C"
                      : "e.g. Room 404, Boys Hostel"
                  }
                  rows={2}
                  required
                />
              </div>

              <div className="md:col-span-2 pt-2">
                <button
                  type="submit"
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-primary bg-accent hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent focus:ring-offset-primary transition duration-200"
                >
                  Create Account
                </button>
              </div>
            </div>
          </form>

          <div className="mt-8 text-center pb-8 border-t border-neutral-mid pt-8">
            <p className="text-sm text-neutral-light">
              Already have an account?{" "}
              <Link
                to="/login"
                className="text-accent hover:text-white font-bold transition-colors"
              >
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
