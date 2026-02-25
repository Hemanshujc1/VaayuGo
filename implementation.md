# VaayuGo Revenue & Rule Engine Implementation Plan (Detailed)

This document outlines the detailed step-by-step implementation plan for the updated VaayuGo Revenue and Rule Engine, which introduces Minimum Order Logic and flexible small-order handling.

**Important Note:** The required database tables (`DeliveryRule` and `OrderRevenueLog`) do **not** currently exist in the database or the native Sequelize models. This plan covers creating them from scratch.

---

## [x] Phase 1: Database & Schema Creation

Since the tables do not exist, we must create new Sequelize models and establish relationships in `server/models/index.js`.

### [x] 1.1 Create `DeliveryRule` Model

Create a new file: `server/models/DeliveryRule.js`

**Schema Definition:**

```javascript
module.exports = (sequelize, DataTypes) => {
  const DeliveryRule = sequelize.define(
    "DeliveryRule",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      location_id: {
        type: DataTypes.INTEGER,
        allowNull: false, // Every rule must at least belong to a location
      },
      category: {
        type: DataTypes.STRING,
        allowNull: true, // Null means it applies to all categories in the location
      },
      shop_id: {
        type: DataTypes.INTEGER,
        allowNull: true, // Null means it applies to all shops in the category/location
      },
      delivery_fee: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.0,
      },
      shop_delivery_share: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.0,
      },
      vaayugo_delivery_share: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.0,
      },
      commission_percent: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 0.0,
      },
      min_order_value: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true, // Null means no minimum order constraint
      },
      small_order_delivery_fee: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true, // Null means strict mode (block if below min_order_value)
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
    },
    {
      timestamps: true,
      tableName: "delivery_rules",
    },
  );

  return DeliveryRule;
};
```

### [x] 1.2 Create `OrderRevenueLog` Model

Create a new file: `server/models/OrderRevenueLog.js`

**Schema Definition:**

```javascript
module.exports = (sequelize, DataTypes) => {
  const OrderRevenueLog = sequelize.define(
    "OrderRevenueLog",
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      order_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      shop_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      order_value: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      is_small_order: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      applied_delivery_fee: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      applied_min_order_value: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
      commission_amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      shop_delivery_earned: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      vaayugo_delivery_earned: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      shop_final_earning: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      vaayugo_final_earning: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
    },
    {
      timestamps: true,
      tableName: "order_revenue_logs",
    },
  );

  return OrderRevenueLog;
};
```

### [x] 1.3 Update `server/models/index.js`

Register the new models and establish associations.

```javascript
const DeliveryRule = require("./DeliveryRule")(sequelize, DataTypes);
const OrderRevenueLog = require("./OrderRevenueLog")(sequelize, DataTypes);

// Associations for DeliveryRule
Location.hasMany(DeliveryRule, { foreignKey: "location_id" });
DeliveryRule.belongsTo(Location, { foreignKey: "location_id" });

Shop.hasMany(DeliveryRule, { foreignKey: "shop_id" });
DeliveryRule.belongsTo(Shop, { foreignKey: "shop_id" });

// Associations for OrderRevenueLog
Order.hasOne(OrderRevenueLog, { foreignKey: "order_id" });
OrderRevenueLog.belongsTo(Order, { foreignKey: "order_id" });

Shop.hasMany(OrderRevenueLog, { foreignKey: "shop_id" });
OrderRevenueLog.belongsTo(Shop, { foreignKey: "shop_id" });

db.DeliveryRule = DeliveryRule;
db.OrderRevenueLog = OrderRevenueLog;
```

---

## [x] Phase 2: Core Rule Engine Service Implementation

Create a new service file `server/services/RuleEngineService.js`.

### [x] 2.1 Implement `getApplicableRule(location_id, category, shop_id)`

Ensure the lookup follows strict priority resolution utilizing Sequelize.

