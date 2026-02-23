import { useState } from "react";
import toast from "react-hot-toast";
import api from "../api/axios";

const CompanyOverview = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await api.post("/contact", formData);
      toast.success(response.data.message || "Message sent successfully!");
      setFormData({ name: "", email: "", subject: "", message: "" });
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send message.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-primary py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-12">
        {/* Header Section */}
        <div className="text-center space-y-4">
          <h1 className="text-5xl font-extrabold text-white tracking-tight">
            About Vaayu<span className="text-accent">GO</span>
          </h1>
          <p className="text-xl text-neutral-light max-w-2xl mx-auto leading-relaxed">
            Revolutionizing the way you shop locally and manage your business.
            We bridge the gap between customers and local shops with seamless
            digital experiences.
          </p>
        </div>

        {/* Company Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-neutral-dark rounded-2xl shadow-lg p-8 border border-neutral-light/20 hover:shadow-xl transition-shadow">
            <div className="h-12 w-12 bg-primary/10 rounded-xl flex items-center justify-center text-accent mb-6">
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
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                ></path>
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">Our Mission</h3>
            <p className="text-neutral-light leading-relaxed">
              To empower local businesses with powerful digital tools while
              providing customers with a convenient, fast, and reliable platform
              to interact with their favorite local stores. We strive to create
              a thriving digital local economy.
            </p>
          </div>

          <div className="bg-neutral-dark rounded-2xl shadow-lg p-8 border border-neutral-light/20 hover:shadow-xl transition-shadow">
            <div className="h-12 w-12 bg-accent/10 rounded-xl flex items-center justify-center text-accent mb-6">
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
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                ></path>
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">
              Customer Support
            </h3>
            <p className="text-neutral-light leading-relaxed mb-6">
              We are here to help you around the clock. If you have any
              questions or issues, please reach out to our support team.
            </p>
            <div className="flex items-center space-x-3 text-lg font-medium text-white">
              <svg
                className="w-5 h-5 text-accent"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                ></path>
              </svg>
              <span>support@vaayugo.com</span>
            </div>
          </div>
        </div>

        {/* Contact Us Form */}
        <div className="bg-neutral-dark rounded-3xl shadow-2xl overflow-hidden border border-neutral-light/20">
          <div className="grid grid-cols-1 lg:grid-cols-5">
            <div className="lg:col-span-2 bg-linear-to-br from-primary to-accent p-10 text-white flex flex-col justify-between relative overflow-hidden">
              <div className="absolute inset-0 bg-black/10 mix-blend-overlay"></div>
              <div className="relative z-10">
                <h3 className="text-3xl font-bold mb-4">Get in Touch</h3>
                <p className="text-white/80 leading-relaxed mb-8">
                  Have a question, feedback, or need assistance? Fill out the
                  form, and our admins will get back to you shortly.
                </p>
              </div>
              <div className="relative z-10 space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      ></path>
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      ></path>
                    </svg>
                  </div>
                  <span>Mumbai, MH, India</span>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      ></path>
                    </svg>
                  </div>
                  <span>support@vaayugo.com</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-3 p-10">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label
                      htmlFor="name"
                      className="block text-sm font-semibold text-neutral-light"
                    >
                      Full Name *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-neutral-mid text-primary-text rounded-lg border border-neutral-light focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition-all placeholder-neutral-light"
                      placeholder="John Doe"
                    />
                  </div>
                  <div className="space-y-2">
                    <label
                      htmlFor="email"
                      className="block text-sm font-semibold text-neutral-light"
                    >
                      Email Address *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-neutral-mid text-primary-text rounded-lg border border-neutral-light focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition-all placeholder-neutral-light"
                      placeholder="john@example.com"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="subject"
                    className="block text-sm font-semibold text-neutral-light"
                  >
                    Subject *
                  </label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    required
                    value={formData.subject}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-neutral-mid text-primary-text rounded-lg border border-neutral-light focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition-all placeholder-neutral-light"
                    placeholder="How can we help?"
                  />
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="message"
                    className="block text-sm font-semibold text-neutral-light"
                  >
                    Message *
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    required
                    rows="5"
                    value={formData.message}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-neutral-mid text-primary-text rounded-lg border border-neutral-light focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition-all resize-none placeholder-neutral-light"
                    placeholder="Write your message here..."
                  ></textarea>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full md:w-auto px-8 py-3 bg-accent text-white font-bold rounded-lg shadow-md hover:bg-secondary hover:shadow-lg focus:ring-4 focus:ring-accent/30 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {loading ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
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
                      <span>Sending...</span>
                    </>
                  ) : (
                    <span>Send Message</span>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyOverview;
