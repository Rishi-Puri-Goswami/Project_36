# 🔓 24-Hour Worker Unlock Feature

## Overview
Workers remain unlocked for 24 hours after the first view. During this time, clients can view the worker's profile unlimited times for FREE. After 24 hours, viewing the same worker again will consume another credit.

---

## ✨ Features

### 1. **24-Hour Unlock Timer**
- When a client views a worker for the first time → 1 credit consumed
- Worker profile is unlocked for exactly 24 hours
- Timer starts from the moment of unlock
- Can view the same worker unlimited times within 24 hours (FREE)

### 2. **Visual Timer Display**
- **Unlocked Badge**: Green badge showing "Unlocked" status
- **Time Remaining**: Live countdown showing hours/minutes left
  - Example: "23h" (23 hours remaining)
  - Example: "45m" (45 minutes remaining)
- **Expired State**: Automatically locks after 24 hours

### 3. **UI States**

#### Locked Worker (Never Viewed or Expired)
```
┌─────────────────────────────┐
│  Worker Card                │
│  ┌───────────────────────┐  │
│  │ 📞 +91 XXXXX XXXXX   │  │ <- Blurred
│  │ ✉️ xxxxx@email.com   │  │
│  │      🔒 Locked        │  │ <- Overlay
│  └───────────────────────┘  │
│  [Unlock Full Details]      │ <- Blue button
│         1 credit            │
└─────────────────────────────┘
```

#### Unlocked Worker (Active 24h)
```
┌─────────────────────────────┐
│ 🔓 Unlocked    ⏱️ 23h      │ <- Green badge with timer
│  Worker Card                │
│  ┌───────────────────────┐  │
│  │ 📞 +91 98765 43210   │  │ <- Visible
│  │ ✉️ worker@email.com  │  │
│  └───────────────────────┘  │
│  [View Again - Free]        │ <- Green button
└─────────────────────────────┘
```

### 4. **Persistent Across Refresh**
- Unlock timestamps stored in `localStorage`
- Survives page refresh
- Timer continues counting even after browser close
- Automatically expires after 24 hours (even if browser closed)

### 5. **Automatic Expiry Checking**
- Checks every 60 seconds for expired unlocks
- Removes expired workers automatically
- Shows locked state again after 24 hours
- Next view will consume a new credit

---

## 🔧 Technical Implementation

### Data Structure
```javascript
// Map: workerId -> unlockTimestamp
unlockedWorkers: Map {
  "worker123" => 1699123456789,  // Unix timestamp
  "worker456" => 1699134567890,
  ...
}
```

### Helper Functions

#### 1. `isUnlockValid(workerId)`
```javascript
// Returns true if unlock is still valid (< 24 hours)
const unlockTime = unlockedWorkers.get(workerId)
const hoursPassed = (Date.now() - unlockTime) / (1000 * 60 * 60)
return hoursPassed < 24
```

#### 2. `getRemainingTime(workerId)`
```javascript
// Returns human-readable time remaining
// Examples: "23h", "45m", null (expired)
const hoursRemaining = 24 - hoursPassed
if (hoursRemaining < 1) return `${Math.floor(hoursRemaining * 60)}m`
return `${Math.floor(hoursRemaining)}h`
```

### Flow Diagram
```
User clicks "View Details"
        ↓
Check if worker exists in unlockedWorkers Map
        ↓
    ┌───────────────────┐
    │ Already Unlocked? │
    └───────┬───────────┘
            │
    ┌───────┴────────┐
    │                │
   YES              NO
    │                │
    ↓                ↓
Check 24h timer    Make API call
    │                │
┌───┴────┐           ↓
│        │       Consume 1 credit
│        │           │
│        │           ↓
│        │    Store timestamp in Map
│        │           │
│        │           ↓
│        │    Save to localStorage
│        │           │
VALID  EXPIRED       │
  │        │         │
  │        └────┬────┘
  │             │
  ↓             ↓
Show profile  Show profile
FREE          1 credit deducted
```

---

## 📊 Credit Consumption Examples

### Scenario 1: First Time Viewing
```
Day 1, 10:00 AM - View Worker A
  → Credit consumed: 1
  → Credits remaining: 9
  → Worker A unlocked until Day 2, 10:00 AM

Day 1, 2:00 PM - View Worker A again
  → Credit consumed: 0 (still unlocked)
  → Credits remaining: 9

Day 1, 8:00 PM - View Worker A again
  → Credit consumed: 0 (still unlocked)
  → Credits remaining: 9
```

