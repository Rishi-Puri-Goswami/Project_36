# Quick Reference: What Happens When Free Trial Expires

## 🎯 TL;DR - Quick Answer

**When free trial expires:**
1. ❌ Client **CANNOT** view worker application details (names, phone numbers)
2. ✅ Client **CAN** still login, post jobs, and see their dashboard
3. ⚠️ Status automatically changes from "active" to "expired"
4. 🔔 Client sees upgrade prompts everywhere
5. 💳 Client must purchase a paid plan to regain access

---

## 🔍 Detailed Breakdown

### Before Expiry (Day 0-2)
```
Free Trial Status: ACTIVE ✅
Expiry: 2 days from registration

Client Can:
✅ View worker profiles
✅ See worker phone numbers in applications
✅ Contact workers
✅ Post unlimited jobs
✅ Edit jobs
✅ See application details

Dashboard Shows:
🟢 Free Trial Active
⏰ X days remaining
```

### Exact Moment of Expiry
```
Time: Exactly when expiryDate < currentDate

Automatic Process (No manual intervention needed):
1. Client tries to access any feature
2. Backend compares dates: expiryDate (Nov 12, 10AM) vs now (Nov 12, 11AM)
3. Expired! (Nov 12, 10AM is in the past)
4. Backend updates: subscription.status = "expired"
5. Backend saves to database
6. Returns: hasAccess = false

This happens EVERY TIME client tries to access the platform
```

### After Expiry (Day 3+)
```
Free Trial Status: EXPIRED ❌
Expiry: Already passed

Client CANNOT:
❌ View worker names in applications
❌ See worker phone numbers
❌ View worker skills/experience details
❌ Contact workers who applied
❌ View worker profiles

Client CAN STILL:
✅ Login to their account
✅ Access dashboard
✅ Post new job listings
✅ Edit existing jobs
✅ Delete jobs
✅ See NUMBER of applications (e.g., "5 workers applied")
✅ View pricing plans
✅ Purchase subscription

Dashboard Shows:
🔴 Subscription Expired
⚠️ Upgrade required to view applications
[Upgrade Now Button]
```

---

## 💻 Technical Details

### How Expiry Detection Works

#### 1. Client Opens Dashboard
```javascript
// Frontend makes API call
fetch('/api/clients/subscription/check-access')

// Backend code runs:
const subscription = await Subscription.findOne({ userId: clientId });
const now = new Date(); // Current date/time

// Compare dates
if (subscription.expiryDate < now) {
  // EXPIRED!
  subscription.status = 'expired';
  await subscription.save();
  
  return {
    hasAccess: false,
    isExpired: true,
    message: "Subscription expired. Upgrade to continue."
  };
}

// Still active
return {
  hasAccess: true,
  isExpired: false
};
```

#### 2. Client Tries to View Worker Applications
```javascript
// Frontend checks access first
const accessCheck = await fetch('/api/clients/subscription/check-access');
const { hasAccess } = await accessCheck.json();

if (!hasAccess) {
  // BLOCKED! Show upgrade modal
  showUpgradeModal();
  return; // Stop execution
}

// Access granted - proceed to show applications
fetchApplications();
```

### Database Changes on Expiry

**Before Expiry:**
```json
{
  "status": "active",
  "expiryDate": "2025-11-12T10:00:00.000Z"
}
```

**After Expiry (Auto-updated):**
```json
{
  "status": "expired",
  "expiryDate": "2025-11-12T10:00:00.000Z"
}
```

---

## 🎨 UI/UX After Expiry

### Dashboard View
```
┌────────────────────────────────────────┐
│ 🏠 Dashboard                           │
├────────────────────────────────────────┤
│                                        │
│ ⚠️ SUBSCRIPTION EXPIRED                │
│ Your free trial ended on Nov 12, 2025 │
│ Upgrade now to view worker apps        │
│ [Upgrade Now]                          │
│                                        │
├────────────────────────────────────────┤
│ My Jobs                                │
│                                        │
│ 📋 Plumber Needed (5 applications) 🔒  │
│ 📋 Electrician Needed (3 apps) 🔒      │
│                                        │
│ [Post New Job] ✅                      │
└────────────────────────────────────────┘
```

