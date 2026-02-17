import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";

const Register = () => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    role: "customer",
  });
  const { register } = useAuth();
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const success = await register(formData);
    if (!success) {
      setError("Registration failed. Try again.");
    }
  };

  return (
    <div className="flex justify-center items-center h-screen bg-primary">
      <div className="w-full max-w-md bg-neutral-dark p-8 rounded shadow-md border-t-4 border-accent">
        <h2 className="text-2xl font-bold mb-6 text-center text-white">
          Join Vaayu<span className="text-accent">GO</span>
        </h2>
        {error && (
          <p className="text-danger mb-4 text-center bg-red-100 p-2 rounded">
            {error}
          </p>
        )}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-neutral-light text-sm font-bold mb-2">
              Username
            </label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-neutral-mid rounded focus:outline-none focus:ring-2 focus:ring-accent bg-neutral-mid text-white placeholder-neutral-light"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-neutral-light text-sm font-bold mb-2">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-neutral-mid rounded focus:outline-none focus:ring-2 focus:ring-accent bg-neutral-mid text-white placeholder-neutral-light"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-neutral-light text-sm font-bold mb-2">
              Password
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-neutral-mid rounded focus:outline-none focus:ring-2 focus:ring-accent bg-neutral-mid text-white placeholder-neutral-light"
              required
            />
          </div>
          <div className="mb-6">
            <label className="block text-neutral-light text-sm font-bold mb-2">
              I am a:
            </label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-neutral-mid rounded focus:outline-none focus:ring-2 focus:ring-accent bg-neutral-mid text-white"
            >
              <option value="customer">Customer</option>
              <option value="shopkeeper">Shopkeeper</option>
            </select>
          </div>
          <button
            type="submit"
            className="w-full bg-accent text-primary font-bold py-2 rounded hover:bg-secondary hover:text-white transition duration-200"
          >
            Register
          </button>
        </form>
        <p className="mt-4 text-center text-neutral-light">
          Already have an account?{" "}
          <Link to="/login" className="text-accent hover:underline font-bold">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
