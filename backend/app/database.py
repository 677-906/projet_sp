from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

POSTGRES_USER = os.getenv("sp_database_user")
POSTGRES_PASSWORD = os.getenv("RBhRyvmZdJKEeSROR6mo7U3GF04ba8q")
POSTGRES_SERVER = os.getenv("dpg-d34ip4ruibrs73aipjrg-a") 
POSTGRES_PORT = os.getenv("5432")
POSTGRES_DB = os.getenv("sp_database") # Le nom de la base de données que vous avez créée

SQLALCHEMY_DATABASE_URL = f"postgresql://sp_database_user:RBhRyvmZdJKEeSROR6mo7U3GF04ba8q@dpg-d34ip4ruibrs73aipjrg-a:5432/sp_database"
# --- FIN DE LA CONFIGURATION ---

engine = create_engine(SQLALCHEMY_DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()