```javascript
const { DeliveryRule } = require("../models");

async function getApplicableRule(location_id, category, shop_id) {
  // Priority 1: Shop-Level Rule
  if (shop_id) {
    const shopRule = await DeliveryRule.findOne({
      where: { shop_id, is_active: true },
    });
    if (shopRule) return shopRule;
  }

  // Priority 2: Category-Level Rule
  if (category) {
    const categoryRule = await DeliveryRule.findOne({
      where: { location_id, category, shop_id: null, is_active: true },
    });
    if (categoryRule) return categoryRule;
  }

  // Priority 3: Location-Level Rule
  const locationRule = await DeliveryRule.findOne({
    where: { location_id, category: null, shop_id: null, is_active: true },
  });
  if (locationRule) return locationRule;

  throw new Error("No active delivery rule configured for this region.");
}
```

### [x] 2.2 Implement `validateOrderAgainstRule(order_value, rule)`

Add a utility function to evaluate the order against the minimum order logic.

```javascript
function validateOrderAgainstRule(orderValue, rule) {
  // If no minimum order is configured, return normal fee
  if (!rule.min_order_value || orderValue >= rule.min_order_value) {
    return {
      isValid: true,
      isSmallOrder: false,
      deliveryFee: Number(rule.delivery_fee),
    };
  }

  // Small order condition
  if (rule.small_order_delivery_fee) {
    // Flexible Mode: Apply higher delivery fee
    return {
      isValid: true,
      isSmallOrder: true,
      deliveryFee: Number(rule.small_order_delivery_fee),
    };
  } else {
    // Strict Mode: Block the order
    throw new Error(
      `Minimum order value of ₹${rule.min_order_value} is not satisfied.`,
    );
  }
}

module.exports = { getApplicableRule, validateOrderAgainstRule };
```

---

## [x] Phase 3: Cart Calculation Logic (`POST /api/cart/calculate`)

Update the cart checkout calculation endpoint (`server/controllers/cartController.js`).

**Action Plan:**

1. Calculate the base `order_value` (sum of item prices \* quantities).
2. Fetch the rule via `RuleEngineService.getApplicableRule(location_id, category, shop_id)`.
3. Validate the order: `const validation = RuleEngineService.validateOrderAgainstRule(order_value, rule);`
   - If an error is thrown (Strict Mode), catch it and return `res.status(400).json({ error: err.message })`.
4. Set `delivery_fee = validation.deliveryFee`.
5. Calculate `commission_amount = order_value * (rule.commission_percent / 100)`.
6. Calculate `grand_total = order_value + delivery_fee`.
7. Return the detailed JSON response:
   ```json
   {
     "order_value": 80,
     "delivery_fee": 20,
     "is_small_order": true,
     "commission_percent": 3,
     "total_payable": 100
   }
   ```

---

## [x] Phase 4: Order Placement & Revenue Splitting (`POST /api/orders`)

During order creation (`server/controllers/orderController.js`), apply the exact financial splits and save the log in the newly created `OrderRevenueLog` table.

### [x] 4.1 Commission Calculation

```javascript
const commissionAmount = orderValue * (rule.commission_percent / 100);
```

### [x] 4.2 Delivery Fee Split Logic

Determine how the delivery fee is shared between the Shop and VaayuGo.

```javascript
const isSmallOrder = validation.isSmallOrder;
let shop_delivery_earned = Number(rule.shop_delivery_share);
let vaayugo_delivery_earned = Number(rule.vaayugo_delivery_share);

if (isSmallOrder) {
  // Proportional Split for higher small order delivery fee
  const totalNormalDelivery = shop_delivery_earned + vaayugo_delivery_earned;
  if (totalNormalDelivery > 0) {
    const shopRatio = shop_delivery_earned / totalNormalDelivery;
    shop_delivery_earned = Number(rule.small_order_delivery_fee) * shopRatio;
    vaayugo_delivery_earned =
      Number(rule.small_order_delivery_fee) * (1 - shopRatio);
  } else {
    // Fallback 50/50 split if standard delivery is inexplicably 0
    shop_delivery_earned = Number(rule.small_order_delivery_fee) * 0.5;
    vaayugo_delivery_earned = Number(rule.small_order_delivery_fee) * 0.5;
  }
}
```

