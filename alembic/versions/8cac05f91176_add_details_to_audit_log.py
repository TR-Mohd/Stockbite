"""add_details_to_audit_log

Revision ID: 8cac05f91176
Revises: d513e210fda2
Create Date: 2026-07-08 09:15:36.110263

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '8cac05f91176'
down_revision: Union[str, Sequence[str], None] = 'd513e210fda2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('audit_logs', sa.Column('details', sa.JSON(), nullable=True))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('audit_logs', 'details')
