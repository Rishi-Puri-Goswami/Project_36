# Quick Testing Guide - Credit-Based Subscription System

## 🧪 Step-by-Step Testing

### Step 1: Start Backend Server
```bash
cd backend
npm start
# Server should run on http://localhost:5000
```

### Step 2: Start Frontend Server
```bash
cd frontend/yarcircle
npm run dev
# Frontend should run on http://localhost:5173
```

### Step 3: Register New Client

1. Go to: `http://localhost:5173/client/register`
2. Fill registration form
3. Verify OTP
4. **Result**: Automatically get 10 free credits

### Step 4: Check Subscription Status

1. After login, you'll see subscription status bar at top
2. **Should show**: "10 out of 10 views" (green state)
3. Progress bar should be full

### Step 5: View Workers List

1. Dashboard shows available workers
2. Each worker card shows:
   - ✅ Name, work type, location (unlocked)
   - 🔒 Contact details (blurred/locked)
   - "View Full Details" button

### Step 6: View Worker Profile (Consume Credit)

1. Click "View Full Details" on any worker
2. **System checks credits** → If available, modal opens
3. **1 credit consumed**
4. Modal shows:
   - Full worker details
   - Contact information (phone, email)
   - Experience, skills, portfolio
   - "1 credit used" notification
5. **Status updates**: "9 out of 10 views"

### Step 7: Exhaust All Credits

1. View 10 different workers
2. After 10th view: **"0 out of 10 views"**
3. Status bar turns **RED** with pulsing animation
4. Shows message: "⚠️ No credits remaining! Upgrade to view worker profiles."

### Step 8: Try to View Without Credits

1. Click "View Full Details" on any worker
2. **Should NOT open worker modal**
3. **Should open pricing modal instead**
4. Alert shows: "❌ You don't have enough credits..."

### Step 9: Upgrade (Purchase Credits)

1. Click "⚡ Upgrade Now" button
2. Pricing modal opens with 4 plans:
   - 20 Profile Views - ₹100
   - 40 Profile Views - ₹200 ⭐ Most Popular
   - 80 Profile Views - ₹500
   - 150 Profile Views - ₹1000

3. Click "Buy Now" on any plan (e.g., 40 views - ₹200)

### Step 10: Razorpay Payment (Test Mode)

1. Razorpay checkout modal opens
2. **Test Card Details**:
   - Card Number: `4111 1111 1111 1111`
   - CVV: `123`
   - Expiry: `12/25`
   - Name: Your name

3. Click "Pay ₹200"
4. Payment processing...
5. **Success**: Alert shows "✅ Payment successful! 40 credits added to your account."

### Step 11: Verify Credits Added

1. Pricing modal closes
2. Subscription status refreshes automatically
3. **Should show**: "40 out of 40 views" (green state)
4. Can now view 40 more profiles

### Step 12: Test Cumulative Credits

1. Use 5 credits (view 5 workers)
2. **Status**: "35 out of 40 views"
3. Buy 20 more credits (₹100 plan)
4. **Result**: viewsAllowed = 40 + 20 = 60
5. **Status**: "55 out of 60 views" (35 already used + 20 new)

## 🎯 What to Check

### ✅ Subscription Status Component
- [ ] Shows correct credit count
- [ ] Progress bar updates accurately
- [ ] Green state when credits > 3
- [ ] Yellow state when credits ≤ 3
- [ ] Red state when credits = 0
- [ ] Pulsing animation on red state
- [ ] Upgrade button works

### ✅ Workers List Component
- [ ] Shows all available workers
- [ ] Basic info visible (unlocked)
- [ ] Contact info blurred (locked)
- [ ] "View Details" button present
- [ ] Loading state works
- [ ] Empty state works (no workers)

### ✅ View Worker Details
- [ ] Checks credits before showing
- [ ] Opens pricing modal if no credits
- [ ] Consumes 1 credit on view
- [ ] Shows full worker details
- [ ] Contact info clickable (phone, email)
- [ ] Modal close works
- [ ] Credits update in real-time

### ✅ Pricing Modal
- [ ] Opens on upgrade click
- [ ] Shows 4 pricing plans
- [ ] Highlights popular plan
- [ ] Price per view calculated
- [ ] "Buy Now" button works
- [ ] Modal close works

### ✅ Razorpay Integration
- [ ] Checkout modal opens
- [ ] Test card works (4111...)
- [ ] Payment success handled
- [ ] Payment failure handled
- [ ] Signature verification works
- [ ] Credits added after payment
- [ ] UI refreshes after payment