### [x] 4.3 Final Net Earnings

- `shop_final_earning = (orderValue - commissionAmount) + shop_delivery_earned`
- `vaayugo_final_earning = commissionAmount + vaayugo_delivery_earned`

### [x] 4.4 Persist Data

After saving the `Order`, create an entry in the `OrderRevenueLog`:

```javascript
await OrderRevenueLog.create(
  {
    order_id: newOrder.id,
    shop_id: shop_id,
    order_value: orderValue,
    is_small_order: isSmallOrder,
    applied_delivery_fee: validation.deliveryFee,
    applied_min_order_value: rule.min_order_value,
    commission_amount: commissionAmount,
    shop_delivery_earned: shop_delivery_earned,
    vaayugo_delivery_earned: vaayugo_delivery_earned,
    shop_final_earning: shop_final_earning,
    vaayugo_final_earning: vaayugo_final_earning,
  },
  { transaction },
);
```

---

## [x] Phase 5: Build API endpoints for Admin Rules Config

Create `server/routes/adminRulesRoutes.js` and corresponding controller.

**Endpoints:**

1. `GET /api/admin/delivery-rules` - Fetch all rules with Location and Shop joins.
2. `POST /api/admin/delivery-rules` - Create a new DeliveryRule.
   - Validation: `small_order_delivery_fee >= delivery_fee` (if provided).
   - Validation: `delivery_fee == shop_delivery_share + vaayugo_delivery_share`.
3. `PUT /api/admin/delivery-rules/:id` - Update an existing DeliveryRule.
4. `DELETE /api/admin/delivery-rules/:id` - Soft delete or Hard delete.

---

## [x] Phase 6: Frontend Implementation Flow (Admin, Customer, Shopkeeper)

This phase details how the new rule engine is exposed to the different user roles in the application.

### [x] 6.1 Admin Flow (Rule Configuration)

Admins are responsible for defining the rules. These set rules dictate the entire flow.

1. **Dashboard Entry:** In `AdminRevenueRules.jsx`, the Admin clicks "Create Rule" or "Edit Rule".
2. **Form Inputs:** The Admin fills out the following configuration:
   - **Scope:** Location (Required), Category (Optional), Shop (Optional). This defines priority.
   - **Financials:** Delivery Fee, Shop Share, VaayuGo Share.
   - **Constraints:** Commission Percent, Min Order Value (₹), and Small Order Delivery Fee (₹).
3. **Submission:** Upon saving, the frontend validates the inputs (e.g., ensuring standard delivery = shop share + vaayugo share) and sends a `POST/PUT /api/admin/delivery-rules` request to persist the rule in the database.

### [x] 6.2 Customer Flow (Automatic Rule Application)

Customers never manually interact with the rule engine; it applies automatically behind the scenes.

1. **Cart Interaction:** A customer adds items to their cart in the app/website.
2. **Checkout Calculation (`CartCheckout.jsx`):**
   - When the checkout page loads, the frontend calls `POST /api/cart/calculate`.
   - The backend silently resolves the highest priority `DeliveryRule` for that specific location, category, or shop.
3. **Warning Display:** If the customer's cart is below the `min_order_value`:
   - **Strict Mode:** The API returns a 400 error. The frontend displays a warning banner: _"Please add ₹X more to checkout."_ and disables the "Place Order" button.
   - **Flexible Mode:** The API returns `is_small_order: true` and applies the higher `small_order_delivery_fee`. The frontend displays an info banner: _"A small order delivery fee of ₹Y is applied. Add ₹X more for standard delivery."_
4. **Order Placement:** The user accepts the final `total_payable` and clicks "Place Order". The system automatically handles the complex revenue splits on the backend based on the applied rule.

### [x] 6.3 Shopkeeper Flow (Financial Transparency)

