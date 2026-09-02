from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import String, Boolean, Column, Table, ForeignKey, Text, Numeric, Date, Time, Integer, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship

db = SQLAlchemy()

followers_association = Table(
    'followers_association',
    db.metadata,
    Column('follower_id', Integer, ForeignKey('users.id'), primary_key=True),
    Column('followed_id', Integer, ForeignKey('users.id'), primary_key=True)
)

payment_methods_association = Table(
    'provider_payment_methods',
    db.metadata,
    Column('provider_id', Integer, ForeignKey('provider_profile.id'), primary_key=True),
    Column('payment_method_id', Integer, ForeignKey('payment_methods.id'), primary_key=True)
)


class User(db.Model):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(120), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(60), nullable=False)
    last_name: Mapped[str] = mapped_column(String(60), nullable=False)
    cover_image: Mapped[str] = mapped_column(String(255), nullable=True)
    profile_image: Mapped[str] = mapped_column(String(255), nullable=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean(), nullable=False, default=True)
    location: Mapped[str] = mapped_column(String(255), nullable=True)
    date_created: Mapped[DateTime] = mapped_column(DateTime, default=db.func.now())

    followers: Mapped[list["User"]] = relationship(
        secondary=followers_association,
        primaryjoin="User.id == followers_association.c.followed_id",
        secondaryjoin="User.id == followers_association.c.follower_id",
        back_populates="following"
    )
    following: Mapped[list["User"]] = relationship(
        secondary=followers_association,
        primaryjoin="User.id == followers_association.c.follower_id",
        secondaryjoin="User.id == followers_association.c.followed_id",
        back_populates="followers"
    )

    provider_profile: Mapped["Provider_Profile"] = relationship(back_populates="user", uselist=False)

    def serialize(self):
        return {
            "id": self.id,
            "email": self.email,
            "name": self.name,
            "last_name": self.last_name,
            "cover_image": self.cover_image,
            "profile_image": self.profile_image,
            "is_active": self.is_active,
            "location": self.location,
            "date_created": self.date_created.isoformat() if self.date_created else None,
            "followers_count": len(self.followers),
            "following_count": len(self.following),
            "provider_profile": self.provider_profile.serialize_basic() if self.provider_profile else None
        }
    def serialize_basic(self):
        return {
            "id": self.id,
            "name": self.name,
            "last_name": self.last_name,
            "profile_image": self.profile_image
        }


class Provider_Profile(db.Model):
    __tablename__ = "provider_profile"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), unique=True)
    role: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=True)
    
    user: Mapped["User"] = relationship(back_populates="provider_profile")
    pay_methods: Mapped[list["PaymentMethod"]] = relationship(secondary=payment_methods_association)
    services: Mapped[list["Service"]] = relationship(back_populates="provider")
    availabilities: Mapped[list["Availability"]] = relationship(back_populates="provider")

    def serialize(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "user_info": self.user.serialize_basic(),
            "ocupation": self.ocupation,
            "description": self.description,
            "pay_methods": [method.serialize() for method in self.pay_methods],
            "services": [service.serialize_basic() for service in self.services]
        }


class PaymentMethod(db.Model):
    __tablename__ = "payment_methods"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(50), nullable=False, unique=True)

    def serialize(self):
        return {
            "id": self.id,
            "name": self.name
        }


class Category(db.Model):
    __tablename__ = "categories"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False, unique=True)
    
    subcategories: Mapped[list["Subcategory"]] = relationship(back_populates="category")

    def serialize(self):
        return {
            "id": self.id,
            "name": self.name,
            "subcategories": [sub.serialize() for sub in self.subcategories]
        }

class Subcategory(db.Model):
    __tablename__ = "subcategories"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    category_id: Mapped[int] = mapped_column(ForeignKey("categories.id"))
    
    category: Mapped["Category"] = relationship(back_populates="subcategories")
    services: Mapped[list["Service"]] = relationship(back_populates="subcategory")

    def serialize(self):
        return {
            "id": self.id,
            "name": self.name,
            "category_name": self.category.name if self.category else None
        }
    

