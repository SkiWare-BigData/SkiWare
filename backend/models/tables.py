from sqlalchemy import JSON, Column, Date, DateTime, Float, Integer, String

from backend.database import Base


class UserTable(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True)
    name = Column(String(100), nullable=False)
    email = Column(String(254), nullable=False, unique=True)
    preferred_sport = Column(String(20), nullable=False)  # "Skier" or "Snowboarder"
    skill_level = Column(String(20), nullable=False)
    equipment = Column(JSON, nullable=False)  # list[str] — each entry is a full equipment description (brand, model, length, width, etc.)
    preferred_terrain = Column(String(20), nullable=False)
    skier_type = Column(Integer, nullable=True) #either Type 1 2 3
    birthday = Column(Date, nullable=True)
    weight_lbs = Column(Float, nullable=True)
    height_in = Column(Float, nullable=True)
    boot_sole_length_mm = Column(Integer, nullable=True)
    din = Column(Float, nullable=False)
    password_hash = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), nullable=False)
    updated_at = Column(DateTime(timezone=True), nullable=False)
