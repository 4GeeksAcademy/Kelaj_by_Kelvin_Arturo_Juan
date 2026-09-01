from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import String, Integer, Float, Boolean, Text, Date, Time, DateTime, ForeignKey
from datetime import datetime

db = SQLAlchemy()

# -------------------- USER --------------------
class User(db.Model):
    __tablename__ = "user"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    email: Mapped[str] = mapped_column(String(120), unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(20))  # client, professional, dual
    city: Mapped[str] = mapped_column(String(120), nullable=True)
    phone: Mapped[str] = mapped_column(String(50), nullable=True)
    verified: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    provider_profile: Mapped["ProviderProfile"] = relationship(back_populates="user", uselist=False)
    reservations: Mapped[list["Reservation"]] = relationship(back_populates="client")

    def serialize(self):
        return {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "role": self.role,
            "city": self.city,
            "phone": self.phone,
            "verified": self.verified,
            "created_at": self.created_at.isoformat()
        }

# -------------------- PROVIDER PROFILE --------------------
class ProviderProfile(db.Model):
    __tablename__ = "provider_profile"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("user.id"))
    bio: Mapped[str] = mapped_column(Text)
    coverage_area: Mapped[str] = mapped_column(String(255))
    is_home_service: Mapped[bool] = mapped_column(Boolean, default=False)

    user: Mapped["User"] = relationship(back_populates="provider_profile")
    services: Mapped[list["Service"]] = relationship(back_populates="provider")
    schedule: Mapped[list["ProviderSchedule"]] = relationship(back_populates="provider")
    portfolio: Mapped[list["ProviderPortfolio"]] = relationship(back_populates="provider")

    def serialize(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "bio": self.bio,
            "coverage_area": self.coverage_area,
            "is_home_service": self.is_home_service
        }

# -------------------- CATEGORY --------------------
class Category(db.Model):
    __tablename__ = "category"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str] = mapped_column(Text)

    subcategories: Mapped[list["Subcategory"]] = relationship(back_populates="category")

    def serialize(self):
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description
        }

class Subcategory(db.Model):
    __tablename__ = "subcategory"

    id: Mapped[int] = mapped_column(primary_key=True)
    category_id: Mapped[int] = mapped_column(ForeignKey("category.id"))
    name: Mapped[str] = mapped_column(String(100), nullable=False)

    category: Mapped["Category"] = relationship(back_populates="subcategories")

    def serialize(self):
        return {
            "id": self.id,
            "category_id": self.category_id,
            "name": self.name
        }

# -------------------- SERVICE --------------------
class Service(db.Model):
    __tablename__ = "service"

    id: Mapped[int] = mapped_column(primary_key=True)
    provider_id: Mapped[int] = mapped_column(ForeignKey("provider_profile.id"))
    subcategory_id: Mapped[int] = mapped_column(ForeignKey("subcategory.id"))
    title: Mapped[str] = mapped_column(String(120), nullable=False)
    description: Mapped[str] = mapped_column(Text)
    price: Mapped[float] = mapped_column(Float, nullable=False)
    duration_minutes: Mapped[int] = mapped_column(Integer)
    visible: Mapped[bool] = mapped_column(Boolean, default=True)

    provider: Mapped["ProviderProfile"] = relationship(back_populates="services")
    availability: Mapped[list["ServiceAvailability"]] = relationship(back_populates="service")
    reservations: Mapped[list["Reservation"]] = relationship(back_populates="service")

    def serialize(self):
        return {
            "id": self.id,
            "provider_id": self.provider_id,
            "subcategory_id": self.subcategory_id,
            "title": self.title,
            "description": self.description,
            "price": self.price,
            "duration_minutes": self.duration_minutes,
            "visible": self.visible
         }

