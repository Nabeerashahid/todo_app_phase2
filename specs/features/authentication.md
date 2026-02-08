# Feature: User Authentication

## Purpose
Allow users to securely sign up and sign in using Better Auth.
All backend API requests must be authenticated using JWT tokens.

## Authentication Flow
1. User signs up or logs in via frontend (Next.js)
2. Better Auth creates a session and issues a JWT token
3. Frontend stores the JWT securely
4. Frontend sends JWT in Authorization header
5. Backend verifies JWT and extracts user info

## Token Format
Authorization: Bearer <jwt_token>

## JWT Claims
- sub: user_id
- email: user email
- exp: expiration timestamp

## Security Rules
- All /api routes require valid JWT
- Requests without token return 401
- User ID from JWT must match task ownership

## Acceptance Criteria
- User can sign up
- User can sign in
- JWT is issued on login
- Backend rejects unauthenticated requests
- Each user only sees their own tasks
