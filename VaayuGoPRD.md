
📘 VaayuGo – Updated Product Requirements Document (PRD)

1. Product Overview
1.1 What is VaayuGo?
VaayuGo is a hyperlocal scheduled-commerce platform that connects customers with nearby local shops and enables organized, batch-based deliveries.
Unlike instant-delivery platforms, VaayuGo operates on a scheduled delivery model to ensure operational stability, especially in small towns and campus environments.
The platform supports multiple shop categories:
Street Food
Grocery
Medical Stores
Xerox / Printing Services
Customers can discover nearby shops, place scheduled orders, upload documents for printing, and receive deliveries during fixed time slots.
Shopkeepers prepare orders in batches and deliver them at predefined schedules.
Admins maintain operational control using a rule-based admin panel.
2. Goals & Objectives
2.1 Business Goals
Digitally empower local neighborhood shops
Build a low-cost, volume-driven commerce ecosystem
Ensure sustainable earnings through delivery fees and commissions
Create predictable, scheduled operations
Enable scalability to multiple campuses or regions
2.2 User Goals
Customers
Affordable delivery (Rs10 flat fee → set my the admins through admin portal)
Predictable delivery time slots
Easy document printing service
Shopkeepers
Increased order volume
Batch delivery efficiency
Additional delivery earnings
Simple system without operational pressure
Admins
Control over delivery fee and commission rates
Monitor performance
Manage users and shops
Track revenue and penalties

3. Revenue Model (Core Business Structure)
3.1 Delivery Fee Model
Scheduled Delivery Only:(Rs10 flat fee → set my the admins through admin portal  per shop and per category)
Revenue Split: (set my the admins through admin portal  per shop and per category)
₹6–₹7 → Shopkeeper
₹3–₹4 → VaayuGo
This ensures:
Shopkeeper motivation
Affordable student pricing
Stable per-order earnings


3.2 Commission Model
Standard Categories:
3–4% commission on total order value. (set my the admins through admin portal per shop and per category)
Xerox Category:(set my the admins through admin portal per shop and per category)
5% commission (due to prepaid, high-repeat demand)
Example:
Average Order = ₹120
3% commission ≈ ₹4
VaayuGo earns per order:
₹3–₹4 (delivery share) + ₹4 (commission)
≈ ₹7–₹8 per order

3.3 Xerox Payment Policy
100% prepaid
No Cash on Delivery
No refund after printing
PDF upload only
This removes risk of no-shows and printing loss.

3.4 Expected Revenue (Campus Model Example)
If 50 orders/day:
₹7 × 50 = ₹350/day
≈ ₹8,750/month
If 100 orders/day:
≈ ₹17,000/month
Revenue increases with volume.
Primary growth engine = frequent small orders from 450 students.

4. Target Users
4.1 Customers
Students
Local residents
Small businesses needing printing
4.2 Shopkeepers
Grocery stores
Food vendors
Medical shops
Xerox shops
4.3 Admins
Operations team
Business managers
Regional controllers
5. Key Features5.1 Customer Features
Account & Location
Registration & login
Manual location selection
Save delivery address
Shop Discovery
Browse shops by:
Location
Category
Availability
View:
Minimum order value
Delivery slot timings

Ordering
Add items to cart
Upload documents (Xerox)
Add instructions
Real-time price calculation

Delivery System
Scheduled Delivery Only
Predefined slots:(decided by admin portal and can change (add or delete the slots))
Lunch Slot
Evening Slot
Night Slot
Cutoff time required before each slot.

Payments
Cash on Delivery (Food, Grocery, Medical)
Mandatory Prepaid (Xerox)

Order Tracking
Order statuses:
Placed
Accepted
Preparing
Out for Delivery
Delivered
Cancelled
Email notifications supported.


5.2 Shopkeeper Features
Shop Management
Registration & verification
Product/service management
Open / Closed toggle

Order Management
View batch orders
Accept / Reject
View delivery slot time
Update status

Earnings Dashboard
Total orders
Delivery earnings
Commission deducted
Net earnings

5.3 Admin Panel Features

Rule Configuration
Admin can define:
Minimum order value
Delivery fee (default ₹10)
Commission percentage (3–4%)
Xerox commission (5%)
Delivery slot timings



User & Shop Control
Approve / reject shops
Block / unblock customers
Suspend shop temporarily

Analytics
Daily order count
Revenue breakdown:
Delivery revenue
Commission revenue
Category performance
Top shops

Export
PDF reports
Excel (XLSX) exports
Date / category filters
6. User Flow6.1 Customer Flow
Login
Select category
Choose shop
Add items / upload document
Choose scheduled slot
Make payment (if Xerox)
Receive delivery at selected slot
6.2 Shopkeeper Flow
Receive batch order list
Accept
Prepare items
Deliver at scheduled slot
Mark delivered
6.3 Admin Flow
Configure commission & fees
Monitor revenue
Manage shops
Generate reports
7. Technical Requirements\
7.1 Frontend
React.js
Mobile-first UI
Simple shop dashboard
Admin dashboard
7.2 Backend
Node.js + Express
JWT authentication
Role-based access
REST APIs
7.3 Database (MySQL)
Core tables:
Users
Shops
Categories
Products
Orders
DeliverySlots
Payments
CommissionLogs
DeliveryFeeSplit
Penalties

8. Non-Functional Requirements
Scalable to multiple campuses
Secure file upload for Xerox
Payment validation before processing
Predictable delivery system
99% uptime

9. Success Metrics
Orders per day
Active student users
Average order value
Monthly revenue
Shopkeeper retention
Xerox repeat rate

🎯 Final Positioning Statement
VaayuGo is a low-margin, high-volume, scheduled hyperlocal commerce platform designed for controlled environments like campuses and small towns, ensuring operational stability and sustainable earnings through delivery fee sharing and small commissions.