Shopkeepers need to see exactly how much they earned and if a small order fee impacted their payout.

1. **Earnings Summary (`ShopDashboard.jsx`):** The shopkeeper views their dashboard cards, showing their **Net Earnings** and a new **Small Orders Count** badge.
2. **Detailed Order List:** When viewing the list of recent orders, they see:
   - The **Item Total** (what the customer paid for food/products).
   - An **"Is Small Order"** indicator flag if applicable.
   - Their final **Delivery Share Earned** (which may be higher than normal if it was a proportional split of a small order fee).
   - The **Commission Deducted** (which is strictly based on the order value, protecting shop profits on small orders).
   - **Final Net Earned** per order.
3. **Formula Tooltip:** A help icon on the table explicitly states: `"Net Earnings = (Order Value − Commission) + Delivery Share"`, providing total financial clarity.

---

## [x] Phase 7: Admin Dashboard Metrics

Update the Admin Dashboard API (`server/controllers/adminDashboardController.js`) to aggregate the new table.

**Queries Using `OrderRevenueLog`:**

- **Small Orders Count:** `const smallOrders = await OrderRevenueLog.count({ where: { is_small_order: true } });`
- **Total Revenue from Small Orders:** Sum of `applied_delivery_fee` where `is_small_order: true`.
- **Minimum Order Impact:**
  - Extra delivery collected: `SUM(applied_delivery_fee - DeliveryRule.delivery_fee)`

---

## [x] Phase 8: Xerox Category Bypass Logic

Xerox orders follow a different paradigm and should bypass normal small order constraints.

**Implementation Plan:**

1. Create a **Category-Level DeliveryRule** specifically for `category = 'Xerox'` via the new Admin UI.
2. Configuration:
   - `min_order_value = 0` (or leave empty/null)
   - `small_order_delivery_fee = null`
   - `commission_percent = 5` (as required).
3. The existing `getApplicableRule` priority logic will automatically pick this category rule when a Xerox order is placed, ensuring smooth prepaid processing without blocking small values.

---

## Phase 9: Testing Strategy

### Test Case 1: Database Migration

- Restart the server. Verify Sequelize syncs/creates `delivery_rules` and `order_revenue_logs` tables correctly in the database.

### Test Case 2: Normal Order

- **Scenario:** Order = ₹250, Min Order = ₹100, Base Delivery = ₹12 (Shop ₹8 / VG ₹4), Comm = 4%
- **Expect:** Order succeeds, `isSmallOrder` = false. Log shows correct splits (Shop Net = ₹248, VG Net = ₹14).

### Test Case 3: Small Order - Flexible Mode

- **Scenario:** Order = ₹60, Min Order = ₹100, Base Delivery = ₹10, Small Delivery = ₹20, Comm = 3%
- **Expect:** Order succeeds, `deliveryFee` applied = ₹20, `isSmallOrder` = true. Splits are calculated proportionally based on ₹20.

### Test Case 4: Small Order - Strict Mode

- **Scenario:** Order = ₹60, Min Order = ₹100, Small Delivery = `null`.
- **Expect:** Cart API throws `400 Bad Request` with "Minimum order value not satisfied." Checkout is blocked.

---

## [x] Phase 10: Order Table Updates (According to Revenue Rules)

**Objective:** Align the `Order` model with the new Revenue tracking and order lifecycle rules.

### [x] 10.1 Update Order Status Enum

Modify the `status` enum in `server/src/models/Order.js` to strictly follow the defined lifecycle:

- Remove `preparing` and `ready`.
- Add `failed`.
- The allowed statuses should be: `pending`, `accepted`, `out_for_delivery`, `delivered`, `failed`, `cancelled`. _(Completed)_

### [x] 10.2 Add Required Revenue Fields

Add the following fields to the `Order` model:

