from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import declarative_base, sessionmaker

SQLALCHEMY_DATABASE_URL = "sqlite:///./store_fraud.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def initialize_database() -> None:
    from backend.app.database import models

    Base.metadata.create_all(bind=engine)
    transaction_columns = {
        column["name"] for column in inspect(engine).get_columns("transactions")
    }
    new_columns = {
        "type": "VARCHAR NOT NULL DEFAULT 'PAYMENT'",
        "oldbalanceOrg": "FLOAT NOT NULL DEFAULT 0",
        "newbalanceOrig": "FLOAT NOT NULL DEFAULT 0",
        "oldbalanceDest": "FLOAT NOT NULL DEFAULT 0",
        "newbalanceDest": "FLOAT NOT NULL DEFAULT 0",
    }
    with engine.begin() as connection:
        for name, definition in new_columns.items():
            if name not in transaction_columns:
                connection.execute(
                    text(f'ALTER TABLE transactions ADD COLUMN "{name}" {definition}')
                )
