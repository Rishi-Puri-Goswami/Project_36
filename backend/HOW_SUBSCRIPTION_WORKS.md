# How the Subscription System Works - Detailed Explanation

## 📖 Complete Flow Explanation

### 1️⃣ CLIENT REGISTRATION (Day 0)

#### What Happens:
```
User fills registration form → Enters phone/email → Receives OTP → Verifies OTP
```

#### Backend Process (in verifyClintOtp function):
```javascript
1. User enters correct OTP
2. Backend finds "Free Trial" plan from database
3. Calculates expiry date = Current Date + 2 days
4. Creates a Subscription record:
   {
     userId: client._id,
     planName: "Free Trial",
     duration: 2 days,
     price: ₹0,
     startDate: Nov 10, 2025 (today),
     expiryDate: Nov 12, 2025 (2 days later),
     status: "active"
   }
5. Links subscription to client account
6. Client gets JWT token and is logged in
```

#### Example:
```
Registration Date: Nov 10, 2025, 10:00 AM
Free Trial Starts: Nov 10, 2025, 10:00 AM
Free Trial Expires: Nov 12, 2025, 10:00 AM
Status: "active"
```

---

### 2️⃣ DURING FREE TRIAL (Day 0 - Day 2)

#### What Client Can Do:
- ✅ Post job listings
- ✅ View worker profiles
- ✅ See worker applications on their job posts
- ✅ Contact workers (phone numbers visible)
- ✅ Full access to all features

#### How It Works:
When client tries to view worker applications:

```javascript
// Frontend calls this API
GET /api/clients/subscription/check-access

// Backend checks:
1. Does subscription exist? → YES
2. Is expiryDate > currentDate? → YES (Nov 12 > Nov 10)
3. Is status = "active"? → YES

// Response:
{
  hasAccess: true,
  isExpired: false,
  subscription: {
    planName: "Free Trial",
    expiryDate: "2025-11-12T10:00:00.000Z",
    daysRemaining: 2
  }
}
```

#### Dashboard Shows:
```
🟢 Free Trial Active
⏰ 2 days remaining
Expires: Nov 12, 2025
```

---

### 3️⃣ FREE TRIAL EXPIRES (Day 2 - 11:59 PM)

#### What Happens Automatically:

**Scenario: Client logs in on Nov 12, 2025, 11:00 PM**

```javascript
// Client opens dashboard
// Frontend calls: GET /api/clients/subscription/check-access

// Backend Process:
1. Fetches subscription from database
2. Checks: expiryDate (Nov 12, 10:00 AM) < currentDate (Nov 12, 11:00 PM)
3. EXPIRED! ❌

4. Backend automatically updates:
   subscription.status = "expired"
   subscription.save()

5. Response:
{
  hasAccess: false,
  isExpired: true,
  message: "Your subscription has expired. Please upgrade to continue.",
  expiryDate: "2025-11-12T10:00:00.000Z"
}
```

---

### 4️⃣ AFTER FREE TRIAL EXPIRES

#### What Client CANNOT Do:
- ❌ View worker application details
- ❌ See worker phone numbers
- ❌ Contact workers who applied to jobs

#### What Client CAN Still Do:
- ✅ Login to account
- ✅ Post new jobs
- ✅ Edit existing jobs
- ✅ See job post statistics (number of applications)
- ✅ View pricing plans
- ✅ Purchase subscription

#### What Client Sees:

**On Dashboard:**
```
🔴 Subscription Expired
⚠️ Upgrade to view worker applications

[Upgrade Now Button]
```

**When Trying to View Worker Applications:**
```
┌─────────────────────────────────────────┐
│  🔒 Subscription Required                │
│                                          │
│  Your free trial has expired.           │
│  Upgrade to continue viewing worker     │
│  applications and contact details.      │
│                                          │
│  [View Plans] [Upgrade Now]             │
└─────────────────────────────────────────┘
```

---

### 5️⃣ UPGRADING SUBSCRIPTION

#### Step-by-Step Process:

