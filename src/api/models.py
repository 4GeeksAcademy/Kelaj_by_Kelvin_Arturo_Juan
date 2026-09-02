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

class User(db.Model):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(120), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(60), nullable=False)
    last_name: Mapped[str] = mapped_column(String(60), nullable=False)
    cover_image: Mapped[str] = mapped_column(String(255), nullable=True)
    profile_image: Mapped[str] = mapped_column(String(255), nullable=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean(), nullable=False)
    location: Mapped[str] = mapped_column(String(255), nullable=True)
    date_created: Mapped[DateTime] = mapped_column(DateTime, default=DateTime.utcnow)

    followers: Mapped[list["User"]] = relationship(
        secondary=followers_association,
        primaryjoin="User.id == followers_association.c.followed_id",
        secondaryjoin="User.id == followers_association.c.follower_id",
        back_populates="following"
    )

    # Los usuarios a los que YO sigo
    following: Mapped[list["User"]] = relationship(
        secondary=followers_association,
        primaryjoin="User.id == followers_association.c.follower_id",
        secondaryjoin="User.id == followers_association.c.followed_id",
        back_populates="followers"
    )

    reviews: Mapped[list[Review]] = mapped_column(ForeignKey(reviews))
    services: Mapped[list[Service]] = mapped_column(ForeignKey(services))


    def serialize(self):
        return {
            "id": self.id,
            "email": self.email,
            "name": self.name,
            "last_name": self.last_name,
            "cover_image": self.cover_image,
            "profile_image": self.profile_image,
            "reviews": [review.serialize() for review in self.reviews],
            "followers_count": len(self.followers),
            "following_count": len(self.following),
            "date_created": self.date_created.isoformat() if self.date_created else None,
            "location": self.location
            # do not serialize the password, its a security breach
        }


class Provider_Profile(db.model):
    __tablename__ = "provider_profile"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey="User")
    ocupation: Mapped[Text] = mapped_column(Text, nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=True)
    pay_methods: Mapped[list[pay_methods]] = mapped_column(ForeignKey="pay_methods")

    def serialize(self):
        return{
        "description": self.description,
        "ocupation": self.ocupation,
        "description": self.description,
        "pay_methods": serialize(self.pay_methods)
        }
