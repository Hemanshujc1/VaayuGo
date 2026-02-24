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
