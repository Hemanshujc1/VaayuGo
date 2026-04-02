# VaayuGO

![VaayuGO Logo](https://via.placeholder.com/150)

VaayuGO is a premium, full-stack delivery and marketplace platform designed to provide a seamless experience for customers, shopkeepers, and administrators. Built with a focus on visual excellence, performance, and robust scalability, VaayuGO streamlines the entire lifecycle of commerce—from product discovery to final settlement.

## 🚀 Key Features

### 🛡️ Admin Powerhouse
- **Comprehensive Governance**: Manage users, shops, and platform-wide rules from a centralized dashboard.
- **Penalty Management System**: A specialized system to issue, track, and integrate penalties into settlements automatically.
- **Bulk Operations**: Streamlined data management with CSV and Zip-based bulk uploads for products and storefronts.
- **Dynamic Rules Engine**: Configure global platform behaviors, delivery slots, and complex discount logic.
- **Financial Transparency**: Automated settlement generation with detailed ledgers and revenue logs.

### 🏪 Shopkeeper Hub
- **Seamless Onboarding**: Intuitive registration and profile setup for new vendors.
- **Inventory Management**: Tools for individual or bulk product updates and category organization.
- **Order Command Center**: Real-time order processing with status tracking and history.
- **Earnings Analytics**: Clear visibility into revenue, pending settlements, and financial performance.

### 🛍️ Customer Experience
- **Premium UI/UX**: A modern, glassmorphic interface powered by Tailwind CSS 4 and smooth animations.
- **Smart Marketplace**: Intuitive product discovery, cart management, and dynamic checkout flows.
- **Real-time Tracking**: Monitor order progress from placement to delivery.
- **Personalized Profiles**: Manage addresses, order history, and preferences easily.

## 🛠 Tech Stack

VaayuGO leverages a modern, high-performance stack to ensure a responsive and reliable experience.

- **Frontend**: React 19, Vite 7, Tailwind CSS 4, Lucide React, Axios, React Hot Toast.
- **Backend**: Node.js 20+, Express 5, Sequelize ORM.
- **Database**: MySQL.
- **Utilities**: 
  - **Communications**: Nodemailer (Email notifications).
  - **Media**: Sharp (Image optimization), Multer (File uploads).
  - **Documents**: PDF-lib & JSPDF (Automated invoicing and reporting).

## 📦 Getting Started

### Prerequisites

- **Node.js**: v20 or higher
- **Database**: MySQL 8.0+
- **Package Manager**: npm or yarn

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Hemanshujc1/VaayuGo.git
   cd VaayuGo
   ```

2. **Install Dependencies**:
   Install root, client, and server dependencies:
   ```bash
   # From root
   npm run install-all # or manually run npm install in /client and /server
   ```

3. **Environment Configuration**:
   Create `.env` files in both `client/` and `server/` directories based on the provided examples.

4. **Initialize Database**:
   ```bash
   cd server
   npm run db:init
   ```

5. **Run Locally**:
   ```bash
   # Start both frontend and backend
   npm run dev
   ```

## 📐 Architecture

VaayuGO follows a clean, modular architecture for maximum maintainability:

- **Client**: Vite-based React application with specialized role-based routing.
- **Server**: Express-based REST API utilizing the Controller-Service-Model pattern.
- **Models**: Sequelize-defined schemas ensuring type safety and relational integrity.
- **Middleware**: Robust layers for JWT authentication, role verification, and global error handling.

---

Built with ❤️ by the VaayuGO Team.
