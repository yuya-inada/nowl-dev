from sqlalchemy import MetaData, Table, Column, Integer, String

metadata = MetaData()

users = Table(
    "users",
    metadata,
    Column("id", Integer, primary_key=True),
    Column("name", String(50), nullable=False),
)