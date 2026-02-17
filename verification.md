# VaayuGo Verification Guide

Use this guide to verify the features implemented so far.

## Prerequisites

1.  **Backend Running**: `cd server && npm start` (Port 3001)
    - _Check_: Should say "MySQL Database Connected & Models Synced"
2.  **Frontend Running**: `cd client && npm run dev` (Port 5173)
    - _Check_: Open `http://localhost:5173` in browser.

---

## 1. Authentication (Phase 2)

### Test Registration

1.  Go to `http://localhost:5173/register`
2.  **Customer Registration**:
    - Fill details: `testuser`, `test@example.com`, `password123`.
    - Select **Customer**.
    - Click **Register**.
    - _Expected_: Redirects to Home Page (`/`).

3.  **Shopkeeper Registration**:
    - Go to Register page again.
    - Fill details: `shopowner`, `owner@example.com`, `password123`.
    - Select **Shopkeeper**.
    - Click **Register**.
    - _Expected_: Redirects to Shop Onboarding (`/shop/onboarding` or `/shop/register`).

### Test Login

1.  /shop (or open Incognito).
2.  Go to `http://localhost:5173/login`.
3.  Enter `owner@example.com` / `password123`.
4.  Click **Sign In**.
5.  _Expected_: Redirects to Shop Dashboard (or Onboarding if shop not created).

---

## 2. Shopkeeper Module (Phase 3 & 4)

### Test Shop Registration

1.  Login as **Shopkeeper** (`owner@example.com`).
2.  Navigate to `http://localhost:5173/shop/register`.
3.  Fill form:
    - **Name**: "Fresh Mart"
    - **Category**: "Grocery"
    - **Address**: "123 Main St, Mumbai"
4.  Click **Create Shop**.
5.  _Expected_: Redirects to Shop Dashboard (`/shop/dashboard`).
    - Header: "Fresh Mart"
    - Status: "Pending" (until Admin approves)

### Test Product Management

1.  On Shop Dashboard, click **Manage Products** (`/shop/products`).
2.  **Add Product**:
    - Click **Add New Product**.
    - Name: `Pencil`, Price: `5`, Stock: `Available`.
    - Click **Add**.
    - _Expected_: Product appears in the list.
3.  **Verify Persistence**: Reload the page. Product should still be there.
4.  **Delete Product**:
    - Click **Delete** on the product card.
    - Confirm dialog (if any).
    - _Expected_: Product is removed from list.

### Test Order Management

1.  On Shop Dashboard, click **Manage Orders** (`/shop/orders`).
2.  **View Orders**:
    - Should see list of incoming orders (if any).
3.  **Update Status**:
    - Change status from "Pending" -> "Accepted" -> "Delivered".
    - _Expected_: Status updates in real-time or after refresh.

---

## 3. Admin Module (Phase 3 & 6)

### Test Dashboard & Approvals

1.  Login as **Admin** (`admin@vaayugo.com` / `password123`).
2.  **Dashboard (`/admin/dashboard`)**:
    - _Check_: Verify "Total Users", "Active Shops", "Revenue" cards are displayed.
3.  **Approve Shop**:
    - Go to **Pending Shops** section.
    - Find "Fresh Mart".
    - Click **Approve**.
    - _Expected_: Shop status changes to "Active".

### Test Service Configuration

1.  Go to **Service Config** (if linked) or verified via backend default seeding.
2.  _Check_: Default delivery fees and commissions are active.

---

## 4. Customer Module (Phase 5)

### Test Shop Discovery

1.  Login as **Customer** (`test@example.com`).
2.  **Home Page**:
    - _Check_: "Fresh Mart" (after approval) should appear in the list.
    - Click on "Fresh Mart".
    - _Expected_: Redirect to `/shop/:id` showing products.

### Test Cart & Checkout

1.  **Add to Cart**:
    - In Shop Details, click **Add** on "Pencil".
    - Go to **Cart** (`/cart`).
    - _Expected_: Item shown with Price `5` + Delivery Fee.
2.  **Checkout**:
    - Click **Proceed to Pay**.
    - Enter Address: "Flat 101, Residency".
    - Click **Place Order**.
    - _Expected_: "Order Placed Successfully" -> Redirect to `/my-orders`.

### Test Xerox Order (Special Flow)

1.  Navigate to a "Xerox" category shop (create one as Shopkeeper if needed).
2.  _Check_: Instead of products, "Upload Document" form appears.
3.  **Upload**:
    - Select a PDF file.
    - Choose "Black & White", "Double Sided".
    - Click **Add to Cart**.
4.  **Checkout**: Follow standard checkout flow.

---

## 5. Database Verification

To check data in the database directly:

1.  Open terminal in project root.
2.  Login to MySQL: `mysql -u root -p` (enter password from `.env`).
3.  Run SQL:
    ```sql
    USE vaayugo;
    SELECT * FROM Users;
    SELECT * FROM Shops;
    SELECT * FROM Products;
    SELECT * FROM Orders;
    ```
