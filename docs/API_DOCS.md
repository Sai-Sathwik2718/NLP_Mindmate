# MindMate AI - API Documentation & Specification

All APIs conform to RESTful conventions and return standardized JSON objects.

Interactive Swagger UI Documentation is available at runtime under `http://localhost:8000/docs`.

---

## 🔐 Authentication APIs (`/api/v1/auth`)

### 1. Register User
- **`POST /auth/register`**
- **Payload**:
  ```json
  {
    "username": "student_john",
    "email": "john@university.edu",
    "password": "securepassword123"
  }
  ```
- **Response** `(201 Created)`: User object excluding hashed password.

### 2. Login & Issue Tokens
- **`POST /auth/login`**
- **Payload**: Form data (`application/x-www-form-urlencoded`) containing `username` and `password`.
- **Response** `(200 OK)`:
  ```json
  {
    "access_token": "eyJhbGciOi...",
    "refresh_token": "eyJhbGciOi...",
    "token_type": "bearer",
    "username": "student_john",
    "role": "user"
  }
  ```

### 3. Refresh Tokens
- **`POST /auth/refresh`**
- **Payload**: `{"refresh_token": "eyJhbGciOi..."}`
- **Response**: Rotated pair of access and refresh credentials.

---

## 💬 Chat & Conversation APIs (`/api/v1/chat`)

### 1. Send Message
- **`POST /chat/{chat_id}/messages`**
- **Headers**: `Authorization: Bearer <access_token>`
- **Payload**: `{"content": "I am feeling extremely stressed about my exams"}`
- **Response** `(201 Created)`: Returns bot response content, intent, sentiment, emotion, confidence scores, and RAG citations.

### 2. Export Chat Transcript
- **`GET /chat/{chat_id}/export`**
- **Response**: Formatted plain-text download transcript.

---

## 📊 Analytics & Admin APIs (`/api/v1/admin`)

### 1. System Analytics Dashboard
- **`GET /admin/analytics`** (Admin privileges required)
- **Response**: DAU counts, emotion distributions, intent rankings, and response routing stats.

### 2. Bulk Dataset Ingestion
- **`POST /admin/dataset/upload`** (Admin privileges required)
- **Payload**: Multipart file (`.csv` or `.json`) containing FAQ guides. Automatically rebuilds RAG Vector indexes.
