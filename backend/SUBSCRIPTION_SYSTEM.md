# Subscription System Documentation

## Overview
This document explains the subscription-based access system for clients on YaarCircle platform.

## Subscription Plans

### Free Trial
- **Duration**: 2 days
- **Price**: ₹0 (Free)
- **Features**: View worker applications for job posts
- **Auto-assigned**: Yes, on client registration

### Paid Plans

| Plan Name | Duration | Price | Access |
|-----------|----------|-------|--------|
| 7 Days    | 7 days   | ₹49   | Full access to worker applications |
| 15 Days   | 15 days  | ₹99   | Full access to worker applications |
| 30 Days   | 30 days  | ₹199  | Full access to worker applications |

## How It Works

### 1. Client Registration
- When a client registers, they automatically get a **2-day Free Trial**
- Free trial starts immediately after OTP verification
- Expiry date is set to 2 days from registration

### 2. During Free Trial
- Client can view worker applications
- Can post jobs
- Full access to all features

### 3. After Free Trial Expires
- Client gets a notification to upgrade
- Cannot view worker application details until subscription is active
- Can still post jobs but limited visibility

### 4. Upgrading Subscription
- Client selects a plan (7, 15, or 30 days)
- Payment via Razorpay
- Subscription activates immediately after successful payment
- If existing subscription is active, new duration is added to current expiry date

## API Endpoints

### Subscription Management

#### Get Subscription Status
```http
GET /api/clients/subscription/status
Authorization: Required (clint_auth)
```

**Response:**
```json
{
  "message": "Subscription status fetched successfully",
  "subscription": {
    "planName": "Free Trial",
    "status": "active",
    "startDate": "2025-11-08T10:00:00.000Z",
    "expiryDate": "2025-11-10T10:00:00.000Z",
    "daysRemaining": 2,
    "isExpired": false,
    "price": {
      "amount": 0,
      "currency": "INR"
    }
  }
}
```

#### Get All Available Plans
```http
GET /api/clients/plans
```

**Response:**
```json
{
  "message": "Plans fetched successfully",
  "plans": [
    {
      "_id": "...",
      "planName": "Free Trial",
      "duration": 2,
      "viewsAllowed": 0,
      "price": {
        "amount": 0,
        "currency": "INR"
      },
      "description": "2 days free trial - View worker applications"
    },
    {
      "_id": "...",
      "planName": "7 Days",
      "duration": 7,
      "viewsAllowed": 0,
      "price": {
        "amount": 49,
        "currency": "INR"
      },
      "description": "7 days access - View worker applications"
    }
    // ... more plans
  ]
}
```

#### Check Subscription Access
```http
GET /api/clients/subscription/check-access
Authorization: Required (clint_auth)
```

**Response (Active):**
```json
{
  "hasAccess": true,
  "isExpired": false,
  "message": "Subscription is active",
  "subscription": {
    "planName": "7 Days",
    "expiryDate": "2025-11-17T10:00:00.000Z",
    "daysRemaining": 7
  }
}
```

**Response (Expired):**
```json
{
  "hasAccess": false,
  "isExpired": true,
  "message": "Your subscription has expired. Please upgrade to continue.",
  "expiryDate": "2025-11-08T10:00:00.000Z"
}
```

#### Create Subscription Order (Razorpay)
```http
POST /api/clients/subscription/create-order
Authorization: Required (clint_auth)
Content-Type: application/json

{
  "planId": "673fc1a2b3c4d5e6f7g8h9i0"
}
```

**Response:**
```json
{
  "message": "Order created successfully",
  "success": true,
  "order": {
    "id": "order_ORzp1a2b3c4d5",
    "entity": "order",
    "amount": 4900,
    "currency": "INR",
    "receipt": "receipt_1699632000000",
    "status": "created"
  },
  "planDetails": {
    "name": "7 Days",
    "duration": 7,
    "amount": 49
  }
}
```

