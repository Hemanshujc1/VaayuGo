import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../api/axios";

// SVG Components for UI
const EyeIcon = ({ show }) => (
  <svg
    className="w-5 h-5 text-neutral-light hover:text-white transition-colors"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    {show ? (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
      />
    ) : (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
      />
    )}
  </svg>
);

const EnvelopeIcon = () => (
  <svg
    className="w-5 h-5"
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
);

const ForgotPassword = () => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const navigate = useNavigate();

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter your email address");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/auth/forgot-password", { email });
      toast.success(res.data.message || "OTP sent successfully!");
      setStep(2);
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Failed to send OTP. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();

    if (!otp || !newPassword || !confirmPassword) {
      toast.error("Please fill in all fields");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/auth/reset-password", {
        email,
        otp,
        newPassword,
      });
      toast.success(res.data.message || "Password reset successful!");
      navigate("/login");
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Failed to reset password. Invalid OTP or expired.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)]flex items-center justify-center bg-primary py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent opacity-20 blur-[100px] rounded-full mix-blend-screen"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary opacity-20 blur-[100px] rounded-full mix-blend-screen"></div>
      </div>

      <div className="max-w-md w-full relative z-10 mx-auto mt-10">
        <div className="text-center mb-8">
          <Link to="/" className="inline-block">
            <h1 className="text-4xl font-extrabold text-white tracking-tight">
              Vaayu<span className="text-accent">GO</span>
            </h1>
          </Link>
        </div>

        <div className="bg-neutral-dark rounded-2xl shadow-xl border border-neutral-light/10 overflow-hidden backdrop-blur-sm">
          <div className="p-8">
            <h2 className="text-2xl font-bold text-white mb-2 text-center">
              {step === 1 ? "Forgot Password?" : "Reset Password"}
            </h2>
            <p className="text-neutral-light text-center mb-8 text-sm">
              {step === 1
                ? "Enter your email address to receive a secure One-Time Password."
                : "Enter the 6-digit OTP sent to your email along with your new password."}
            </p>

            {step === 1 && (
              <form onSubmit={handleRequestOtp} className="space-y-6">
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-neutral-light mb-2"
                  >
                    Email Address
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-light group-focus-within:text-accent transition-colors">
                      <EnvelopeIcon />
                    </div>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="block w-full pl-10 px-4 py-3 bg-primary border border-neutral-mid rounded-xl text-white focus:ring-2 focus:ring-accent focus:border-accent transition-all placeholder-neutral-light/50"
                      placeholder="you@example.com"
                      disabled={loading}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-primary bg-accent hover:bg-white hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-primary focus:ring-accent transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center">
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-primary"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Sending OTP...
                    </span>
                  ) : (
                    "Send OTP"
                  )}
                </button>
              </form>
            )}

            {step === 2 && (
              <form onSubmit={handleResetPassword} className="space-y-6">
                <div>
                  <label
                    htmlFor="otp"
                    className="block text-sm font-medium text-neutral-light mb-2"
                  >
                    6-Digit OTP
                  </label>
                  <input
                    id="otp"
                    name="otp"
                    type="text"
                    required
                    maxLength="6"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))} // Only allow digits
                    className="block w-full px-4 py-3 bg-primary border border-neutral-mid rounded-xl text-white focus:ring-2 focus:ring-accent focus:border-accent transition-all text-center tracking-widest text-xl font-mono"
                    placeholder="------"
                    disabled={loading}
                  />
                </div>

                <div>
                  <label
                    htmlFor="new-password"
                    className="block text-sm font-medium text-neutral-light mb-2"
                  >
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      id="new-password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="block w-full px-4 py-3 bg-primary border border-neutral-mid rounded-xl text-white focus:ring-2 focus:ring-accent focus:border-accent transition-all pr-12"
                      placeholder="••••••••"
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center focus:outline-none"
                    >
                      <EyeIcon show={showPassword} />
                    </button>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="confirm-password"
                    className="block text-sm font-medium text-neutral-light mb-2"
                  >
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      id="confirm-password"
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="block w-full px-4 py-3 bg-primary border border-neutral-mid rounded-xl text-white focus:ring-2 focus:ring-accent focus:border-accent transition-all pr-12"
                      placeholder="••••••••"
                      disabled={loading}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute inset-y-0 right-0 pr-3 flex items-center focus:outline-none"
                    >
                      <EyeIcon show={showConfirmPassword} />
                    </button>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    disabled={loading}
                    className="w-1/3 flex justify-center items-center py-3 px-4 border border-neutral-light/20 rounded-xl shadow-sm text-sm font-semibold text-white bg-neutral-mid hover:bg-neutral-light/20 focus:outline-none transition-all duration-200"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-2/3 flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-primary bg-accent hover:bg-white hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-primary focus:ring-accent transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <span className="animate-pulse">Processing...</span>
                    ) : (
                      "Reset Password"
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>

          <div className="px-8 py-4 bg-primary/50 border-t border-neutral-light/10 text-center">
            <span className="text-sm text-neutral-light">
              Remember your password?{" "}
              <Link
                to="/login"
                className="font-semibold text-accent hover:text-white transition-colors"
              >
                Back to Login
              </Link>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
