"""replace super admin index with system config

Revision ID: f1a2b3c4d5e6
Revises: e8d91f2c3b4a
Create Date: 2026-07-24 18:10:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'f1a2b3c4d5e6'
down_revision: Union[str, None] = 'e8d91f2c3b4a'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Drop uix_users_super_admin index safely
    op.execute(sa.text("DROP INDEX IF EXISTS uix_users_super_admin;"))

    # 2. Create system_config table
    op.create_table(
        'system_config',
        sa.Column('key', sa.String(), nullable=False, primary_key=True),
        sa.Column('value', sa.String(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.text('CURRENT_TIMESTAMP'), nullable=False)
    )

    # 3. Backfill: If DB already has existing users, mark setup as completed in system_config
    op.execute(sa.text("""
        INSERT INTO system_config (key, value, updated_at)
        SELECT 'is_initialized', 'true', CURRENT_TIMESTAMP
        WHERE EXISTS (SELECT 1 FROM users)
        ON CONFLICT (key) DO NOTHING;
    """))


def downgrade() -> None:
    op.drop_table('system_config')
    op.create_index(
        'uix_users_super_admin',
        'users',
        ['is_super_admin'],
        unique=True,
        postgresql_where=sa.text('is_super_admin = true')
    )
