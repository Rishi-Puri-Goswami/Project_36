# 🔧 UPI Not Showing - Complete Fix Guide

## Problem
You're seeing Cards, Net Banking, Wallets, Pay Later but **NOT UPI/QR Code**.

---

## ✅ Solution Steps

### Step 1: Test with Standalone HTML File

I've created a test file for you. Open it in your browser:

```powershell
# Open the test file
start C:\Users\RONIT\Project_36\frontend\razorpay-upi-test.html
```

**Or manually open:** `C:\Users\RONIT\Project_36\frontend\razorpay-upi-test.html`

**What to do:**
1. Click "Test UPI Payment" button
2. Check if UPI option appears
3. If UPI shows → Your Razorpay account HAS UPI enabled ✅
4. If UPI doesn't show → Need to enable in Razorpay Dashboard ❌

---

### Step 2: Enable UPI in Razorpay Dashboard

**This is the MOST COMMON reason UPI doesn't show!**

1. **Login to Razorpay:**
   - Go to: https://dashboard.razorpay.com
   - Login with your account

2. **Navigate to Payment Methods:**
   - Click **Settings** (left sidebar)
   - Click **Payment Methods**
   - OR directly: https://dashboard.razorpay.com/app/payment-methods

3. **Enable UPI:**
   - Scroll to find **UPI** section
   - Toggle the switch to **ON** (blue)
   - Click **Save** or **Update**

4. **Wait:**
   - Changes take 2-3 minutes to propagate
   - Clear your browser cache after enabling

5. **Verify:**
   - Go back to test HTML file
   - Click "Test UPI Payment"
   - UPI should now appear! ✅

---

### Step 3: Verify Your Code is Updated

I've already updated `PricingModal.jsx` with UPI enabled. Verify it has:

```javascript
method: {
  upi: true,        // ← This line is CRITICAL
  card: true,
  netbanking: true,
  wallet: true,
  paylater: true
}
```

**Check your file:**
```powershell
# View the relevant section
cat C:\Users\RONIT\Project_36\frontend\yarcircle\src\component\clint\PricingModal.jsx | Select-String -Pattern "upi: true" -Context 3
```

---

### Step 4: Clear Browser Cache & Restart

**Important:** Razorpay caches payment method settings!

**In your browser:**
1. Press `Ctrl + Shift + Delete`
2. Select "Cached images and files"
3. Click "Clear data"

**Or try Incognito Mode:**
```
Ctrl + Shift + N (Chrome)
Ctrl + Shift + P (Firefox)
```

**Restart your dev server:**
```powershell
# In your frontend terminal:
# Press Ctrl + C to stop
# Then restart:
cd C:\Users\RONIT\Project_36\frontend\yarcircle
npm run dev
```

---

### Step 5: Test Again

1. **Open your app** in browser (preferably Incognito)
2. **Login as client**
3. **Click "Buy Credits"**
4. **Click "Buy Now" on ₹100 plan**
5. **Check browser console** (F12) - you should see:
   ```
   === RAZORPAY ORDER DATA ===
   Amount: 10000 paise (₹100)
   Currency: INR
   Order ID: order_xxxxx
   ===========================
   ```
6. **Look for UPI option** in Razorpay checkout

---

## 🎯 Most Likely Cause

**90% of the time, UPI doesn't show because:**

### ❌ UPI is Disabled in Razorpay Dashboard

**How to check:**
1. Login to https://dashboard.razorpay.com
2. Go to Settings → Payment Methods
3. Look for UPI toggle
4. If it's OFF (gray) → Turn it ON (blue)
5. Save and wait 2-3 minutes

---

## 🧪 Debug Checklist

Run through this checklist:

- [ ] **Razorpay Account**: UPI enabled in dashboard
- [ ] **Code**: `method: { upi: true }` present in PricingModal.jsx
- [ ] **Database**: Plans have correct pricing (₹100, not ₹1)
- [ ] **Currency**: Backend sending `currency: "INR"`
- [ ] **Amount**: Backend sending amount in paise (10000 for ₹100)
- [ ] **Browser**: Tried incognito mode or cleared cache
- [ ] **Script**: Razorpay script loaded (`window.Razorpay` exists)
- [ ] **Test File**: Tried standalone HTML test file
- [ ] **Console**: No JavaScript errors in browser console