### When Clicking on Job Applications
```
┌────────────────────────────────────────┐
│ 🔒 Subscription Required               │
├────────────────────────────────────────┤
│                                        │
│ Your free trial has expired!          │
│                                        │
│ Upgrade to:                            │
│ • View worker details                  │
│ • See phone numbers                    │
│ • Contact applicants                   │
│                                        │
│ Choose a plan:                         │
│ ┌──────────────────────────────┐      │
│ │ 7 Days  - ₹49  [Select]      │      │
│ │ 15 Days - ₹99  [Select] ⭐   │      │
│ │ 30 Days - ₹199 [Select]      │      │
│ └──────────────────────────────┘      │
│                                        │
│ [Upgrade Now]                          │
└────────────────────────────────────────┘
```

### Job Applications List (Blocked)
```
┌────────────────────────────────────────┐
│ Applications for: Plumber Needed       │
├────────────────────────────────────────┤
│                                        │
│ 🔒 5 workers applied                   │
│                                        │
│ ┌──────────────────────────────────┐  │
│ │ Worker #1                        │  │
│ │ Details hidden                   │  │
│ │ [Upgrade to View]                │  │
│ └──────────────────────────────────┘  │
│                                        │
│ ┌──────────────────────────────────┐  │
│ │ Worker #2                        │  │
│ │ Details hidden                   │  │
│ │ [Upgrade to View]                │  │
│ └──────────────────────────────────┘  │
│                                        │
│ ... 3 more workers                     │
│                                        │
│ [Upgrade to See All Applications]     │
└────────────────────────────────────────┘
```

---

## 🔄 Restoration After Upgrade

### Payment Successful
```
✅ Payment verified
↓
Subscription updated:
- planName: "7 Days"
- expiryDate: NOW + 7 days
- status: "active"
↓
Access restored immediately!
↓
Can view all worker applications again
```

### Timeline
```
11:00 AM - Trial expires, access blocked ❌
11:30 AM - Client selects plan
11:31 AM - Payment successful ✅
11:32 AM - Subscription activated
11:33 AM - Access restored, can view workers ✅
```

---

## 📊 Access Comparison Table

| Feature | Free Trial (Active) | Free Trial (Expired) | Paid Plan (Active) |
|---------|--------------------|--------------------|-------------------|
| Login | ✅ | ✅ | ✅ |
| Dashboard | ✅ | ✅ | ✅ |
| Post Jobs | ✅ | ✅ | ✅ |
| Edit Jobs | ✅ | ✅ | ✅ |
| See Job Count | ✅ | ✅ | ✅ |
| **View Worker Names** | ✅ | ❌ | ✅ |
| **View Phone Numbers** | ✅ | ❌ | ✅ |
| **View Worker Details** | ✅ | ❌ | ✅ |
| **Contact Workers** | ✅ | ❌ | ✅ |
| **Access Applications** | ✅ | ❌ | ✅ |

---

## ⚡ Key Points to Remember

1. **Automatic Expiry**: No cron jobs needed, checked on every access
2. **Immediate Effect**: Access blocked the moment expiry date passes
3. **Partial Access**: Can still use platform, just can't see worker details
4. **Database Update**: Status automatically changes to "expired"
5. **Easy Restoration**: Pay and access restored within seconds
6. **Cumulative Plans**: New plan extends current expiry (doesn't replace)
7. **No Data Loss**: All job posts and applications are preserved

---

## 🚨 Common Scenarios

### Scenario 1: Trial expires while viewing applications
```
1. Client is viewing worker applications
2. Trial expires at 10:00 AM
3. Client refreshes page at 10:05 AM
4. Backend detects expiry
5. Access immediately blocked
6. Upgrade modal appears
```

### Scenario 2: Trial expires but client doesn't login
```
1. Trial expires on Nov 12, 10:00 AM
2. Client doesn't login for 3 days
3. Client logs in on Nov 15
4. First API call detects expiry
5. Status updated to "expired"
6. Access blocked, shows upgrade prompt
```

### Scenario 3: Multiple job posts with applications
```
Trial Expires:
- Job 1: 5 applications → All BLOCKED 🔒
- Job 2: 3 applications → All BLOCKED 🔒
- Job 3: 8 applications → All BLOCKED 🔒

After Upgrade:
- Job 1: 5 applications → All VISIBLE ✅
- Job 2: 3 applications → All VISIBLE ✅
- Job 3: 8 applications → All VISIBLE ✅
```

---

This is exactly what happens when the free trial expires! 🎯
