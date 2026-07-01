"""Add whatsapp and email columns

Revision ID: a5a9d0f871bf
Revises: a5a9d0f871ae
Create Date: 2026-07-01 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a5a9d0f871bf'
down_revision: Union[str, Sequence[str], None] = 'a5a9d0f871ae'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('transactions', sa.Column('whatsapp', sa.String(), nullable=True))
    op.add_column('transactions', sa.Column('email', sa.String(), nullable=True))

def downgrade() -> None:
    op.drop_column('transactions', 'email')
    op.drop_column('transactions', 'whatsapp')
