import { useState, useEffect } from "react";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import { Link } from "react-router-dom";

const Register = () => {
  const [formData, setFormData] = useState({
    name: "",
    mobile_number: "",
    email: "",
    password: "",
    confirmPassword: "",
    location: "",
    address: "",
    role: "customer",
    // Shopkeeper specific fields
    shopName: "",
    category: "",
    opening_time: "09:00",
    closing_time: "21:00",
    break_start: "",
    break_end: "",
    closed_days: [],
  });

  const { register, verifyOtp, resendOtp } = useAuth();
  const [error, setError] = useState("");
  const [verificationSent, setVerificationSent] = useState(false);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [resendTimer, setResendTimer] = useState(0);
  const [isVerifying, setIsVerifying] = useState(false);

  const [locations, setLocations] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    let interval;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [locRes, catRes] = await Promise.all([
          api.get("/public/locations"),
          api.get("/public/categories"),
        ]);
        setLocations(locRes.data);
        setCategories(catRes.data);

        let updates = {};
        if (locRes.data.length > 0) {
          updates.location = locRes.data[0].name;
        }
        if (catRes.data.length > 0) {
          updates.category = catRes.data[0].name;
        }
        if (Object.keys(updates).length > 0) {
          setFormData((prev) => ({ ...prev, ...updates }));
        }
      } catch (err) {
        console.error("Error fetching initial data", err);
      }
    };
    fetchInitialData();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleOtpChange = (element, index) => {
    if (isNaN(element.value)) return false;
    const newOtp = [...otp];
    newOtp[index] = element.value;
    setOtp(newOtp);

    // Focus next input
    if (element.nextSibling && element.value) {
      element.nextSibling.focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && !otp[index] && e.target.previousSibling) {
      e.target.previousSibling.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    const success = await register(formData);
    if (success) {
      setVerificationSent(true);
      setResendTimer(60);
      window.scrollTo(0, 0);
    } else {
      setError("Registration failed. Try again.");
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setIsVerifying(true);
    const otpString = otp.join("");
    if (otpString.length < 6) {
      // toast.error("Please enter the full 6-digit code"); // Assuming toast is available
      setError("Please enter the full 6-digit code");
      setIsVerifying(false);
      return;
    }

    const success = await verifyOtp(formData.email, otpString);
    setIsVerifying(false);
    if (!success) {
      setError("OTP verification failed. Please try again.");
    }
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0) return;
    const success = await resendOtp(formData.email);
    if (success) {
      setResendTimer(60);
      setError(""); // Clear previous error if resend is successful
    } else {
      setError("Failed to resend OTP. Please try again.");
    }
  };

  if (verificationSent) {
    return (
      <div className="flex bg-primary min-h-screen items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-md bg-neutral-dark border border-neutral-mid rounded-2xl p-6 sm:p-8 text-center space-y-6 shadow-2xl">
          <div className="w-20 h-20 bg-accent/20 rounded-full flex items-center justify-center mx-auto">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-10 w-10 text-accent"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-white">Verify Your Email</h2>
          <p className="text-neutral-light leading-relaxed">
            We've sent a 6-digit verification code to <br />
            <span className="text-white font-semibold">{formData.email}</span>
          </p>

          {/* Dedicated Error Message Box for OTP */}
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

          <form onSubmit={handleOtpSubmit} className="space-y-6">
            <div className="flex justify-between gap-1 sm:gap-2">
              {otp.map((data, index) => (
                <input
                  key={index}
                  type="text"
                  maxLength="1"
                  value={data}
                  onChange={(e) => handleOtpChange(e.target, index)}
                  onFocus={(e) => e.target.select()}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  className="w-10 h-12 sm:w-12 sm:h-14 text-center text-xl sm:text-2xl font-bold bg-neutral-mid border border-neutral-light/20 rounded-lg text-white focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
                  required
                />
              ))}
            </div>

            <button
              type="submit"
              disabled={isVerifying}
              className="w-full py-3 px-4 rounded-lg font-bold text-primary bg-accent hover:bg-secondary disabled:opacity-50 transition duration-200"
            >
              {isVerifying ? "Verifying..." : "Verify & Continue"}
            </button>
          </form>

          <div className="pt-4">
            <p className="text-sm text-neutral-light">
              Didn't receive the code?{" "}
              <button
                onClick={handleResendOtp}
                disabled={resendTimer > 0}
                className={`font-bold transition-colors ${resendTimer > 0 ? "text-neutral-500 cursor-not-allowed" : "text-accent hover:text-white"}`}
              >
                {resendTimer > 0 ? `Resend in ${resendTimer}s` : "Resend OTP"}
              </button>
            </p>
          </div>

          <Link
            to="/login"
            className="text-sm text-neutral-500 hover:text-white transition-colors block"
          >
            Cancel and Back to Login
          </Link>
        </div>
      </div>
    );
  }

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
      <div className="w-full lg:w-1/2 lg:ml-auto flex items-center justify-center p-4 sm:p-8 relative min-h-screen border-t lg:border-t-0 lg:border-l border-neutral-mid">
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
                  maxLength={50}
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
                  pattern="\d{10}"
                  maxLength={10}
                  minLength={10}
                  title="Mobile number must be exactly 10 digits"
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
                <select
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-neutral-mid rounded-lg focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent bg-neutral-dark text-white transition-colors"
                  required
                >
                  <option value="" disabled>
                    Select a location
                  </option>
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.name}>
                      {loc.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-neutral-light text-sm font-semibold ml-1">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-neutral-mid rounded-lg focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent bg-neutral-dark text-white placeholder-neutral-500 transition-colors pr-12"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-neutral-500 hover:text-accent transition-colors"
                  >
                    {showPassword ? (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                    ) : (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                        />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-neutral-light text-sm font-semibold ml-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-neutral-mid rounded-lg focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent bg-neutral-dark text-white placeholder-neutral-500 transition-colors pr-12"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-neutral-500 hover:text-accent transition-colors"
                  >
                    {showConfirmPassword ? (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                    ) : (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                        />
                      </svg>
                    )}
                  </button>
                </div>
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
                      maxLength={100}
                      minLength={3}
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
                      {categories.map((cat) => (
                        <option key={cat.id} value={cat.name}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-neutral-light text-sm font-semibold ml-1">
                      Opening Time
                    </label>
                    <input
                      type="time"
                      name="opening_time"
                      value={formData.opening_time}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-neutral-mid rounded-lg focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent bg-neutral-dark text-white transition-colors"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-neutral-light text-sm font-semibold ml-1">
                      Closing Time
                    </label>
                    <input
                      type="time"
                      name="closing_time"
                      value={formData.closing_time}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-neutral-mid rounded-lg focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent bg-neutral-dark text-white transition-colors"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-neutral-light text-sm font-semibold ml-1">
                      Break Start (Optional)
                    </label>
                    <input
                      type="time"
                      name="break_start"
                      value={formData.break_start}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-neutral-mid rounded-lg focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent bg-neutral-dark text-white transition-colors"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-neutral-light text-sm font-semibold ml-1">
                      Break End (Optional)
                    </label>
                    <input
                      type="time"
                      name="break_end"
                      value={formData.break_end}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-neutral-mid rounded-lg focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent bg-neutral-dark text-white transition-colors"
                    />
                  </div>

                  <div className="md:col-span-2 space-y-2">
                    <label className="block text-neutral-light text-sm font-semibold ml-1">
                      Weekly Closed Days (Optional)
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        "Monday",
                        "Tuesday",
                        "Wednesday",
                        "Thursday",
                        "Friday",
                        "Saturday",
                        "Sunday",
                      ].map((day) => (
                        <button
                          key={day}
                          type="button"
                          onClick={() => {
                            const current = formData.closed_days || [];
                            const updated = current.includes(day)
                              ? current.filter((d) => d !== day)
                              : [...current, day];
                            setFormData({ ...formData, closed_days: updated });
                          }}
                          className={`px-3 py-1.5 rounded-full text-[10px] font-bold border transition-all ${
                            formData.closed_days.includes(day)
                              ? "bg-red-900/40 border-red-500 text-red-200"
                              : "bg-neutral-mid border-neutral-light/20 text-neutral-light hover:border-neutral-light hover:text-white"
                          }`}
                        >
                          {day}
                        </button>
                      ))}
                    </div>
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
                  maxLength={255}
                  minLength={10}
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
