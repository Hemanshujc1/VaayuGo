# VaayuGO

![VaayuGO Logo](https://via.placeholder.com/150)

VaayuGO is a modern delivery and marketplace platform designed to connect shopkeepers and customers with a seamless, efficient, and transparent experience. Built with a focus on visual excellence and robust scalability, VaayuGO streamlines order management, settlements, and platform governance.

## 🚀 Features

- **Store Management**: Easy onboarding and product management for shopkeepers.
- **Dynamic Marketplace**: A premium shopping experience for customers with real-time tracking.
- **Smart Settlements**: Automated financial tracking and payouts.
- **Platform Governance**: Tools for admins to manage roles, orders, and now a comprehensive **Penalty Management System**.
- **Role-Based Access**: Specialized interfaces for Customers, Shopkeepers, and Admins.

## 🛠 Tech Stack

- **Frontend**: React.js with modern CSS (Vanilla CSS, Glassmorphism, Premium UI)
- **Backend**: Node.js & Express
- **Database**: PostgreSQL / MongoDB (depending on implementation)
- **Communication**: Email notifications via SendGrid/Nodemailer

## 📦 Getting Started

### Prerequisites

- Node.js (v16+)
- npm or yarn

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/Hemanshujc1/VaayuGo.git
   cd VaayuGo
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Configure environment variables:
   - Create a `.env` file in the root directory.
   - Add necessary keys (DB_URL, API_KEYS, etc.).

4. Start the development server:
   ```bash
   npm run dev
   ```

## 📐 Architecture

VaayuGO follows a clean, modular architecture:

- **Controllers**: Handle business logic and request processing.
- **Services**: Abstract complex operations (e.g., OrderService, SettlementService).
- **Models**: Define data structures and relationships.
- **Middleware**: Manage authentication, logging, and error handling.

## ⚖️ Governance: Penalty Management System

The latest addition to VaayuGO is a robust **Penalty Management System**. This allows Admins to:

- Issue penalties for policy violations.
- Maintain a separate penalty ledger for transparent accounting.
- Automatically integrate penalties into settlements and checkouts without cluttering daily order logs.

---

Built with ❤️ by the VaayuGO Team.