**Step 1: Client Views Plans**
```javascript
// Frontend calls: GET /api/clients/plans

Response:
[
  { name: "7 Days", price: ₹49, duration: 7 },
  { name: "15 Days", price: ₹99, duration: 15 },
  { name: "30 Days", price: ₹199, duration: 30 }
]
```

**Step 2: Client Selects "7 Days" Plan**
```javascript
// Frontend calls: POST /api/clients/subscription/create-order
Body: { planId: "691116af6ef1d9f7db7cafab" }

// Backend creates Razorpay order:
{
  orderId: "order_ABC123",
  amount: 4900 (₹49 × 100 paise),
  currency: "INR"
}

// Also creates Payment record in database:
{
  razorpayOrderId: "order_ABC123",
  planId: "7 Days plan ID",
  userId: client._id,
  status: "PENDING",
  price: { amount: 49, currency: "INR" }
}
```

**Step 3: Razorpay Checkout Opens**
```javascript
// Frontend shows Razorpay payment popup
// Client enters card details
// Client pays ₹49
```

**Step 4: Payment Success**
```javascript
// Razorpay sends to frontend:
{
  razorpay_order_id: "order_ABC123",
  razorpay_payment_id: "pay_XYZ789",
  razorpay_signature: "hashed_signature"
}

// Frontend sends to backend: POST /api/clients/subscription/verify-payment
```

**Step 5: Backend Verifies Payment**
```javascript
1. Validates Razorpay signature (security check)
2. Finds Payment record by orderId
3. Updates Payment:
   {
     paymentId: "pay_XYZ789",
     signature: "hashed_signature",
     status: "SUCCESS" ✅
   }

4. Finds client's Subscription
5. Calculates new expiry date:
   - Current expiry: Nov 12, 2025 (expired)
   - Is it expired? YES
   - Start fresh from NOW
   - New expiry = Nov 13, 2025 + 7 days = Nov 20, 2025

6. Updates Subscription:
   {
     planName: "7 Days",
     price: { amount: 49, currency: "INR" },
     startDate: Nov 13, 2025,
     expiryDate: Nov 20, 2025,
     status: "active" ✅
   }
```

**Step 6: Subscription Activated**
```
🟢 Subscription Active!
Plan: 7 Days
Valid until: Nov 20, 2025
7 days remaining
```

---

### 6️⃣ SUBSCRIPTION EXTENSION (Buying Another Plan)

#### Scenario: Client still has active subscription

**Current Status:**
```
Plan: 7 Days
Expiry: Nov 20, 2025 (5 days remaining)
Status: Active
```

**Client buys "15 Days" plan:**

```javascript
// Backend logic:
1. Payment verified successfully
2. Finds existing subscription
3. Checks: expiryDate (Nov 20) > currentDate (Nov 15) → STILL ACTIVE!
4. EXTENDS subscription instead of replacing:
   
   newExpiryDate = currentExpiryDate + new plan duration
   newExpiryDate = Nov 20 + 15 days = Dec 5, 2025

5. Updates Subscription:
   {
     planName: "15 Days", // Updated to latest plan
     expiryDate: Dec 5, 2025, // EXTENDED! 🎉
     status: "active"
   }
```

**Result:**
```
🟢 Subscription Extended!
Plan: 15 Days
Valid until: Dec 5, 2025
20 days remaining (5 old + 15 new)
```

---

### 7️⃣ AUTOMATIC EXPIRY CHECK

#### When Does Expiry Check Happen?

**Every time client:**
1. Opens dashboard → Calls `check-access` API
2. Tries to view worker applications → Calls `check-access` API
3. Clicks on a job post → Calls `check-access` API
4. Checks subscription status → Calls `getSubscriptionStatus` API