- `delivery_otp`: `DataTypes.STRING` (4-digit code for delivery verification).
- `delivered_at`: `DataTypes.DATE`.
- `failed_at`: `DataTypes.DATE`.
- `failure_reason`: `DataTypes.ENUM('Delivery attempt was made', 'Customer was unavailable', 'Customer refused order', 'Other')`
- `cancelled_at`: `DataTypes.DATE`.
- `cancelled_by`: `DataTypes.ENUM('customer', 'shop', 'admin')`
- `cancel_reason`: `DataTypes.STRING`.
- `final_status_locked`: `DataTypes.BOOLEAN` (Default: `false`. Set to `true` when status becomes `delivered`, `failed`, or `cancelled`).

Make sure to implement these fields and establish any necessary constraints for them.

---

## [x] Phase 11: Backend Order Lifecycle & OTP API

**Objective:** Enforce the new order state machine, OTP generation, validation, and final status locking on the backend.

### [x] 11.1 Implement Order Status Update Logic

Update the `PUT /api/orders/:id/status` (or similar) endpoint in `server/src/controllers/orderController.js`:

- **State Transitions:** Ensure sequence: `pending` -> `accepted` -> `out_for_delivery` -> `delivered`/`failed`. Allow `cancelled` from `pending` (or later if by shop/admin).
- **OTP Generation:** When status changes to `out_for_delivery`, generate a randomly generated 4-digit numeric string and save it to `delivery_otp`.
- **OTP Validation:** When status changes to `delivered`, require the correct OTP in the request body. If invalid or missing, return `400 Bad Request`.
- **Failure Handling:** When status changes to `failed`, require `failure_reason`. Set `failed_at = new Date()`.
- **Cancellation Logic:**
  - If Customer cancels: Only allowed within 10 minutes of `created_at`.
  - Require `cancel_reason` and set `cancelled_by` to the role of the user taking the action. Set `cancelled_at = new Date()`.

### [x] 11.2 Implement Final Status Locking

- Before modifying an order, verify `final_status_locked` is `false`. If `true`, reject the request with `403 Forbidden`.
- When an order reaches `delivered`, `failed`, or `cancelled`, update `final_status_locked` to `true`.

---

## [x] Phase 12: Admin Override & Audit API

**Objective:** Allow super admins to override locked final states while maintaining a strict audit trail.

### [x] 12.1 Admin Status Override Endpoint

Create `PUT /api/admin/orders/:id/override-status`:

- Bypasses the `final_status_locked` constraint.
- Accepts any valid enum status.
- Should ideally log this action in a system log (Admin ID, Order ID, Old Status, New Status, Reason).

---

## [x] Phase 13: Customer Frontend Implementation

**Objective:** Update the customer-facing app to display OTPs, handle cancellations safely, and show new final states.

### [x] 13.1 Display Delivery OTP

In `client/src/pages/OrderDetails.jsx` (or your customer order view):

- When `order.status === 'out_for_delivery'`, prominently display `order.delivery_otp`.
- Add helper text: _"Please share this code with the delivery partner to receive your order."_

### [x] 13.2 Time-Restricted Cancellation

- Disable or hide the "Cancel Order" button if `status` is beyond `pending` or if `(Date.now() - new Date(order.created_at)) > 10 * 60 * 1000` (10 minutes).
- When a user clicks "Cancel Order", prompt them for a `cancel_reason` via a modal before sending the API request.

### [x] 13.3 Display Failure/Cancellation Reasons

- If the order is `failed`, show the `failure_reason` prominently on the UI.
- If the order is `cancelled`, show the `cancel_reason` and who cancelled it (`cancelled_by`).

---

## [x] Phase 14: Shopkeeper / Delivery Frontend Updates

**Objective:** Provide shopkeepers/delivery partners the UI to interact with the new strict state machine.

### [x] 14.1 Status Action Buttons & Modals

Update the shopkeeper order view (`ShopDashboard` / `Order Management`) to use specific action buttons instead of a direct dropdown:

