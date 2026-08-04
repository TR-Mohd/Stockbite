"""add purchase_order_items table and migrate legacy po columns

Revision ID: c1a2b3d4e5f6
Revises: f2b3c4d5e6f7
Create Date: 2026-07-31 10:40:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'c1a2b3d4e5f6'
down_revision: Union[str, None] = 'f2b3c4d5e6f7'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Create purchase_order_items table
    op.create_table(
        'purchase_order_items',
        sa.Column('id', sa.String(), nullable=False),
        sa.Column('purchase_order_id', sa.String(), nullable=False),
        sa.Column('ingredient_id', sa.String(), nullable=False),
        sa.Column('current_stock', sa.Numeric(precision=10, scale=3), nullable=False),
        sa.Column('reorder_point', sa.Numeric(precision=10, scale=3), nullable=False),
        sa.Column('suggested_quantity', sa.Numeric(precision=10, scale=3), nullable=False),
        sa.Column('actual_received_quantity', sa.Numeric(precision=10, scale=3), nullable=True),
        sa.Column('received_at', sa.DateTime(), nullable=True),
        sa.Column('unit_cost_at_time', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column('ingredient_unit_cost_before_receipt', sa.Numeric(precision=10, scale=2), nullable=True),
        sa.ForeignKeyConstraint(['ingredient_id'], ['ingredients.id'], ),
        sa.ForeignKeyConstraint(['purchase_order_id'], ['purchase_orders.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )

    # 2. Backfill existing purchase_orders rows into purchase_order_items
    op.execute("""
        INSERT INTO purchase_order_items (
            id,
            purchase_order_id,
            ingredient_id,
            current_stock,
            reorder_point,
            suggested_quantity,
            actual_received_quantity,
            received_at,
            unit_cost_at_time,
            ingredient_unit_cost_before_receipt
        )
        SELECT
            po.id || '-item-1' AS id,
            po.id AS purchase_order_id,
            po.ingredient_id,
            COALESCE(po.current_stock, 0.0) AS current_stock,
            COALESCE(po.reorder_point, 0.0) AS reorder_point,
            COALESCE(po.suggested_quantity, 0.0) AS suggested_quantity,
            po.actual_received_quantity,
            NULL AS received_at,
            COALESCE(i.unit_cost, 0.00) AS unit_cost_at_time,
            NULL AS ingredient_unit_cost_before_receipt
        FROM purchase_orders po
        LEFT JOIN ingredients i ON po.ingredient_id = i.id
        WHERE po.ingredient_id IS NOT NULL;
    """)

    # 3. Drop deprecated single-item columns from purchase_orders
    op.drop_constraint('purchase_orders_ingredient_id_fkey', 'purchase_orders', type_='foreignkey')
    op.drop_column('purchase_orders', 'ingredient_id')
    op.drop_column('purchase_orders', 'current_stock')
    op.drop_column('purchase_orders', 'reorder_point')
    op.drop_column('purchase_orders', 'suggested_quantity')
    op.drop_column('purchase_orders', 'actual_received_quantity')


def downgrade() -> None:
    # 1. Add back single-item columns to purchase_orders
    op.add_column('purchase_orders', sa.Column('ingredient_id', sa.String(), nullable=True))
    op.add_column('purchase_orders', sa.Column('current_stock', sa.Numeric(precision=10, scale=3), nullable=True))
    op.add_column('purchase_orders', sa.Column('reorder_point', sa.Numeric(precision=10, scale=3), nullable=True))
    op.add_column('purchase_orders', sa.Column('suggested_quantity', sa.Numeric(precision=10, scale=3), nullable=True))
    op.add_column('purchase_orders', sa.Column('actual_received_quantity', sa.Numeric(precision=10, scale=3), nullable=True))
    op.create_foreign_key('purchase_orders_ingredient_id_fkey', 'purchase_orders', 'ingredients', ['ingredient_id'], ['id'])

    # 2. Backfill from purchase_order_items back to purchase_orders
    op.execute("""
        UPDATE purchase_orders po
        SET
            ingredient_id = poi.ingredient_id,
            current_stock = poi.current_stock,
            reorder_point = poi.reorder_point,
            suggested_quantity = poi.suggested_quantity,
            actual_received_quantity = poi.actual_received_quantity
        FROM purchase_order_items poi
        WHERE po.id = poi.purchase_order_id;
    """)

    # 3. Drop purchase_order_items table
    op.drop_table('purchase_order_items')
