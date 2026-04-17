"""create assessments table

Revision ID: 005
Revises: 004
Create Date: 2026-04-16
"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "005"
down_revision: Union[str, None] = "004"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "assessments",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("user_id", sa.String(), nullable=False),
        sa.Column("equipment_type", sa.String(20), nullable=False),
        sa.Column("brand", sa.String(), nullable=False, server_default=""),
        sa.Column("safe_to_ski", sa.Boolean(), nullable=False),
        sa.Column("severity", sa.Integer(), nullable=False),
        sa.Column("verdict", sa.String(10), nullable=False),
        sa.Column("request_data", sa.JSON(), nullable=False),
        sa.Column("response_data", sa.JSON(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
    )
    op.create_index("ix_assessments_user_id", "assessments", ["user_id"])


def downgrade() -> None:
    op.drop_index("ix_assessments_user_id", table_name="assessments")
    op.drop_table("assessments")