- **"Accept Order"**: Moves from `pending` -> `accepted`.
- **"Mark Out for Delivery"**: Moves from `accepted` -> `out_for_delivery`.
- **"Complete Delivery"**: Opens a modal prompting for the 4-digit OTP. Sends this to the API to mark as `delivered`.
- **"Report Failure"**: Opens a modal with a dropdown for `failure_reason`. Required to mark as `failed`.
- **"Cancel Order"**: Opens a modal prompting for `cancel_reason`.

### [x] 14.2 Enforce Locked States

- If `order.final_status_locked` is true (or status is `delivered`/`failed`/`cancelled`), disable and hide all state transition buttons. Display a clear visual badge like _"Finalized"_.

---

## [x] Phase 15: Admin Dashboard Refinement

**Objective:** Give admins visibility into the new fields and the ability to intervene using the override API.

### [x] 15.1 Enhanced Order List

In the Admin `Orders.jsx` view:

- Show columns or badges for `delivery_otp` (if `out_for_delivery`), `failure_reason`, and `cancel_reason`.
- Add a visual indicator (e.g., a lock icon in red) if `final_status_locked` is true.

### [x] 15.2 Admin Override Controls

- On the Admin Order Details page, add an **Admin Override** section.
- Only visible to Admins.
- Contains a form/dropdown to forcefully change the status (calling the Phase 12 API), with a required "Reason for Override" text field.

---

## [x] Phase 16: Bulk Upload of Products

**Objective:** Enable Shopkeepers and Admins to efficiently add multiple products at once by uploading a data file (CSV) and simultaneously uploading a ZIP file containing the associated product images (max 2 per product).

### [x] 16.1 Backend Bulk Upload API (`POST /api/products/bulk-upload`)

Create a robust endpoint inside `server/src/controllers/productController.js`:

- **Handling Multipart Data:** Utilize `multer` to accept one CSV file (e.g., `products.csv`) and one ZIP file (e.g., `images.zip`).
- **Dependencies:** Install `adm-zip` to extract the uploaded ZIP file in memory or to a temporary directory.
- **Role-Based Access:**
  - **Shopkeeper:** Can only upload to their own `shop_id` (extracted from JWT).
  - **Admin:** Must provide a `target_shop_id` in the request body to execute the upload on behalf of a shop.
- **Data Parsing & Extraction:**
  - Use `adm-zip` to extract the image contents.
  - Parse the uploaded CSV into JSON.
- **Execution & Validation Flow:**
  - Loop through each parsed row.
  - **CSV Template Fields Required:** `Product Name`, `Price`, `Stock Qty`, `Description`, `Image 1 Filename`, `Image 2 Filename`.
  - **Validation Rules:**
    - `Product Name` and `Price` cannot be empty.
    - `Description` length should not exceed reasonable database text limits (e.g., 500 characters).
    - Max 2 images allowed per product.
    - **Image Size Limit:** Each extracted image must be checked to ensure it does not exceed 150KB (matching the frontend modal limits).
  - Match the extracted files to the `Image Filename` columns.
  - Process the matched image (resize to reasonable dimensions, convert to WebP to save space) and save to the file system (`server/uploads/productimages/`).
  - Set `is_available` to true if `Stock Qty > 0`, otherwise false.
  - Create the `Product` record in the database, inserting the array of uploaded image paths into the `images` JSON column.
  - **Error Handling:** Return a detailed summary array of any rows that failed (e.g., "Row 4: Missing Price", "Row 7: Image1.jpg exceeds 150KB", "Image2.png not found in ZIP").

### [x] 16.2 Frontend: Dedicated Shopkeeper Bulk Upload Page (`ShopBulkUpload.jsx`)

Create a specific, dedicated React page `client/src/pages/ShopBulkUpload.jsx` for the shopkeeper to handle this complex flow.

- **Routing & Trigger:**
  - Register the route `/shop/bulk-upload` in `App.jsx` protected by shopkeeper auth.
  - Add a "Bulk Upload" navigation link or button inside `ShopProducts.jsx` that links to this new page.