# -------------------- AVAILABILITY --------------------
class ServiceAvailability(db.Model):
    __tablename__ = "service_availability"

    id: Mapped[int] = mapped_column(primary_key=True)
    service_id: Mapped[int] = mapped_column(ForeignKey("service.id"))
    date: Mapped[Date] = mapped_column(Date)
    start_time: Mapped[Time] = mapped_column(Time)
    end_time: Mapped[Time] = mapped_column(Time)
    is_available: Mapped[bool] = mapped_column(Boolean, default=True)
    price_override: Mapped[float] = mapped_column(Float, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    service: Mapped["Service"] = relationship(back_populates="availability")

    def serialize(self):
        return {
            "id": self.id,
            "service_id": self.service_id,
            "date": self.date.isoformat() if self.date else None,
            "start_time": self.start_time.strftime("%H:%M") if self.start_time else None,
            "end_time": self.end_time.strftime("%H:%M") if self.end_time else None,
            "is_available": self.is_available,
            "price_override": self.price_override,
            "created_at": self.created_at.isoformat()
        } 

# -------------------- RESERVATION --------------------
class Reservation(db.Model):
    __tablename__ = "reservation"

    id: Mapped[int] = mapped_column(primary_key=True)
    client_id: Mapped[int] = mapped_column(ForeignKey("user.id"))
    service_id: Mapped[int] = mapped_column(ForeignKey("service.id"))
    availability_id: Mapped[int] = mapped_column(ForeignKey("service_availability.id"))
    date: Mapped[Date] = mapped_column(Date)
    start_time: Mapped[Time] = mapped_column(Time)
    end_time: Mapped[Time] = mapped_column(Time)
    status: Mapped[str] = mapped_column(String(20), default="pending")
    total_price: Mapped[float] = mapped_column(Float)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    client: Mapped["User"] = relationship(back_populates="reservations")
    service: Mapped["Service"] = relationship(back_populates="reservations")
    transaction: Mapped["Transaction"] = relationship(back_populates="reservation", uselist=False)
    review: Mapped["Review"] = relationship(back_populates="reservation", uselist=False)

    def serialize(self):
        return {
            "id": self.id,
            "client_id": self.client_id,
            "service_id": self.service_id,
            "availability_id": self.availability_id,
            "date": self.date.isoformat() if self.date else None,
            "start_time": self.start_time.strftime("%H:%M") if self.start_time else None,
            "end_time": self.end_time.strftime("%H:%M") if self.end_time else None,
            "status": self.status,
            "total_price": self.total_price,
            "created_at": self.created_at.isoformat()
        }

# -------------------- TRANSACTION --------------------
class Transaction(db.Model):
    __tablename__ = "transaction"

    id: Mapped[int] = mapped_column(primary_key=True)
    reservation_id: Mapped[int] = mapped_column(ForeignKey("reservation.id"))
    amount: Mapped[float] = mapped_column(Float)
    status: Mapped[str] = mapped_column(String(20))
    transaction_date: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    reservation: Mapped["Reservation"] = relationship(back_populates="transaction")

    def serialize(self):
        return {
            "id": self.id,
            "reservation_id": self.reservation_id,
            "amount": self.amount,
            "status": self.status,
            "transaction_date": self.transaction_date.isoformat()
        }

# -------------------- REVIEW --------------------
class Review(db.Model):
    __tablename__ = "review"

    id: Mapped[int] = mapped_column(primary_key=True)
    reservation_id: Mapped[int] = mapped_column(ForeignKey("reservation.id"))
    rating: Mapped[int] = mapped_column(Integer)
    comment: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    reservation: Mapped["Reservation"] = relationship(back_populates="review")

    def serialize(self):
        return {
            "id": self.id,
            "reservation_id": self.reservation_id,
            "rating": self.rating,
            "comment": self.comment,
            "created_at": self.created_at.isoformat()
        }

# -------------------- PORTFOLIO --------------------
class ProviderPortfolio(db.Model):
    __tablename__ = "provider_portfolio"

    id: Mapped[int] = mapped_column(primary_key=True)
    provider_id: Mapped[int] = mapped_column(ForeignKey("provider_profile.id"))
    image_url: Mapped[str] = mapped_column(String(255))
    description: Mapped[str] = mapped_column(Text)
    uploaded_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    provider: Mapped["ProviderProfile"] = relationship(back_populates="portfolio")

    def serialize(self):
        return {
            "id": self.id,
            "provider_id": self.provider_id,
            "image_url": self.image_url,
            "description": self.description,
            "uploaded_at": self.uploaded_at.isoformat()
        }

# -------------------- SCHEDULE --------------------
class ProviderSchedule(db.Model):
    __tablename__ = "provider_schedule"

    id: Mapped[int] = mapped_column(primary_key=True)
    provider_id: Mapped[int] = mapped_column(ForeignKey("provider_profile.id"))
    day_of_week: Mapped[str] = mapped_column(String(10))
    start_time: Mapped[Time] = mapped_column(Time)
    end_time: Mapped[Time] = mapped_column(Time)

    provider: Mapped["ProviderProfile"] = relationship(back_populates="schedule")

    def serialize(self):
        return {
            "id": self.id,
            "provider_id": self.provider_id,
            "day_of_week": self.day_of_week,
            "start_time": self.start_time.strftime("%H:%M") if self.start_time else None,
            "end_time": self.end_time.strftime("%H:%M") if self.end_time else None
        }

