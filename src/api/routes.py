from flask import Blueprint, request, jsonify
from api.models import db, User, ProviderProfile, ProviderSchedule, ProviderPortfolio
from api.models import Service, ServiceAvailability, Reservation, Transaction, Review

api = Blueprint('api', __name__)

# ============================================================
# 🔹 AUTH
# ============================================================

@api.route('/auth/register', methods=['POST'])
def register():
    data = request.get_json()

    user = User(
        name=data["name"],
        email=data["email"],
        password_hash=data["password"],
        role=data.get("role", "client"),
        city=data.get("city"),
        phone=data.get("phone")
    )

    db.session.add(user)
    db.session.commit()

    return jsonify({"msg": "Usuario registrado", "id": user.id}), 201


@api.route('/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    user = User.query.filter_by(email=data["email"]).first()

    if not user:
        return jsonify({"error": "Usuario no encontrado"}), 404

    return jsonify({"msg": "Login correcto", "user": user.serialize()})


@api.route('/auth/me', methods=['GET'])
def get_me():
    user_id = request.headers.get("user_id")
    user = User.query.get(user_id)
    return jsonify(user.serialize())


# ============================================================
# 🔹 USER
# ============================================================

@api.route('/user/me', methods=['GET'])
def get_user():
    user_id = request.headers.get("user_id")
    user = User.query.get(user_id)
    return jsonify(user.serialize())


@api.route('/user/me', methods=['PUT'])
def update_user():
    user_id = request.headers.get("user_id")
    user = User.query.get(user_id)
    data = request.get_json()

    user.name = data.get("name", user.name)
    user.city = data.get("city", user.city)
    user.phone = data.get("phone", user.phone)

    db.session.commit()
    return jsonify({"msg": "Usuario actualizado"})


@api.route('/user/password', methods=['PUT'])
def update_password():
    user_id = request.headers.get("user_id")
    user = User.query.get(user_id)
    data = request.get_json()

    user.password_hash = data["new_password"]
    db.session.commit()

    return jsonify({"msg": "Contraseña actualizada"})


@api.route('/user/delete', methods=['DELETE'])
def delete_user():
    user_id = request.headers.get("user_id")
    user = User.query.get(user_id)

    db.session.delete(user)
    db.session.commit()

    return jsonify({"msg": "Cuenta eliminada"})


# ============================================================
# 🔹 PROVIDER PROFILE
# ============================================================

@api.route('/provider', methods=['POST'])
def create_provider_profile():
    data = request.get_json()

    profile = ProviderProfile(
        user_id=data["user_id"],
        bio=data.get("bio"),
        coverage_area=data.get("coverage_area"),
        is_home_service=data.get("is_home_service", False)
    )

    db.session.add(profile)
    db.session.commit()

    return jsonify({"msg": "Perfil profesional creado", "id": profile.id})


@api.route('/provider/<int:id>', methods=['GET'])
def get_provider_profile(id):
    profile = ProviderProfile.query.get(id)
    return jsonify(profile.serialize())


@api.route('/provider/<int:id>', methods=['PUT'])
def update_provider_profile(id):
    profile = ProviderProfile.query.get(id)
    data = request.get_json()

    profile.bio = data.get("bio", profile.bio)
    profile.coverage_area = data.get("coverage_area", profile.coverage_area)
    profile.is_home_service = data.get("is_home_service", profile.is_home_service)

    db.session.commit()
    return jsonify({"msg": "Perfil profesional actualizado"})


# ============================================================
# 🔹 PROVIDER PORTFOLIO
# ============================================================

@api.route('/provider/<int:id>/portfolio', methods=['GET'])
def get_portfolio(id):
    images = ProviderPortfolio.query.filter_by(provider_id=id).all()
    return jsonify([img.serialize() for img in images])


@api.route('/provider/<int:id>/portfolio', methods=['POST'])
def add_portfolio_image(id):
    data = request.get_json()

    image = ProviderPortfolio(
        provider_id=id,
        image_url=data["image_url"],
        description=data.get("description")
    )

    db.session.add(image)
    db.session.commit()

    return jsonify({"msg": "Imagen añadida"})


@api.route('/provider/<int:id>/portfolio/<int:image_id>', methods=['DELETE'])
def delete_portfolio_image(id, image_id):
    image = ProviderPortfolio.query.get(image_id)
    db.session.delete(image)
    db.session.commit()

    return jsonify({"msg": "Imagen eliminada"})


# ============================================================
# 🔹 PROVIDER SCHEDULE
# ============================================================

@api.route('/provider/<int:id>/schedule', methods=['GET'])
def get_schedule(id):
    schedule = ProviderSchedule.query.filter_by(provider_id=id).all()
    return jsonify([s.serialize() for s in schedule])


@api.route('/provider/<int:id>/schedule', methods=['POST'])
def create_schedule(id):
    data = request.get_json()

    slot = ProviderSchedule(
        provider_id=id,
        day_of_week=data["day_of_week"],
        start_time=data["start_time"],
        end_time=data["end_time"]
    )

    db.session.add(slot)
    db.session.commit()

    return jsonify({"msg": "Horario añadido"})


@api.route('/provider/<int:id>/schedule/<string:day>', methods=['PUT'])
def update_schedule(id, day):
    slot = ProviderSchedule.query.filter_by(provider_id=id, day_of_week=day).first()
    data = request.get_json()

    slot.start_time = data.get("start_time", slot.start_time)
    slot.end_time = data.get("end_time", slot.end_time)

    db.session.commit()
    return jsonify({"msg": "Horario actualizado"})


@api.route('/provider/<int:id>/schedule/<string:day>', methods=['DELETE'])
def delete_schedule(id, day):
    slot = ProviderSchedule.query.filter_by(provider_id=id, day_of_week=day).first()
    db.session.delete(slot)
    db.session.commit()

    return jsonify({"msg": "Horario eliminado"})


# ============================================================
# 🔹 SERVICES
# ============================================================

@api.route('/services', methods=['GET'])
def get_services():
    services = Service.query.all()
    return jsonify([s.serialize() for s in services])


@api.route('/services/<int:id>', methods=['GET'])
def get_service(id):
    service = Service.query.get(id)
    return jsonify(service.serialize())


@api.route('/services', methods=['POST'])
def create_service():
    data = request.get_json()

    service = Service(
        provider_id=data["provider_id"],
        subcategory_id=data["subcategory_id"],
        title=data["title"],
        description=data["description"],
        price=data["price"],
        duration_minutes=data["duration_minutes"],
        visible=True
    )

    db.session.add(service)
    db.session.commit()

    return jsonify({"msg": "Servicio creado"})


@api.route('/services/<int:id>', methods=['PUT'])
def update_service(id):
    service = Service.query.get(id)
    data = request.get_json()

    service.title = data.get("title", service.title)
    service.description = data.get("description", service.description)
    service.price = data.get("price", service.price)
    service.duration_minutes = data.get("duration_minutes", service.duration_minutes)
    service.visible = data.get("visible", service.visible)

    db.session.commit()
    return jsonify({"msg": "Servicio actualizado"})


@api.route('/services/<int:id>', methods=['DELETE'])
def delete_service(id):
    service = Service.query.get(id)
    db.session.delete(service)
    db.session.commit()

    return jsonify({"msg": "Servicio eliminado"})


@api.route('/provider/<int:id>/services', methods=['GET'])
def get_services_by_provider(id):
    services = Service.query.filter_by(provider_id=id).all()
    return jsonify([s.serialize() for s in services])


# ============================================================
# 🔹 SERVICE AVAILABILITY
# ============================================================

@api.route('/services/<int:id>/availability', methods=['GET'])
def get_service_availability(id):
    slots = ServiceAvailability.query.filter_by(service_id=id).all()
    return jsonify([s.serialize() for s in slots])


@api.route('/services/<int:id>/availability', methods=['POST'])
def create_service_availability(id):
    data = request.get_json()

    slot = ServiceAvailability(
        service_id=id,
        date=data["date"],
        start_time=data["start_time"],
        end_time=data["end_time"],
        is_available=True
    )

    db.session.add(slot)
    db.session.commit()

    return jsonify({"msg": "Disponibilidad creada"})


@api.route('/availability/<int:id>', methods=['PUT'])
def update_availability(id):
    slot = ServiceAvailability.query.get(id)
    data = request.get_json()

    slot.date = data.get("date", slot.date)
    slot.start_time = data.get("start_time", slot.start_time)
    slot.end_time = data.get("end_time", slot.end_time)
    slot.is_available = data.get("is_available", slot.is_available)

    db.session.commit()
    return jsonify({"msg": "Disponibilidad actualizada"})


@api.route('/availability/<int:id>', methods=['DELETE'])
def delete_availability(id):
    slot = ServiceAvailability.query.get(id)
    db.session.delete(slot)
    db.session.commit()

    return jsonify({"msg": "Disponibilidad eliminada"})


# ============================================================
# 🔹 RESERVATIONS
# ============================================================

@api.route('/reservations', methods=['POST'])
def create_reservation():
    data = request.get_json()

    reservation = Reservation(
        client_id=data["client_id"],
        service_id=data["service_id"],
        availability_id=data["availability_id"],
        date=data["date"],
        start_time=data["start_time"],
        end_time=data["end_time"],
        total_price=data["total_price"],
        status="pending"
    )

    db.session.add(reservation)
    db.session.commit()

    return jsonify({"msg": "Reserva creada", "id": reservation.id})


@api.route('/reservations/<int:id>', methods=['GET'])
def get_reservation(id):
    reservation = Reservation.query.get(id)
    return jsonify(reservation.serialize())


@api.route('/reservations/<int:id>', methods=['PUT'])
def update_reservation(id):
    reservation = Reservation.query.get(id)
    data = request.get_json()

    reservation.status = data.get("status", reservation.status)

    db.session.commit()
    return jsonify({"msg": "Reserva actualizada"})


@api.route('/user/<int:id>/reservations', methods=['GET'])
def get_reservations_by_user(id):
    reservations = Reservation.query.filter_by(client_id=id).all()
    return jsonify([r.serialize() for r in reservations])


@api.route('/provider/<int:id>/reservations', methods=['GET'])
def get_reservations_by_provider(id):
    reservations = Reservation.query.filter_by(professional_id=id).all()
    return jsonify([r.serialize() for r in reservations])


# ============================================================
# 🔹 TRANSACTIONS
# ============================================================

@api.route('/transactions', methods=['POST'])
def create_transaction():
    data = request.get_json()

    tx = Transaction(
        reservation_id=data["reservation_id"],
        amount=data["amount"],
        status="pending"
    )

    db.session.add(tx)
    db.session.commit()

    return jsonify({"msg": "Transacción creada"})


@api.route('/transactions/<int:id>', methods=['GET'])
def get_transaction(id):
    tx = Transaction.query.get(id)
    return jsonify(tx.serialize())


@api.route('/provider/<int:id>/transactions', methods=['GET'])
def get_transactions_by_provider(id):
    txs = Transaction.query.join(Reservation).filter(Reservation.professional_id == id).all()
    return jsonify([t.serialize() for t in txs])


# ============================================================
# 🔹 REVIEWS
# ============================================================

@api.route('/reviews', methods=['POST'])
def create_review():
    data = request.get_json()

    review = Review(
        reservation_id=data["reservation_id"],
        rating=data["rating"],
        comment=data.get("comment")
    )

    db.session.add(review)
    db.session.commit()

    return jsonify({"msg": "Reseña creada"})


@api.route('/reviews/provider/<int:id>', methods=['GET'])
def get_reviews_for_provider(id):
    reviews = Review.query.join(Reservation).filter(Reservation.professional_id == id).all()
    return jsonify([r.serialize() for r in reviews])


@api.route('/reviews/reservation/<int:id>', methods=['GET'])
def get_review_for_reservation(id):
    review = Review.query.filter_by(reservation_id=id).first()
    return jsonify(review.serialize())