# 📊 Admin Dashboard API - Backend Documentation

## ✅ Implemented Features

### Dashboard Overview Endpoints

---

## 1️⃣ **Get Dashboard Overview**

**Endpoint:** `GET /api/admin/dashboard/overview`

**Description:** Returns comprehensive dashboard statistics

**Response:**
```json
{
  "message": "Dashboard overview fetched successfully",
  "data": {
    "totalUsers": {
      "total": 150,
      "clients": 80,
      "workers": 70
    },
    "totalJobs": 45,
    "totalRevenue": 125000,
    "activeSubscriptions": 35,
    "recentRegistrations": {
      "total": 12,
      "clients": 7,
      "workers": 5
    },
    "popularWorkTypes": [
      { "workType": "Plumber", "count": 15 },
      { "workType": "Electrician", "count": 12 },
      { "workType": "Carpenter", "count": 10 }
    ],
    "topLocations": [
      { "location": "Delhi", "count": 25 },
      { "location": "Mumbai", "count": 18 },
      { "location": "Bangalore", "count": 15 }
    ],
    "paymentStatistics": {
      "byStatus": [
        { "status": "completed", "count": 40, "totalAmount": 120000 },
        { "status": "pending", "count": 3, "totalAmount": 5000 },
        { "status": "failed", "count": 2, "totalAmount": 0 }
      ],
      "recentPayments": [
        {
          "_id": "...",
          "orderId": "order_xxx",
          "amount": 5000,
          "status": "completed",
          "createdAt": "2025-11-10T...",
          "userId": {
            "name": "John Doe",
            "email": "john@example.com"
          }
        }
      ]
    }
  }
}
```

**Usage:**
```bash
curl -X GET http://localhost:5000/api/admin/dashboard/overview
```

---

## 2️⃣ **Get User Growth Analytics**

**Endpoint:** `GET /api/admin/dashboard/user-growth`

**Query Parameters:**
- `period` (optional): `daily` | `weekly` | `monthly` (default: `monthly`)

**Description:** Returns user registration trends over time

**Response:**
```json
{
  "message": "User growth analytics fetched successfully",
  "period": "monthly",
  "data": {
    "clients": [
      { "_id": { "year": 2025, "month": 10 }, "count": 15 },
      { "_id": { "year": 2025, "month": 11 }, "count": 22 }
    ],
    "workers": [
      { "_id": { "year": 2025, "month": 10 }, "count": 12 },
      { "_id": { "year": 2025, "month": 11 }, "count": 18 }
    ]
  }
}
```

**Usage:**
```bash
# Monthly growth (default)
curl -X GET http://localhost:5000/api/admin/dashboard/user-growth

# Daily growth
curl -X GET http://localhost:5000/api/admin/dashboard/user-growth?period=daily

# Weekly growth
curl -X GET http://localhost:5000/api/admin/dashboard/user-growth?period=weekly
```

---

## 3️⃣ **Get Revenue Analytics**

**Endpoint:** `GET /api/admin/dashboard/revenue-analytics`

**Query Parameters:**
- `period` (optional): `daily` | `weekly` | `monthly` (default: `monthly`)

**Description:** Returns revenue trends over time

**Response:**
```json
{
  "message": "Revenue analytics fetched successfully",
  "period": "monthly",
  "data": [
    {
      "_id": { "year": 2025, "month": 10 },
      "totalRevenue": 45000,
      "transactionCount": 15
    },
    {
      "_id": { "year": 2025, "month": 11 },
      "totalRevenue": 80000,
      "transactionCount": 25
    }
  ]
}
```

**Usage:**
```bash
# Monthly revenue (default)
curl -X GET http://localhost:5000/api/admin/dashboard/revenue-analytics

# Daily revenue
curl -X GET http://localhost:5000/api/admin/dashboard/revenue-analytics?period=daily

# Weekly revenue
curl -X GET http://localhost:5000/api/admin/dashboard/revenue-analytics?period=weekly
```

---

## 📊 Data Breakdown

### Total Users
- **Total:** Sum of all clients and workers
- **Clients:** Count from `Client` collection
- **Workers:** Count from `Worker` collection

### Total Jobs
- Count of all documents in `ClientPost` collection

### Total Revenue
- Sum of all `completed` payments from `Payment` collection

### Active Subscriptions
- Count of subscriptions with `status: 'active'`

### Recent Registrations (Last 7 Days)
- Clients registered in last 7 days
- Workers registered in last 7 days
- Total of both

### Popular Work Types
- Top 10 work types by worker count
- Aggregated from `Worker.workType` field

### Top Locations
- Top 10 locations by worker count
- Aggregated from `Worker.location` field

### Payment Statistics
- **By Status:** Grouped by payment status (completed, pending, failed)
- **Recent Payments:** Last 10 payments with user details

---

## 🔐 Authentication

Currently, these endpoints are **public** for testing. 

**TODO:** Add admin authentication middleware:
```javascript
import { admin_auth } from "../middlewares/admin_middlewares/admin_auth.js";

adminrouter.get('/dashboard/overview', admin_auth, getDashboardOverview);
```

---

## 🧪 Testing

### Test with Postman/Thunder Client:

1. **Dashboard Overview:**
   - Method: GET
   - URL: `http://localhost:5000/api/admin/dashboard/overview`

2. **User Growth (Monthly):**
   - Method: GET
   - URL: `http://localhost:5000/api/admin/dashboard/user-growth`

3. **User Growth (Daily):**
   - Method: GET
   - URL: `http://localhost:5000/api/admin/dashboard/user-growth?period=daily`

4. **Revenue Analytics (Monthly):**
   - Method: GET
   - URL: `http://localhost:5000/api/admin/dashboard/revenue-analytics`

5. **Revenue Analytics (Weekly):**
   - Method: GET
   - URL: `http://localhost:5000/api/admin/dashboard/revenue-analytics?period=weekly`

---

## 📁 Files Modified

1. **`backend/src/controllers/adminController.js`**
   - Added imports: `Client`, `Subscription`, `JobPost`
   - Added `getDashboardOverview()` function
   - Added `getUserGrowthAnalytics()` function
   - Added `getRevenueAnalytics()` function

2. **`backend/src/routes/adminRoutes.js`**
   - Added dashboard routes
   - Imported new controller functions

---

## 🚀 Next Steps

### For Frontend Integration:
1. Create Admin Dashboard component
2. Fetch data from these endpoints
3. Display statistics in cards/charts
4. Add Chart.js or Recharts for visualizations

### For Backend:
1. Add admin authentication middleware
2. Add rate limiting
3. Add caching for dashboard data
4. Add date range filters
5. Add export functionality (CSV/PDF)

---

## 🎯 Dashboard Metrics Summary

| Metric | Source | Calculation |
|--------|--------|-------------|
| Total Users | Client + Worker models | Count all documents |
| Total Jobs | ClientPost model | Count all documents |
| Total Revenue | Payment model | Sum where status = 'completed' |
| Active Subscriptions | Subscription model | Count where status = 'active' |
| Recent Registrations | Client + Worker models | Count where createdAt >= 7 days ago |
| Popular Work Types | Worker model | Group by workType, count, top 10 |
| Top Locations | Worker model | Group by location, count, top 10 |
| Payment Stats | Payment model | Group by status, sum amounts |

---

**Status:** ✅ Backend Complete  
**Testing Required:** Yes  
**Auth Required:** Not yet (add `admin_auth` middleware)
