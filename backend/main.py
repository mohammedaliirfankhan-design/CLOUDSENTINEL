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
    get_events,
    save_investigation,
    get_investigation,
    initialize_database,
    get_soc_metrics,
    get_investigation_history,
    create_user,
    get_user_by_username,
    get_users,
    create_audit_log,
    get_audit_logs,
    create_notification,
    get_notifications,
    get_unread_notification_count,
    mark_notification_read,
    mark_all_notifications_read,
    count_recent_failed_logins,
    get_active_brute_force_alert,
    create_brute_force_alert,
    save_security_finding,
    get_security_findings,
    get_security_finding,
    update_security_finding_status,
    get_security_finding_metrics,
)

from ingestion.api_ingestion import router as ingestion_router

from aws.posture import AWSPostureScanner
from aws.processor import AWSCloudTrailProcessor


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


class FindingStatusRequest(BaseModel):
    status: str


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


@app.get("/auth/me")
def get_current_user_profile(
    current_user: dict = Depends(get_current_user)
):
    user = get_user_by_username(current_user["username"])

    if user is None:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    return {
        "id": user["id"],
        "username": user["username"],
        "email": user["email"],
        "role": user["role"],
        "is_active": user["is_active"],
        "created_at": user["created_at"],
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
        create_audit_log(
            username=username,
            role="UNKNOWN",
            action="LOGIN_FAILED",
            target_type="AUTHENTICATION",
            target_id=None,
            details="Unknown username"
        )

        raise HTTPException(
            status_code=401,
            detail="Invalid username or password"
        )

    if not user["is_active"]:
        create_audit_log(
            username=user["username"],
            role=user["role"],
            action="LOGIN_FAILED",
            target_type="AUTHENTICATION",
            target_id=str(user["id"]),
            details="Login attempted for inactive account"
        )

        raise HTTPException(
            status_code=403,
            detail="User account is inactive"
        )

    if not verify_password(password, user["password_hash"]):
        create_audit_log(
            username=user["username"],
            role=user["role"],
            action="LOGIN_FAILED",
            target_type="AUTHENTICATION",
            target_id=str(user["id"]),
            details="Invalid password"
        )

        failure_count = count_recent_failed_logins(
            username=user["username"],
            window_minutes=5
        )

        if failure_count >= 5:
            existing_alert = get_active_brute_force_alert(
                user["username"]
            )

            if existing_alert is None:
                create_brute_force_alert(
                    username=user["username"],
                    failure_count=failure_count
                )

                create_audit_log(
                    username=user["username"],
                    role=user["role"],
                    action="BRUTE_FORCE_DETECTED",
                    target_type="AUTHENTICATION",
                    target_id=str(user["id"]),
                    details=(
                        f"{failure_count} failed login attempts "
                        "within 5 minutes"
                    )
                )

        raise HTTPException(
            status_code=401,
            detail="Invalid username or password"
        )

    access_token = create_access_token(
        user["username"],
        user["role"]
    )

    create_audit_log(
        username=user["username"],
        role=user["role"],
        action="LOGIN_SUCCESS",
        target_type="AUTHENTICATION",
        target_id=str(user["id"]),
        details="Successful user login"
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


@app.get("/events")
def events(current_user: dict = Depends(get_current_user)):
    return get_events()


@app.get("/metrics")
def metrics(current_user: dict = Depends(get_current_user)):
    return get_soc_metrics()


@app.get("/findings")
def findings(
    current_user: dict = Depends(get_current_user)
):
    """
    Return all CloudSentinel CSPM security findings.
    """
    return get_security_findings()


@app.get("/findings/metrics")
def finding_metrics(
    current_user: dict = Depends(get_current_user)
):
    """
    Return CSPM finding severity metrics.
    """
    return get_security_finding_metrics()


@app.get("/findings/{finding_id}")
def finding(
    finding_id: int,
    current_user: dict = Depends(get_current_user)
):
    """
    Return one CloudSentinel CSPM finding.
    """

    result = get_security_finding(
        finding_database_id=finding_id
    )

    if result is None:
        raise HTTPException(
            status_code=404,
            detail="Security finding not found"
        )

    return result


@app.patch("/findings/{finding_id}/status")
def update_finding_status(
    finding_id: int,
    data: FindingStatusRequest,
    current_user: dict = Depends(get_current_user),
):
    """
    Update the status of a CloudSentinel CSPM finding.
    """

    status = str(data.status).upper()

    if status not in {"OPEN", "RESOLVED"}:
        raise HTTPException(
            status_code=400,
            detail="Status must be OPEN or RESOLVED",
        )

    finding = get_security_finding(
        finding_database_id=finding_id
    )

    if finding is None:
        raise HTTPException(
            status_code=404,
            detail="Security finding not found",
        )

    updated = update_security_finding_status(
        finding_database_id=finding_id,
        status=status,
    )

    if not updated:
        raise HTTPException(
            status_code=404,
            detail="Security finding not found",
        )

    create_audit_log(
        username=current_user["username"],
        role=current_user["role"],
        action="CSPM_FINDING_STATUS_UPDATE",
        target_type="CSPM_FINDING",
        target_id=str(finding_id),
        details=(
            f"CSPM finding {finding['finding_id']} "
            f"status changed to {status}"
        ),
    )

    updated_finding = get_security_finding(
        finding_database_id=finding_id
    )

    return updated_finding


@app.post("/findings/scan")
def run_cspm_scan(
    demo: bool = False,
    current_user: dict = Depends(get_current_user)
):
    """
    Run a read-only AWS CSPM assessment and persist findings.

    When demo=True, use the controlled local CSPM demonstration
    finding. Demo mode does not interact with AWS resources.
    """

    scanner = AWSPostureScanner()

    if demo:
        findings = scanner.scan_demo_findings()
        scan_source = "CLOUDSENTINEL_DEMO"
    else:
        findings = scanner.scan()
        scan_source = "AWS_CSPM"

    saved = []

    for finding_data in findings:

        finding_database_id = save_security_finding(
            finding_data
        )

        saved.append({
            **finding_data,
            "database_id": finding_database_id,
        })

    create_audit_log(
        username=current_user["username"],
        role=current_user["role"],
        action="CSPM_SCAN",
        target_type="AWS_ACCOUNT",
        target_id=None,
        details=(
            f"CSPM scan completed; "
            f"{len(findings)} findings detected; "
            f"source={scan_source}"
        )
    )

    return {
        "message": (
            "CloudSentinel CSPM demo scan completed"
            if demo
            else "AWS CSPM scan completed"
        ),
        "findings_detected": len(findings),
        "findings": saved,
        "demo": demo,
    }


@app.post("/aws/collect")
def collect_aws_events(
    current_user: dict = Depends(get_current_user)
):
    """
    Collect recent AWS CloudTrail management events,
    process them through the CloudSentinel detection engine,
    and store any detected security alerts.

    This operation is read-only against AWS.
    """

    try:
        processor = AWSCloudTrailProcessor()

        alerts = processor.process_events(
            max_results=50
        )

    except Exception as error:
        print(
            "AWS CloudTrail collection failed:",
            error
        )

        raise HTTPException(
            status_code=500,
            detail=f"AWS CloudTrail collection failed: {error}"
        )

    create_audit_log(
        username=current_user["username"],
        role=current_user["role"],
        action="AWS_CLOUDTRAIL_COLLECTION",
        target_type="AWS_CLOUDTRAIL",
        target_id=None,
        details=(
            f"AWS CloudTrail collection completed; "
            f"{len(alerts)} security alerts detected"
        )
    )

    return {
        "message": "AWS CloudTrail collection completed",
        "alerts_detected": len(alerts),
        "alerts": alerts,
    }


@app.get("/investigations")
def get_investigations_endpoint(
    current_user: dict = Depends(get_current_user)
):
    rows = get_alerts()

    investigations = []

    for row in rows:
        investigations.append({
            "alert_id": row[0],
            "alert": row[1],
            "title": row[2],
            "severity": row[3],
            "risk_score": row[4],
            "priority": row[5],
            "analyst": row[12] or "Unassigned",
            "source": (
                "CloudTrail"
                if row[8] or row[9]
                else "Unknown"
            ),
            "status": row[11] or "OPEN",
            "updated": row[10],
        })

    return investigations


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

    create_audit_log(
        username=current_user["username"],
        role=current_user["role"],
        action="UPDATE_INVESTIGATION",
        target_type="ALERT",
        target_id=str(alert_id),
        details=(
            f"Status set to {status}; "
            f"assigned analyst: {assigned_analyst or 'Unassigned'}"
        )
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


@app.get("/admin/audit-logs")
def get_audit_logs_endpoint(
    current_user: dict = Depends(require_admin)
):
    return get_audit_logs()


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

    create_audit_log(
        username=current_user["username"],
        role=current_user["role"],
        action="CREATE_USER",
        target_type="USER",
        target_id=str(user_id),
        details=f"Created user '{data.username}' with role {data.role}"
    )

    return {
        "message": "User created successfully",
        "user_id": user_id,
        "username": data.username,
        "email": data.email,
        "role": data.role
    }


# NOTIFICATIONS

@app.get("/notifications")
def get_notifications_endpoint(
    unread_only: bool = False,
    current_user: dict = Depends(get_current_user)
):
    user = get_user_by_username(current_user["username"])

    if user is None:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    return get_notifications(
        user_id=user["id"],
        unread_only=unread_only
    )


@app.get("/notifications/unread-count")
def get_unread_notification_count_endpoint(
    current_user: dict = Depends(get_current_user)
):
    user = get_user_by_username(current_user["username"])

    if user is None:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    return {
        "count": get_unread_notification_count(
            user_id=user["id"]
        )
    }


@app.post("/notifications/{notification_id}/read")
def mark_notification_read_endpoint(
    notification_id: int,
    current_user: dict = Depends(get_current_user)
):
    user = get_user_by_username(current_user["username"])

    if user is None:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    updated = mark_notification_read(
        notification_id=notification_id,
        user_id=user["id"]
    )

    if updated == 0:
        raise HTTPException(
            status_code=404,
            detail="Notification not found"
        )

    return {
        "message": "Notification marked as read"
    }


@app.post("/notifications/read-all")
def mark_all_notifications_read_endpoint(
    current_user: dict = Depends(get_current_user)
):
    user = get_user_by_username(current_user["username"])

    if user is None:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    updated = mark_all_notifications_read(
        user_id=user["id"]
    )

    return {
        "message": "All notifications marked as read",
        "updated": updated
    }