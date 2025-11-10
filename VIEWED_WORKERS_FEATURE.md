# Viewed Workers Tracking Feature

## Overview
This feature prevents clients from losing credits when viewing the same worker profile multiple times. Once a worker profile is viewed, it remains "unlocked" for that client without consuming additional credits.

## Problem Statement
**Before:** When a client views a worker profile, 1 credit is consumed. If they close the profile and view the same worker again, another credit is consumed, which creates a poor user experience and wastes credits.

**After:** When a client views a worker profile for the first time, 1 credit is consumed and the worker is added to the `viewedWorkers` list. Subsequent views of the same worker do NOT consume additional credits.

---

## Backend Implementation

### 1. Database Schema Update
**File:** `backend/src/models/subscription_model.js`

Added new field to track viewed workers:
```javascript
viewedWorkers: [
  { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Worker" 
  }
]
```

This array stores the ObjectIds of all workers this client has viewed.

---

### 2. Updated Controller Logic
**File:** `backend/src/controllers/clientController.js`

#### `viewWorkerProfile` Function (Lines ~1118-1175)

**New Flow:**
1. Check if subscription exists
2. Fetch worker details
3. **NEW:** Check if worker is in `viewedWorkers` array
   - If YES: Return profile with `creditsUsed: 0`, `alreadyViewed: true`
   - If NO: Check credits → Consume 1 credit → Add to `viewedWorkers` → Return profile with `creditsUsed: 1`, `alreadyViewed: false`

**Key Code:**
```javascript
// Check if this worker was already viewed (remains unlocked)
const alreadyViewed = subscription.viewedWorkers.some(
  id => id.toString() === workerId.toString()
);

if (alreadyViewed) {
  // Return profile without consuming credit
  return res.status(200).json({ 
    message: "Worker profile fetched successfully (already viewed)",
    worker: worker,
    creditsRemaining: subscription.viewsAllowed - subscription.viewsUsed,
    creditsUsed: 0,
    alreadyViewed: true
  });
}

// First time viewing - consume 1 credit and add to viewed workers
subscription.viewsUsed += 1;
subscription.viewedWorkers.push(workerId);
await subscription.save();
```

---

#### `getSubscriptionStatus` Function (Lines ~856-894)

**Updated Response:**
Now includes `viewedWorkers` array in the subscription status response:

```javascript
return res.status(200).json({ 
  message: "Subscription status fetched successfully", 
  subscription: {
    planName: subscription.planName,
    status: subscription.status,
    viewsAllowed: subscription.viewsAllowed,
    viewsUsed: subscription.viewsUsed,
    creditsRemaining: creditsRemaining,
    hasCredits: hasCredits,
    price: subscription.price,
    viewedWorkers: subscription.viewedWorkers || []  // NEW
  }
});
```

This allows the frontend to know which workers have been viewed and show appropriate UI indicators.

---

## API Response Format

### First View of Worker
**Request:** `GET /api/worker/view/:workerId`

**Response:**
```json
{
  "message": "Worker profile fetched successfully",
  "worker": { /* worker details */ },
  "creditsRemaining": 9,
  "creditsUsed": 1,
  "alreadyViewed": false
}
```

### Subsequent Views of Same Worker
**Request:** `GET /api/worker/view/:workerId`

**Response:**
```json
{
  "message": "Worker profile fetched successfully (already viewed)",
  "worker": { /* worker details */ },
  "creditsRemaining": 9,
  "creditsUsed": 0,
  "alreadyViewed": true
}
```

---

## Benefits

### For Clients
✅ **Save Credits:** View the same worker multiple times without penalty  
✅ **Better UX:** Can reference previously viewed workers freely  
✅ **More Value:** Each credit unlocks a unique worker permanently  
✅ **Reduced Anxiety:** No fear of accidentally wasting credits  

### For Platform
✅ **Increased Satisfaction:** Clients feel credits are more valuable  
✅ **Higher Conversion:** Clients more likely to purchase plans  
✅ **Analytics:** Track unique views vs. total views  
✅ **Competitive Edge:** Better than competitors who charge per view  

---

## Frontend Implementation (Recommended)

### Update Worker List Component
Show visual indicators for already-viewed workers:

```jsx
// In WorkersList.jsx or similar component

// Get viewed workers from subscription status
const [viewedWorkers, setViewedWorkers] = useState([]);

useEffect(() => {
  // Fetch subscription status
  const fetchStatus = async () => {
    const response = await fetch('/api/subscription/status');
    const data = await response.json();
    setViewedWorkers(data.subscription.viewedWorkers || []);
  };
  fetchStatus();
}, []);

// Render worker card
const isViewed = viewedWorkers.includes(worker._id);

return (
  <div className="worker-card">
    {isViewed && (
      <span className="badge-viewed">✓ Already Viewed</span>
    )}
    <button onClick={() => viewWorker(worker._id)}>
      {isViewed ? "View Again (Free)" : "View Full Details"}
    </button>
  </div>
);
```

