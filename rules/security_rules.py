"""
CloudSentinel security detection rules.

This module contains centralized definitions for
security-sensitive actions and authentication events.
"""


SUSPICIOUS_IAM_ACTIONS = {
    "CreateAccessKey",
    "CreateUser",
}


PRIVILEGE_ESCALATION_ACTIONS = {
    "AttachUserPolicy",
    "AttachRolePolicy",
    "PutUserPolicy",
    "PutRolePolicy",
}


SUSPICIOUS_AUTH_ACTIONS = {
    "FailedLogin",
}


SUSPICIOUS_SOURCE_IPS = {
    "203.0.113.10",
    "203.0.113.50",
}


IAM_RULE = {
    "name": "SUSPICIOUS_IAM_ACTIVITY",
    "severity": "HIGH",
    "risk_score": 75,
}

PRIVILEGE_ESCALATION_RULE = {
    "name": "PRIVILEGE_ESCALATION",
    "severity": "CRITICAL",
    "risk_score": 90,
}

AUTH_RULE = {
    "name": "MULTIPLE_FAILED_LOGINS",
    "severity": "MEDIUM",
    "risk_score": 50,
}

SOURCE_IP_RULE = {
    "name": "SUSPICIOUS_SOURCE_IP",
    "severity": "HIGH",
    "risk_score": 80,
}
