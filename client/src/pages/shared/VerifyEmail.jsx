import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import toast from "react-hot-toast";

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const { verifyOtp, resendOtp } = useAuth();

  const [email, setEmail] = useState(searchParams.get("email") || "");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    let interval;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleOtpChange = (element, index) => {
    if (isNaN(element.value)) return false;
    const newOtp = [...otp];
    newOtp[index] = element.value;
    setOtp(newOtp);

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
    if (!email) {
      setError("Please enter your email address");
      return;
    }

    setIsVerifying(true);
    setError("");
    const otpString = otp.join("");

    if (otpString.length < 6) {
      setError("Please enter the full 6-digit code");
      setIsVerifying(false);
      return;
    }

    const success = await verifyOtp(email, otpString);
    setIsVerifying(false);
    if (!success) {
      setError("Verification failed. Please check the code and try again.");
    }
  };

  const handleResendOtp = async () => {
    if (!email) {
      setError("Please enter your email address first");
      return;
    }
    if (resendTimer > 0) return;

    const success = await resendOtp(email);
    if (success) {
      setResendTimer(60);
      setError("");
    }
  };

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

        <h2 className="text-3xl font-bold text-white">Email Verification</h2>
        <p className="text-neutral-light leading-relaxed">
          Enter your email and the 6-digit code sent to you.
        </p>

        {error && (
          <div className="bg-red-900/30 border-l-4 border-red-500 p-4 rounded text-left">
            <p className="text-sm font-medium text-red-300">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6 text-left">
          <div className="space-y-1">
            <label className="block text-neutral-light text-sm font-semibold ml-1">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-neutral-mid rounded-lg focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent bg-neutral-dark text-white placeholder-neutral-500 transition-colors"
              placeholder="name@example.com"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="block text-neutral-light text-sm font-semibold ml-1">
              Verification Code
            </label>
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
          </div>

          <button
            type="submit"
            disabled={isVerifying}
            className="w-full py-3 px-4 rounded-lg font-bold text-primary bg-accent hover:bg-secondary disabled:opacity-50 transition duration-200"
          >
            {isVerifying ? "Verifying..." : "Verify Email"}
          </button>
        </form>

        <div className="pt-2">
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
          className="text-sm text-neutral-500 hover:text-white transition-colors block border-t border-neutral-mid pt-4"
        >
          Back to Login
        </Link>
      </div>
    </div>
  );
};

export default VerifyEmail;
