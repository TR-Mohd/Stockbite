"""make username not null

Revision ID: 5f9425960e7f
Revises: 7d7ca5a4d2b6
Create Date: 2026-07-21 16:14:39.612688

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '5f9425960e7f'
down_revision: Union[str, Sequence[str], None] = '7d7ca5a4d2b6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # Backfill existing NULL usernames with a derived value from name and id to prevent collisions
    op.execute(
        "UPDATE users SET username = LOWER(REPLACE(name, ' ', '')) || '_' || SUBSTRING(id, 1, 4) WHERE username IS NULL"
    )
    # Set the column to NOT NULL
    op.alter_column('users', 'username',
               existing_type=sa.String(),
               nullable=False)


def downgrade() -> None:
    """Downgrade schema."""
    op.alter_column('users', 'username',
               existing_type=sa.String(),
               nullable=True)