---

## 🔍 Advanced Debugging

### Check Browser Console

1. Open your app
2. Press `F12` to open console
3. Try buying a plan
4. Look for console output:

**Expected:**
```javascript
=== RAZORPAY ORDER DATA ===
Amount: 10000 paise (₹100)
Currency: INR
Order ID: order_xxxxx
===========================
```

**Check for errors:**
- ❌ `Razorpay is not defined` → Script not loaded
- ❌ `Currency is not INR` → Backend issue
- ❌ Other errors → Share with me

### Test Razorpay Script Loading

Open browser console (F12) and type:
```javascript
console.log('Razorpay loaded?', typeof Razorpay !== 'undefined')
console.log('Razorpay version:', Razorpay)
```

Should output:
```
Razorpay loaded? true
Razorpay version: function Razorpay() {...}
```

---

## 📞 Razorpay Support

If UPI still doesn't show after all steps:

### Contact Razorpay Support:
1. **Email:** support@razorpay.com
2. **Phone:** +91-80-6193-0800
3. **Dashboard:** Click "Help" button (bottom right)

### What to ask:
> "I'm using test API key `rzp_test_RdnvWAChajg0bW`. UPI payment method is not showing in checkout even though I've enabled it in Payment Methods settings. I can only see Cards, Net Banking, Wallets, and Pay Later. Please help enable UPI for my test account."

---

## 🎬 Quick Video Guide

**What Razorpay Checkout Should Look Like with UPI:**

```
┌─────────────────────────────────────┐
│  Pay ₹100.00                       │
│  to YarCircle                      │
│                                    │
│  ▼ UPI ← SHOULD BE HERE           │
│    ╔═══════════════╗               │
│    ║ █████████████ ║               │
│    ║ █ QR CODE  █ ║ ← Scan this   │
│    ║ █████████████ ║               │
│    ╚═══════════════╝               │
│                                    │
│    Or enter UPI ID:                │
│    [________________] [Pay]        │
│                                    │
│    📱 PhonePe  📱 Google Pay       │
│    📱 Paytm    📱 BHIM             │
│                                    │
│  ▼ Cards                           │
│  ▼ Net Banking                     │
│  ▼ Wallets                         │
│  ▼ Pay Later                       │
└─────────────────────────────────────┘
```

---

## 🆘 Still Not Working?

### Option 1: Use Test HTML File
The standalone test file (`razorpay-upi-test.html`) should work if your Razorpay account has UPI enabled.

### Option 2: Create New Razorpay Account
Sometimes test accounts have restrictions. Try:
1. Create new Razorpay test account
2. Enable UPI in settings
3. Use new API keys

### Option 3: Contact Me
Share this info:
1. Screenshot of Razorpay checkout (what you see)
2. Screenshot of Payment Methods page in Razorpay Dashboard
3. Browser console output when clicking "Buy Now"
4. Result from test HTML file

---

## ✅ Success Criteria

You'll know it's working when:

1. ✅ UPI appears as **first option** in Razorpay checkout
2. ✅ QR code is displayed
3. ✅ You can enter UPI ID like `success@razorpay`
4. ✅ PhonePe, Google Pay, Paytm apps listed
5. ✅ Test payment with `success@razorpay` succeeds

---

## 📝 Summary

**Most likely you need to:**

1. **Enable UPI in Razorpay Dashboard** ← Do this FIRST!
   - Login to https://dashboard.razorpay.com
   - Settings → Payment Methods
   - Toggle UPI ON
   - Save

2. **Clear browser cache**
   - Ctrl + Shift + Delete
   - Or use Incognito mode

3. **Test with the HTML file** I created
   - Open `frontend/razorpay-upi-test.html`
   - Click "Test UPI Payment"
   - Verify UPI shows

4. **If still not working:**
   - Contact Razorpay support
   - They can enable UPI for your account remotely

**The code is correct. The issue is 99% likely to be Razorpay account settings!**
