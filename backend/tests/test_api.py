import os
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from backend.main import app
from backend.database.connection import Base, get_db

# Setup file-based SQLite database for isolated testing
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_mindmate.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, 
    connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(
    autocommit=False, 
    autoflush=False, 
    bind=engine
)

# Override database dependency in FastAPI app
def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

@pytest.fixture(scope="module", autouse=True)
def setup_db():
    """Initializes schema before running tests and drops it afterwards."""
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)
    # Clean up test database file
    try:
        if os.path.exists("test_mindmate.db"):
            os.remove("test_mindmate.db")
    except Exception:
        pass

client = TestClient(app)

def test_health_check():
    """Test standard API health metrics."""
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"
    assert "project" in response.json()

def test_auth_registration():
    """Test user registration process."""
    reg_data = {
        "username": "teststudent",
        "email": "test@university.edu",
        "password": "securepassword123"
    }
    response = client.post("/api/v1/auth/register", json=reg_data)
    assert response.status_code == 201
    assert response.json()["username"] == "teststudent"
    assert response.json()["role"] == "admin"  # First user gets admin role by default in our seeder logic

def test_auth_duplicate_registration():
    """Verify system blocks registering duplicate credentials."""
    reg_data = {
        "username": "teststudent",
        "email": "test@university.edu",
        "password": "securepassword123"
    }
    response = client.post("/api/v1/auth/register", json=reg_data)
    assert response.status_code == 400
    assert response.json()["detail"] == "Username already registered"

def test_auth_login():
    """Verify username/password verification and JWT issuance."""
    login_data = {
        "username": "teststudent",
        "password": "securepassword123"
      }
    response = client.post(
        "/api/v1/auth/login", 
        data=login_data,  # FastAPI OAuth2PasswordRequestForm expects form-data
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    assert response.status_code == 200
    token_json = response.json()
    assert "access_token" in token_json
    assert "refresh_token" in token_json
    assert token_json["token_type"] == "bearer"
    assert token_json["role"] == "admin"

def test_auth_refresh():
    """Verify refresh token rotation returns a new access token."""
    login_data = {
        "username": "teststudent",
        "password": "securepassword123"
    }
    response = client.post(
        "/api/v1/auth/login",
        data=login_data,
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    token_json = response.json()
    refresh_token = token_json["refresh_token"]
    
    refresh_response = client.post(
        "/api/v1/auth/refresh",
        json={"refresh_token": refresh_token}
    )
    assert refresh_response.status_code == 200
    assert "access_token" in refresh_response.json()
    assert "refresh_token" in refresh_response.json()

def test_reports_and_notifications():
    """Test creating and retrieving reports and notifications."""
    login_data = {
        "username": "teststudent",
        "password": "securepassword123"
    }
    response = client.post(
        "/api/v1/auth/login",
        data=login_data,
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    token = response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # Create report
    report_data = {
        "title": "Feeling high stress",
        "summary": "I am experiencing significant academic stress this semester",
        "risk_level": "medium"
    }
    rep_response = client.post("/api/v1/reports", json=report_data, headers=headers)
    assert rep_response.status_code == 201
    assert rep_response.json()["title"] == "Feeling high stress"
    
    # Get user reports
    user_reps = client.get("/api/v1/reports/user", headers=headers)
    assert user_reps.status_code == 200
    assert len(user_reps.json()) >= 1
