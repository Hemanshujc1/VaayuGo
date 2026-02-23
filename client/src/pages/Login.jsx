import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login } = useAuth();
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const result = await login(email, password);
    if (!result.success) {
      setError(result.message || "Invalid credentials");
    }

    setIsLoading(false);
  };

  return (
    <div className="flex h-screen bg-primary">
      {/* Left Column: Branding / Graphic */}
      <div className="hidden lg:flex lg:w-1/2 bg-neutral-dark border-r border-neutral-mid items-center justify-center p-12 relative overflow-hidden">
        {/* Dynamic decorative elements */}
        <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-accent to-blue-500"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-accent rounded-full opacity-10 blur-3xl"></div>
        <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-blue-500 rounded-full opacity-10 blur-3xl"></div>

        <div className="relative z-10 text-center space-y-6">
          <h1 className="text-6xl font-extrabold text-white tracking-tight">
            Vaayu<span className="text-accent">GO</span>
          </h1>
          <p className="text-xl text-neutral-light max-w-md mx-auto leading-relaxed">
            The smartest way to order from your campus shops. Fast, reliable,
            and built specifically for your needs.
          </p>
          {/* <div className="pt-8">
            <div className="inline-flex gap-2">
              <div className="w-16 h-2 bg-accent rounded-full opacity-80"></div>
              <div className="w-4 h-2 bg-neutral-mid rounded-full"></div>
              <div className="w-4 h-2 bg-neutral-mid rounded-full"></div>
            </div>
          </div> */}
        </div>
      </div>

      {/* Right Column: Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 relative">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center lg:text-left space-y-2">
            <h2 className="text-3xl font-bold tracking-tight text-white mb-2 lg:hidden">
              Vaayu<span className="text-accent">GO</span>
            </h2>
            <h3 className="text-3xl font-bold tracking-tight text-white">
              Welcome back
            </h3>
            <p className="text-neutral-light">
              Enter your details to access your account
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
            <div className="space-y-1">
              <label className="block text-neutral-light text-sm font-semibold ml-1">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-neutral-mid rounded-lg focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent bg-neutral-dark text-white placeholder-neutral-500 transition-colors"
                  placeholder="name@example.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-neutral-light text-sm font-semibold ml-1">
                Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-neutral-mid rounded-lg focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent bg-neutral-dark text-white placeholder-neutral-500 transition-colors"
                  placeholder="••••••••"
                  required
                />
              </div>
              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  className="text-xs text-neutral-light hover:text-accent font-medium"
                >
                  Forgot password?
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-bold text-primary bg-accent hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent focus:ring-offset-primary transition duration-200 mt-6 ${isLoading ? "opacity-70 cursor-not-allowed" : ""}`}
            >
              {isLoading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-sm text-neutral-light">
              Don't have an account?{" "}
              <Link
                to="/register"
                className="text-accent hover:text-white font-bold transition-colors"
              >
                Create one now
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