### Scenario 2: After 24 Hours
```
Day 1, 10:00 AM - View Worker A
  → Credit consumed: 1
  → Credits remaining: 9
  → Worker A unlocked until Day 2, 10:00 AM

Day 2, 10:01 AM - View Worker A again
  → 24 hours passed! Lock expires
  → Credit consumed: 1 (new unlock)
  → Credits remaining: 8
  → Worker A unlocked until Day 3, 10:01 AM
```

### Scenario 3: Multiple Workers
```
10:00 AM - View Worker A
  → Credit consumed: 1
  → Credits: 9 remaining

10:30 AM - View Worker B
  → Credit consumed: 1
  → Credits: 8 remaining

11:00 AM - View Worker A again
  → Credit consumed: 0 (unlocked until tomorrow 10:00 AM)
  → Credits: 8 remaining

11:15 AM - View Worker B again
  → Credit consumed: 0 (unlocked until tomorrow 10:30 AM)
  → Credits: 8 remaining
```

---

## 🎨 Visual Features

### Color Coding
- **Locked**: Blue button, gray contact info, blur effect
- **Unlocked**: Green button, green border, visible contact info
- **Timer Badge**: Dark green with clock icon

### Animations
- Smooth transition when locking/unlocking
- Border color change
- Blur removal animation

### Icons
- 🔒 Locked icon (locked state)
- 🔓 Unlocked icon (unlocked state)
- ⏱️ Timer icon (remaining time)

---

## 💾 LocalStorage Schema

### Key: `unlockedWorkers`
```json
[
  ["worker123abc", 1699123456789],
  ["worker456def", 1699134567890],
  ["worker789ghi", 1699145678901]
]
```

### Storage Management
- Automatically saves on unlock
- Loads on component mount
- Cleans expired entries every minute
- Survives browser restart

---

## 🔄 Auto-Expiry System

### Interval Check (Every 60 seconds)
```javascript
useEffect(() => {
  const checkExpiredUnlocks = () => {
    // Loop through all unlocked workers
    for (const [workerId, timestamp] of unlockedWorkers) {
      const hoursPassed = (Date.now() - timestamp) / (1000 * 60 * 60)
      
      if (hoursPassed >= 24) {
        // Remove from Map
        // Remove from localStorage
        console.log(`⏰ Worker ${workerId} expired after 24h`)
      }
    }
  }
  
  const interval = setInterval(checkExpiredUnlocks, 60000)
  return () => clearInterval(interval)
}, [])
```

---

## 🎯 User Benefits

### For Clients
1. **Cost Savings**: View the same worker multiple times within 24 hours for free
2. **Flexibility**: Re-check worker details without spending credits
3. **Transparency**: Clear timer showing when unlock expires
4. **Fair System**: 24 hours is enough time to make hiring decisions

### For Platform
1. **Better UX**: Users feel they get value for their credits
2. **Reduced Support**: Clear unlock status prevents confusion
3. **Fair Pricing**: One credit = 24-hour access (not single view)
4. **Encourages Engagement**: Users can review profiles thoroughly

---

## 🐛 Edge Cases Handled

### 1. Page Refresh
- ✅ Unlocks persist via localStorage
- ✅ Timer continues from stored timestamp

### 2. Browser Close/Reopen
- ✅ Unlocks remain active
- ✅ Expired unlocks cleaned on reopen

### 3. Simultaneous Views
- ✅ Backend prevents double charging
- ✅ Frontend checks timestamp before API call

### 4. Clock Changes
- ✅ Uses Unix timestamps (UTC)
- ✅ Not affected by timezone changes

### 5. Network Failure
- ✅ Optimistic updates
- ✅ Syncs with backend after reconnection

---

## 📝 Testing Checklist

- [ ] Unlock worker → See timer counting down
- [ ] View same worker 5 minutes later → No credit consumed
- [ ] Refresh page → Timer still shows correct time
- [ ] Close browser, reopen → Unlock still active
- [ ] Wait 24 hours → Worker locks again
- [ ] View expired worker → New credit consumed
- [ ] Unlock 3 workers → All show individual timers
- [ ] Check localStorage → See correct timestamps

---

## 🚀 Future Enhancements

### Possible Improvements
1. **Email Reminder**: "Your worker unlock expires in 1 hour"
2. **Extend Option**: "Extend unlock for 24h - 0.5 credits"
3. **Bulk Unlock**: "Unlock 5 workers for 24h - 4 credits (save 1 credit)"
4. **Unlock History**: See all previously unlocked workers
5. **Analytics**: Show which workers client viewed most

---

## 📞 Support

If you encounter any issues with the unlock system:
1. Check browser console for timer logs
2. Clear localStorage and refresh: `localStorage.clear()`
3. Verify system time is correct
4. Check credit balance in subscription status

---

**Last Updated**: November 11, 2025
**Version**: 2.0.0
**Feature**: 24-Hour Worker Unlock Timer