class Service(db.Model):
    __tablename__ = "services"
    id: Mapped[int] = mapped_column(primary_key=True)
    provider_id: Mapped[int] = mapped_column(ForeignKey("provider_profile.id"))
    subcategory_id: Mapped[int] = mapped_column(ForeignKey("subcategories.id"))
    title: Mapped[str] = mapped_column(String(150), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    price: Mapped[float] = mapped_column(Numeric(10, 2), nullable=False)
    estimated_duration: Mapped[int] = mapped_column(Integer, nullable=True)
    
    provider: Mapped["Provider_Profile"] = relationship(back_populates="services")
    subcategory: Mapped["Subcategory"] = relationship(back_populates="services")
    appointments: Mapped[list["Appointment"]] = relationship(back_populates="service")
    media: Mapped[list["Media"]] = relationship(back_populates="service")

    def serialize(self):
        return {
            "id": self.id,
            "provider": self.provider.serialize_basic(),
            "subcategory": self.subcategory.serialize(),
            "title": self.title,
            "description": self.description,
            "price": float(self.price),
            "estimated_duration": self.estimated_duration,
            "media": [m.serialize() for m in self.media],
            "reviews_data": self.get_reviews_summary()
        }
    def serialize_basic(self):
        return {
            "id": self.id,
            "title": self.title,
            "price": float(self.price),
            "estimated_duration": self.estimated_duration
        }
    
    def get_reviews_summary(self):
        completed_appointments = [app for app in self.appointments if app.review]
        total_reviews = len(completed_appointments)
        
        if total_reviews == 0:
            return {"average_rating": 0, "total_reviews": 0}
            
        sum_ratings = sum([app.review.rating for app in completed_appointments])
        return {
            "average_rating": round(sum_ratings / total_reviews, 1),
            "total_reviews": total_reviews
        }


class Availability(db.Model):
    __tablename__ = "availabilities"
    id: Mapped[int] = mapped_column(primary_key=True)
    provider_id: Mapped[int] = mapped_column(ForeignKey("provider_profile.id"))
    day_of_week: Mapped[int] = mapped_column(Integer, nullable=False)
    start_time: Mapped[Time] = mapped_column(Time, nullable=False)
    end_time: Mapped[Time] = mapped_column(Time, nullable=False)
    
    provider: Mapped["Provider_Profile"] = relationship(back_populates="availabilities")

    def serialize(self):
        return {
            "id": self.id,
            "day_of_week": self.day_of_week,
            "start_time": self.start_time.strftime("%H:%M") if self.start_time else None,
            "end_time": self.end_time.strftime("%H:%M") if self.end_time else None
        }

class Appointment(db.Model):
    __tablename__ = "appointments"
    id: Mapped[int] = mapped_column(primary_key=True)
    client_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    service_id: Mapped[int] = mapped_column(ForeignKey("services.id"))
    date_time: Mapped[DateTime] = mapped_column(DateTime, nullable=False)
    status: Mapped[str] = mapped_column(String(20), default="pending")
    
    client: Mapped["User"] = relationship(back_populates="appointments")
    service: Mapped["Service"] = relationship(back_populates="appointments")
    
    review: Mapped["Review"] = relationship(back_populates="appointment", uselist=False)

    def serialize(self):
        return {
            "id": self.id,
            "client": self.client.serialize_basic(),
            "service": self.service.serialize_basic(),
            "date_time": self.date_time.isoformat() if self.date_time else None,
            "status": self.status,
            "review": self.review.serialize() if self.review else None
        }
    

class Review(db.Model):
    __tablename__ = "reviews"
    id: Mapped[int] = mapped_column(primary_key=True)
    appointment_id: Mapped[int] = mapped_column(ForeignKey("appointments.id"), unique=True)
    rating: Mapped[int] = mapped_column(Integer, nullable=False)
    comment: Mapped[str] = mapped_column(Text, nullable=True)
    
    appointment: Mapped["Appointment"] = relationship(back_populates="review")
    media: Mapped[list["Media"]] = relationship(back_populates="review")

    def serialize(self):
        return {
            "id": self.id,
            "rating": self.rating,
            "comment": self.comment,
            "client_name": self.appointment.client.name if self.appointment else None, 
            "media": [m.serialize() for m in self.media]
        }


class Media(db.Model):
    __tablename__ = "media"
    id: Mapped[int] = mapped_column(primary_key=True)
    url: Mapped[str] = mapped_column(String(255), nullable=False)
    
    service_id: Mapped[int] = mapped_column(ForeignKey("services.id"), nullable=True)
    review_id: Mapped[int] = mapped_column(ForeignKey("reviews.id"), nullable=True)
    
    service: Mapped["Service"] = relationship(back_populates="media")
    review: Mapped["Review"] = relationship(back_populates="media")

    def serialize(self):
        return {
            "id": self.id,
            "url": self.url,
            "type": "service" if self.service_id else "review" if self.review_id else "unknown"
        }