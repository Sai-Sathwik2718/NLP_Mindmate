# MindMate AI - System Architecture & Technical Design

## 🌟 Architecture Overview

MindMate AI is designed adhering to modern **Clean Architecture** and **SOLID Principles**, separating concerns into isolated, decoupled layers:

1. **Presentation Layer (Frontend)**: React 19, TypeScript, Vite, Framer Motion, and Chart.js UI components.
2. **API & Routing Layer**: FastAPI REST endpoints handling request validation (Pydantic), routing, and response serialization.
3. **Security & Authentication Middleware**: JWT bearer token validation, OAuth2 password flows, refresh token rotation, and Role-Based Access Control (RBAC).
4. **AI & NLP Engine Layer**: Hybrid intelligence pipeline integrating spaCy / NLTK text processing, SentenceTransformers embedding generators, TF-IDF cosine similarity vector classifiers, and 6-tier response priority routing.
5. **Retrieval-Augmented Generation (RAG) Layer**: Vector Database abstraction supporting runtime switching between FAISS, ChromaDB, and raw NumPy vector similarity storage.
6. **Data Storage & Persistence Layer**: SQLAlchemy 2.0 ORM managing dynamic database connections between local SQLite (dev) and MySQL 8.0 (prod).

---

## 🔄 6-Tier Response Engine Flow

```mermaid
flowchart TD
    A[User Message] --> B[NLP Pipeline Analysis]
    B --> C{1. Emergency Check}
    C -- Matched --> D[Crisis Helpline Card]
    C -- Clear --> E{2. FAQ Dataset Match}
    E -- Confidence >= 0.60 --> F[Direct FAQ Answer]
    E -- Miss --> G{3. Semantic Search}
    G -- Confidence >= 0.45 --> H[Vector Match + Citation]
    G -- Miss --> I{4. RAG Retrieval}
    I -- Context Found --> J[Synthesized Wellness Guide]
    I -- Miss --> K{5. Emotion-Aware Engine}
    K -- Emotion Detected --> L[Empathetic Wrapper + Template]
    K -- Neutral --> M[6. Conversational Fallback]
```

---

## 🗄️ Database Entity-Relationship (ER) Schema

```mermaid
erDiagram
    USERS ||--o{ CHATS : owns
    USERS ||--o{ MOOD_LOGS : records
    USERS ||--o{ FEEDBACK : submits
    USERS ||--o{ ACTIVITY_LOGS : generates
    USERS ||--o{ REPORTS : files
    USERS ||--o{ NOTIFICATIONS : receives
    USERS ||--o{ USER_SESSIONS : maintains
    
    CHATS ||--o{ MESSAGES : contains
    FAQ_DATASET ||--o{ MESSAGES : cited_in

    USERS {
        int id PK
        string username
        string email
        string hashed_password
        string role
        boolean is_active
        boolean is_suspended
        datetime created_at
    }

    CHATS {
        int id PK
        int user_id FK
        string title
        datetime created_at
    }

    MESSAGES {
        int id PK
        int chat_id FK
        string sender
        text content
        string intent
        float intent_confidence
        string sentiment
        float sentiment_confidence
        string emotion
        float emotion_confidence
        int matched_faq_id FK
        boolean is_crisis
        string response_source
        string citation
        datetime timestamp
    }

    MOOD_LOGS {
        int id PK
        int user_id FK
        int mood_score
        text notes
        datetime timestamp
    }

    FAQ_DATASET {
        int id PK
        string category
        string question
        text answer
        string keywords
        datetime created_at
    }

    USER_SESSIONS {
        int id PK
        int user_id FK
        string refresh_token
        datetime expires_at
        boolean is_revoked
        datetime created_at
    }
```