- **Interface Layout (UI Components):**
  - **Header Area:** Title and a prominent "Download CSV Template" button. The template should be a static file served from the public directory containing the exact required headers (`Product Name`, `Price`, `Stock Qty`, `Description`, `Image 1 Filename`, `Image 2 Filename`).
  - **Upload Area (Grid/Flex Layout):**
    - **Step 1: CSV File Dropzone:** An integrated file input specifically accepting `.csv` formats. Show the selected filename across the dropzone.
    - **Step 2: ZIP File Dropzone:** An integrated file input specifically accepting `.zip` formats for the images.
  - **Action Area:** A large "Upload and Process" submit button.
- **State Management:**
  - `csvFile`: Stores the selected CSV file object.
  - `zipFile`: Stores the selected ZIP file object.
  - `isUploading`: Boolean to trigger loading spinners and disable inputs.
  - `uploadResults`: Object/Array to store success counts and specific row-by-row error messages returned from the backend.

### [x] 16.3 Frontend: Dedicated Admin Bulk Upload Page (`AdminBulkUpload.jsx`)

Build a dedicated page interface for super admins to assist shopkeepers (`client/src/pages/AdminBulkUpload.jsx`).

- **Routing & Trigger:**
  - Register `/admin/bulk-upload` protected by admin auth.
  - Link from the global `AdminProducts` view or the specific `AdminShopDetails` profile.
- **Interface Layout (UI Components):**
  - Inherits the exact same UI structure (CSV + ZIP dropzones) as the shopkeeper page.
  - **Crucial Addition - Shop Selector:** A mandatory dropdown or searchable autocomplete input mapped to `admin/shops` API to select the `target_shop_id`.
- **State Management:**
  - Inherits `csvFile`, `zipFile`, `isUploading`, `uploadResults` from the shopkeeper logic.
  - Adds `selectedShopId`: Must be validated as non-null before allowing submission.

### [x] 16.4 Frontend API Integration & User Feedback

Detailing the exact Axios calls and user experience flow for the upload process.

- **FormData Construction:**
  - Create a new `FormData` object.
  - `formData.append('csv', csvFile)`
  - `formData.append('imagesZip', zipFile)`
  - If Admin: `formData.append('target_shop_id', selectedShopId)`
- **Axios Submission:**
  - Execute `POST /api/products/bulk-upload` via the internal `api` Axios instance.
  - Set headers: `'Content-Type': 'multipart/form-data'`.
- **Feedback & Progress Handling:**
  - **Loading State:** While `isUploading` is true, render a translucent overlay with a spinner and text: _"Processing dataset and extracting images... Please do not close this window."_
  - **Success Handling:** If HTTP 200, display a vibrant success alert (e.g., using `react-hot-toast` or a custom component): _"X Products added successfully!"_. Provide a button to "Return to Products List".
  - **Partial Success / Validation Errors:** If the API returns a `400` or `207 Multi-Status` detailing specific row failures:
    - Render a clean table or list below the dropzones titled "Upload Report".
    - Display the exact errors mapped from the backend (e.g., _Row 4: Image1.jpg exceeds 150KB limit_, _Row 12: Price field is missing_).
    - This allows the user to fix their CSV/ZIP and re-upload only the failed items.
- **Frontend File Validation (Pre-flight):**
  - Before calling the API, check `csvFile.size` and `zipFile.size` on the frontend to prevent attempting to upload files that obviously exceed Nginx or Express payload limits (e.g., block ZIPs > 50MB instantly with an alert).

### [x] 16.5 File Processing Utilities (Backend Detail)

- Install `adm-zip` via `npm install adm-zip`.
- Centralize the image compression, size checking (max 150KB per extracted file), and WebP conversion logic using Sharp.
- Ensure the server has a high enough payload configuration (`express.json({ limit: '50mb' })` and `express.urlencoded({ limit: '50mb' })`) to accept a large ZIP file.

---

## [x] Phase 17: Multiple Category Support for Shops

**Objective:** Enable a shop to be listed in multiple categories (e.g., Grocery, Essentials, Organic) to increase discoverability and support diverse inventories.

