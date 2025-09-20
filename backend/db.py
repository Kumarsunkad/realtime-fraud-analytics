# backend/db.py
from sqlalchemy import create_engine, Column, Integer, Float, String, DateTime
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy.sql import func
import os

Base = declarative_base()

class Transaction(Base):
    __tablename__ = "transactions"
    id = Column(Integer, primary_key=True)
    txn_id = Column(String)
    payload = Column(String)
    features = Column(String)
    score = Column(Float)
    decision = Column(String)
    model_msgs = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

def get_session(db_url=None):
    if db_url is None:
        db_url = os.environ.get("DATABASE_URL", "sqlite:///fraud.db")
    engine = create_engine(db_url, connect_args={"check_same_thread": False})
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine)
    return Session()
