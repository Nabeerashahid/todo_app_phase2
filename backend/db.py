from sqlmodel import SQLModel, create_engine

DATABASE_URL = "sqlite:///./todo.db"  
# abhi sqlite use kar rahe hain (Phase 2 me PostgreSQL ayega)

engine = create_engine(DATABASE_URL, echo=True)

def create_db_and_tables():
    SQLModel.metadata.create_all(engine)
