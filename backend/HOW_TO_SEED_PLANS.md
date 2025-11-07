# How to Seed Plans in Database

## Option 1: Using MongoDB Compass or Studio 3T (Recommended - Quick)

1. Open MongoDB Compass or Studio 3T
2. Connect to your database: `mongodb+srv://your-connection-string`
3. Navigate to your database
4. Find or create the `plans` collection
5. Insert these 3 documents:

```json
[
  {
    "planName": "Free",
    "viewsAllowed": 10,
    "price": {
      "amount": 0,
      "currency": "INR"
    }
  },
  {
    "planName": "Starter",
    "viewsAllowed": 50,
    "price": {
      "amount": 499,
      "currency": "INR"
    }
  },
  {
    "planName": "Pro",
    "viewsAllowed": 200,
    "price": {
      "amount": 1499,
      "currency": "INR"
    }
  }
]
```

## Option 2: Using MongoDB Shell

```bash
# Connect to MongoDB
mongosh "your-mongodb-connection-string"

# Use your database
use your_database_name

# Insert plans
db.plans.insertMany([
  {
    planName: "Free",
    viewsAllowed: 10,
    price: { amount: 0, currency: "INR" }
  },
  {
    planName: "Starter",
    viewsAllowed: 50,
    price: { amount: 499, currency: "INR" }
  },
  {
    planName: "Pro",
    viewsAllowed: 200,
    price: { amount: 1499, currency: "INR" }
  }
])
```

## Option 3: Using the Seed Script (Command Line)

1. Stop your backend server (Ctrl+C)
2. Run: `npm run seed:plans`
3. Follow prompts
4. Restart server: `npm run dev`

## Verify Plans Were Created

```bash
# In MongoDB Shell
db.plans.find().pretty()

# Should show 3 plans: Free, Starter, Pro
```

After adding plans, your worker registration OTP verification will work!
