# Authentication Service - UP Knowledge Graph

A professional, production-ready authentication service built with Node.js, Express, and MongoDB. This service provides secure user authentication with JWT tokens, password hashing, input validation, and comprehensive security measures.

## Features

- **User Registration** with comprehensive validation
- **Secure Login** with JWT access and refresh tokens
- **Token Refresh** mechanism for seamless user experience
- **Password Management** (change password)
- **User Profile** management (view and update)
- **Token Verification** endpoint
- **Logout** with token invalidation
- **Security Best Practices**:
  - Password hashing with bcryptjs
  - JWT-based authentication
  - Request rate limiting
  - CORS protection
  - Helmet security headers
  - Input validation and sanitization
  - Error handling middleware

## Project Structure

```
backend-auth/
├── src/
│   ├── config/
│   │   ├── database.js          # MongoDB connection
│   │   └── jwt.js               # JWT configuration
│   ├── controllers/
│   │   └── authController.js    # Request handlers
│   ├── middleware/
│   │   ├── auth.js              # Authentication middleware
│   │   ├── errorHandler.js      # Error handling
│   │   └── validation.js        # Input validation rules
│   ├── models/
│   │   └── User.js              # User model schema
│   ├── routes/
│   │   └── authRoutes.js        # API routes
│   ├── services/
│   │   └── authService.js       # Business logic
│   ├── app.js                   # Express app configuration
│   └── server.js                # Server entry point
├── .env.example                 # Environment variables template
├── .gitignore
├── package.json
└── README.md
```

## Installation

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or MongoDB Atlas)
- npm or yarn

### Steps

1. **Install Dependencies**

```bash
cd backend-auth
npm install
```

2. **Configure Environment Variables**

Create a `.env` file in the root directory:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Server Configuration
PORT=5001
NODE_ENV=development

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/up-knowledge-graph-auth

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=7d
JWT_REFRESH_SECRET=your-super-secret-refresh-token-key-change-this-in-production
JWT_REFRESH_EXPIRE=30d

# CORS Configuration
CORS_ORIGIN=http://localhost:5173

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

3. **Start the Server**

**Development mode** (with auto-reload):

```bash
npm run dev
```

**Production mode**:

```bash
npm start
```

The server will start on `http://localhost:5001`

## API Documentation

### Base URL

```
http://localhost:5001/api/auth
```

### Endpoints

#### 1. **Register User**

Register a new user account.

- **URL**: `/register`
- **Method**: `POST`
- **Auth Required**: No

**Request Body:**

```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "password": "SecurePass123!",
  "confirmPassword": "SecurePass123!"
}
```

**Validation Rules:**

- First name: 2-50 characters, letters only
- Last name: 2-50 characters, letters only
- Email: Valid email format
- Password: Minimum 8 characters, must contain uppercase, lowercase, number, and special character
- Passwords must match

**Success Response (201):**

```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "user_id",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com",
      "role": "user",
      "fullName": "John Doe"
    },
    "accessToken": "jwt_access_token",
    "refreshToken": "jwt_refresh_token"
  }
}
```

#### 2. **Login**

Authenticate user and receive tokens.

- **URL**: `/login`
- **Method**: `POST`
- **Auth Required**: No

**Request Body:**

```json
{
  "email": "john.doe@example.com",
  "password": "SecurePass123!"
}
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "user_id",
      "firstName": "John",
      "lastName": "Doe",
      "email": "john.doe@example.com",
      "role": "user",
      "fullName": "John Doe",
      "lastLogin": "2026-02-12T10:30:00Z"
    },
    "accessToken": "jwt_access_token",
    "refreshToken": "jwt_refresh_token"
  }
}
```

#### 3. **Refresh Token**

Get a new access token using refresh token.

- **URL**: `/refresh-token`
- **Method**: `POST`
- **Auth Required**: No

**Request Body:**

```json
{
  "refreshToken": "jwt_refresh_token"
}
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "accessToken": "new_jwt_access_token"
  }
}
```

#### 4. **Get Profile**

Get current user's profile.

- **URL**: `/profile`
- **Method**: `GET`
- **Auth Required**: Yes

**Headers:**

