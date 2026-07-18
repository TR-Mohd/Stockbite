"""migrate_transaction_floats_to_numeric

Revision ID: b6e5421567e8
Revises: a5d4310456d7
Create Date: 2026-07-18 17:20:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'b6e5421567e8'
down_revision = 'a5d4310456d7'
branch_labels = None
depends_on = None

def upgrade():
    # transactions
    op.execute("ALTER TABLE transactions ALTER COLUMN subtotal TYPE NUMERIC(12, 0) USING ROUND(subtotal)::numeric(12,0)")
    op.execute("ALTER TABLE transactions ALTER COLUMN tax TYPE NUMERIC(12, 0) USING ROUND(tax)::numeric(12,0)")
    op.execute("ALTER TABLE transactions ALTER COLUMN total_amount TYPE NUMERIC(12, 0) USING ROUND(total_amount)::numeric(12,0)")
    op.execute("ALTER TABLE transactions ALTER COLUMN amount_tendered TYPE NUMERIC(12, 0) USING ROUND(amount_tendered)::numeric(12,0)")
    op.execute("ALTER TABLE transactions ALTER COLUMN change TYPE NUMERIC(12, 0) USING ROUND(change)::numeric(12,0)")

    # transaction_items
    op.execute("ALTER TABLE transaction_items ALTER COLUMN price_at_time TYPE NUMERIC(12, 0) USING ROUND(price_at_time)::numeric(12,0)")
    op.execute("ALTER TABLE transaction_items ALTER COLUMN cogs_per_unit TYPE NUMERIC(14, 4) USING cogs_per_unit::numeric(14,4)")

    # transaction_item_modifiers
    op.execute("ALTER TABLE transaction_item_modifiers ALTER COLUMN price_at_time TYPE NUMERIC(12, 0) USING ROUND(price_at_time)::numeric(12,0)")
    op.execute("ALTER TABLE transaction_item_modifiers ALTER COLUMN cogs_per_unit TYPE NUMERIC(14, 4) USING cogs_per_unit::numeric(14,4)")

    # menu_items
    op.execute("ALTER TABLE menu_items ALTER COLUMN price TYPE NUMERIC(12, 0) USING ROUND(price)::numeric(12,0)")

    # item_modifiers
    op.execute("ALTER TABLE item_modifiers ALTER COLUMN price_adjustment TYPE NUMERIC(12, 0) USING ROUND(price_adjustment)::numeric(12,0)")

def downgrade():
    # item_modifiers
    op.execute("ALTER TABLE item_modifiers ALTER COLUMN price_adjustment TYPE DOUBLE PRECISION USING price_adjustment::double precision")

    # menu_items
    op.execute("ALTER TABLE menu_items ALTER COLUMN price TYPE DOUBLE PRECISION USING price::double precision")

    # transaction_item_modifiers
    op.execute("ALTER TABLE transaction_item_modifiers ALTER COLUMN cogs_per_unit TYPE DOUBLE PRECISION USING cogs_per_unit::double precision")
    op.execute("ALTER TABLE transaction_item_modifiers ALTER COLUMN price_at_time TYPE DOUBLE PRECISION USING price_at_time::double precision")

    # transaction_items
    op.execute("ALTER TABLE transaction_items ALTER COLUMN cogs_per_unit TYPE DOUBLE PRECISION USING cogs_per_unit::double precision")
    op.execute("ALTER TABLE transaction_items ALTER COLUMN price_at_time TYPE DOUBLE PRECISION USING price_at_time::double precision")

    # transactions
    op.execute("ALTER TABLE transactions ALTER COLUMN change TYPE DOUBLE PRECISION USING change::double precision")
    op.execute("ALTER TABLE transactions ALTER COLUMN amount_tendered TYPE DOUBLE PRECISION USING amount_tendered::double precision")
    op.execute("ALTER TABLE transactions ALTER COLUMN total_amount TYPE DOUBLE PRECISION USING total_amount::double precision")
    op.execute("ALTER TABLE transactions ALTER COLUMN tax TYPE DOUBLE PRECISION USING tax::double precision")
    op.execute("ALTER TABLE transactions ALTER COLUMN subtotal TYPE DOUBLE PRECISION USING subtotal::double precision")
