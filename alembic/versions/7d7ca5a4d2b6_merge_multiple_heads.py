"""merge multiple heads

Revision ID: 7d7ca5a4d2b6
Revises: b6e5421567e8, d682b01f4270
Create Date: 2026-07-18 17:46:48.060613

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '7d7ca5a4d2b6'
down_revision: Union[str, Sequence[str], None] = ('b6e5421567e8', 'd682b01f4270')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
