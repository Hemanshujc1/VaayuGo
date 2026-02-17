# Implementation Plan: VaayuGo (Detailed)

This document outlines the step-by-step plan to build the VaayuGo Hyperlocal Scheduled-Commerce Platform, strictly adhering to the "Scheduled Delivery" model and extensive Admin controls.

## Phase 1: Foundation & Architecture Setup

**Goal:** Establish a solid technical base capable of handling configurable rules and scheduled batches.

### 1.1 Project Structure

- [x] Initialize Git Repository.
- [x] Set up directory structure:
  - `/client` (React + Vite)
  - `/server` (Node.js + Express)
  - `/shared` (Types/Constants for Slots, Statuses, roles)

### 1.2 Database (MySQL) Design & ERD

**Core Entities:**

- [x] `Users`
  - `id`, `email`, `password_hash`, `role` (customer, shopkeeper, admin), `is_blocked`, `created_at`
- [x] `Shops`
  - `id`, `owner_id`, `name`, `category` (Attributes: Street Food, Grocery, Medical, Xerox), `location` (lat/long + address), `status` (pending, approved, rejected, suspended), `is_open`, `rating`
- [x] `ServiceConfig` (Admin Controlled Rules per Shop/Category)
  - `id`, `shop_id` (nullable, if global), `category` (nullable, if global), `min_order_value`, `delivery_fee`, `commission_rate`, `delivery_revenue_share` (Shop vs VaayuGo split), `is_prepaid_only` (bool, e.g., true for Xerox)
- [x] `DeliverySlots`
  - `id`, `name` (Lunch, Evening, Night), `start_time`, `end_time`, `cutoff_time`, `is_active`
- [x] `Products`
  - `id`, `shop_id`, `name`, `price`, `description`, `image_url`, `is_available`
- [x] `Orders`
  - `id`, `customer_id`, `shop_id`, `slot_id` (FK to DeliverySlots), `status` (Placed, Accepted, Preparing, Out_for_Delivery, Delivered, Cancelled), `order_type` (Normal, Xerox), `total_amount`, `delivery_fee`, `commission_amount`, `shop_earnings`, `platform_earnings`, `payment_method` (COD, Online), `payment_status`, `document_url` (for Xerox)
- [x] `OrderItems`
  - `id`, `order_id`, `product_id`, `quantity`, `price_at_order`
- [x] `CommissionLogs`
  - `id`, `order_id`, `shop_id`, `amount`, `type` (Commission, DeliveryFeeShare), `created_at`

### 1.3 Backend Setup

- [x] Initialize Express app clearly separating `admin` routes from `client` routes.
- [x] Configure `cors`, `helmet`, `dotenv`.
- [x] Implement Global Error Handling.
- [x] Set up MySQL connection (Sequelize or similar ORM recommended for complex relationships).

---

## Phase 2: Core Services - Authentication & Role Management

**Goal:** Secure access with specific flows for Shopkeeper approval and Admin checks.

### 2.1 Backend (Auth)

- [x] `POST /api/auth/register`:
  - Customers: Auto-active.
  - Shopkeepers: Created as `pending`.
  - Admins: Only created by other Admins (seed first admin).
- [x] `POST /api/auth/login`: JWT Token with Role payload.
- [x] Middleware:
  - `authenticateToken`: Verify JWT.
  - `authorizeRole(['admin', 'shopkeeper'])`: Role-based access control.
  - `checkShopStatus`: Middleware to block actions if shop is suspended.

### 2.2 Frontend (Auth)

- [x] Login Page with Role separation if needed (or unified login).
- [x] Registration Page:
  - Customer Flow: Phone/Email + Password.
  - Shopkeeper Flow: Shop Name, Category, Location, Owner Details.
- [x] Context/State: `useAuth` hook storing user info and role.

---

## Phase 3: Admin Configuration & Control (The "Brain")

**Goal:** Enable the "Admin-First" control model for fees, slots, and approvals.

### 3.1 Global & Granular Configuration

- [x] **Backend**:
  - `POST /api/admin/config`: Create/Update rules for `delivery_fee`, `commission_rate` based on `category` or specific `shop_id`.
  - `GET /api/admin/config`: Fetch current active rules.
  - `POST /api/admin/slots`: Create/Update Delivery Slots (e.g., Lunch 12:00-14:00, Cutoff 11:00).
- [x] **Frontend**:
  - **Master Rules Engine**: UI to set default fees/commissions per category.
  - **Slot Manager**: UI to add/remove delivery slots and set cutoff times.
  - **Shop Overrides**: UI to set specific rules for a specific shop if needed.

### 3.2 Shop & User Validation

- [x] **Backend**:
  - `PATCH /api/admin/shops/:id/approve`: Approve pending shop.
  - `PATCH /api/admin/shops/:id/reject`: Reject shop.
  - `PATCH /api/admin/users/:id/block`: Block a user (customer or shop).
- [x] **Frontend**:
  - **Shop Verification Queue**: List of pending shops with "Approve/Reject" actions.
  - **User Management**: Searchable list of users to block/unblock.

