# Listing Charges Model - How It Works

## 📋 Overview

YaarCircle uses a **Listing Charges** model for clients posting jobs. Jobs are only visible to workers when the client has an **active subscription**.

---

## 💰 Listing Charges

| Duration | Listing Fee (₹) |
|----------|----------------|
| **Free Trial** | ₹0 (2 days) |
| **7 Days** | ₹49 |
| **15 Days** | ₹99 |
| **30 Days** | ₹199 |

---

## ✨ Benefits

### During Active Subscription:
- ✅ **Unlimited worker access** for the duration of the plan
- ✅ **Faster response** from verified workers
- ✅ **Job visibility** - Your jobs are shown to all workers
- ✅ **View applications** - See all worker applications with details
- ✅ **Contact workers** - Get phone numbers and contact info
- ✅ **Option to renew or extend** listings anytime

---

## 🔄 How It Works

### 1️⃣ Client Registration
```
Client signs up → Gets 2-day FREE TRIAL automatically
```

### 2️⃣ Free Trial (Active)
```
✅ Post jobs → Visible to ALL workers
✅ Workers apply → Client can see applications
✅ Unlimited access for 2 days
```

### 3️⃣ Free Trial Expires
```
❌ Job posts → HIDDEN from workers (Not visible in search)
❌ Worker applications → Client cannot view details
⚠️ Client must upgrade to restore visibility
```

### 4️⃣ Client Upgrades
```
Client buys 7/15/30 days plan → Pays listing fee
✅ Job posts → IMMEDIATELY visible to workers again
✅ Applications → Client can view all details
✅ Access restored for purchased duration
```

---

## 📊 Job Visibility Logic

### When Job is VISIBLE to Workers:
```javascript
Client Subscription Status: ACTIVE ✅
Client Subscription Expiry: Future date (not expired)

Result: Job appears in worker search results
```

### When Job is HIDDEN from Workers:
```javascript
Client Subscription Status: EXPIRED ❌
OR
Client Subscription Expiry: Past date (already expired)

Result: Job does NOT appear in worker search
```

---

## 🎯 Real Example

### Scenario: Rishi (Client) Posts a Job

#### Day 0 (Nov 10) - Registration
```
✅ Rishi registers
✅ Gets Free Trial (2 days)
✅ Subscription expires: Nov 12, 10:00 AM
```

#### Day 0 (Nov 10, 11:00 AM) - Posts Job
```
Job: "Need Plumber in Delhi"
Workers Needed: 2
Salary: ₹500/day

✅ Job VISIBLE to workers immediately
✅ Workers search "Plumber Delhi" → See Rishi's job
```

#### Day 1 (Nov 11) - Workers Apply
```
✅ 5 workers apply to Rishi's job
✅ Rishi can see all applications
✅ Rishi can contact workers
```

#### Day 2 (Nov 12, 11:00 AM) - Free Trial EXPIRES
```
❌ Subscription expired (1 hour ago)
❌ Rishi's job automatically HIDDEN from workers
❌ Workers search "Plumber Delhi" → DON'T see Rishi's job

Worker's View:
- Before expiry: 10 jobs found (including Rishi's)
- After expiry: 9 jobs found (Rishi's job removed)
```

#### Day 2 (Nov 12, 2:00 PM) - Rishi Upgrades
```
✅ Rishi buys "7 Days" plan (₹49)
✅ Payment successful
✅ Subscription active until: Nov 19, 2:00 PM

✅ Job IMMEDIATELY visible again
✅ Workers search "Plumber Delhi" → See Rishi's job
✅ Rishi can view all applications
```

---

## 🔍 Technical Implementation

### Backend Logic (getAllAvailableJobs)

```javascript
// When workers search for jobs
export const getAllAvailableJobs = async (req, res) => {
  // 1. Find all matching jobs
  const jobs = await ClientPost.find(filter);
  
  // 2. Check each client's subscription
  const activeJobs = [];
  for (const job of jobs) {
    const subscription = await Subscription.findOne({
      userId: job.clientId,
      userType: 'Client'
    });
    
    // 3. Only include if subscription is active
    if (subscription?.status === 'active' && 
        subscription?.expiryDate >= now) {
      activeJobs.push(job); // ✅ Show this job
    }
    // Otherwise: ❌ Skip this job (hidden)
  }
  
  // 4. Return only jobs from active clients
  return { jobs: activeJobs };
};
```

---

## 📱 What Client Sees