#### Verify Subscription Payment
```http
POST /api/clients/subscription/verify-payment
Authorization: Required (clint_auth)
Content-Type: application/json

{
  "razorpayOrderId": "order_ORzp1a2b3c4d5",
  "paymentId": "pay_ORzp1a2b3c4d5",
  "signature": "generated_signature_from_razorpay"
}
```

**Response:**
```json
{
  "message": "Payment verified and subscription activated successfully",
  "subscription": {
    "planName": "7 Days",
    "expiryDate": "2025-11-17T10:00:00.000Z",
    "status": "active"
  }
}
```

## Database Models

### Plan Model
```javascript
{
  planName: String, // "Free Trial", "7 Days", "15 Days", "30 Days"
  duration: Number, // in days
  viewsAllowed: Number, // 0 means unlimited during subscription
  price: {
    amount: Number,
    currency: String
  },
  description: String
}
```

### Subscription Model
```javascript
{
  userId: ObjectId, // ref to Client
  planId: ObjectId, // ref to Plan
  userType: String, // "Client"
  planName: String,
  price: {
    amount: Number,
    currency: String
  },
  viewsAllowed: Number,
  viewsUsed: Number,
  startDate: Date,
  expiryDate: Date,
  status: String // "active", "expired", "cancelled"
}
```

### Payment Model
```javascript
{
  planId: ObjectId,
  userId: ObjectId,
  paymentId: String,
  razorpayOrderId: String,
  signature: String,
  status: String, // "PENDING", "SUCCESS", "FAILED"
  price: {
    amount: Number,
    currency: String
  }
}
```

## Frontend Integration Guide

### 1. Check Subscription Status on Dashboard Load
```javascript
const checkSubscription = async () => {
  const response = await fetch(`${API_URL}/clients/subscription/check-access`, {
    credentials: 'include'
  });
  const data = await response.json();
  
  if (!data.hasAccess && data.isExpired) {
    // Show upgrade modal/notification
    showUpgradeModal();
  }
};
```

### 2. Display Subscription Info
```javascript
const getSubscriptionStatus = async () => {
  const response = await fetch(`${API_URL}/clients/subscription/status`, {
    credentials: 'include'
  });
  const data = await response.json();
  
  // Display: planName, daysRemaining, expiryDate
  return data.subscription;
};
```

### 3. Fetch Available Plans
```javascript
const fetchPlans = async () => {
  const response = await fetch(`${API_URL}/clients/plans`);
  const data = await response.json();
  return data.plans;
};
```

### 4. Purchase Subscription (Razorpay Integration)
```javascript
const purchaseSubscription = async (planId) => {
  // Step 1: Create order
  const orderResponse = await fetch(`${API_URL}/clients/subscription/create-order`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ planId })
  });
  const orderData = await orderResponse.json();
  
  // Step 2: Open Razorpay checkout
  const options = {
    key: 'YOUR_RAZORPAY_KEY_ID',
    amount: orderData.order.amount,
    currency: orderData.order.currency,
    name: 'YaarCircle',
    description: `${orderData.planDetails.name} Subscription`,
    order_id: orderData.order.id,
    handler: async function (response) {
      // Step 3: Verify payment
      const verifyResponse = await fetch(`${API_URL}/clients/subscription/verify-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          razorpayOrderId: response.razorpay_order_id,
          paymentId: response.razorpay_payment_id,
          signature: response.razorpay_signature
        })
      });
      
      const verifyData = await verifyResponse.json();
      
      if (verifyResponse.ok) {
        alert('Subscription activated successfully!');
        // Reload subscription status
        checkSubscription();
      }
    }
  };
  
  const razorpay = new window.Razorpay(options);
  razorpay.open();
};
```

## Testing

### Seed Plans
```bash
cd backend
node src/seedPlans.js
```

### Test Razorpay (Test Mode)
Use Razorpay test credentials:
- Test Card: 4111 1111 1111 1111
- CVV: Any 3 digits
- Expiry: Any future date

## Notes
- Free trial is automatically assigned on registration
- Subscriptions can be extended (durations add up)
- Expired subscriptions automatically update status
- All dates are stored in UTC
- Payment verification uses Razorpay signature validation