```
Authorization: Bearer {accessToken}
```

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "id": "user_id",
    "firstName": "John",
    "lastName": "Doe",
    "fullName": "John Doe",
    "email": "john.doe@example.com",
    "role": "user",
    "isEmailVerified": false,
    "lastLogin": "2026-02-12T10:30:00Z",
    "createdAt": "2026-01-01T00:00:00Z"
  }
}
```

#### 5. **Update Profile**

Update user profile information.

- **URL**: `/profile`
- **Method**: `PUT`
- **Auth Required**: Yes

**Headers:**

```
Authorization: Bearer {accessToken}
```

**Request Body:**

```json
{
  "firstName": "Jane",
  "lastName": "Smith"
}
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "id": "user_id",
    "firstName": "Jane",
    "lastName": "Smith",
    "fullName": "Jane Smith",
    "email": "john.doe@example.com",
    "role": "user"
  }
}
```

#### 6. **Change Password**

Change user password.

- **URL**: `/change-password`
- **Method**: `PUT`
- **Auth Required**: Yes

**Headers:**

```
Authorization: Bearer {accessToken}
```

**Request Body:**

```json
{
  "currentPassword": "OldPass123!",
  "newPassword": "NewSecurePass123!",
  "confirmPassword": "NewSecurePass123!"
}
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "Password changed successfully. Please log in again."
}
```

#### 7. **Logout**

Logout user and invalidate refresh token.

- **URL**: `/logout`
- **Method**: `POST`
- **Auth Required**: Yes

**Headers:**

```
Authorization: Bearer {accessToken}
```

**Request Body:**

```json
{
  "refreshToken": "jwt_refresh_token"
}
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "Logout successful"
}
```

#### 8. **Verify Token**

Verify if access token is valid.

- **URL**: `/verify`
- **Method**: `GET`
- **Auth Required**: Yes

**Headers:**

```
Authorization: Bearer {accessToken}
```

**Success Response (200):**

```json
{
  "success": true,
  "valid": true,
  "user": {
    "id": "user_id",
    "email": "john.doe@example.com",
    "role": "user",
    "firstName": "John",
    "lastName": "Doe"
  }
}
```

### Error Responses

All endpoints may return error responses in the following format:

**400 Bad Request** (Validation Error):

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Please provide a valid email address"
    }
  ]
}
```

**401 Unauthorized**:

```json
{
  "success": false,
  "message": "Invalid email or password"
}
```

**403 Forbidden**:

```json
{
  "success": false,
  "message": "You do not have permission to perform this action"
}
```

**404 Not Found**:

```json
{
  "success": false,
  "message": "User not found"
}
```

**500 Internal Server Error**:

```json
{
  "success": false,
  "message": "Something went wrong"
}
```

## Security Features

1. **Password Hashing**: Uses bcryptjs with salt rounds
2. **JWT Authentication**: Secure token-based authentication
3. **Refresh Tokens**: Long-lived tokens stored in database
4. **Rate Limiting**: Protects public auth endpoints against brute force attacks
5. **Helmet**: Sets secure HTTP headers
6. **CORS**: Configured cross-origin resource sharing
7. **Input Validation**: Using express-validator
8. **Error Handling**: Comprehensive error handling middleware

## Testing with cURL

### Register

```bash
curl -X POST http://localhost:5001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "password": "SecurePass123!",
    "confirmPassword": "SecurePass123!"
  }'
```

### Login

```bash
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@example.com",
    "password": "SecurePass123!"
  }'
```

### Get Profile

```bash
curl -X GET http://localhost:5001/api/auth/profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Environment Variables

| Variable                  | Description                          | Default                 |
| ------------------------- | ------------------------------------ | ----------------------- |
| `PORT`                    | Server port                          | `5001`                  |
| `NODE_ENV`                | Environment (development/production) | `development`           |
| `MONGODB_URI`             | MongoDB connection string            | Required                |
| `JWT_SECRET`              | Secret key for access tokens         | Required                |
| `JWT_EXPIRE`              | Access token expiration              | `7d`                    |
| `JWT_REFRESH_SECRET`      | Secret key for refresh tokens        | Required                |
| `JWT_REFRESH_EXPIRE`      | Refresh token expiration             | `30d`                   |
| `CORS_ORIGIN`             | Allowed CORS origin                  | `http://localhost:5173` |
| `RATE_LIMIT_WINDOW_MS`    | Auth rate limit window (ms)          | `900000`                |
| `RATE_LIMIT_MAX_REQUESTS` | Max requests per window              | `100`                   |

## Production Deployment

### Important Steps:

1. **Change JWT Secrets**: Use strong, random secrets
2. **Set NODE_ENV**: Set to `production`
3. **Use MongoDB Atlas**: For cloud database
4. **Enable HTTPS**: Use SSL/TLS certificates
5. **Environment Variables**: Never commit `.env` file
6. **Logging**: Set up proper logging service
7. **Monitoring**: Use monitoring tools (PM2, New Relic, etc.)

### Using PM2 (Recommended)

```bash
npm install -g pm2
pm2 start src/server.js --name auth-service
pm2 save
pm2 startup
```

## Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

ISC

## Author

UP Knowledge Graph Team

## Support

For support, email support@example.com or create an issue in the repository.
