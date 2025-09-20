# Teacher Management System - API Documentation

## Swagger Documentation

This backend now includes comprehensive API documentation using Swagger/OpenAPI 3.0.

### Accessing the Documentation

Once the server is running, you can access the Swagger documentation at:

**http://localhost:5000/api-docs**

### Features

- **Interactive API Explorer**: Test API endpoints directly from the browser
- **Comprehensive Documentation**: All endpoints are documented with:
  - Request/response schemas
  - Authentication requirements
  - Parameter descriptions
  - Example requests and responses
  - Error codes and messages

### API Endpoints Covered

#### Authentication (`/api/auth`)

- `GET /verify` - Verify Firebase token
- `POST /register` - Complete teacher registration
- `GET /profile` - Get current teacher profile
- `PUT /profile` - Update teacher profile
- `DELETE /account` - Delete teacher account
- `POST /custom-token` - Create custom Firebase token (Admin only)

#### Teachers (`/api/teachers`)

- `GET /` - Get all teachers (Admin only)
- `GET /:id` - Get teacher by ID
- `PUT /:id` - Update teacher profile

#### Books (`/api/books`)

- `POST /upload` - Upload book PDF
- `GET /` - Get all books
- `GET /filter` - Get books by class and subject filter
- `GET /:id` - Get book by ID
- `PUT /:id/status` - Update book processing status
- `DELETE /:id` - Delete book

#### Admin (`/api/admin`)

- `GET /dashboard` - Get admin dashboard data
- `GET /stats` - Get system statistics
- `GET /teachers` - Get all teachers with pagination
- Additional admin endpoints for user management

#### System (`/api`)

- `GET /health` - Health check endpoint

### Authentication

Most endpoints require Firebase authentication. Include the Firebase token in the Authorization header:

```
Authorization: Bearer <your-firebase-token>
```

### Getting Started

1. Start the backend server:

   ```bash
   cd backend
   npm start
   ```

2. Open your browser and navigate to:

   ```
   http://localhost:5000/api-docs
   ```

3. Use the "Authorize" button to add your Firebase token for testing protected endpoints

### Schema Definitions

The documentation includes detailed schemas for:

- User objects
- Teacher objects
- Student objects
- Book objects
- Error responses
- Success responses

### Development

The Swagger configuration is located in `backend/config/swagger.js` and can be customized as needed. Route annotations are added directly in the route files using JSDoc comments.