### [x] 17.1 Database Schema Evolution

We will move away from a single string `category` field in the `Shop` model and introduce a relational approach.

1.  **[NEW] `Category` Model**:
    - `id`: Integer, PK.
    - `name`: String, Unique (e.g., 'Xerox', 'Grocery', 'Pharmacy').
    - `icon_url`: String (Optional).

2.  **[NEW] `ShopCategories` Junction Table**:
    - `shop_id`: Foreign Key to `Shops`.
    - `category_id`: Foreign Key to `Categories`.

3.  **[MODIFY] `Shop` Model**:
    - Deprecate `category` string field.
    - Add associations to the `Category` model via the junction table.

### [x] 17.2 Backend Implementation

1.  **Controller Updates (`adminController.js`)**:
    - Add `getCategories`, `addCategory`, `deleteCategory`.
    - Update `verifyShop` and `updateShopStatus` to handle multiple category IDs.
2.  **Controller Updates (`shopController.js`)**:
    - Update `registerShop` and `updateProfile` to accept an array of `categoryIds`.
3.  **Rule Engine Refinement (`RuleEngineService.js`)**:
    - Change `getApplicableRule` to accept an array of categories or look up the shop's categories internally.
    - **Priority resolution:** If a shop belongs to multiple categories, the engine will check if any of them have a category-specific rule configured.

### [x] 17.3 Frontend Implementation

1.  **Admin Panel (`AdminSettings.jsx`)**:
    - Create a management UI to handle the master list of categories.
2.  **Shopkeeper Flow (`ShopRegister.jsx`, `ShopProfile.jsx`)**:
    - Replace the single-select category dropdown with a **Multi-select component**.
    - Show selected categories as removable tags.
3.  **Customer Discovery (`Home.jsx`, `ShopCard.jsx`)**:
    - Update filters to allow searching by any category the shop is listed in.
    - Display multiple category badges on the `ShopCard`.

### [x] 17.4 Migration Plan

1.  Create the `Category` table and populate it with existing unique values from `Shops.category`.
2.  Populate `ShopCategories` by mapping existing `Shop.category` strings to the new `Category` records.
3.  Update the codebase to utilize the junction table for all category-related logic.

---

## [x] Phase 18: Unified Profile Editing

**Objective:** Implement a robust profile editing system with role-specific fields for Shopkeepers, Customers, and Admins.

### [x] 18.1 Backend Profile Update API

1.  **[MODIFY] `authController.js`**:
    - Implement `updateProfile` function.
    - **Logic by Role:**
      - **Admin**: Update `User.name`, `User.mobile_number`, `User.location`.
      - **Shopkeeper**: Update `User.name`, `User.mobile_number`, `User.address`. Also update associated `Shop.name` and categories in `ShopCategory`.
      - **Customer**: Update `User.name`, `User.mobile_number`, `User.address`. If they have a shop, update `Shop.name`.
2.  **[MODIFY] `authRoutes.js`**:
    - Register `PUT /api/auth/profile` protected by `authenticateToken`.

### [x] 18.2 Frontend Profile Editing UI

1.  **[MODIFY] `ShopProfile.jsx`**:
    - Add an "Edit Profile" mode.
    - Fields: Name, Mobile, Shop Name, Registered Address (Textarea), Categories (Multi-select).
2.  **[NEW] `CustomerProfile.jsx`**:
    - Create a profile page for customers.
    - Fields: Name, Mobile, Shop Name (if shop exists), Registered Address (Textarea).
3.  **[NEW] `AdminProfile.jsx`**:
    - Create a profile page for admins.
    - Fields: Name, Mobile, Location (Select).

### [x] 18.3 Verification & Validation

1.  Ensure invalid inputs (empty name, invalid mobile) are blocked on backend.
2.  Verify that clicking "Save" updates both `User` and `Shop` tables where applicable.
3.  Verify that role-specific constraints (e.g., Admin edits location, others edit address) are respected.
