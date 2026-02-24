# 🔄 UPDATED: VaayuGo Revenue & Rule Engine Implementation Plan (With Min Order Logic)

---

# ✅ PHASE 1: DATABASE UPDATES

---

## 1.1 Update `delivery_rules` Table

Add stronger support for minimum order handling.

### Updated Fields:

* `id`
* `location_id`
* `category` (nullable)
* `shop_id` (nullable)
* `delivery_fee`
* `shop_delivery_share`
* `vaayugo_delivery_share`
* `commission_percent`
* `min_order_value` (Decimal, nullable)
* `small_order_delivery_fee` (Decimal, nullable) ✅ NEW
* `is_active`
* `created_at`
* `updated_at`

---

## 🔎 What is `small_order_delivery_fee`?

This field is optional.

If:

order_value < min_order_value

Then:

Instead of blocking order, system can:

* Either reject the order
* OR apply higher delivery charge

You decide strategy per rule.

---

# ✅ PHASE 2: UPDATED RULE ENGINE LOGIC

---

## 2.1 Updated `RuleEngineService`

### Function:

```
getApplicableRule(location_id, category, shop_id)
```

### Priority Order:

1. Shop-Level
2. Category-Level
3. Location-Level
4. Throw error if no rule exists

---

## 2.2 NEW FUNCTION: Minimum Order Validator

Add new utility:

```
validateOrderAgainstRule(order_value, rule)
```

---

### Logic:

IF rule.min_order_value IS NOT NULL:

```
IF order_value >= min_order_value:
    use normal delivery_fee

ELSE:
    IF rule.small_order_delivery_fee EXISTS:
        use small_order_delivery_fee
    ELSE:
        throw error:
        "Minimum order value not satisfied"
```

ELSE:
use normal delivery_fee

---

# 🧠 IMPORTANT BUSINESS DECISION

You must choose ONE of these behaviors:

### OPTION A (Strict Mode)

Block order if minimum not satisfied.

### OPTION B (Flexible Mode)

Allow order but apply higher delivery fee.

Example:

Minimum order = ₹100
Order placed = ₹60

Normal delivery = ₹10
Small order delivery = ₹20

System auto applies ₹20.

This encourages larger cart value.

---

# ✅ PHASE 3: CART CALCULATION UPDATE

---

## Update `POST /api/cart/calculate`

### Updated Flow:

1. Get applicable rule
2. Calculate order_value
3. Call `validateOrderAgainstRule`
4. Determine delivery_fee:

   * Normal OR Small-order
5. Calculate grand_total
6. Return breakdown:

Response structure:

```
{
  order_value: 80,
  delivery_fee: 20,
  is_small_order: true,
  commission_percent: 3,
  total_payable: 100
}
```

---

# ✅ PHASE 4: ORDER PLACEMENT UPDATE

---

## Update `POST /api/orders`

### Updated Calculation:

Let:

O = order_value
D = delivery_fee (after validation logic)
C = commission_percent

---

### Commission Calculation:

commission_amount = O × (C / 100)

---

### Delivery Split Logic:

If using normal delivery:
use rule.shop_delivery_share
use rule.vaayugo_delivery_share

If using small_order_delivery_fee:
YOU MUST DEFINE SPLIT LOGIC

Recommended:

Either:

* Same split ratio
  OR
* Fixed 50/50 split for small orders

Add logic clearly.

---

### Final Earnings:

shop_final_earning =
(O - commission_amount) + shop_delivery_share

vaayugo_final_earning =
commission_amount + vaayugo_delivery_share

---

### Save in `OrderRevenueLog`:

Add extra fields:

* `is_small_order` (boolean)
* `applied_delivery_fee`
* `applied_min_order_value`

---

# ✅ PHASE 5: ADMIN RULE CONFIGURATION UPDATE

---

## Update Admin Form (`AdminRevenueRules.jsx`)

Add fields:

* Minimum Order Value
* Small Order Delivery Fee (optional)
* Behavior Type:

  * Block order
  * Allow with higher delivery

---

## Add Validation:

* small_order_delivery_fee >= delivery_fee
* delivery_fee = shop_delivery_share + vaayugo_delivery_share

---

# ✅ PHASE 6: ADMIN DASHBOARD NUMBERS (UPDATED)

Admin dashboard must now show:

---

## 📊 Revenue Metrics

* Total Orders
* Total Order Value
* Total Delivery Revenue
* Total Commission Revenue
* Total VaayuGo Revenue
* Small Orders Count
* Revenue from Small Orders
* Average Order Value
* Average Delivery Fee
* Revenue per Location
* Revenue per Category
* Revenue per Shop

---

## NEW IMPORTANT METRIC:

Minimum Order Impact:

* % of small orders
* Extra delivery collected from small orders

---

# ✅ PHASE 7: SHOPKEEPER DASHBOARD UPDATE

Shopkeeper must see:

---

## Earnings Summary:

* Total Orders
* Total Order Value
* Total Commission Deducted
* Delivery Earnings
* Net Earnings
* Small Order Count

---

## Order Table Must Show:

* Order ID
* Order Value
* Was Small Order? (Yes/No)
* Commission Deducted
* Delivery Share Earned
* Final Net Earned

---

## Display Formula Clearly:

Net Earnings =
(Order Value − Commission) + Delivery Share

---

# ✅ PHASE 8: XEROX CATEGORY UPDATE

For Xerox:

* Always enforce min_order_value = 0
* No small-order override needed
* Always prepaid
* Commission may be higher (5%)

Handled via category-level rule.

---

# ✅ PHASE 9: TEST CASES (UPDATED)

You must test:

---

### Test 1: Normal Order

Order = ₹250
Min Order = ₹100
Delivery = ₹12
Split = ₹8 / ₹4
Commission = 4%

Expected:
Shop = ₹248
VaayuGo = ₹14

---

### Test 2: Small Order With Flexible Mode

Order = ₹60
Min Order = ₹100
Normal Delivery = ₹10
Small Delivery = ₹20
Commission = 3%

Expected:
Delivery applied = ₹20
Commission = ₹1.8

Validate split correctly.

---

### Test 3: Strict Mode

Order = ₹60
Min Order = ₹100
No small_order_delivery_fee

Expected:
Order blocked.

---

# 🎯 FINAL SYSTEM BEHAVIOR

Your system now supports:

✔ Multi-level rule engine
✔ Minimum order per level
✔ Small-order handling
✔ Commission on item total only
✔ Delivery split logic
✔ Transparent dashboards
✔ Scalable financial structure

---
