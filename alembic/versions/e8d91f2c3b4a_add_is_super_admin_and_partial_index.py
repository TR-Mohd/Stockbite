"""add is_super_admin and partial index

Revision ID: e8d91f2c3b4a
Revises: 7d7ca5a4d2b6
Create Date: 2026-07-23 17:15:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'e8d91f2c3b4a'
down_revision: Union[str, None] = '5f9425960e7f'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Add is_super_admin column
    op.add_column(
        'users',
        sa.Column('is_super_admin', sa.Boolean(), nullable=False, server_default=sa.text('false'))
    )

    # 2. Data backfill: Target at most 1 row via LIMIT 1 subquery
    op.execute(sa.text("""
        UPDATE users 
        SET is_super_admin = true 
        WHERE id = (
            SELECT id FROM users 
            WHERE username = 'mohammed' OR name = 'mohammed' 
            ORDER BY id ASC 
            LIMIT 1
        );
    """))

    op.execute(sa.text("""
        UPDATE users 
        SET is_super_admin = true 
        WHERE id = (
            SELECT id FROM users 
            WHERE role = 'Manager' 
            ORDER BY id ASC 
            LIMIT 1
        ) 
        AND NOT EXISTS (SELECT 1 FROM users WHERE is_super_admin = true);
    """))

    # 3. Partial unique index enforcing max 1 super admin
    op.create_index(
        'uix_users_super_admin',
        'users',
        ['is_super_admin'],
        unique=True,
        postgresql_where=sa.text('is_super_admin = true')
    )


def downgrade() -> None:
    op.drop_index(
        'uix_users_super_admin',
        table_name='users',
        postgresql_where=sa.text('is_super_admin = true')
    )
    op.drop_column('users', 'is_super_admin')
