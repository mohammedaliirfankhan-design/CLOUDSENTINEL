# CloudSentinel AWS Worker - Windows Deployment

## 1. Purpose

The CloudSentinel AWS Worker is the background runtime responsible for continuously collecting AWS CloudTrail events and processing them through the CloudSentinel security detection pipeline.

The worker runs as a Windows Service using WinSW and is configured to start automatically with Windows.

---

## 2. Runtime Architecture

The production runtime follows this flow:

AWS CloudTrail
    |
    v
AWS CloudTrail Collector
    |
    v
Event Normalization
    |
    v
Detection Engine
    |
    v
Risk Scoring
    |
    v
Alert Store
    |
    v
CloudSentinel SOC Dashboard

---

## 3. Deployment Files

The Windows deployment directory contains the following important files:

```text
deployment/windows/

CloudSentinelAWSService.exe
    WinSW Windows Service wrapper.

CloudSentinelAWSService.xml
    Windows Service configuration.

CloudSentinelAWSWorker.spec
    PyInstaller build configuration.

dist/CloudSentinelAWSWorker.exe
    Packaged CloudSentinel AWS runtime worker.

logs/
    Runtime and service logs.