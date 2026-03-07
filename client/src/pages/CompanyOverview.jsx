import React from "react";

const CompanyOverview = () => {
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

          {/* Mission */}
          <div className="bg-neutral-dark rounded-2xl shadow-lg p-8 border border-neutral-light/20 hover:shadow-xl transition-shadow">
            <div className="h-12 w-12 bg-primary/10 rounded-xl flex items-center justify-center text-accent mb-6">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
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

          {/* Customer Support */}
          <div className="bg-neutral-dark rounded-2xl shadow-lg p-8 border border-neutral-light/20 hover:shadow-xl transition-shadow">
            <div className="h-12 w-12 bg-accent/10 rounded-xl flex items-center justify-center text-accent mb-6">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                />
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
                />
              </svg>

              <span>support@vaayugo.com</span>
            </div>
          </div>

        </div>

        {/* Contact Info Section */}
        <div className="bg-neutral-dark rounded-2xl shadow-lg p-8 border border-neutral-light/20 text-white">
          <h3 className="text-2xl font-bold mb-6">Contact Information</h3>

          <div className="space-y-4 text-neutral-light">

            <div className="flex items-center space-x-4">
              <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
              </svg>
              <span>Mumbai, MH, India</span>
            </div>

            <div className="flex items-center space-x-4">
              <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8"
                />
              </svg>
              <span>support@vaayugo.com</span>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

export default CompanyOverview;