### ✅ Notifications
- [ ] Success alert on payment
- [ ] Error alert on payment failure
- [ ] Credit exhausted warning
- [ ] Low credits warning (≤3)
- [ ] Upgrade needed alert

## 🐛 Common Issues & Solutions

### Issue: Subscription status not showing
**Check**:
- Backend running?
- Client logged in?
- API endpoint working: `GET /api/clients/subscription/status`
- JWT token in localStorage

**Fix**: Check browser console for errors

---

### Issue: Pricing modal doesn't open
**Check**:
- Razorpay script loaded in index.html?
- API endpoint working: `GET /api/clients/plans`

**Fix**: Open browser console, look for errors

---

### Issue: Payment modal doesn't open
**Check**:
- Razorpay SDK loaded?
- Order creation successful?
- API endpoint working: `POST /api/clients/subscription/create-order`

**Fix**: 
```javascript
// Check in browser console:
console.log(window.Razorpay) // Should not be undefined
```

---

### Issue: Credits not updating after payment
**Check**:
- Payment verification endpoint working?
- Signature validation passing?
- API endpoint: `POST /api/clients/subscription/verify-payment`

**Fix**: Check backend logs for verification errors

---

### Issue: Worker details not showing
**Check**:
- API endpoint working: `GET /api/clients/worker/view/:workerId`
- Client has credits?
- Backend consuming credit correctly?

**Fix**: Check network tab in browser dev tools

## 📊 Test Scenarios

### Scenario 1: New User Journey
```
1. Register → Get 10 credits
2. View 3 workers → 7 credits left
3. Close app and return → Still 7 credits
4. View 7 more workers → 0 credits left
5. Try to view another → Pricing modal opens
6. Buy 20 credits → Now have 20 credits
7. View workers → Works fine
```

### Scenario 2: Credit Management
```
1. Have 10 credits
2. Buy 20 credits → Total: 30
3. Use 15 credits → Remaining: 15
4. Buy 40 credits → Total: 55 (15 + 40)
5. Verify cumulative addition works
```

### Scenario 3: Payment Flow
```
1. 0 credits → Click "View Details"
2. Pricing modal opens
3. Select 40 views plan
4. Razorpay opens
5. Enter card: 4111 1111 1111 1111
6. Payment succeeds
7. Alert: "✅ Payment successful! 40 credits added"
8. Modal closes
9. Status: "40 out of 40 views"
10. Click "View Details" → Works!
```

### Scenario 4: Edge Cases
```
1. Try payment with failure card: 4000 0000 0000 0002
   → Should show error alert
2. Close Razorpay modal without payment
   → Should not add credits
3. Internet disconnection during payment
   → Should handle gracefully
4. View worker with exactly 1 credit left
   → Should work, then show 0 credits
```

## 🎨 Visual Checks

### Colors & States:
- **Green State** (>3 credits): Blue gradient background
- **Yellow State** (≤3 credits): Yellow background, warning icon
- **Red State** (0 credits): Red background, pulsing animation

### Animations:
- [ ] Pulsing "Upgrade Now" button when 0 credits
- [ ] Progress bar fills smoothly
- [ ] Modal fade-in animations
- [ ] Loading spinners during API calls

### Responsiveness:
- [ ] Test on desktop (1920x1080)
- [ ] Test on tablet (768px)
- [ ] Test on mobile (375px)
- [ ] All modals scrollable on small screens

## 📱 Browser Testing

Test on:
- [ ] Chrome/Edge (Latest)
- [ ] Firefox (Latest)
- [ ] Safari (if on Mac)
- [ ] Mobile Chrome
- [ ] Mobile Safari

## ✅ Final Checklist

Before marking as complete:
- [ ] New user gets 10 credits
- [ ] Credits consume on profile view
- [ ] Credits show in real-time
- [ ] Pricing modal works
- [ ] Razorpay payment works
- [ ] Credits add after payment
- [ ] Credits are cumulative
- [ ] No credits = pricing modal
- [ ] All notifications work
- [ ] Responsive on all devices
- [ ] No console errors
- [ ] Backend API healthy

## 🎉 Success Criteria

**System is working if:**
1. ✅ New client gets 10 free credits
2. ✅ Can view 10 profiles without payment
3. ✅ 11th profile view triggers upgrade modal
4. ✅ Can purchase credits via Razorpay
5. ✅ Credits add to account after payment
6. ✅ Can view more profiles after purchase
7. ✅ Credits never expire
8. ✅ UI updates in real-time
9. ✅ All notifications display correctly
10. ✅ System handles errors gracefully

---

**Happy Testing! 🚀**

If all checks pass, your credit-based subscription system is **READY FOR PRODUCTION**! 🎊