### Update ViewWorkerProfile Handler
Handle the `alreadyViewed` flag in the response:

```jsx
const viewWorker = async (workerId) => {
  const response = await fetch(`/api/worker/view/${workerId}`);
  const data = await response.json();
  
  if (data.alreadyViewed) {
    // Show indicator that this is a free re-view
    console.log("Re-viewing worker - no credit consumed");
  } else {
    // First view - credit consumed
    console.log(`Credit consumed. ${data.creditsRemaining} credits remaining`);
  }
  
  // Update viewed workers list
  setViewedWorkers(prev => [...new Set([...prev, workerId])]);
};
```

---

## Testing Checklist

### Backend Testing
- [ ] Register a new client
- [ ] Purchase a plan (e.g., 10 credits)
- [ ] View Worker A → Verify 1 credit consumed (9 remaining)
- [ ] View Worker B → Verify 1 credit consumed (8 remaining)
- [ ] View Worker A again → Verify 0 credits consumed (8 remaining)
- [ ] Check subscription status → Verify `viewedWorkers` contains [WorkerA_id, WorkerB_id]
- [ ] Restart server → View Worker A → Verify still 0 credits consumed (persistence works)

### API Testing with Postman/Thunder Client
```bash
# 1. View worker for first time
GET http://localhost:5000/api/worker/view/WORKER_ID_HERE
Authorization: Bearer <client_token>

# Expected: creditsUsed: 1, alreadyViewed: false

# 2. View same worker again
GET http://localhost:5000/api/worker/view/WORKER_ID_HERE
Authorization: Bearer <client_token>

# Expected: creditsUsed: 0, alreadyViewed: true

# 3. Check subscription status
GET http://localhost:5000/api/subscription/status
Authorization: Bearer <client_token>

# Expected: viewedWorkers array contains worker ID
```

---

## Database Migration (If Needed)

If your existing subscriptions don't have the `viewedWorkers` field, you can add it via MongoDB shell:

```javascript
// Connect to MongoDB
use your_database_name;

// Add viewedWorkers field to all existing subscriptions
db.subscriptions.updateMany(
  { viewedWorkers: { $exists: false } },
  { $set: { viewedWorkers: [] } }
);

// Verify
db.subscriptions.find({ userType: "Client" }).forEach(doc => {
  print(`Client: ${doc.userId}, ViewedWorkers: ${doc.viewedWorkers.length}`);
});
```

---

## Edge Cases Handled

1. **Empty viewedWorkers:** Uses `|| []` fallback to prevent errors
2. **ObjectId Comparison:** Converts to string before comparison to avoid type mismatch
3. **Worker Not Found:** Returns 404 before credit check
4. **No Subscription:** Returns 403 before checking viewed workers
5. **No Credits:** Only checked if worker NOT in viewedWorkers (already viewed workers are free)

---

## Future Enhancements

### Potential Features
- **Expiry:** Make viewed workers expire after X days (e.g., 30 days)
- **Analytics:** Track view frequency per worker
- **Favorites:** Let clients mark viewed workers as favorites
- **History:** Show viewing history with timestamps
- **Limits:** Limit viewedWorkers array size (e.g., max 100 stored)

### Example: Add Expiry (Optional)
```javascript
// In subscription model
viewedWorkers: [{
  workerId: { type: mongoose.Schema.Types.ObjectId, ref: "Worker" },
  viewedAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, default: () => Date.now() + 30*24*60*60*1000 } // 30 days
}]

// In controller
const alreadyViewed = subscription.viewedWorkers.some(
  view => view.workerId.toString() === workerId && view.expiresAt > Date.now()
);
```

---

## Summary

This feature significantly improves the client experience by making credits more valuable and reducing frustration. Clients can now freely reference previously viewed workers without penalty, making your platform more competitive and user-friendly.

**Key Points:**
- ✅ Backend implementation complete
- ✅ API returns `alreadyViewed` flag
- ✅ Subscription status includes `viewedWorkers` list
- ⏳ Frontend UI indicators recommended (not yet implemented)
- ⏳ End-to-end testing needed

**Next Steps:**
1. Test the backend functionality thoroughly
2. Update frontend to show "Already Viewed" badges
3. Update frontend to change button text for viewed workers
4. Add analytics to track unique views vs. total views
