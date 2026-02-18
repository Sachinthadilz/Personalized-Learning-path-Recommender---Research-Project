# Postman Testing Guide

## Quick Start

### 1. Import Files into Postman

**Import Collection:**

1. Open Postman
2. Click "Import" button (top left)
3. Select `Auth-API.postman_collection.json`
4. Click "Import"

**Import Environment:**

1. Click the "Environments" icon (left sidebar, gear icon)
2. Click "Import"
3. Select `Auth-API.postman_environment.json`
4. Click "Import"

**Activate Environment:**

1. Select "UP Knowledge Graph - Auth (Local)" from the environment dropdown (top right)

### 2. Start Your Server

```bash
cd backend-auth
npm run dev
```

### 3. Test the API

## Testing Workflow

### Step 1: Health Check

**Run:** `Health Check > Health Status`

- Verify server is running
- Should return 200 OK

### Step 2: Register a New User

**Run:** `Authentication > Register User`

- Creates a new user account
- Automatically saves tokens to environment variables
- Change the email if user already exists

**Sample Request:**

```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "password": "SecurePass123!",
  "confirmPassword": "SecurePass123!"
}
```

**Expected Response (201):**

```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "...",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com",
      "role": "user",
      "fullName": "John Doe"
    },
    "accessToken": "...",
    "refreshToken": "..."
  }
}
```

### Step 3: Login (If Already Registered)

**Run:** `Authentication > Login`

- Login with existing credentials
- Tokens automatically saved

**Sample Request:**

```json
{
  "email": "john.doe@example.com",
  "password": "SecurePass123!"
}
```

### Step 4: Get Profile

**Run:** `User Profile > Get Profile`

- Requires authentication (token automatically added from environment)
- Returns current user information

**Expected Response (200):**

```json
{
  "success": true,
  "data": {
    "id": "...",
    "firstName": "John",
    "lastName": "Doe",
    "fullName": "John Doe",
    "email": "john.doe@example.com",
    "role": "user",
    "isEmailVerified": false,
    "lastLogin": "2026-02-13T...",
    "createdAt": "2026-02-13T..."
  }
}
```

### Step 5: Update Profile

**Run:** `User Profile > Update Profile`

- Update first name and/or last name

**Sample Request:**

```json
{
  "firstName": "Jane",
  "lastName": "Smith"
}
```

### Step 6: Verify Token

**Run:** `Authentication > Verify Token`

- Check if access token is valid
- Useful for debugging token issues

### Step 7: Refresh Token

**Run:** `Authentication > Refresh Token`

- Get new access token without logging in again
- Automatically updates accessToken in environment

### Step 8: Change Password

**Run:** `User Profile > Change Password`

- Change user password
- **Note:** After this, all refresh tokens are invalidated

**Sample Request:**

```json
{
  "currentPassword": "SecurePass123!",
  "newPassword": "NewSecurePass456!",
  "confirmPassword": "NewSecurePass456!"
}
```

### Step 9: Logout

**Run:** `Authentication > Logout`

- Invalidates refresh token
- Automatically clears tokens from environment

## Environment Variables

The collection automatically manages these variables:

| Variable       | Description       | Auto-filled             |
| -------------- | ----------------- | ----------------------- |
| `baseUrl`      | API base URL      | Manual                  |
| `accessToken`  | JWT access token  | Yes (on login/register) |
| `refreshToken` | JWT refresh token | Yes (on login/register) |
| `userId`       | Current user ID   | Yes (on login/register) |

## Password Validation Rules

Passwords must meet these requirements:

- Minimum 8 characters
- At least 1 uppercase letter (A-Z)
- At least 1 lowercase letter (a-z)
- At least 1 number (0-9)
- At least 1 special character (@$!%\*?&)

**Valid Examples:**

- `SecurePass123!`
- `MyP@ssw0rd`
- `Test1234!@#`

**Invalid Examples:**

- `password` (no uppercase, number, special char)
- `PASSWORD123` (no lowercase, special char)
- `Pass123` (too short)

## Common Errors

### 400 Bad Request - Validation Failed

**Cause:** Invalid input data
**Solution:** Check validation rules, ensure all required fields are provided

### 401 Unauthorized

**Cause:** Missing or invalid token
**Solution:** Login again or refresh token

### 403 Forbidden

**Cause:** Account deactivated or insufficient permissions
**Solution:** Contact administrator

### 409 Conflict

**Cause:** Email already exists
**Solution:** Use different email or login with existing account

### 500 Internal Server Error

**Cause:** Server error or database connection issue
**Solution:** Check server logs and database connection

## Testing Different Scenarios

### Test Invalid Registration

1. Use "Register User" request
2. Modify body to test:
   - Weak password: `"password": "weak"`
   - Invalid email: `"email": "notanemail"`
   - Mismatched passwords: Different password and confirmPassword
   - Short name: `"firstName": "A"`

### Test Token Expiration

1. Login to get tokens
2. Wait for token to expire (or manually set expired token)
3. Try "Get Profile" - should get 401
4. Use "Refresh Token" to get new access token

### Test Logout

1. Login to get tokens
2. Run "Logout"
3. Try "Get Profile" - should work (access token still valid)
4. Try "Refresh Token" with old refresh token - should fail (token invalidated)

## Tips

1. **Auto-save Tokens:** Login and Register requests automatically save tokens to environment
2. **Clean Environment:** Logout request automatically clears tokens
3. **Multiple Users:** Create multiple users by changing the email in Register request
4. **Token Inspection:** Use [jwt.io](https://jwt.io) to decode and inspect tokens
5. **Console Logs:** Check Postman console (View > Show Postman Console) for debug info

## Production Testing

To test against production:

1. Duplicate the environment
2. Rename to "UP Knowledge Graph - Auth (Production)"
3. Update `baseUrl` to your production URL
4. Switch environment in dropdown

## Troubleshooting

**Issue:** "Cannot connect to server"
**Solution:** Ensure server is running on http://localhost:5001

**Issue:** "Tokens not auto-saving"
**Solution:** Check environment is selected in dropdown (top right)

**Issue:** "Database connection failed"
**Solution:** Check MongoDB connection string in .env file

**Issue:** "Password doesn't meet requirements"
**Solution:** Use password with uppercase, lowercase, number, and special character

## Support

For issues or questions:

- Check [README.md](../README.md) for API documentation
- Review server logs for detailed error messages
- Verify .env configuration