#### Backend Logic:
```javascript
export const checkSubscriptionAccess = async (req, res) => {
  // 1. Get subscription from database
  const subscription = await Subscription.findOne({ 
    userId: clientId, 
    userType: "Client" 
  });

  // 2. Get current date/time
  const now = new Date(); // Nov 20, 2025, 11:00 AM

  // 3. Compare dates
  if (subscription.expiryDate < now) {
    // Nov 20, 10:00 AM < Nov 20, 11:00 AM = TRUE (EXPIRED!)
    
    // 4. Auto-update status
    subscription.status = 'expired';
    await subscription.save();
    
    // 5. Return no access
    return {
      hasAccess: false,
      isExpired: true,
      message: "Subscription expired. Please upgrade."
    };
  }

  // 6. Still active!
  return {
    hasAccess: true,
    isExpired: false,
    daysRemaining: Math.ceil((expiryDate - now) / (1000*60*60*24))
  };
};
```

---

## 🎯 Key Points Summary

### ✅ What Happens When Free Trial Expires:

1. **Automatic Detection**: 
   - No cron job needed
   - Checked every time client tries to access features
   - Status automatically changes from "active" to "expired"

2. **Client Experience**:
   - Cannot view worker applications anymore
   - Sees upgrade prompts and notifications
   - Can still login and post jobs
   - Must purchase a plan to regain access

3. **Access Control**:
   - Frontend checks `hasAccess` flag from API
   - If `false` → Show upgrade modal
   - If `true` → Show worker applications

4. **Subscription Extension**:
   - New plans ADD to existing expiry (cumulative)
   - Example: 5 days left + buy 15 days = 20 days total

5. **Payment Security**:
   - Razorpay signature validation
   - Payment record stored in database
   - Subscription only activated after successful verification

### 📊 Database States

**Active Subscription:**
```json
{
  "planName": "7 Days",
  "startDate": "2025-11-10T10:00:00.000Z",
  "expiryDate": "2025-11-17T10:00:00.000Z",
  "status": "active"
}
```

**Expired Subscription:**
```json
{
  "planName": "Free Trial",
  "startDate": "2025-11-10T10:00:00.000Z",
  "expiryDate": "2025-11-12T10:00:00.000Z",
  "status": "expired" // ← Changed automatically
}
```

---

## 🔄 Visual Flow Diagram

```
Registration
    ↓
Free Trial (2 days) - ACTIVE ✅
    ↓
[Day 0] → Can view workers ✅
[Day 1] → Can view workers ✅
[Day 2] → Can view workers ✅
    ↓
[Day 3] → Trial EXPIRED ❌
    ↓
Cannot view workers 🔒
    ↓
See "Upgrade" prompt
    ↓
Client buys plan
    ↓
Payment via Razorpay
    ↓
Payment verified ✅
    ↓
Subscription ACTIVE again ✅
    ↓
New expiry = Today + Plan duration
    ↓
Can view workers again 🎉
```

---

## 💡 Frontend Implementation Hints

### Show Subscription Status:
```javascript
const [subscription, setSubscription] = useState(null);
const [hasAccess, setHasAccess] = useState(false);

useEffect(() => {
  checkAccess();
}, []);

const checkAccess = async () => {
  const res = await fetch(`${API_URL}/clients/subscription/check-access`, {
    credentials: 'include'
  });
  const data = await res.json();
  
  setHasAccess(data.hasAccess);
  
  if (data.isExpired) {
    // Show upgrade modal
    setShowUpgradeModal(true);
  }
};

// In render:
{!hasAccess && (
  <div className="bg-red-100 p-4">
    ⚠️ Your subscription has expired. 
    <button onClick={() => setShowUpgradeModal(true)}>
      Upgrade Now
    </button>
  </div>
)}
```

### Block Worker Applications:
```javascript
const viewWorkerApplications = async (jobId) => {
  // Check access first
  const accessCheck = await fetch(
    `${API_URL}/clients/subscription/check-access`,
    { credentials: 'include' }
  );
  const accessData = await accessCheck.json();
  
  if (!accessData.hasAccess) {
    // Show upgrade prompt
    alert('Subscription expired! Please upgrade to view applications.');
    setShowUpgradeModal(true);
    return; // STOP here
  }
  
  // Access granted - fetch applications
  const res = await fetch(
    `${API_URL}/clients/applications/${jobId}`,
    { credentials: 'include' }
  );
  const data = await res.json();
  setApplications(data.applications);
};
```

---

This is how the complete subscription system works from registration to expiry to upgrade! 🚀
