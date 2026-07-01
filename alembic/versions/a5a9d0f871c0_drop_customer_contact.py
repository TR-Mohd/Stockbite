"""Drop customer_contact column

Revision ID: a5a9d0f871c0
Revises: a5a9d0f871bf
Create Date: 2026-07-01 12:10:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a5a9d0f871c0'
down_revision: Union[str, Sequence[str], None] = 'a5a9d0f871bf'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.drop_column('transactions', 'customer_contact')

def downgrade() -> None:
    op.add_column('transactions', sa.Column('customer_contact', sa.String(), nullable=True))
