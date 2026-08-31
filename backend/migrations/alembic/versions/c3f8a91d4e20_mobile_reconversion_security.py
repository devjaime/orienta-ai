"""mobile journey tables and reconversion edit tokens

Revision ID: c3f8a91d4e20
Revises: 1b719f78cc1b
Create Date: 2026-08-30 22:30:00.000000
"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op
from sqlalchemy import inspect
from sqlalchemy.dialects import postgresql

revision: str = "c3f8a91d4e20"
down_revision: Union[str, None] = "1b719f78cc1b"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

JSON_TYPE = sa.JSON().with_variant(postgresql.JSONB(astext_type=sa.Text()), "postgresql")


def _tables() -> set[str]:
    bind = op.get_bind()
    return set(inspect(bind).get_table_names())


def _columns(table_name: str) -> set[str]:
    bind = op.get_bind()
    return {column["name"] for column in inspect(bind).get_columns(table_name)}


def upgrade() -> None:
    tables = _tables()

    if "adult_reconversion_sessions" not in tables:
        op.create_table(
            "adult_reconversion_sessions",
            sa.Column("share_token", sa.String(length=64), nullable=False),
            sa.Column("edit_token_hash", sa.String(length=64), nullable=False),
            sa.Column("user_id", sa.UUID(), nullable=True),
            sa.Column("version", sa.Integer(), nullable=False, server_default="1"),
            sa.Column("nombre", sa.String(length=255), nullable=False),
            sa.Column("email", sa.String(length=255), nullable=False),
            sa.Column("profesion_actual", sa.String(length=255), nullable=False),
            sa.Column("edad", sa.Integer(), nullable=False),
            sa.Column("pais", sa.String(length=120), nullable=True),
            sa.Column("ciudad", sa.String(length=120), nullable=True),
            sa.Column("nivel_educativo", sa.String(length=120), nullable=True),
            sa.Column("ingreso_actual_aprox", sa.Float(), nullable=True),
            sa.Column("nivel_ingles", sa.String(length=60), nullable=True),
            sa.Column("situacion_actual", sa.String(length=120), nullable=True),
            sa.Column("disponibilidad_para_estudiar", sa.String(length=120), nullable=True),
            sa.Column("disponibilidad_para_relocalizarse", sa.String(length=120), nullable=True),
            sa.Column("status", sa.String(length=40), nullable=False, server_default="in_progress"),
            sa.Column("current_phase", sa.Integer(), nullable=False, server_default="0"),
            sa.Column("summary_json", sa.JSON(), nullable=False),
            sa.Column("id", sa.UUID(), nullable=False),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
            sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
            sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="SET NULL"),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint("share_token"),
        )
        op.create_index("ix_adult_reconversion_sessions_email", "adult_reconversion_sessions", ["email"])
        op.create_index("ix_adult_reconversion_sessions_edit_token_hash", "adult_reconversion_sessions", ["edit_token_hash"])
        op.create_index("ix_adult_reconversion_sessions_user_id", "adult_reconversion_sessions", ["user_id"])
    else:
        columns = _columns("adult_reconversion_sessions")
        if "edit_token_hash" not in columns:
            op.add_column(
                "adult_reconversion_sessions",
                sa.Column("edit_token_hash", sa.String(length=64), nullable=True),
            )
            op.execute(
                "UPDATE adult_reconversion_sessions "
                "SET edit_token_hash = replace(gen_random_uuid()::text, '-', '') "
                "WHERE edit_token_hash IS NULL"
            )
            op.alter_column("adult_reconversion_sessions", "edit_token_hash", nullable=False)
            op.create_index(
                "ix_adult_reconversion_sessions_edit_token_hash",
                "adult_reconversion_sessions",
                ["edit_token_hash"],
            )
        if "user_id" not in columns:
            op.add_column("adult_reconversion_sessions", sa.Column("user_id", sa.UUID(), nullable=True))
            op.create_foreign_key(
                "fk_adult_reconversion_sessions_user_id",
                "adult_reconversion_sessions",
                "users",
                ["user_id"],
                ["id"],
                ondelete="SET NULL",
            )
            op.create_index("ix_adult_reconversion_sessions_user_id", "adult_reconversion_sessions", ["user_id"])
        if "version" not in columns:
            op.add_column(
                "adult_reconversion_sessions",
                sa.Column("version", sa.Integer(), nullable=False, server_default="1"),
            )

    tables = _tables()
    if "adult_reconversion_phase_results" not in tables:
        op.create_table(
            "adult_reconversion_phase_results",
            sa.Column("session_id", sa.UUID(), nullable=False),
            sa.Column("phase_key", sa.String(length=50), nullable=False),
            sa.Column("answers_json", sa.JSON(), nullable=False),
            sa.Column("derived_scores_json", sa.JSON(), nullable=False),
            sa.Column("completed_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
            sa.Column("id", sa.UUID(), nullable=False),
            sa.ForeignKeyConstraint(["session_id"], ["adult_reconversion_sessions.id"], ondelete="CASCADE"),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint("session_id", "phase_key", name="uq_adult_reconversion_phase"),
        )
        op.create_index("ix_adult_reconversion_phase_results_session_id", "adult_reconversion_phase_results", ["session_id"])
        op.create_index("ix_adult_reconversion_phase_results_phase_key", "adult_reconversion_phase_results", ["phase_key"])

    if "adult_reconversion_reports" not in tables:
        op.create_table(
            "adult_reconversion_reports",
            sa.Column("session_id", sa.UUID(), nullable=False),
            sa.Column("report_json", JSON_TYPE, nullable=False),
            sa.Column("report_text", sa.Text(), nullable=False, server_default=""),
            sa.Column("model_name", sa.String(length=120), nullable=False, server_default="pending"),
            sa.Column("prompt_version", sa.String(length=40), nullable=False, server_default="adult-reconversion-v1"),
            sa.Column("id", sa.UUID(), nullable=False),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
            sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
            sa.ForeignKeyConstraint(["session_id"], ["adult_reconversion_sessions.id"], ondelete="CASCADE"),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index("ix_adult_reconversion_reports_session_id", "adult_reconversion_reports", ["session_id"])

    if "idempotency_records" not in tables:
        op.create_table(
            "idempotency_records",
            sa.Column("scope_hash", sa.String(length=64), nullable=False),
            sa.Column("idempotency_key", sa.String(length=128), nullable=False),
            sa.Column("status_code", sa.Integer(), nullable=False),
            sa.Column("response_json", JSON_TYPE, nullable=False),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
            sa.Column("id", sa.UUID(), nullable=False),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint("scope_hash", "idempotency_key", name="uq_idempotency_scope_key"),
        )
        op.create_index("ix_idempotency_records_scope_hash", "idempotency_records", ["scope_hash"])

    if "mobile_guests" not in tables:
        op.create_table(
            "mobile_guests",
            sa.Column("token_hash", sa.String(length=64), nullable=False),
            sa.Column("claimed_user_id", sa.UUID(), nullable=True),
            sa.Column("claimed_at", sa.DateTime(timezone=True), nullable=True),
            sa.Column("revoked_at", sa.DateTime(timezone=True), nullable=True),
            sa.Column("id", sa.UUID(), nullable=False),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
            sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
            sa.ForeignKeyConstraint(["claimed_user_id"], ["users.id"], ondelete="SET NULL"),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint("token_hash"),
        )
        op.create_index("ix_mobile_guests_claimed_user_id", "mobile_guests", ["claimed_user_id"])

    if "learning_paths" not in tables:
        op.create_table(
            "learning_paths",
            sa.Column("slug", sa.String(length=80), nullable=False),
            sa.Column("audience", sa.String(length=40), nullable=False, server_default="adult"),
            sa.Column("version", sa.String(length=40), nullable=False, server_default="v1"),
            sa.Column("title", sa.String(length=255), nullable=False),
            sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
            sa.Column("id", sa.UUID(), nullable=False),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
            sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint("slug"),
        )

    if "journey_nodes" not in tables:
        op.create_table(
            "journey_nodes",
            sa.Column("path_id", sa.UUID(), nullable=False),
            sa.Column("slug", sa.String(length=80), nullable=False),
            sa.Column("node_type", sa.String(length=40), nullable=False),
            sa.Column("title", sa.String(length=255), nullable=False),
            sa.Column("position", sa.Integer(), nullable=False),
            sa.Column("prerequisites", JSON_TYPE, nullable=False),
            sa.Column("content_version", sa.String(length=40), nullable=False, server_default="v1"),
            sa.Column("xp_reward", sa.Integer(), nullable=False, server_default="0"),
            sa.Column("estimated_minutes", sa.Integer(), nullable=False, server_default="6"),
            sa.Column("id", sa.UUID(), nullable=False),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
            sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
            sa.ForeignKeyConstraint(["path_id"], ["learning_paths.id"], ondelete="CASCADE"),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint("path_id", "slug", name="uq_journey_node_path_slug"),
        )
        op.create_index("ix_journey_nodes_path_id", "journey_nodes", ["path_id"])
        op.create_index("ix_journey_nodes_slug", "journey_nodes", ["slug"])

    if "user_journeys" not in tables:
        op.create_table(
            "user_journeys",
            sa.Column("user_id", sa.UUID(), nullable=True),
            sa.Column("guest_id", sa.UUID(), nullable=True),
            sa.Column("path_id", sa.UUID(), nullable=False),
            sa.Column("current_node_id", sa.UUID(), nullable=True),
            sa.Column("status", sa.String(length=40), nullable=False, server_default="in_progress"),
            sa.Column("timezone", sa.String(length=64), nullable=False, server_default="America/Santiago"),
            sa.Column("version", sa.Integer(), nullable=False, server_default="1"),
            sa.Column("started_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
            sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
            sa.Column("id", sa.UUID(), nullable=False),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
            sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
            sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="SET NULL"),
            sa.ForeignKeyConstraint(["guest_id"], ["mobile_guests.id"], ondelete="SET NULL"),
            sa.ForeignKeyConstraint(["path_id"], ["learning_paths.id"], ondelete="CASCADE"),
            sa.ForeignKeyConstraint(["current_node_id"], ["journey_nodes.id"], ondelete="SET NULL"),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index("ix_user_journeys_user_id", "user_journeys", ["user_id"])
        op.create_index("ix_user_journeys_guest_id", "user_journeys", ["guest_id"])
        op.create_index("ix_user_journeys_path_id", "user_journeys", ["path_id"])

    if "node_attempts" not in tables:
        op.create_table(
            "node_attempts",
            sa.Column("journey_id", sa.UUID(), nullable=False),
            sa.Column("node_id", sa.UUID(), nullable=False),
            sa.Column("idempotency_key", sa.String(length=128), nullable=False),
            sa.Column("answers_json", JSON_TYPE, nullable=False),
            sa.Column("result_json", JSON_TYPE, nullable=False),
            sa.Column("completed_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
            sa.Column("id", sa.UUID(), nullable=False),
            sa.ForeignKeyConstraint(["journey_id"], ["user_journeys.id"], ondelete="CASCADE"),
            sa.ForeignKeyConstraint(["node_id"], ["journey_nodes.id"], ondelete="CASCADE"),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint("journey_id", "idempotency_key", name="uq_node_attempt_idempotency"),
        )
        op.create_index("ix_node_attempts_journey_id", "node_attempts", ["journey_id"])
        op.create_index("ix_node_attempts_node_id", "node_attempts", ["node_id"])

    if "xp_ledger" not in tables:
        op.create_table(
            "xp_ledger",
            sa.Column("journey_id", sa.UUID(), nullable=False),
            sa.Column("event_type", sa.String(length=40), nullable=False),
            sa.Column("event_id", sa.String(length=80), nullable=False),
            sa.Column("amount", sa.Integer(), nullable=False),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
            sa.Column("id", sa.UUID(), nullable=False),
            sa.ForeignKeyConstraint(["journey_id"], ["user_journeys.id"], ondelete="CASCADE"),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint("journey_id", "event_type", "event_id", name="uq_xp_ledger_event"),
        )
        op.create_index("ix_xp_ledger_journey_id", "xp_ledger", ["journey_id"])

    if "user_streaks" not in tables:
        op.create_table(
            "user_streaks",
            sa.Column("journey_id", sa.UUID(), nullable=False),
            sa.Column("timezone", sa.String(length=64), nullable=False, server_default="America/Santiago"),
            sa.Column("current_days", sa.Integer(), nullable=False, server_default="0"),
            sa.Column("best_days", sa.Integer(), nullable=False, server_default="0"),
            sa.Column("last_active_date", sa.Date(), nullable=True),
            sa.Column("freeze_available", sa.Boolean(), nullable=False, server_default=sa.text("true")),
            sa.Column("id", sa.UUID(), nullable=False),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
            sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
            sa.ForeignKeyConstraint(["journey_id"], ["user_journeys.id"], ondelete="CASCADE"),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint("journey_id", name="uq_user_streak_journey"),
        )
        op.create_index("ix_user_streaks_journey_id", "user_streaks", ["journey_id"])

    if "achievements" not in tables:
        op.create_table(
            "achievements",
            sa.Column("slug", sa.String(length=80), nullable=False),
            sa.Column("title", sa.String(length=255), nullable=False),
            sa.Column("description", sa.String(length=500), nullable=False),
            sa.Column("version", sa.String(length=40), nullable=False, server_default="v1"),
            sa.Column("id", sa.UUID(), nullable=False),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
            sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint("slug"),
        )

    if "user_achievements" not in tables:
        op.create_table(
            "user_achievements",
            sa.Column("journey_id", sa.UUID(), nullable=False),
            sa.Column("achievement_id", sa.UUID(), nullable=False),
            sa.Column("granted_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
            sa.Column("id", sa.UUID(), nullable=False),
            sa.ForeignKeyConstraint(["journey_id"], ["user_journeys.id"], ondelete="CASCADE"),
            sa.ForeignKeyConstraint(["achievement_id"], ["achievements.id"], ondelete="CASCADE"),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint("journey_id", "achievement_id", name="uq_user_achievement"),
        )
        op.create_index("ix_user_achievements_journey_id", "user_achievements", ["journey_id"])
        op.create_index("ix_user_achievements_achievement_id", "user_achievements", ["achievement_id"])

    if "action_plan_items" not in tables:
        op.create_table(
            "action_plan_items",
            sa.Column("journey_id", sa.UUID(), nullable=False),
            sa.Column("route_slug", sa.String(length=80), nullable=True),
            sa.Column("title", sa.String(length=255), nullable=False),
            sa.Column("due_date", sa.Date(), nullable=True),
            sa.Column("status", sa.String(length=40), nullable=False, server_default="pending"),
            sa.Column("evidence_json", JSON_TYPE, nullable=False),
            sa.Column("id", sa.UUID(), nullable=False),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
            sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
            sa.ForeignKeyConstraint(["journey_id"], ["user_journeys.id"], ondelete="CASCADE"),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index("ix_action_plan_items_journey_id", "action_plan_items", ["journey_id"])

    if "device_push_tokens" not in tables:
        op.create_table(
            "device_push_tokens",
            sa.Column("user_id", sa.UUID(), nullable=True),
            sa.Column("guest_id", sa.UUID(), nullable=True),
            sa.Column("platform", sa.String(length=20), nullable=False),
            sa.Column("token_hash", sa.String(length=64), nullable=False),
            sa.Column("locale", sa.String(length=16), nullable=False, server_default="es-CL"),
            sa.Column("last_seen_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
            sa.Column("revoked_at", sa.DateTime(timezone=True), nullable=True),
            sa.Column("id", sa.UUID(), nullable=False),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
            sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
            sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="SET NULL"),
            sa.ForeignKeyConstraint(["guest_id"], ["mobile_guests.id"], ondelete="SET NULL"),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint("token_hash", name="uq_device_push_token_hash"),
        )
        op.create_index("ix_device_push_tokens_user_id", "device_push_tokens", ["user_id"])
        op.create_index("ix_device_push_tokens_guest_id", "device_push_tokens", ["guest_id"])
        op.create_index("ix_device_push_tokens_token_hash", "device_push_tokens", ["token_hash"])


def downgrade() -> None:
    for table_name in [
        "device_push_tokens",
        "action_plan_items",
        "user_achievements",
        "achievements",
        "user_streaks",
        "xp_ledger",
        "node_attempts",
        "user_journeys",
        "journey_nodes",
        "learning_paths",
        "mobile_guests",
        "idempotency_records",
    ]:
        op.drop_table(table_name)
