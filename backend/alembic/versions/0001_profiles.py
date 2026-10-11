"""0001 profiles + RLS + handle_new_user trigger.

Revision ID: 0001_profiles
Revises:
Create Date: 2026-10-11

NOTE: every op.execute() below sends exactly ONE statement with NO trailing
semicolon. asyncpg (extended query protocol) rejects multiple commands per
prepared statement, so multi-command strings and trailing ";" break migrations
with "cannot insert multiple commands into a prepared statement". The
CREATE FUNCTION body keeps its INTERNAL semicolons (inside $$...$$ quoting,
Postgres still sees a single statement).
"""

from __future__ import annotations

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID as PG_UUID

revision = "0001_profiles"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "profiles",
        sa.Column("id", PG_UUID(as_uuid=True), primary_key=True),
        sa.Column("email", sa.String(320), nullable=False),
        sa.Column("first_name", sa.String(100), nullable=False, server_default=""),
        sa.Column("last_name", sa.String(100), nullable=False, server_default=""),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column(
            "updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
    )
    op.create_index("ix_profiles_email", "profiles", ["email"], unique=True)

    op.execute("ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY")
    op.execute(
        """
        CREATE POLICY "profiles_own_read" ON public.profiles
        FOR SELECT TO authenticated USING (auth.uid() = id)
        """
    )
    op.execute(
        """
        CREATE POLICY "profiles_own_update" ON public.profiles
        FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id)
        """
    )
    # No INSERT policy for clients: rows are created by the trigger below.

    op.execute(
        """
        CREATE OR REPLACE FUNCTION public.handle_new_user()
        RETURNS trigger
        LANGUAGE plpgsql
        SECURITY DEFINER SET search_path = public
        AS $$
        BEGIN
          INSERT INTO public.profiles (id, email, first_name, last_name)
          VALUES (
            NEW.id,
            lower(trim(NEW.email)),
            COALESCE(NEW.raw_user_meta_data ->> 'first_name', ''),
            COALESCE(NEW.raw_user_meta_data ->> 'last_name', '')
          )
          ON CONFLICT (id) DO NOTHING;
          RETURN NEW;
        END;
        $$
        """
    )
    op.execute("DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users")
    op.execute(
        """
        CREATE TRIGGER on_auth_user_created
        AFTER INSERT ON auth.users
        FOR EACH ROW EXECUTE FUNCTION public.handle_new_user()
        """
    )


def downgrade() -> None:
    op.execute("DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users")
    op.execute("DROP FUNCTION IF EXISTS public.handle_new_user()")
    op.execute('DROP POLICY IF EXISTS "profiles_own_update" ON public.profiles')
    op.execute('DROP POLICY IF EXISTS "profiles_own_read" ON public.profiles')
    op.drop_index("ix_profiles_email", table_name="profiles")
    op.drop_table("profiles")
