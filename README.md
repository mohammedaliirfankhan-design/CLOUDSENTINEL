# CloudSentinel

CloudSentinel is a cloud-focused Security Operations Center (SOC) platform designed to detect, investigate, prioritize, and monitor security events from AWS environments through a centralized SOC workflow.

The platform combines AWS CloudTrail ingestion, security detection rules, risk scoring, alert management, investigations, notifications, cloud-security-posture findings, authentication, role-based access control, audit logging, and a React-based SOC dashboard.

---

## 1. Project Overview

Cloud environments generate large volumes of security-relevant activity. Security teams need a centralized system that can:

- Collect cloud activity
- Detect suspicious behavior
- Prioritize security alerts
- Investigate incidents
- Maintain investigation history
- Track cloud-security findings
- Notify analysts about important alerts
- Maintain an auditable security workflow
- Provide a centralized SOC dashboard

CloudSentinel is being developed to address this workflow as a production-oriented SOC platform rather than as a standalone detection script.

---

## 2. Core Architecture

```text
                         AWS CloudTrail
                               │
                               ▼
                    ┌─────────────────────┐
                    │  AWS CloudSentinel  │
                    │       Worker        │
                    └──────────┬──────────┘
                               │
                               ▼
                    AWS CloudTrail Collector
                               │
                               ▼
                     Event Normalization
                               │
                               ▼
                       Detection Engine
                               │
                               ▼
                         Risk Scoring
                               │
                               ▼
                         Alert Store
                               │
                 ┌─────────────┴─────────────┐
                 │                           │
                 ▼                           ▼
            FastAPI Backend             Notifications
                 │
                 ▼
          React SOC Dashboard
                 │
        ┌────────┼─────────┐
        ▼        ▼         ▼
      Alerts  Investigations  Findings
                 │
                 ▼
             Audit Logs