---

## Phase 4: Shopkeeper Supply Side

**Goal:** Simple interface for batch acceptance and status updates.

### 4.1 Onboarding & Dashboard

- [x] **Backend**:
  - `GET /api/shop/profile`: Get shop details + current active Admin Rules (fees/commissions applying to them).
  - `PATCH /api/shop/status`: Toggle Open/Closed.
- [x] **Frontend**:
  - Shop Profile Setup (Upload Image, Set Location).
  - Dashboard Header: "Open/Closed" toggle.

### 4.2 Product Management

- [x] **Backend**:
  - CRUD Products.
  - `POST /api/shop/products`: Add item (Name, Price, Image, Stock Quantity).
  - `PUT /api/shop/products/:id`: Update item details and stock.
  - `PUT /api/shop/products/:id/availability`: Toggle stock (Auto-sets stock to 0 if unavailable).
- [x] **Frontend**:
  - Product List with "In Stock" toggles and Stock Quantity display.
  - Edit Product form with Stock Management.

### 4.3 Batch Order Management

- [x] **Backend**:
  - `GET /api/shop/orders`: Filter by `slot_id` (e.g., "Show me Lunch Batch").
  - `PATCH /api/shop/orders/:id/status`: Update status (Accept -> Preparing -> Out for Delivery).
- [x] **Frontend**:
  - **Batch View**: Group orders by Delivery Slot (Lunch, Evening).
  - **Action**: "Accept Batch" or individual "Accept".
  - **Print View**: Simple list for packing.

---

## Phase 5: Customer Demand Side

**Goal:** Scheduled ordering flow with strict slot enforcing.

### 5.1 Discovery & Selection

- [x] **Backend**:
  - `GET /api/shops`: List shops (Apply filters: Category, Location).
  - `GET /api/config/slots`: distinct list of available slots derived from Admin config.
- [x] **Frontend**:
  - **Home**: List Categories (Street Food, Xerox, etc.).
  - **Shop List**: Show "Next Slot: Lunch (Order within 30 mins)".
  - **Shop Detail**: Menu + "Minimum Order Value" banner.

### 5.2 Cart, Logic & Uploads

- [x] **Backend**:
  - `POST /api/cart/calculate`: Dynamic pricing endpoint.
    - Input: Items, ShopID.
    - Logic: Fetch Admin Rule for Shop -> Apply Delivery Fee -> Calculate Total.
  - `POST /api/upload`: Multer middleware for PDF uploads (Xerox only).
- [x] **Frontend**:
  - **Cart**: Show Item Total + Delivery Fee (Explicitly).
  - **Xerox Flow**: If Category == Xerox -> Show File Upload Input (Limit: PDF only).
  - **Slot Selection**: Dropdown of Available Slots (Filter out slots where `CurrentTime > CutoffTime`).

### 5.3 Checkout & Order Placement

- [x] **Backend**:
  - `POST /api/orders`:
    - Valdiate Slot Cutoff again.
    - Validate Min Order Value.
    - If Xerox: Check `payment_status` (Must be Prepaid - Mock/Integration).
    - Save Order with calculated `commission_amount` and `shop_earnings` snapshots.
- [x] **Frontend**:
  - **Payment Options**:
    - General: COD or Online.
    - Xerox: Online Only (Banner: "Xerox orders are prepaid/no-refund").
  - **Confirmation**: Show "Delivered in [Slot Name] Slot".

---

## Phase 6: Financials & Analytics

**Goal:** Enable revenue tracking and splits.

### 6.1 Earnings Calculation (Backend)

- [x] Logic on Order Completion (`Delivered`):
  - Update `CommissionLogs`.
  - Calculate `Net Earnings` = `Order Value` - `Commission` + `Shop Delivery Share`.
  - Store this in a daily/monthly aggregate table for speed.

### 6.2 Visualizations

- [x] **Shopkeeper Dashboard**:
  - "Today's Earnings": Total Orders | Net Payout.
  - "Delivery Earnings": Specifically from the Delivery Fee Split.
- [x] **Admin Analytics**:
  - Revenue Graphs (Chart.js/Recharts).
  - Filters: "Last 7 Days", "By Category".
  - "Top Shops" List.
  - Export Button: Generate CSV/PDF of the data table.

---

## Phase 7: Deployment & Polish

### 7.1 Testing

- [x] **Unit Tests**: Fee Calculation Logic (Critical).
- **Integration Tests**: Order Flow (Place -> Accept -> Deliver).
- **Edge Cases**:
  - Order placed 1 min before cutoff.
  - Shop rejected by Admin while active orders exist.

### 7.2 Scalability Checks

- [ ] Database Indexing on `orders(shop_id, status)` and `orders(slot_id)`.
- [ ] Rate Limiting (prevent spam orders).

### 7.3 Final Launch Prep

- [x] Seed Default Admin Config (Slots: Lunch/Dinner, Fee: 10, Comm: 3%).
- [x] Environment Variables setup for Production.
