# Online Debate Platform API Documentation

## Overview

The Online Debate Platform API is a RESTful service built with Django REST Framework that provides endpoints for user authentication, debate management, and real-time messaging.

## Base URL

```
http://localhost:8000/api/v1/
```

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

## Endpoints

### Authentication

#### Register User
```http
POST /users/register/
```

**Request Body:**
```json
{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "securepassword123",
  "role": "student"
}
```

**Response:**
```json
{
  "id": 1,
  "username": "john_doe",
  "email": "john@example.com",
  "role": "student",
  "date_joined": "2024-01-15T10:30:00Z"
}
```

#### Login
```http
POST /token/
```

**Request Body:**
```json
{
  "username": "john_doe",
  "password": "securepassword123"
}
```

**Response:**
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

#### Refresh Token
```http
POST /token/refresh/
```

**Request Body:**
```json
{
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

### Debate Topics

#### List Topics
```http
GET /debates/topics/
```

**Response:**
```json
[
  {
    "id": 1,
    "title": "Should social media be regulated?",
    "description": "Debate about government regulation of social media platforms",
    "category": "technology",
    "created_at": "2024-01-15T10:30:00Z"
  }
]
```

#### Create Topic (Moderator Only)
```http
POST /debates/topics/
```

**Request Body:**
```json
{
  "title": "Climate Change Solutions",
  "description": "Discussing effective solutions for climate change",
  "category": "environment"
}
```

### Debate Sessions

#### List Sessions
```http
GET /debates/sessions/
```

**Query Parameters:**
- `topic_id` (optional): Filter by topic ID
- `status` (optional): Filter by status (active, completed, scheduled)

**Response:**
```json
[
  {
    "id": 1,
    "topic": {
      "id": 1,
      "title": "Should social media be regulated?"
    },
    "moderator": {
      "id": 2,
      "username": "moderator_jane"
    },
    "status": "active",
    "start_time": "2024-01-15T14:00:00Z",
    "end_time": "2024-01-15T16:00:00Z",
    "participant_count": 5,
    "max_participants": 10
  }
]
```

#### Join Session
```http
POST /debates/sessions/{session_id}/join/
```

**Response:**
```json
{
  "message": "Successfully joined the debate session",
  "session_id": 1
}
```

#### Leave Session
```http
POST /debates/sessions/{session_id}/leave/
```

**Response:**
```json
{
  "message": "Successfully left the debate session",
  "session_id": 1
}
```

### Messages

#### List Messages
```http
GET /debates/messages/?session_pk={session_id}
```

**Query Parameters:**
- `session_pk`: Session ID (required)
- `limit` (optional): Number of messages to return (default: 50)
- `offset` (optional): Number of messages to skip

**Response:**
```json
[
  {
    "id": 1,
    "session": 1,
    "user": {
      "id": 1,
      "username": "john_doe"
    },
    "content": "I believe social media regulation is necessary for user privacy.",
    "timestamp": "2024-01-15T14:05:00Z",
    "is_moderator_message": false
  }
]
```

#### Post Message
```http
POST /debates/messages/?session_pk={session_id}
```

**Request Body:**
```json
{
  "content": "I believe social media regulation is necessary for user privacy."
}
```

**Response:**
```json
{
  "id": 1,
  "session": 1,
  "user": {
    "id": 1,
    "username": "john_doe"
  },
  "content": "I believe social media regulation is necessary for user privacy.",
  "timestamp": "2024-01-15T14:05:00Z",
  "is_moderator_message": false
}
```

### Moderator Actions

#### Mute Participant
```http
POST /debates/sessions/{session_id}/mute_participant/
```

**Request Body:**
```json
{
  "user_id": 1,
  "reason": "Inappropriate language"
}
```

#### Unmute Participant
```http
POST /debates/sessions/{session_id}/unmute_participant/
```

**Request Body:**
```json
{
  "user_id": 1
}
```

#### Remove Participant
```http
POST /debates/sessions/{session_id}/remove_participant/
```

**Request Body:**
```json
{
  "user_id": 1,
  "reason": "Repeated violations"
}
```

## WebSocket Endpoints

### Real-time Messaging

Connect to WebSocket endpoint for real-time messaging:

```
ws://localhost:8001/ws/debates/{session_id}/
```

**Message Format:**
```json
{
  "type": "chat_message",
  "message": "Hello, everyone!",
  "session_id": 1
}
```

## Error Responses

### 400 Bad Request
```json
{
  "error": "Invalid input data",
  "details": {
    "field_name": ["This field is required."]
  }
}
```

### 401 Unauthorized
```json
{
  "detail": "Authentication credentials were not provided."
}
```

### 403 Forbidden
```json
{
  "detail": "You do not have permission to perform this action."
}
```

### 404 Not Found
```json
{
  "detail": "Not found."
}
```

### 429 Too Many Requests
```json
{
  "detail": "Request limit exceeded. Please try again later."
}
```

## Rate Limiting

- Authentication endpoints: 5 requests per minute
- General API endpoints: 100 requests per hour
- WebSocket connections: 10 connections per user

## Pagination

List endpoints support pagination with the following query parameters:
- `page`: Page number (default: 1)
- `page_size`: Items per page (default: 20, max: 100)

**Response Format:**
```json
{
  "count": 100,
  "next": "http://localhost:8000/api/v1/debates/topics/?page=2",
  "previous": null,
  "results": [...]
}
``` 