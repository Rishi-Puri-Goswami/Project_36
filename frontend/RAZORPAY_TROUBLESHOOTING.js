/* 
 * RAZORPAY UPI TROUBLESHOOTING GUIDE
 * ==================================
 * 
 * Issue: UPI options not showing in Razorpay checkout
 * 
 * SOLUTION STEPS:
 */

// 1. CHECK RAZORPAY SCRIPT IS LOADED
// Open browser console and type:
console.log('Razorpay loaded?', typeof window.Razorpay !== 'undefined')

// 2. VERIFY CURRENCY IS INR
// UPI only works with INR currency
// Check your order creation response

// 3. SIMPLIFIED RAZORPAY CONFIG
// The current implementation uses DEFAULT Razorpay settings
// which AUTOMATICALLY shows UPI for INR currency

const optionsExample = {
  key: 'rzp_test_RdnvWAChajg0bW',
  amount: 10000, // ₹100 in paise (10000 paise = ₹100)
  currency: 'INR', // MUST be INR for UPI
  name: 'YarCircle',
  description: 'Test Payment',
  order_id: 'order_xxx',
  handler: function(response) {
    console.log('Payment Success:', response)
  },
  prefill: {
    name: 'Test User',
    email: 'test@example.com',
    contact: '9999999999'
  },
  theme: {
    color: '#3B82F6'
  }
}

// 4. WHAT RAZORPAY SHOWS BY DEFAULT FOR INR:
// ✅ UPI (with QR code, UPI ID, app intent)
// ✅ Cards
// ✅ Net Banking
// ✅ Wallets
// ✅ Pay Later (if enabled)

// 5. WHY UPI MIGHT NOT SHOW:
// ❌ Currency is not INR
// ❌ Amount is too high (>₹1,00,000 has limits)
// ❌ Razorpay script not loaded
// ❌ Browser blocking Razorpay (adblocker)
// ❌ Network issues

// 6. CORS ERRORS YOU'RE SEEING:
// These are NORMAL and don't affect payment:
// - lumberjack.razorpay.com (tracking/analytics)
// - sentry-cdn.com (error tracking)
// - fonts.googleapis.com (fonts)
// These errors are cosmetic and can be ignored!

// 7. TEST IN BROWSER CONSOLE:
/*
// Open browser console (F12) and paste this:

const testOrder = {
  order: {
    id: 'order_test123',
    amount: 10000,
    currency: 'INR'
  }
}

const options = {
  key: 'rzp_test_RdnvWAChajg0bW',
  amount: testOrder.order.amount,
  currency: testOrder.order.currency,
  name: 'YarCircle Test',
  description: 'Testing UPI',
  order_id: testOrder.order.id,
  handler: function(response) {
    alert('Test payment initiated: ' + response.razorpay_payment_id)
  }
}

const rzp = new Razorpay(options)
rzp.open()

// You should see UPI as the first option!
*/

// 8. DEBUGGING STEPS:
console.log('=== RAZORPAY DEBUG ===')
console.log('1. Check Razorpay loaded:', typeof window.Razorpay)
console.log('2. Check currency in your order:', 'Should be INR')
console.log('3. Check amount format:', 'Should be in paise (₹100 = 10000)')
console.log('4. CORS errors:', 'Can be ignored - cosmetic only')
console.log('5. If UPI still not showing:', 'Clear browser cache, try incognito mode')

// 9. BROWSER REQUIREMENTS:
// ✅ Chrome/Edge (Best support)
// ✅ Firefox (Good support)
// ✅ Safari (OK support)
// ❌ IE (Not supported)

// 10. MOBILE TESTING:
// On mobile, Razorpay will automatically show:
// - UPI apps installed on the phone
// - QR code for scanning
// - Option to enter UPI ID

export default {
  name: 'Razorpay UPI Troubleshooting',
  solution: 'Using default Razorpay config - UPI shows automatically for INR',
  ignoreCORS: true
}
