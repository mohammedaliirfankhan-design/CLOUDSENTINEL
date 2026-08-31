from datetime import datetime, timezone
from typing import Any

import boto3


class AWSPostureScanner:
    """
    Read-only AWS security posture scanner for CloudSentinel.

    The scanner evaluates AWS IAM configuration and produces
    CloudSentinel security findings.

    Current checks:
    - IAM-001: Long-lived active access keys
    - IAM-002: Broad IAM permissions
    """

    def __init__(
        self,
        profile_name: str = "cloudsentinel-audit",
        region_name: str = "ap-south-1",
    ) -> None:
        self.profile_name = profile_name
        self.region_name = region_name

        self.session = boto3.Session(
            profile_name=self.profile_name,
            region_name=self.region_name,
        )

        self.iam = self.session.client("iam")

    def _finding(
        self,
        finding_id: str,
        title: str,
        severity: str,
        resource: str,
        description: str,
        recommendation: str,
        evidence: dict[str, Any],
    ) -> dict[str, Any]:
        """Create a standardized CloudSentinel posture finding."""

        return {
            "finding_id": finding_id,
            "title": title,
            "severity": severity,
            "resource": resource,
            "description": description,
            "recommendation": recommendation,
            "evidence": evidence,
            "source": "AWS_IAM",
            "detected_at": datetime.now(
                timezone.utc
            ).isoformat(),
        }

    def scan_access_keys(self) -> list[dict[str, Any]]:
        """
        Check IAM access-key age.

        IAM-001:
        Active access keys older than 90 days.
        """

        findings = []

        users_response = self.iam.list_users()

        for user in users_response.get("Users", []):

            username = user.get("UserName")

            if not username:
                continue

            keys_response = self.iam.list_access_keys(
                UserName=username
            )

            for key in keys_response.get(
                "AccessKeyMetadata",
                [],
            ):

                status = key.get("Status")
                access_key_id = key.get("AccessKeyId")
                create_date = key.get("CreateDate")

                if status != "Active":
                    continue

                if not isinstance(
                    create_date,
                    datetime,
                ):
                    continue

                age_days = (
                    datetime.now(timezone.utc)
                    - create_date.astimezone(timezone.utc)
                ).days

                if age_days < 90:
                    continue

                findings.append(
                    self._finding(
                        finding_id="IAM-001",
                        title="Long-lived active access key",
                        severity="MEDIUM",
                        resource=username,
                        description=(
                            f"IAM user '{username}' has an active "
                            f"access key that is {age_days} days old."
                        ),
                        recommendation=(
                            "Rotate the access key and remove "
                            "the old credential if it is no longer required."
                        ),
                        evidence={
                            "username": username,
                            "access_key_id": access_key_id,
                            "status": status,
                            "created_at": create_date.isoformat(),
                            "age_days": age_days,
                        },
                    )
                )

        return findings

    def _is_broad_action(self, action: str) -> bool:
        """
        Determine whether an IAM action is broadly permissive.
        """

        normalized_action = action.lower()

        return (
            normalized_action == "*"
            or normalized_action.endswith(":*")
        )

    def _extract_actions(
        self,
        statement: dict[str, Any],
    ) -> list[str]:
        """
        Normalize IAM Action into a list.
        """

        actions = statement.get("Action", [])

        if isinstance(actions, str):
            return [actions]

        if isinstance(actions, list):
            return [
                action
                for action in actions
                if isinstance(action, str)
            ]

        return []

    def _extract_resources(
        self,
        statement: dict[str, Any],
    ) -> list[str]:
        """
        Normalize IAM Resource into a list.
        """

        resources = statement.get("Resource", [])

        if isinstance(resources, str):
            return [resources]

        if isinstance(resources, list):
            return [
                resource
                for resource in resources
                if isinstance(resource, str)
            ]

        return []

    def _analyze_policy_document(
        self,
        document: dict[str, Any],
        policy_name: str,
        resource_name: str,
        policy_type: str,
    ) -> list[dict[str, Any]]:
        """
        Analyze an IAM policy document for broad permissions.
        """

        findings = []

        statements = document.get(
            "Statement",
            [],
        )

        if isinstance(statements, dict):
            statements = [statements]

        if not isinstance(statements, list):
            return findings

        for statement in statements:

            if not isinstance(statement, dict):
                continue

            if statement.get("Effect") != "Allow":
                continue

            actions = self._extract_actions(
                statement
            )

            resources = self._extract_resources(
                statement
            )

            broad_actions = [
                action
                for action in actions
                if self._is_broad_action(action)
            ]

            broad_resources = (
                "*" in resources
            )

            if not broad_actions and not broad_resources:
                continue

            if "*" in broad_actions:
                severity = "CRITICAL"
                title = "Wildcard IAM permissions"
                description = (
                    f"{policy_type} policy '{policy_name}' "
                    f"attached to '{resource_name}' contains "
                    "a wildcard action."
                )
            elif broad_resources:
                severity = "HIGH"
                title = "Broad IAM resource access"
                description = (
                    f"{policy_type} policy '{policy_name}' "
                    f"attached to '{resource_name}' grants "
                    "permissions against all resources."
                )
            else:
                severity = "HIGH"
                title = "Broad IAM action permissions"
                description = (
                    f"{policy_type} policy '{policy_name}' "
                    f"attached to '{resource_name}' contains "
                    "a wildcard service action."
                )

            findings.append(
                self._finding(
                    finding_id="IAM-002",
                    title=title,
                    severity=severity,
                    resource=resource_name,
                    description=description,
                    recommendation=(
                        "Apply least privilege by limiting "
                        "actions and resources to only those "
                        "required by the workload."
                    ),
                    evidence={
                        "policy_name": policy_name,
                        "policy_type": policy_type,
                        "resource": resource_name,
                        "actions": actions,
                        "broad_actions": broad_actions,
                        "resources": resources,
                        "broad_resources": broad_resources,
                    },
                )
            )

        return findings

    def _get_policy_document(
        self,
        policy_arn: str,
        policy_name: str,
        resource_name: str,
        policy_type: str,
    ) -> list[dict[str, Any]]:
        """
        Retrieve and analyze the default version of an
        AWS-managed or customer-managed IAM policy.
        """

        policy = self.iam.get_policy(
            PolicyArn=policy_arn
        )

        policy_version_id = (
            policy["Policy"]
            ["DefaultVersionId"]
        )

        response = self.iam.get_policy_version(
            PolicyArn=policy_arn,
            VersionId=policy_version_id,
        )

        document = (
            response["PolicyVersion"]
            ["Document"]
        )

        return self._analyze_policy_document(
            document=document,
            policy_name=policy_name,
            resource_name=resource_name,
            policy_type=policy_type,
        )

    def scan_user_policies(
        self,
    ) -> list[dict[str, Any]]:
        """
        Analyze policies attached directly to IAM users.
        """

        findings = []

        users_response = self.iam.list_users()

        for user in users_response.get("Users", []):

            username = user.get("UserName")

            if not username:
                continue

            attached = self.iam.list_attached_user_policies(
                UserName=username
            )

            for policy in attached.get(
                "AttachedPolicies",
                [],
            ):

                policy_arn = policy.get("PolicyArn")
                policy_name = policy.get("PolicyName")

                if not policy_arn or not policy_name:
                    continue

                findings.extend(
                    self._get_policy_document(
                        policy_arn=policy_arn,
                        policy_name=policy_name,
                        resource_name=username,
                        policy_type="User attached",
                    )
                )

            inline = self.iam.list_user_policies(
                UserName=username
            )

            for policy_name in inline.get(
                "PolicyNames",
                [],
            ):

                response = self.iam.get_user_policy(
                    UserName=username,
                    PolicyName=policy_name,
                )

                findings.extend(
                    self._analyze_policy_document(
                        document=response["PolicyDocument"],
                        policy_name=policy_name,
                        resource_name=username,
                        policy_type="User inline",
                    )
                )

        return findings

    def scan_role_policies(
        self,
    ) -> list[dict[str, Any]]:
        """
        Analyze policies attached to IAM roles.

        AWS service-linked roles are skipped because their
        permissions are managed by AWS services.
        """

        findings = []

        roles_response = self.iam.list_roles()

        for role in roles_response.get("Roles", []):

            role_name = role.get("RoleName")
            role_path = role.get("Path", "")

            if not role_name:
                continue

            if role_path.startswith(
                "/aws-service-role/"
            ):
                continue

            # Do not treat CloudSentinel's own audit role
            # as a customer security finding.
            if role_name == (
                "CloudSentinelSecurityAuditRole"
            ):
                continue

            attached = self.iam.list_attached_role_policies(
                RoleName=role_name
            )

            for policy in attached.get(
                "AttachedPolicies",
                [],
            ):

                policy_arn = policy.get("PolicyArn")
                policy_name = policy.get("PolicyName")

                if not policy_arn or not policy_name:
                    continue

                findings.extend(
                    self._get_policy_document(
                        policy_arn=policy_arn,
                        policy_name=policy_name,
                        resource_name=role_name,
                        policy_type="Role attached",
                    )
                )

            inline = self.iam.list_role_policies(
                RoleName=role_name
            )

            for policy_name in inline.get(
                "PolicyNames",
                [],
            ):

                response = self.iam.get_role_policy(
                    RoleName=role_name,
                    PolicyName=policy_name,
                )

                findings.extend(
                    self._analyze_policy_document(
                        document=response["PolicyDocument"],
                        policy_name=policy_name,
                        resource_name=role_name,
                        policy_type="Role inline",
                    )
                )

        return findings

    def scan_iam_permissions(
        self,
    ) -> list[dict[str, Any]]:
        """Run IAM privilege analysis for users and roles."""

        findings = []

        findings.extend(
            self.scan_user_policies()
        )

        findings.extend(
            self.scan_role_policies()
        )

        return findings

    def scan(self) -> list[dict[str, Any]]:
        """
        Run all currently available AWS posture checks.
        """

        findings = []

        findings.extend(
            self.scan_access_keys()
        )

        findings.extend(
            self.scan_iam_permissions()
        )

        return findings

    def scan_demo_findings(self) -> list[dict[str, Any]]:
        """
        Generate controlled CSPM findings for local demonstration/testing.

        This does not modify or interact with AWS resources.
        """

        return [
            self._finding(
                finding_id="DEMO-001",
                title="Demo: Broad IAM permissions detected",
                severity="HIGH",
                resource="CloudSentinelDemoRole",
                description=(
                    "This is a controlled CloudSentinel CSPM demonstration "
                    "finding used to validate the complete finding pipeline."
                ),
                recommendation=(
                    "Apply least privilege by limiting IAM actions and "
                    "resources to only those required."
                ),
                evidence={
                    "demo": True,
                    "policy_name": "CloudSentinelDemoPolicy",
                    "actions": ["s3:*"],
                    "resources": ["*"],
                },
            )
        ]