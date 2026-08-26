from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from backend.auth import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_user,
    require_role,
    require_admin
)
from database.alert_store import (
    get_alerts,
    save_investigation,
    get_investigation,
    initialize_database,
    get_soc_metrics,
    get_investigation_history,
    create_user,
    get_user_by_username,
    get_users
)
from ingestion.api_ingestion import router as ingestion_router

app = FastAPI(
    title="CloudSentinel API",
    description="Backend API for CloudSentinel security monitoring platform",
    version="1.0.0"
)
class SignupRequest(BaseModel):
    username: str
    email: str
    password: str

class LoginRequest(BaseModel):
    username: str
    password: str

class AdminCreateUserRequest(BaseModel):
    username: str
    email: str
    password: str
    role: str = "SOC_ANALYST"


app.include_router(ingestion_router)
initialize_database()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/auth/signup")
def signup(data: SignupRequest):
    username = data.username.strip()
    email = data.email.strip().lower()
    password = data.password

    if not username or not email or not password:
        raise HTTPException(
            status_code=400,
            detail="Username, email and password are required"
        )

    if len(username) < 3:
        raise HTTPException(
            status_code=400,
            detail="Username must be at least 3 characters"
        )

    if len(password) < 8:
        raise HTTPException(
            status_code=400,
            detail="Password must be at least 8 characters"
        )

    existing_user = get_user_by_username(username)

    if existing_user is not None:
        raise HTTPException(
            status_code=409,
            detail="Username already exists"
        )

    password_hash = hash_password(password)

    user_id = create_user(
        username,
        email,
        password_hash,
        "SOC_ANALYST"
    )

    return {
        "message": "User created successfully",
        "user": {
            "id": user_id,
            "username": username,
            "email": email,
            "role": "SOC_ANALYST"
        }
    }

@app.post("/auth/login")
def login(data: LoginRequest):
    username = data.username.strip()
    password = data.password

    if not username or not password:
        raise HTTPException(
            status_code=400,
            detail="Username and password are required"
        )

    user = get_user_by_username(username)

    if user is None:
        raise HTTPException(
            status_code=401,
            detail="Invalid username or password"
        )

    if not user["is_active"]:
        raise HTTPException(
            status_code=403,
            detail="User account is inactive"
        )

    if not verify_password(password, user["password_hash"]):
        raise HTTPException(
            status_code=401,
            detail="Invalid username or password"
        )

    access_token = create_access_token(
        user["username"],
        user["role"]
    )

    return {
        "message": "Login successful",
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user["id"],
            "username": user["username"],
            "email": user["email"],
            "role": user["role"]
        }
    }


@app.get("/")
def root():
    return {
        "message": "CloudSentinel API is running",
        "status": "online"
    }


@app.get("/alerts")
def alerts(current_user: dict = Depends(get_current_user)):
    rows = get_alerts()

    columns = [
        "id",
        "event_id",
        "rule",
        "severity",
        "risk_score",
        "risk_level",
        "user",
        "source_ip",
        "action",
        "resource",
        "created_at",
        "investigation_status",
        "assigned_analyst"
    ]

    return [
        dict(zip(columns, row))
        for row in rows
    ]

@app.get("/metrics")
def metrics(current_user: dict = Depends(get_current_user)):
    return get_soc_metrics()


@app.post("/investigations")
def save_investigation_endpoint(
    data: dict[str, str | int],
    current_user: dict = Depends(get_current_user)
):
    raw_alert_id = data.get("alert_id")
    raw_status = data.get("status")

    if raw_alert_id is None or raw_status is None:
        return {
            "error": "alert_id and status are required"
        }

    alert_id = int(raw_alert_id)
    status = str(raw_status)
    analyst_notes = str(data.get("analyst_notes", ""))
    assigned_analyst = str(data.get("assigned_analyst", ""))

    save_investigation(
        alert_id,
        status,
        analyst_notes,
        assigned_analyst
    )

    return {
        "message": "Investigation saved successfully",
        "alert_id": alert_id,
        "status": status,
        "assigned_analyst": assigned_analyst
    }


@app.get("/investigations/{alert_id}")
def get_investigation_endpoint(
    alert_id: int,
    current_user: dict = Depends(get_current_user)
):
    investigation = get_investigation(alert_id)

    if investigation is None:
        return {
            "message": "No investigation found",
            "alert_id": alert_id
        }

    return investigation

@app.get("/investigations/{alert_id}/history")
def get_investigation_history_endpoint(
    alert_id: int,
    current_user: dict = Depends(get_current_user)
):
    return get_investigation_history(alert_id)

@app.get("/admin/users")
def get_users_endpoint(
    current_user: dict = Depends(require_admin)
):
    return get_users()

@app.post("/admin/users")
def create_admin_user(
    data: AdminCreateUserRequest,
    current_user: dict = Depends(require_admin)
):
    if data.role not in {"SOC_ANALYST", "SOC_ADMIN"}:
        raise HTTPException(
            status_code=400,
            detail="Invalid role"
        )

    if get_user_by_username(data.username):
        raise HTTPException(
            status_code=400,
            detail="Username already exists"
        )

    password_hash = hash_password(data.password)

    user_id = create_user(
        data.username,
        data.email,
        password_hash,
        data.role
    )

    return {
        "message": "User created successfully",
        "user_id": user_id,
        "username": data.username,
        "email": data.email,
        "role": data.role
    }