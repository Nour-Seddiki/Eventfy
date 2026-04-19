"""add active_sessions table

Revision ID: 20260419_add_active_sessions
Revises: 20260416_add_payment_table
Create Date: 2026-04-19
"""
from alembic import op
import sqlalchemy as sa


revision = "20260419_add_active_sessions"
down_revision = "20260416_add_payment_table"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "active_sessions",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False, index=True),
        sa.Column("token_jti", sa.String(), nullable=False, unique=True, index=True),
        sa.Column("device_name", sa.String(), nullable=True),
        sa.Column("device_type", sa.String(), nullable=True),
        sa.Column("ip_address", sa.String(), nullable=True),
        sa.Column("os", sa.String(), nullable=True),
        sa.Column("browser", sa.String(), nullable=True),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("1")),
        sa.Column("last_activity", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=True),
        sa.Column("logged_out_at", sa.DateTime(), nullable=True),
    )


def downgrade():
    op.drop_table("active_sessions")
