# Worker Authentication API Documentation

## Base URL
`http://localhost:5000/api/workers`

---

## Authentication Endpoints

### 1. Register Worker
**POST** `/api/workers/register`

Creates a new worker account and sends OTP to phone number for verification.

**Request Body:**
```json
{
  "name": "John Doe",
  "phone": "+919876543210",
  "password": "yourPassword123",
  "workType": "Plumber",
  "email": "john@example.com",  // Optional
  "location": "Mumbai",         // Optional
  "yearsOfExperience": 5,       // Optional
  "age": 30                     // Optional
}
```

**Success Response (201):**
```json
{
  "message": "OTP sent to your phone number for verification",
  "status": 201,
  "phone": "+919876543210"
}
```

**Error Responses:**
- **400**: Missing required fields (name, phone, password, workType)
- **400**: Worker already exists with this phone number
- **400**: Worker already exists with this email
- **500**: Failed to send OTP or server error

---

### 2. Verify OTP
**POST** `/api/workers/verify-otp`

Verifies the OTP sent during registration and completes account setup.

**Request Body:**
```json
{
  "phone": "+919876543210",
  "otp": "123456"
}
```

**Success Response (200):**
```json
{
  "message": "OTP verified successfully",
  "status": 200,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Cookie Set:** `workertoken` (httpOnly, 7 days expiration)

**Error Responses:**
- **400**: Phone number and OTP required
- **400**: Invalid phone number or OTP
- **400**: OTP expired (10 minutes validity)
- **400**: Max OTP attempts exceeded (5 attempts)
- **400**: Invalid OTP
- **500**: Free plan not found or server error

---

### 3. Resend OTP
**POST** `/api/workers/resend-otp`

Resends OTP to worker's phone number (1-minute cooldown).

**Request Body:**
```json
{
  "phone": "+919876543210"
}
```

**Success Response (200):**
```json
{
  "message": "OTP resent successfully to your phone number",
  "status": 200
}
```

**Error Responses:**
- **400**: Phone number is required
- **404**: Worker not found
- **429**: OTP already sent, wait 1 minute
- **500**: Failed to send OTP or server error

---

### 4. Login Worker
**POST** `/api/workers/login`

Authenticates worker and returns JWT token.

**Request Body:**
```json
{
  "phone": "+919876543210",
  "password": "yourPassword123"
}
```

**Success Response (200):**
```json
{
  "message": "Login successful",
  "status": 200,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "worker": {
    "id": "60d5ec49f1b2c72b8c8e4f1a",
    "name": "John Doe",
    "phone": "+919876543210",
    "email": "john@example.com",
    "workType": "Plumber",
    "location": "Mumbai"
  }
}
```

**Cookie Set:** `workertoken` (httpOnly, 7 days expiration)

**Error Responses:**
- **400**: Phone number and password are required
- **401**: Invalid phone number or password
- **403**: Please verify your phone number first
- **500**: Server error

---

### 5. Get Worker Profile
**GET** `/api/workers/profile`

Retrieves authenticated worker's profile (Protected Route).

**Headers:**
- Cookie: `workertoken=<JWT_TOKEN>`

**Success Response (200):**
```json
{
  "status": 200,
  "worker": {
    "_id": "60d5ec49f1b2c72b8c8e4f1a",
    "name": "John Doe",
    "phone": "+919876543210",
    "email": "john@example.com",
    "workType": "Plumber",
    "location": "Mumbai",
    "yearsOfExperience": 5,
    "age": 30,
    "skills": [],
    "bio": "",
    "profilePicture": "",
    "workPhotos": [],
    "idProof": "",
    "status": "approved",
    "otpVerified": true,
    "appliedJobs": [],
    "subscription": {
      "_id": "...",
      "planName": "Free",
      "viewsAllowed": 10,
      "viewsUsed": 0
    },
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Error Responses:**
- **401**: Authentication required
- **401**: Invalid token
- **404**: Worker not found
- **500**: Server error

---

## Worker Model Schema

```javascript
{
  name: String (required),
  email: String (unique, optional),
  password: String,
  phone: String (unique, required),
  age: Number,
  workType: String (required),
  yearsOfExperience: Number (default: 0),
  location: String,
  workPhotos: [String],
  idProof: String,
  skills: [String],
  bio: String,
  profilePicture: String,
  otpVerified: Boolean (default: false),
  otp: {
    code: String,
    expiresAt: Date,
    attempts: Number (default: 0),
    lastSentAt: Date
  },
  status: String (enum: ["pending", "approved", "rejected"], default: "approved"),
  adminNote: String,
  subscription: ObjectId (ref: "Subscription"),
  appliedJobs: [ObjectId] (ref: "ClientPost"),
  createdAt: Date,
  updatedAt: Date
}
```

---

## Authentication Flow

1. **Registration**:
   - Worker submits registration form
   - OTP sent to phone number
   - Worker account created with `otpVerified: false`

2. **OTP Verification**:
   - Worker enters 6-digit OTP
   - System validates OTP (max 5 attempts, 10-minute validity)
   - Free subscription plan assigned
   - JWT token generated and returned
   - Worker status set to "approved"

3. **Login**:
   - Worker enters phone + password
   - System validates credentials
   - JWT token generated and returned

4. **Protected Routes**:
   - Worker includes JWT in httpOnly cookie
   - Middleware validates token
   - Worker object attached to `req.worker`

---

## Middleware

### `worker_auth`
Used for protecting worker routes. Validates JWT token from cookies.

**Usage:**
```javascript
import { worker_auth } from "../middlewares/worker_middlewares/worker_auth.js";

workerrouter.get('/profile', worker_auth, getWorkerProfile);
```

---

## Testing with Postman/Thunder Client

### 1. Register
```
POST http://localhost:5000/api/workers/register
Content-Type: application/json

{
  "name": "Test Worker",
  "phone": "+919876543210",
  "password": "test123",
  "workType": "Electrician"
}
```

### 2. Verify OTP
```
POST http://localhost:5000/api/workers/verify-otp
Content-Type: application/json

{
  "phone": "+919876543210",
  "otp": "123456"
}
```

### 3. Login
```
POST http://localhost:5000/api/workers/login
Content-Type: application/json

{
  "phone": "+919876543210",
  "password": "test123"
}
```

### 4. Get Profile (Protected)
```
GET http://localhost:5000/api/workers/profile
Cookie: workertoken=<JWT_TOKEN>
```

---

## Notes

- OTP is valid for 10 minutes
- Maximum 5 OTP attempts allowed
- Resend OTP has 1-minute cooldown
- JWT token expires in 7 days
- Workers are auto-approved (status: "approved")
- Free subscription plan automatically assigned on verification
- Passwords stored in plain text (⚠️ Use bcrypt in production)
- All authenticated routes require `workertoken` cookie
