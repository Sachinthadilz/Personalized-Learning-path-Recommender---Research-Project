# Quick Start Guide - Authentication Integration

## Setup Instructions

### 1. Install Dependencies (if not already done)

**Backend Auth:**

```bash
cd backend-auth
npm install
```

**Frontend:**

```bash
cd frontend
npm install
```

### 2. Configure Environment

**Backend Auth (.env):**
Make sure `backend-auth/.env` is configured:

```env
PORT=5001
NODE_ENV=development
MONGODB_URI=mongodb+srv://your-connection-string
JWT_SECRET=your-jwt-secret
JWT_REFRESH_SECRET=your-refresh-secret
CORS_ORIGIN=http://localhost:5173
```

### 3. Start All Services

**Terminal 1 - Auth Backend:**

```bash
cd backend-auth
npm run dev
```

Server will start on http://localhost:5001

**Terminal 2 - Main Backend:**

```bash
cd backend
# If using Python virtual environment
.venv\Scripts\activate  # Windows
# or
source .venv/bin/activate  # Mac/Linux

python -m uvicorn main:app --reload
```

Server will start on http://localhost:5000

**Terminal 3 - Frontend:**

```bash
cd frontend
npm run dev
```

App will open on http://localhost:5173

### 4. Test the Application

1. **Open Browser:** Go to http://localhost:5173
2. **Sign Up:** Create a new account
3. **Use App:** Access all features
4. **Profile:** Manage your account in the Profile tab

## What's New?

### Frontend Changes

✅ **New Components:**

- Login page with email/password
- Signup page with validation
- User Profile page
- Auth state management

✅ **New Features:**

- Protected routes (login required)
- Automatic token refresh
- User welcome message in header
- Profile management tab

✅ **Security:**

- JWT token authentication
- Auto-refresh expired tokens
- Secure token storage
- Protected API calls

### File Structure

```
Frontend:
├── src/
│   ├── services/
│   │   └── authService.ts       ✨ NEW - Auth API
│   ├── contexts/
│   │   └── AuthContext.tsx      ✨ NEW - Auth state
│   ├── components/
│   │   ├── Login.tsx            ✨ NEW
│   │   ├── Signup.tsx           ✨ NEW
│   │   └── UserProfile.tsx      ✨ NEW
│   ├── api.ts                   ✏️ UPDATED - Auth header
│   ├── App.tsx                  ✏️ UPDATED - Auth routing
│   └── main.tsx                 ✏️ UPDATED - Auth provider

Backend Auth:
├── src/
│   ├── config/                  Database & JWT config
│   ├── controllers/             Request handlers
│   ├── middleware/              Auth, validation, errors
│   ├── models/                  User model
│   ├── routes/                  API routes
│   ├── services/                Business logic
│   ├── app.js                   Express app
│   └── server.js                Server entry
└── postman/                     API testing files
```

## Testing Checklist

- [ ] Sign up new account
- [ ] Login with credentials
- [ ] View dashboard
- [ ] Navigate between tabs
- [ ] View profile
- [ ] Edit profile name
- [ ] Logout
- [ ] Login again
- [ ] Check token persistence (refresh page)

## Common Issues

### Port Already in Use

```bash
# Windows - Kill process on port 5001
netstat -ano | findstr :5001
taskkill /PID <PID> /F

# Mac/Linux
lsof -ti:5001 | xargs kill -9
```

### MongoDB Connection Failed

- Check your MongoDB connection string in `.env`
- Ensure MongoDB Atlas IP whitelist includes your IP
- Replace `<db_password>` with actual password

### CORS Error

- Ensure `CORS_ORIGIN` in backend `.env` matches frontend URL
- Default: `http://localhost:5173`

### Tokens Not Working

1. Clear localStorage in browser (F12 → Application → Local Storage)
2. Logout and login again
3. Check both backend servers are running

## API Endpoints

### Test with Postman

Import files from `backend-auth/postman/`:

1. `Auth-API.postman_collection.json`
2. `Auth-API.postman_environment.json`

### Or use cURL

**Register:**

```bash
curl -X POST http://localhost:5001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "password": "SecurePass123!",
    "confirmPassword": "SecurePass123!"
  }'
```

**Login:**

```bash
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePass123!"
  }'
```

## User Flow

```
1. User visits http://localhost:5173
   ↓
2. Sees Login page (if not authenticated)
   ↓
3. Can switch to Sign Up
   ↓
4. After signup/login → Main Dashboard
   ↓
5. Can navigate all tabs
   ↓
6. Profile tab → View/Edit profile, Logout
   ↓
7. Logout → Back to Login page
```

## Documentation

- **Backend Auth:** [backend-auth/README.md](../backend-auth/README.md)
- **Frontend Auth:** [frontend/AUTHENTICATION.md](./AUTHENTICATION.md)
- **Postman Guide:** [backend-auth/postman/README.md](../backend-auth/postman/README.md)

## Next Steps

Want to add more features?

1. **Password Reset:**
   - Add forgot password link
   - Email reset token
   - Reset password form

2. **Email Verification:**
   - Send verification email on signup
   - Verify email link
   - Mark account as verified

3. **Profile Picture:**
   - Upload avatar
   - Store in cloud (AWS S3, Cloudinary)
   - Display in header

4. **Admin Panel:**
   - User management
   - Role assignment
   - Activity logs

5. **Social Login:**
   - Google OAuth
   - GitHub OAuth
   - Facebook Login

## Support

Having issues? Check:

1. All three servers are running
2. MongoDB connection is working
3. Environment variables are set correctly
4. Browser console for errors (F12)
5. Backend logs in terminals

## Success! 🎉

If you can:

- ✅ Sign up a new account
- ✅ Login successfully
- ✅ See your name in header
- ✅ Navigate all tabs
- ✅ View/edit your profile
- ✅ Logout and login again

**You're all set!** The authentication system is fully integrated and working.
