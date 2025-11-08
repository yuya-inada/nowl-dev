from sqlalchemy import MetaData, Table, Column, Integer, String, TIMESTAMP, Float, text

metadata = MetaData()

users = Table(
    "users",
    metadata,
    Column("id", Integer, primary_key=True),
    Column("name", String(50), nullable=False),
)

event_sync_logs = Table(
    "event_sync_logs",
    metadata,
    Column("id", Integer, primary_key=True),
    Column("executed_at", TIMESTAMP, nullable=False, server_default=text("NOW()")),
    Column("status", String(10), nullable=False),  # 'SUCCESS' / 'FAILED'
    Column("added_count", Integer, default=0),
    Column("updated_count", Integer, default=0),
    Column("deleted_count", Integer, default=0),
    Column("duration_seconds", Float),
    Column("error_message", String),  # 長文用なら Text にしてもOK
    Column("created_at", TIMESTAMP, server_default=text("NOW()")),
)