# Frontend Authentication Integration

This guide explains how the authentication system is integrated with the frontend application.

## Architecture

### Files Created/Modified

```
frontend/
├── src/
│   ├── services/
│   │   └── authService.ts          # Auth API client
│   ├── contexts/
│   │   └── AuthContext.tsx         # Auth state management
│   ├── components/
│   │   ├── Login.tsx               # Login form
│   │   ├── Signup.tsx              # Registration form
│   │   └── UserProfile.tsx         # User profile management
│   ├── api.ts                      # Updated with auth interceptor
│   ├── App.tsx                     # Updated with auth routing
│   └── main.tsx                    # Wrapped with AuthProvider
```

## Features

### 1. **Authentication Service** (`authService.ts`)

- Axios instance configured for auth backend (port 5001)
- Automatic token management (access & refresh tokens)
- Auto-refresh expired tokens
- Request/response interceptors
- LocalStorage integration

### 2. **Auth Context** (`AuthContext.tsx`)

- Global authentication state
- React hooks: `useAuth()`
- Methods: `login`, `register`, `logout`, `updateUser`
- Token verification on app load

### 3. **Login & Signup Components**

- Clean, responsive UI with Tailwind CSS
- Real-time validation
- Error handling
- Auto-save tokens on success

### 4. **User Profile Component**

- View/edit user information
- Update name
- Logout functionality

### 5. **Protected Routes**

- App shows login/signup if not authenticated
- Main dashboard requires authentication
- New "Profile" tab for user management

## How It Works

### Flow Diagram

```
User Opens App
     ↓
Check localStorage for token
     ↓
  Has token? ────No───→ Show Login/Signup
     ↓ Yes
     ↓
Verify token with backend
     ↓
Valid? ────No───→ Clear tokens → Show Login
     ↓ Yes
     ↓
Show Main Dashboard
```

### Token Management

**Access Token**

- Stored in localStorage
- Expires in 7 days
- Automatically added to API requests
- Auto-refreshed when expired

**Refresh Token**

- Stored in localStorage
- Expires in 30 days
- Used to get new access tokens
- Invalidated on logout

### API Integration

#### Auth API (Port 5001)

```typescript
// Auto-configured in authService.ts
const AUTH_API_BASE_URL = "http://localhost:5001";
```

#### Main API (Port 5000)

```typescript
// Updated in api.ts
// Automatically includes access token in headers
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

## Usage Guide

### Starting the Application

**1. Start Auth Backend:**

```bash
cd backend-auth
npm run dev
# Runs on http://localhost:5001
```

**2. Start Main Backend** (if not running):

```bash
cd backend
python -m uvicorn main:app --reload
# Runs on http://localhost:5000
```

**3. Start Frontend:**

```bash
cd frontend
npm run dev
# Runs on http://localhost:5173
```

### Testing the Flow

**1. First Visit**

- Opens to Login page
- Click "Sign up" to create account

**2. Sign Up**

- Fill in: First Name, Last Name, Email, Password
- Password must have uppercase, lowercase, number, special char
- Automatically logged in after registration

**3. Using the App**

- Access all tabs: Dashboard, AI Search, Courses, etc.
- New "Profile" tab to manage account

**4. Profile Management**

- Click "Profile" tab
- View user information
- Edit name
- Logout

**5. Token Refresh**

- Access tokens expire after 7 days
- Automatically refreshed using refresh token
- Seamless for user (no re-login needed)

**6. Logout**

- Click "Logout" in Profile tab
- Clears all tokens
- Redirects to Login page

## Using the Auth Hook

### In Any Component

```typescript
import { useAuth } from '../contexts/AuthContext';

function MyComponent() {
  const { user, isAuthenticated, login, logout } = useAuth();

  if (!isAuthenticated) {
    return <p>Please login</p>;
  }

  return (
    <div>
      <h1>Hello, {user?.fullName}</h1>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

### Available Properties/Methods

```typescript
interface AuthContextType {
  user: User | null; // Current user data
  isAuthenticated: boolean; // Auth status
  isLoading: boolean; // Initial load state
  login: (data: LoginData) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (data) => Promise<void>;
}
```

## API Endpoints Used

### Auth Endpoints (localhost:5001)

| Endpoint                  | Method | Description                      |
| ------------------------- | ------ | -------------------------------- |
| `/api/auth/register`      | POST   | Create new account               |
| `/api/auth/login`         | POST   | Login user                       |
| `/api/auth/logout`        | POST   | Logout (requires auth)           |
| `/api/auth/profile`       | GET    | Get user profile (requires auth) |
| `/api/auth/profile`       | PUT    | Update profile (requires auth)   |
| `/api/auth/verify`        | GET    | Verify token (requires auth)     |
| `/api/auth/refresh-token` | POST   | Get new access token             |

## Password Requirements

- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 number
- At least 1 special character (@$!%\*?&)

**Valid Examples:**

- `SecurePass123!`
- `MyP@ssw0rd`
- `Test1234!@#`

## Error Handling

### Network Errors

- Displays user-friendly error messages
- Automatic retry for failed token refresh

### Validation Errors

- Real-time frontend validation
- Backend validation errors displayed per field

### Token Expiration

- Access token: Auto-refreshed transparently
- Refresh token: Redirects to login page

## LocalStorage Keys

```
accessToken     - JWT access token
refreshToken    - JWT refresh token
user           - Serialized user object
```

## Security Features

1. **HttpOnly Storage**: Tokens in localStorage (consider httpOnly cookies for production)
2. **Auto Token Refresh**: Prevents unnecessary re-logins
3. **Token Verification**: Validates on app load
4. **Automatic Cleanup**: Clears tokens on logout/errors
5. **Request Interceptors**: Adds auth header automatically
6. **Protected Routes**: Redirects to login if not authenticated

## Customization

### Change Auth API URL

Edit `frontend/src/services/authService.ts`:

```typescript
const AUTH_API_BASE_URL = "https://your-production-api.com";
```

### Add Role-Based Access

```typescript
function AdminPanel() {
  const { user } = useAuth();

  if (user?.role !== 'admin') {
    return <p>Access denied</p>;
  }

  return <div>Admin content</div>;
}
```

### Customize Token Storage

Replace localStorage with sessionStorage or cookies:

```typescript
// In authService.ts
sessionStorage.setItem("accessToken", token);
```

## Troubleshooting

### Issue: "Cannot connect to server"

**Solution:** Ensure auth backend is running on port 5001

### Issue: Tokens not persisting

**Solution:** Check browser localStorage isn't disabled

### Issue: Infinite loading

**Solution:** Check network tab for failed API calls

### Issue: 401 Unauthorized

**Solution:** Token might be expired, try logging out and back in

## Production Considerations

For production deployment:

1. **Use HTTPS** for all API calls
2. **HttpOnly Cookies** instead of localStorage for tokens
3. **Environment Variables** for API URLs
4. **CORS Configuration** on backend
5. **Token Encryption** for sensitive data
6. **Rate Limiting** on backend
7. **Refresh Token Rotation** for security

## Next Steps

- [ ] Add "Remember Me" functionality
- [ ] Add password reset flow
- [ ] Add email verification
- [ ] Add 2FA (Two-Factor Authentication)
- [ ] Add social login (Google, GitHub, etc.)
- [ ] Add role-based permissions UI
- [ ] Add session management (multiple devices)

## Support

For issues or questions:

- Check backend logs: `backend-auth/` terminal
- Check browser console: F12 → Console
- Review network requests: F12 → Network
- Check [backend README](../../backend-auth/README.md)