### During Active Subscription:
```
┌────────────────────────────────┐
│ 🟢 Subscription Active          │
│ Plan: 7 Days                   │
│ Expires: Nov 19, 2025          │
│ Days Remaining: 7              │
├────────────────────────────────┤
│ Your Jobs (Visible to Workers) │
│                                │
│ 📋 Plumber Needed              │
│    Status: Active ✅            │
│    Applications: 5             │
│    [View Applications]         │
└────────────────────────────────┘
```

### After Subscription Expires:
```
┌────────────────────────────────┐
│ 🔴 Subscription Expired         │
│ Plan: Free Trial               │
│ Expired: Nov 12, 2025          │
├────────────────────────────────┤
│ Your Jobs (HIDDEN from Workers)│
│                                │
│ 📋 Plumber Needed              │
│    Status: Hidden 🔒            │
│    Applications: 5             │
│    ⚠️ Upgrade to make visible  │
│    [Upgrade Now]               │
└────────────────────────────────┘
```

---

## 👷 What Worker Sees

### When Client Has Active Subscription:
```
Search Results: "Plumber Delhi"

┌─────────────────────────────┐
│ Plumber Needed              │
│ Posted by: Rishi            │
│ Location: Delhi             │
│ Salary: ₹500/day            │
│ Workers needed: 2           │
│ [Apply Now]                 │
└─────────────────────────────┘
```

### When Client's Subscription Expired:
```
Search Results: "Plumber Delhi"

(No results - Job is hidden)

OR

(Other jobs shown, but Rishi's job is NOT in the list)
```

---

## 🔄 Subscription Extension

### Scenario: Client Extends Before Expiry

**Current Status:**
```
Plan: 7 Days
Expiry: Nov 19, 2025
Days Remaining: 5
Status: Active ✅
```

**Buys 15 Days Plan:**
```
Payment: ₹99
New Expiry: Nov 19 + 15 days = Dec 4, 2025
Status: Active ✅
Total Days: 20 (5 remaining + 15 new)
```

**Result:**
```
✅ Jobs remain visible (no interruption)
✅ Extended until Dec 4, 2025
```

---

## ⚠️ Important Notes

### For Clients:
1. **Free Trial**: 2 days to test the platform
2. **Auto-Hide**: Jobs automatically hidden when subscription expires
3. **Instant Restore**: Pay and jobs become visible immediately
4. **No Data Loss**: All job posts and applications preserved
5. **Cumulative**: Extend plans before expiry for continuous visibility

### For Workers:
1. Only see jobs from clients with active subscriptions
2. Cannot apply to hidden jobs (don't see them in search)
3. Applications to expired jobs are preserved
4. Get notified when job becomes active again (optional feature)

---

## 💡 Best Practices

### For Clients:
```
✅ DO: Extend subscription before it expires
✅ DO: Use longer plans (30 days) for better value
✅ DO: Monitor expiry date on dashboard
❌ DON'T: Let subscription expire if actively hiring
❌ DON'T: Wait until last day to renew
```

### Benefits of Active Subscription:
- 📈 **Higher visibility** - More workers see your jobs
- ⚡ **Faster responses** - Workers apply quickly
- 💼 **Professional image** - Shows you're serious
- 🔄 **Continuous hiring** - No interruption in applications

---

## 📊 Comparison Table

| Feature | Free Trial (Active) | Expired | Paid Plan (Active) |
|---------|--------------------|---------|--------------------|
| **Job Visibility to Workers** | ✅ Visible | ❌ Hidden | ✅ Visible |
| **Worker Applications** | ✅ Can view | ❌ Blocked | ✅ Can view |
| **Contact Workers** | ✅ Yes | ❌ No | ✅ Yes |
| **Post New Jobs** | ✅ Yes | ✅ Yes | ✅ Yes |
| **Edit Jobs** | ✅ Yes | ✅ Yes | ✅ Yes |
| **Duration** | 2 days | - | 7/15/30 days |
| **Cost** | Free | - | ₹49/99/199 |

---

## 🎯 Summary

### Listing Charges Model:
```
Active Subscription → Jobs VISIBLE to workers → Get applications ✅
Expired Subscription → Jobs HIDDEN from workers → No new applications ❌
Upgrade → Jobs VISIBLE again → Resume hiring ✅
```

This ensures:
- 💰 Fair pricing for job visibility
- 🎯 Active clients get better results
- ⚡ Workers see only serious job posts
- 🔄 Easy to extend/renew anytime

---

**Ready to post jobs and find the best workers? Start your free trial today!** 🚀
