# 📦 VaayuGo – Order Lifecycle & Revenue Engine

## 🎯 Objective

This document defines the official order lifecycle, revenue calculation logic, and fraud-prevention rules for VaayuGo.

The system ensures:

* Revenue is calculated only from successfully delivered orders.
* Fake deliveries are prevented using OTP verification.
* Final order states are locked.
* Cancellation rules are controlled.
* Revenue is never manually added or subtracted.

---

# 🛒 1. Order Lifecycle

Every order must follow this controlled state machine:

```
Pending
ACCEPTED
OUT_FOR_DELIVERY
DELIVERED
FAILED
CANCELLED
```

---

# 🔄 2. Status Definitions & Rules

## 2.1 Pending

* Created when customer places an order.
* Customer may cancel:
  * Within 10 minutes of placing the order.Even the shopkeeper have accepted the order then also.
---

## 2.2 ACCEPTED

* Set when the shop confirms the order.

---

## 2.3 OUT_FOR_DELIVERY

* Delivery process begins by the shopkeeper.
* System generates a delivery OTP.

---

## 2.4 DELIVERED (Final State – Locked)

### Requirements:

* OTP verification is mandatory.
* Delivery partner must enter correct OTP.
* If OTP(4 digit code) matches:

  * Mark order as DELIVERED
  * Set `delivered_at` timestamp
  * Lock order permanently
  * Revenue becomes eligible

Without OTP → DELIVERED status is not allowed.
---

## 2.5 FAILED (Final State – Locked)

Used when:

* Delivery attempt was made.
* Customer was unavailable.
* Customer refused order.

### Required Fields:

* `failed_at`
* `failure_reason` (make a option of * Delivery attempt was made.
* Customer was unavailable.
* Customer refused order. and also mark as other )

Rules:

* Status becomes immutable.
* Revenue is NOT counted.

---

## 2.6 CANCELLED (Final State – Locked)

Cancellation may happen in three ways:

### 1️⃣ Customer Cancellation

* Allowed within 10 minutes of PLACED.

### 2️⃣ Shop Cancellation

* Item unavailable.
* Operational issue.

### Required Fields:

* `cancelled_at`
* `cancelled_by` (customer / shop)
* `cancel_reason`

Revenue is NOT counted.

---

# 🔒 3. Final State Locking Rule

If order status becomes:

* DELIVERED
* FAILED
* CANCELLED

Then:

* `final_status_locked = true`
* No further status changes allowed.
* Only admin override permitted.
* Admin overrides must create an audit log entry.

---


### Rules:

* CANCELLED orders are ignored.
* FAILED orders are ignored.
* No subtraction logic exists.
* Revenue depends only on verified completed orders.

---

# 🛡 5. Fraud Prevention Rules

To prevent fake delivery and revenue manipulation:

* DELIVERED requires OTP verification.
* Shops cannot directly mark orders as DELIVERED.
* FAILED requires a reason and timestamp.
* Final states are immutable.
* Maintain audit logs for every status change.
* Track shop cancellation rate for monitoring.

---

# 🗂 6. Required Order Table Fields

Minimum required columns in table:

```
status
delivery_otp
delivered_at
failed_at
failure_reason
cancelled_at
cancelled_by
cancel_reason
final_status_locked
created_at
updated_at
```

---

# 🧠 Core Business Principle

Revenue represents:

> Successfully completed and verified transactions only.

It does NOT represent:

* Temporary states
* Status fluctuations
* Manual adjustments

---

# 🚀 Production Recommendations

* Always use transactions when updating order status.
* Create audit logs for every state change.
* Use server-side validation for status transitions.
* Never allow frontend to directly control final state logic.
* Implement OTP expiry (e.g., 10 minutes).

---

# 📌 Summary

✔ OTP required for DELIVERED
✔ Final states are locked
✔ Revenue calculated only from DELIVERED
✔ No subtraction-based accounting
✔ Cancellation rules controlled
✔ Fraud-resistant architecture