from sqlalchemy.dialects import postgresql
from app.routers.manager import get_timeframe_boundaries, StatusEnum
from app.models import Transaction
from sqlalchemy import select, func, text, and_
from datetime import timedelta

def generate_sql(timeframe):
    start_utc, end_utc, start_local, end_local = get_timeframe_boundaries(timeframe)
    hourly = timeframe in ["today", "yesterday"]
    interval_td = timedelta(hours=1) if hourly else timedelta(days=1)
    
    series = select(
        func.generate_series(
            start_local.replace(tzinfo=None),
            end_local.replace(tzinfo=None),
            interval_td
        ).label("ts")
    ).subquery("series_ts")
    
    local_tx_ts = Transaction.timestamp.op('AT TIME ZONE')('UTC').op('AT TIME ZONE')('Asia/Jakarta')
    trunc_tx_ts = func.date_trunc('hour' if hourly else 'day', local_tx_ts)
    
    stmt = (
        select(
            series.c.ts.label("date"),
            func.coalesce(func.sum(Transaction.total_amount), 0).label("revenue")
        )
        .select_from(series)
        .outerjoin(
            Transaction,
            and_(
                Transaction.status == StatusEnum.Completed,
                trunc_tx_ts == series.c.ts,
                Transaction.timestamp >= start_utc,
                Transaction.timestamp <= end_utc
            )
        )
        .group_by(series.c.ts)
        .order_by(series.c.ts)
    )
    
    print(f"\n{'='*50}")
    print(f"SQL QUERY FOR TIMEFRAME: {timeframe.upper()}")
    print(f"Local Boundary Start: {start_local}")
    print(f"Local Boundary End:   {end_local}")
    print(f"UTC Boundary Start:   {start_utc}")
    print(f"UTC Boundary End:     {end_utc}")
    print(f"{'='*50}")
    compiled = stmt.compile(dialect=postgresql.dialect(), compile_kwargs={"literal_binds": True})
    print(compiled)

if __name__ == "__main__":
    generate_sql("today")
    generate_sql("last_7_days")
    generate_sql("this_month")
