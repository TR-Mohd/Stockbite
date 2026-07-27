"""add id sequences table

Revision ID: f2b3c4d5e6f7
Revises: f1a2b3c4d5e6
Create Date: 2026-07-24 19:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = 'f2b3c4d5e6f7'
down_revision: Union[str, None] = 'f1a2b3c4d5e6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'id_sequences',
        sa.Column('key', sa.String(), nullable=False, primary_key=True),
        sa.Column('current_value', sa.Integer(), nullable=False)
    )


def downgrade() -> None:
    op.drop_table('id_sequences')
