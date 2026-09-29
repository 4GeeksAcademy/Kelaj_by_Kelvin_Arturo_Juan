"""
This module takes care of starting the API Server, Loading the DB and Adding the endpoints
"""
import cloudinary
import cloudinary.uploader
from flask import Flask, request, jsonify, url_for, Blueprint
from flask_socketio import SocketIO, emit, join_room
from sqlalchemy import func
from api.models import db, User, UserRole, Media, Service, Transaction, Appointment, Message, Category, Subcategory, ProviderProfile, Availability, ProviderPortfolio, PaymentMethod, Review, Notification
from api.utils import generate_sitemap, APIException
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
import stripe
import json
import os
from datetime import datetime, timedelta

cloudinary.config(
    cloud_name=os.getenv('CLOUDINARY_CLOUD_NAME'),
    api_key=os.getenv('CLOUDINARY_API_KEY'),
    api_secret=os.getenv('CLOUDINARY_API_SECRET'),
    secure=True
)

api = Blueprint('api', __name__)

# Configuración Stripe
stripe.api_key = os.getenv("STRIPE_SECRET_KEY")


@api.route('/register', methods=['POST'])
def register():
    body = request.get_json()

    if body is None:
        return jsonify({"message": "Debes enviar un body en formato JSON"}), 400

    name = body.get("name")
    email = body.get("email")
    password = body.get("password")
    role = body.get("role", "buyer")  # Default a buyer
    city = body.get("city")
    phone = body.get("phone")

    if not name or not email or not password:
        return jsonify({"message": "nombre, email, password son requeridos"}), 400

    if role not in ["buyer", "provider"]:
        return jsonify({"message": "role debe ser 'buyer' o 'provider'"}), 400

    existing_user = User.query.filter_by(email=email).first()
    if existing_user is not None:
        return jsonify({"message": "el email ya está en uso"}), 400

    new_user = User(
        name=name,
        email=email,
        password_hash=generate_password_hash(password),
        is_provider=(role == "provider"),
        role=role,
        city=city,
        phone=phone
    )

    db.session.add(new_user)
    db.session.commit()

    if role == "provider":
        provider_profile = ProviderProfile(user_id=new_user.id)
        db.session.add(provider_profile)
        db.session.commit()

    return jsonify({"message": "usuario creado exitosamente", "user": new_user.serialize()}), 201


@api.route('/users/<int:user_id>/profile_image', methods=['POST'])
@jwt_required()
def upload_profile_image(user_id):
    current_user_id = get_jwt_identity()

    if int(current_user_id) != user_id:
        return jsonify({"error": "No autorizado para cambiar esta imagen"}), 403

    if 'file' not in request.files:
        return jsonify({"error": "No se envió ninguna imagen"}), 400

    file = request.files['file']

    if file.filename == '':
        return jsonify({"error": "Nombre de archivo vacío"}), 400

    try:
        upload_result = cloudinary.uploader.upload(
            file, folder="kelaj_profiles")

        image_url = upload_result.get('secure_url')

        user = User.query.get(user_id)
        user.profile_image = image_url
        db.session.commit()

        return jsonify({
            "message": "Imagen de perfil actualizada",
            "profile_image": image_url
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Error subiendo la imagen: {str(e)}"}), 500


@api.route('/users/<int:user_id>', methods=['PUT'])
@jwt_required()
def update_user_profile(user_id):
    current_user_id = get_jwt_identity()

    if int(current_user_id) != user_id:
        return jsonify({"error": "No autorizado para editar este perfil"}), 403

    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "Usuario no encontrado"}), 404

    data = request.get_json()

    if not data:
        return jsonify({"error": "No se enviaron datos"}), 400

    if "name" in data:
        user.name = data["name"]
    if "last_name" in data:
        user.last_name = data["last_name"]
    if "phone" in data:
        user.phone = data["phone"]
    if "city" in data:
        user.city = data["city"]

    try:
        db.session.commit()
        return jsonify({
            "message": "Perfil actualizado exitosamente",
            "user": user.serialize()
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Error interno: {str(e)}"}), 500


@api.route('/users/<int:user_id>', methods=['DELETE'])
@jwt_required()
def delete_user(user_id):
    current_user_id = get_jwt_identity()

    if int(current_user_id) != user_id:
        return jsonify({"error": "No autorizado para eliminar este perfil"}), 403

    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "Usuario no encontrado"}), 404

    # 1. Bloquear si tiene citas pendientes como cliente
    pending_as_client = Appointment.query.filter(
        Appointment.client_id == user.id,
        Appointment.status.in_(["pending", "upcoming", "in_progress"])
    ).first()

    if pending_as_client:
        return jsonify({
            "error": "No puedes eliminar tu cuenta porque tienes citas reservadas pendientes o en curso."
        }), 400

    # 2. Bloquear si es proveedor y tiene citas pendientes por atender
    if user.providerprofile:
        pending_as_provider = Appointment.query.join(Service).filter(
            Service.provider_id == user.providerprofile.id,
            Appointment.status.in_(["pending", "upcoming", "in_progress"])
        ).first()

        if pending_as_provider:
            return jsonify({
                "error": "No puedes eliminar tu cuenta porque tienes servicios con citas pendientes de atender."
            }), 400

    try:
        from api.models import Media, Message, ProviderSchedule

        # Limpiar seguidores y mensajes de chat
        user.followers.clear()
        user.following.clear()
        Message.query.filter(
            db.or_(Message.sender_id == user.id,
                   Message.receiver_id == user.id)
        ).delete(synchronize_session=False)

        # Limpiar historial de citas pasadas como cliente (y sus reseñas/pagos)
        client_appointments = Appointment.query.filter_by(
            client_id=user.id).all()
        for app in client_appointments:
            if app.review:
                Media.query.filter_by(review_id=app.review.id).delete()
                db.session.delete(app.review)
            if app.transaction:
                db.session.delete(app.transaction)
            db.session.delete(app)

        # Si es proveedor, limpiar primero las dependencias de sus servicios
        if user.providerprofile:
            provider_id = user.providerprofile.id

            provider_services = Service.query.filter_by(
                provider_id=provider_id).all()
            for srv in provider_services:
                srv_appointments = Appointment.query.filter_by(
                    service_id=srv.id).all()
                for app in srv_appointments:
                    if app.review:
                        Media.query.filter_by(review_id=app.review.id).delete()
                        db.session.delete(app.review)
                    if app.transaction:
                        db.session.delete(app.transaction)
                    db.session.delete(app)

                Media.query.filter_by(service_id=srv.id).delete()
                db.session.delete(srv)

            Availability.query.filter_by(provider_id=provider_id).delete()
            ProviderSchedule.query.filter_by(provider_id=provider_id).delete()
            ProviderPortfolio.query.filter_by(provider_id=provider_id).delete()

            db.session.delete(user.providerprofile)

        # Borrar roles, métodos de pago y transacciones restantes
        UserRole.query.filter_by(user_id=user.id).delete()
        PaymentMethod.query.filter_by(user_id=user.id).delete()
        Transaction.query.filter_by(user_id=user.id).delete()

        db.session.delete(user)
        db.session.commit()

        return jsonify({"message": "Cuenta eliminada exitosamente"}), 200

    except Exception as e:
        db.session.rollback()  # Si algo sale mal, revertimos todo para no corromper la BD
        print(f"Error borrando usuario: {str(e)}")
        return jsonify({"error": "Error interno al eliminar la cuenta"}), 500

# ============================
# OBTENER LISTA DE SEGUIDOS DE UN USUARIO
# ============================


@api.route('/users/<int:user_id>/following', methods=['GET'])
def get_user_following(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "Usuario no encontrado"}), 404

    return jsonify([u.serialize_basic() for u in user.following]), 200


@api.route('/login', methods=['POST'])
def login():
    body = request.get_json()

    if body is None:
        return jsonify({"message": "Debes enviar un body en formato JSON"}), 400

    email = body.get("email")
    password = body.get("password")

    if not email or not password:
        return jsonify({"message": "email y password son requeridos"}), 400

    user = User.query.filter_by(email=email).first()

    if user is None or not check_password_hash(user.password_hash, password):
        return jsonify({"message": "credenciales inválidas"}), 401

    roles = ["buyer", "provider"] if user.is_provider else ["buyer"]

    access_token = create_access_token(identity=str(
        user.id), additional_claims={"roles": roles})

    return jsonify({"message": "login exitoso", "token": access_token, "user": user.serialize()}), 200


# Cambio de contraseña
@api.route('/users/change-password', methods=['PUT'])
@jwt_required()
def change_password():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)

    if not user:
        return jsonify({"error": "Usuario no encontrado"}), 404

    data = request.get_json()
    current_password = data.get("current_password")
    new_password = data.get("new_password")

    if not current_password or not new_password:
        return jsonify({"error": "Todos los campos son obligatorios"}), 400

    if not check_password_hash(user.password_hash, current_password):
        return jsonify({"error": "La contraseña actual es incorrecta"}), 401

    user.password_hash = generate_password_hash(new_password)
    db.session.commit()

    return jsonify({"message": "Contraseña actualizada exitosamente"}), 200


@api.route('/services/featured', methods=['GET'])
def featured_services():
    services = Service.query.filter_by(visible=True).order_by(
        Service.id.desc()).limit(6).all()
    return jsonify([s.serialize() for s in services]), 200


@api.route('/services/<int:service_id>', methods=['GET'])
def get_service(service_id):
    service = Service.query.get(service_id)

    if not service:
        return jsonify({"error": "Servicio no encontrado"}), 404

    return jsonify(service.serialize()), 200


# ============================
# OBTENER DISPONIBILIDAD CON BLOQUES CALCULADOS
# ============================
@api.route('/services/<int:service_id>/availability', methods=['GET'])
def get_service_availability(service_id):
    service = Service.query.get(service_id)

    if not service:
        return jsonify({"error": "Servicio no encontrado"}), 404

    availabilities = Availability.query.filter_by(
        provider_id=service.provider_id
    ).order_by(
        Availability.day_of_week,
        Availability.start_time
    ).all()

    today = datetime.now().date()
    result = []
    slot_id_counter = 1

    # Usamos la duración estimada del servicio (o 60 min por defecto)
    duration_minutes = service.estimated_duration if service.estimated_duration else 60

    for availability in availabilities:
        # Python: lunes=0, martes=1, ..., domingo=6
        days_ahead = (availability.day_of_week - today.weekday()) % 7
        date = today + timedelta(days=days_ahead)

        # Generar bloques individuales de tiempo entre start_time y end_time
        current_time = datetime.combine(date, availability.start_time)
        end_datetime = datetime.combine(date, availability.end_time)

        while current_time + timedelta(minutes=duration_minutes) <= end_datetime:
            result.append({
                "id": slot_id_counter,
                "day_of_week": availability.day_of_week,
                "date": date.isoformat(),
                "start_time": current_time.strftime("%H:%M"),
                "end_time": (current_time + timedelta(minutes=duration_minutes)).strftime("%H:%M")
            })
            slot_id_counter += 1
            current_time += timedelta(minutes=duration_minutes)

    return jsonify(result), 200

# ============================
# CREAR CITA (CON PROTECCIÓN DE CONDICIÓN DE CARRERA)
# ============================


@api.route('/appointments', methods=['POST'])
@jwt_required()
def create_appointment():
    import json
    from datetime import datetime

    current_user_id = int(get_jwt_identity())
    data = request.get_json()

    if not data:
        return jsonify({"error": "Debes enviar datos en formato JSON"}), 400

    service_id = data.get("service_id")
    date_time = data.get("date_time")

    if not service_id:
        return jsonify({"error": "service_id es obligatorio"}), 400

    if not date_time:
        return jsonify({"error": "date_time es obligatorio"}), 400

    # Comprobar que el servicio existe
    service = Service.query.get(service_id)

    if not service:
        return jsonify({"error": "Servicio no encontrado"}), 404

    # Comprobar que el servicio está visible
    if not service.visible:
        return jsonify({"error": "Este servicio no está disponible"}), 400

    try:
        appointment_date = datetime.fromisoformat(
            date_time.replace("Z", "+00:00")
        )
    except ValueError:
        return jsonify({
            "error": "Formato de fecha inválido. Usa formato ISO"
        }), 400

    # ==========================================
    # VALIDACIÓN DE CONDICIÓN DE CARRERA (BLOQUEO)
    # ==========================================
    existing_appointment = Appointment.query.filter_by(
        service_id=service.id,
        date_time=appointment_date
    ).filter(
        Appointment.status != 'cancelled'  # Solo nos importan las citas activas
    ).first()

    if existing_appointment:
        return jsonify({"error": "Lo sentimos, este horario acaba de ser reservado. Por favor, elige otro."}), 409

    # Crear la cita si pasó el filtro
    appointment = Appointment(
        client_id=current_user_id,
        service_id=service.id,
        date_time=appointment_date,
        status="pending"
    )

    try:
        db.session.add(appointment)
        db.session.flush()  # Obtenemos el ID de la cita antes del commit

        # Crear notificación para el proveedor
        client_user = User.query.get(current_user_id)
        provider_user_id = service.provider.user_id if service.provider else None

        if provider_user_id and client_user:
            notif = Notification(
                user_id=provider_user_id,
                actor_id=current_user_id,
                type="appointment_requested",
                message=f"{client_user.name} solicitó una cita para {service.title}.",
                data_json=json.dumps({
                    "appointment_id": appointment.id,
                    "service_id": service.id,
                    "service_title": service.title,
                    "price": float(service.price),
                    "client_id": current_user_id,
                    "client_name": f"{client_user.name} {client_user.last_name or ''}".strip(),
                    "client_phone": client_user.phone,
                    "date_time": appointment.date_time.isoformat(),
                    "status": appointment.status
                })
            )
            db.session.add(notif)

        db.session.commit()

        return jsonify({
            "message": "Cita creada exitosamente",
            "appointment": {
                "id": appointment.id,
                "client_id": appointment.client_id,
                "service_id": appointment.service_id,
                "date_time": appointment.date_time.isoformat(),
                "status": appointment.status
            }
        }), 201

    except Exception as e:
        db.session.rollback()
        print(f"Error creando cita: {str(e)}")
        return jsonify({
            "error": "Error creando la cita"
        }), 500


@api.route('/categories', methods=['GET'])
def get_categories():
    categories = Category.query.all()
    return jsonify([c.serialize() for c in categories]), 200


@api.route('/become-provider', methods=['POST'])
@jwt_required()
def become_provider():

    user_id = int(get_jwt_identity())

    user = User.query.get(user_id)

    if not user:
        return jsonify({
            "error": "Usuario no encontrado"
        }), 404

    if user.is_provider:
        return jsonify({
            "error": "El usuario ya es proveedor"
        }), 400

    data = request.get_json()

    if data is None:
        return jsonify({
            "error": "Debes enviar datos en formato JSON"
        }), 400

    provider_profile = ProviderProfile(
        user_id=user.id,
        phone=data.get("phone"),
        bio=data.get("bio"),
        description=data.get("description"),
        coverage_area=data.get("coverage_area"),
        is_home_service=data.get("is_home_service", False)
    )

    user.is_provider = True

    db.session.add(provider_profile)
    db.session.commit()

    return jsonify({
        "message": "Ahora eres proveedor",
        "user": user.serialize(),
        "provider_profile": provider_profile.serialize()
    }), 201

# ============================
# CREAR SETUP INTENT (GUARDAR TARJETA)
# ============================


@api.route('/stripe/setup-intent', methods=['POST'])
@jwt_required()
def create_setup_intent():
    user_id = int(get_jwt_identity())
    user = User.query.get(user_id)

    if not user:
        return jsonify({"error": "Usuario no encontrado"}), 404

    # 1. Crear o recuperar Customer
    if not user.stripe_customer_id:
        customer = stripe.Customer.create(email=user.email)
        user.stripe_customer_id = customer.id
        db.session.commit()
    else:
        customer = stripe.Customer.retrieve(user.stripe_customer_id)

    # 2. Crear SetupIntent
    setup_intent = stripe.SetupIntent.create(
        customer=customer.id,
        payment_method_types=["card"]
    )

    return jsonify({
        "client_secret": setup_intent.client_secret
    }), 200


# ============================
# GUARDAR MÉTODO DE PAGO
# ============================
@api.route('/payment-methods', methods=['POST'])
@jwt_required()
def add_payment_method():
    user_id = int(get_jwt_identity())
    data = request.get_json()

    required = ["provider", "payment_method_id", "brand", "last_four_digits"]
    if not all(k in data for k in required):
        return jsonify({"error": "Datos incompletos"}), 400

    user = User.query.get(user_id)
    if not user or not user.stripe_customer_id:
        return jsonify({"error": "Cliente Stripe no encontrado"}), 400

    # Asociar PaymentMethod al Customer en Stripe
    stripe.PaymentMethod.attach(
        data["payment_method_id"],
        customer=user.stripe_customer_id
    )

    method = PaymentMethod(
        user_id=user_id,
        provider=data["provider"],
        stripe_payment_method_id=data["payment_method_id"],
        brand=data["brand"],
        last_four_digits=data["last_four_digits"]
    )

    db.session.add(method)
    db.session.commit()

    return jsonify(method.serialize()), 201


# ============================
# LISTAR MÉTODOS DE PAGO
# ============================
@api.route('/payment-methods', methods=['GET'])
@jwt_required()
def get_payment_methods():
    user_id = int(get_jwt_identity())
    methods = PaymentMethod.query.filter_by(user_id=user_id).all()
    return jsonify([m.serialize() for m in methods]), 200

# ============================
# ELIMINAR TARJETA GUARDADA
# ============================


@api.route('/payment-methods/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_payment_method(id):
    user_id = int(get_jwt_identity())

    method = PaymentMethod.query.filter_by(id=id, user_id=user_id).first()
    if not method:
        return jsonify({"error": "Método no encontrado"}), 404

    db.session.delete(method)
    db.session.commit()

    return jsonify({"success": True}), 200

# ============================
# COBRO CON TARJETA NUEVA
# ============================


@api.route('/charge', methods=['POST'])
@jwt_required()
def create_charge():

    user_id = int(get_jwt_identity())
    data = request.get_json()

    required = ["appointment_id", "amount", "payment_method_id"]

    if not all(k in data for k in required):
        return jsonify({"error": "Datos incompletos"}), 400

    appointment = Appointment.query.get(data["appointment_id"])

    if not appointment:
        return jsonify({"error": "Cita no encontrada"}), 404

    user = User.query.get(user_id)

    if not user:
        return jsonify({"error": "Usuario no encontrado"}), 404

    try:

        # ==========================================
        # 1. CREAR CUSTOMER DE STRIPE SI NO EXISTE
        # ==========================================

        if not user.stripe_customer_id:

            customer = stripe.Customer.create(
                email=user.email,
                name=f"{user.name} {user.last_name or ''}".strip()
            )

            user.stripe_customer_id = customer.id
            db.session.commit()

        # ==========================================
        # 2. ASOCIAR PAYMENT METHOD AL CUSTOMER
        # ==========================================

        payment_method_id = data["payment_method_id"]

        stripe.PaymentMethod.attach(
            payment_method_id,
            customer=user.stripe_customer_id
        )

        # ==========================================
        # 3. CREAR PAYMENT INTENT
        # ==========================================

        payment_intent = stripe.PaymentIntent.create(
            amount=int(float(data["amount"]) * 100),
            currency="eur",
            customer=user.stripe_customer_id,
            payment_method=data["payment_method_id"],
            confirm=True,
            automatic_payment_methods={
                "enabled": True,
                "allow_redirects": "never"
            }
        )

        # ==========================================
        # 4. GUARDAR TRANSACCIÓN
        # ==========================================

        transaction = Transaction(
            appointment_id=appointment.id,
            user_id=user_id,
            amount=data["amount"],
            status="paid",
            provider="stripe",
            provider_transaction_id=payment_intent.id
        )

        db.session.add(transaction)
        db.session.commit()

        return jsonify({
            "transaction_id": transaction.id,
            "payment_intent_id": payment_intent.id
        }), 201

    except stripe.error.CardError as e:

        print("STRIPE CARD ERROR:", str(e))

        return jsonify({
            "error": str(e)
        }), 402

    except stripe.error.StripeError as e:

        print("STRIPE ERROR:", str(e))

        return jsonify({
            "error": str(e)
        }), 400

    except Exception as e:

        print("ERROR INTERNO:", repr(e))

        db.session.rollback()

        return jsonify({
            "error": str(e)
        }), 500

# ============================
# COBRO CON TARJETA GUARDADA
# ============================


@api.route('/charge/saved', methods=['POST'])
@jwt_required()
def create_charge_with_saved_method():
    user_id = int(get_jwt_identity())
    data = request.get_json()

    required = ["appointment_id", "amount", "payment_method_id"]
    if not all(k in data for k in required):
        return jsonify({"error": "Datos incompletos"}), 400

    appointment = Appointment.query.get(data["appointment_id"])
    if not appointment:
        return jsonify({"error": "Cita no encontrada"}), 404

    method = PaymentMethod.query.filter_by(
        id=data["payment_method_id"],
        user_id=user_id
    ).first()

    if not method:
        return jsonify({"error": "Método de pago no encontrado"}), 404

    user = User.query.get(user_id)
    if not user.stripe_customer_id:
        return jsonify({"error": "Cliente Stripe no encontrado"}), 400

    try:
        payment_intent = stripe.PaymentIntent.create(
            amount=int(float(data["amount"]) * 100),
            currency="eur",
            customer=user.stripe_customer_id,
            payment_method=method.stripe_payment_method_id,  # <-- Corregido
            payment_method_types=["card"],
            confirm=True
        )

        transaction = Transaction(
            appointment_id=appointment.id,
            user_id=user_id,
            amount=data["amount"],
            status="paid",
            provider="stripe",
            provider_transaction_id=payment_intent.id
        )

        db.session.add(transaction)
        db.session.commit()

        return jsonify({
            "transaction_id": transaction.id,
            "payment_intent_id": payment_intent.id
        }), 201

    except stripe.error.CardError as e:
        return jsonify({"error": str(e)}), 402
    except Exception as e:
        print(e)
        return jsonify({"error": "Error procesando el pago"}), 500


# PANEL PROFESIONAL: ROUTES


@api.route('/provider/summary', methods=['GET'])
@jwt_required()
def provider_summary():
    user_id = int(get_jwt_identity())
    provider = ProviderProfile.query.filter_by(user_id=user_id).first()

    if not provider:
        return jsonify({"error": "No eres proveedor"}), 403

    # Total ganado
    transactions = Transaction.query.join(Appointment).filter(
        Appointment.service.has(provider_id=provider.id),
        Transaction.status == "paid"
    ).all()

    total_earned = sum(t.amount for t in transactions)

    # Ganado este mes
    from datetime import datetime
    now = datetime.now()
    monthly_earned = sum(
        t.amount for t in transactions
        if t.transaction_date.month == now.month and t.transaction_date.year == now.year
    )

    # Citas
    appointments = Appointment.query.join(Service).filter(
        Service.provider_id == provider.id
    ).all()

    summary = {
        "total_earned": float(total_earned),
        "monthly_earned": float(monthly_earned),
        "completed": len([a for a in appointments if a.status == "completed"]),
        "pending": len([a for a in appointments if a.status == "pending"]),
        "upcoming": len([a for a in appointments if a.status == "upcoming"]),
        "in_progress": len([a for a in appointments if a.status == "in_progress"])
    }

    return jsonify(summary), 200


@api.route('/provider/services', methods=['GET'])
@jwt_required()
def provider_services():
    user_id = int(get_jwt_identity())
    provider = ProviderProfile.query.filter_by(user_id=user_id).first()

    if not provider:
        return jsonify({"error": "No eres proveedor"}), 403

    services = Service.query.filter_by(provider_id=provider.id).all()
    return jsonify([s.serialize() for s in services]), 200


@api.route('/provider/services/<int:id>/toggle', methods=['PUT'])
@jwt_required()
def toggle_service(id):
    user_id = int(get_jwt_identity())
    provider = ProviderProfile.query.filter_by(user_id=user_id).first()
    if not provider:
        return jsonify({"error": "No eres proveedor"}), 403

    service = Service.query.filter_by(id=id, provider_id=provider.id).first()
    if not service:
        return jsonify({"error": "Servicio no encontrado"}), 404

    service.visible = not service.visible
    db.session.commit()

    return jsonify(service.serialize()), 200


# para obtener los perfiles publicos:


@api.route('/users/<int:user_id>', methods=['GET'])
def get_user_profile(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "Usuario no encontrado"}), 404

    user_data = user.serialize()

    if user.is_provider and user.providerprofile:
        user_data["providerprofile"] = user.providerprofile.serialize()

    if not user.is_provider:
        user_data["client_appointments"] = [{
            "id": app.id,
            "service_title": app.service.title if app.service else "Servicio Eliminado",
            "provider_name": app.service.provider.user.name if app.service and app.service.provider else "Desconocido",
            "date": app.date_time.strftime("%d/%m/%Y")
        } for app in user.appointments if app.status == "completed"]

        user_data["client_reviews"] = [{
            "id": app.review.id,
            "rating": app.review.rating,
            "comment": app.review.comment,
            "service_title": app.service.title,
            "date": app.review.created_at.strftime("%d/%m/%Y") if app.review.created_at else "Reciente"
        } for app in user.appointments if app.review]

    return jsonify(user_data), 200

# para seguir y ser seguido:


# para seguir y ser seguido:
@api.route('/users/<int:user_id>/follow', methods=['POST', 'DELETE'])
@jwt_required()
def toggle_follow(user_id):
    import json

    current_user_id = get_jwt_identity()

    if int(current_user_id) == user_id:
        return jsonify({"error": "No puedes seguirte a ti mismo"}), 400

    current_user = User.query.get(current_user_id)
    target_user = User.query.get(user_id)

    if not target_user:
        return jsonify({"error": "Usuario a seguir no encontrado"}), 404

    if request.method == 'POST':
        if target_user not in current_user.following:
            current_user.following.append(target_user)

            # Crear notificación de nuevo seguidor
            notif = Notification(
                user_id=target_user.id,
                actor_id=current_user.id,
                type="new_follower",
                message=f"{current_user.name} ha comenzado a seguirte.",
                data_json=json.dumps({
                    "follower_id": current_user.id,
                    "follower_name": f"{current_user.name} {current_user.last_name or ''}".strip()
                })
            )
            db.session.add(notif)
            db.session.commit()
            return jsonify({"message": f"Ahora sigues a {target_user.name}"}), 200
        return jsonify({"message": "Ya sigues a este usuario"}), 400

    if request.method == 'DELETE':
        if target_user in current_user.following:
            current_user.following.remove(target_user)
            db.session.commit()
            return jsonify({"message": f"Dejaste de seguir a {target_user.name}"}), 200
        return jsonify({"message": "No sigues a este usuario"}), 400


# sistema de reviews:
# sistema de reviews:
@api.route('/appointments/<int:appointment_id>/reviews', methods=['POST'])
@jwt_required()
def create_review(appointment_id):
    import json

    current_user_id = int(get_jwt_identity())
    body = request.get_json()

    rating = body.get("rating")
    comment = body.get("comment")

    if not rating or not isinstance(rating, int) or rating < 1 or rating > 5:
        return jsonify({"error": "El rating debe ser un número entre 1 y 5"}), 400

    appointment = Appointment.query.get(appointment_id)

    if not appointment:
        return jsonify({"error": "Cita no encontrada"}), 404

    if int(appointment.client_id) != current_user_id:
        return jsonify({"error": "Solo el cliente de la cita puede dejar una reseña"}), 403

    if appointment.review:
        return jsonify({"error": "Esta cita ya tiene una reseña"}), 400

    try:
        new_review = Review(
            appointment_id=appointment.id,
            rating=rating,
            comment=comment
        )

        db.session.add(new_review)
        db.session.flush()  # Obtenemos el ID y la fecha de creación antes del commit

        # Crear notificación para el proveedor dueño del servicio
        client_user = User.query.get(current_user_id)
        provider_user_id = (
            appointment.service.provider.user_id
            if appointment.service and appointment.service.provider
            else None
        )

        if provider_user_id and client_user:
            service_title = appointment.service.title if appointment.service else "tu servicio"
            notif = Notification(
                user_id=provider_user_id,
                actor_id=current_user_id,
                type="new_review",
                message=f"{client_user.name} dejó una reseña de {rating} ★ en {service_title}.",
                data_json=json.dumps({
                    "review_id": new_review.id,
                    "appointment_id": appointment.id,
                    "service_id": appointment.service_id,
                    "service_title": service_title,
                    "rating": rating,
                    "comment": comment or "Sin comentario adicional.",
                    "client_id": current_user_id,
                    "client_name": f"{client_user.name} {client_user.last_name or ''}".strip(),
                    "provider_user_id": provider_user_id,
                    "created_at": new_review.created_at.isoformat() if new_review.created_at else None
                })
            )
            db.session.add(notif)

        db.session.commit()

        return jsonify({
            "message": "Reseña creada exitosamente",
            "review": new_review.serialize()
        }), 201

    except Exception as e:
        db.session.rollback()
        print(f"Error creando reseña: {str(e)}")
        return jsonify({"error": "Error interno al guardar la reseña"}), 500

# busquedas


@api.route('/search/providers', methods=['GET'])
def search_providers():
    query_text = request.args.get('q', '').lower()
    location = request.args.get('location', '').lower()
    subcategory_id = request.args.get('subcategory_id')

    search = db.session.query(
        User,
        func.coalesce(func.avg(Review.rating), 0).label('avg_rating')
    ).select_from(User)\
     .join(ProviderProfile, User.id == ProviderProfile.user_id)\
     .outerjoin(Service, ProviderProfile.id == Service.provider_id)\
     .outerjoin(Appointment, Service.id == Appointment.service_id)\
     .outerjoin(Review, Appointment.id == Review.appointment_id)\
     .filter(User.is_active == True, User.is_provider == True)

    if query_text:
        search = search.filter(
            db.or_(
                User.name.ilike(f'%{query_text}%'),
                User.last_name.ilike(f'%{query_text}%'),
                Service.title.ilike(f'%{query_text}%')
            )
        )

    if location:
        search = search.filter(
            ProviderProfile.coverage_area.ilike(f'%{location}%'))

    if subcategory_id:
        search = search.filter(Service.subcategory_id == subcategory_id)

    search = search.group_by(User.id)
    search = search.order_by(db.desc('avg_rating'))

    results = search.all()

    response = []
    for user, avg_rating in results:
        user_data = user.serialize()
        user_data['average_rating'] = float(avg_rating)
        response.append(user_data)

    return jsonify(response), 200

# ============================
# SUBIR PUBLICACIÓN A GALERÍA (CLOUDINARY)
# ============================


# ============================
# SUBIR PUBLICACIÓN A GALERÍA (CLOUDINARY)
# ============================
@api.route('/provider/gallery', methods=['POST'])
@jwt_required()
def upload_gallery_media():
    import json

    user_id = int(get_jwt_identity())

    provider = ProviderProfile.query.filter_by(user_id=user_id).first()
    if not provider:
        return jsonify({"error": "No eres proveedor"}), 403

    # Capturamos todos los datos que vienen del modal
    files = request.files.getlist('files')
    title = request.form.get('title', 'Trabajo en galería')
    description = request.form.get('description', '')

    if not files or files[0].filename == '':
        return jsonify({"error": "No se seleccionaron imágenes"}), 400

    try:
        uploaded_urls = []

        # Subimos foto por foto a Cloudinary
        for file in files:
            upload_result = cloudinary.uploader.upload(
                file, folder="kelaj_gallery")
            uploaded_urls.append(upload_result.get('secure_url'))

        # Guardamos TODO como una sola publicación
        new_post = ProviderPortfolio(
            provider_id=provider.id,
            title=title,
            description=description,
            image_urls=json.dumps(uploaded_urls)  # Agrupamos las URLs
        )

        db.session.add(new_post)
        db.session.flush()  # Necesario para que new_post.serialize() tenga el id y fecha

        # Notificar a todos los seguidores del proveedor
        if provider.user and provider.user.followers:
            for follower in provider.user.followers:
                notif = Notification(
                    user_id=follower.id,
                    actor_id=user_id,
                    type="new_media",
                    message=f"{provider.user.name} añadió fotos a su galería: {new_post.title}",
                    data_json=json.dumps({
                        **new_post.serialize(),
                        "provider_user_id": user_id,
                        "provider_name": f"{provider.user.name} {provider.user.last_name or ''}".strip()
                    })
                )
                db.session.add(notif)

        db.session.commit()

        return jsonify({"message": "Publicación subida con éxito"}), 201

    except Exception as e:
        db.session.rollback()
        print("Error subiendo galería a Cloudinary:", str(e))
        return jsonify({"error": "Error interno al subir imágenes"}), 500


# ============================
# EDITAR PUBLICACIÓN DE GALERÍA
# ============================
@api.route('/provider/gallery/<int:post_id>', methods=['PUT'])
@jwt_required()
def edit_gallery_media(post_id):
    user_id = int(get_jwt_identity())

    post = ProviderPortfolio.query.get(post_id)
    if not post or post.provider.user_id != user_id:
        return jsonify({"error": "Publicación no encontrada o no autorizada"}), 404

    data = request.get_json()
    if "title" in data:
        post.title = data["title"]
    if "description" in data:
        post.description = data["description"]

    # NUEVO: Guardamos el nuevo orden de las imágenes
    if "urls" in data:
        import json
        post.image_urls = json.dumps(data["urls"])

    try:
        db.session.commit()
        return jsonify({"message": "Publicación actualizada"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Error al actualizar"}), 500

# ============================
# ELIMINAR PUBLICACIÓN DE GALERÍA
# ============================


@api.route('/provider/gallery/<int:post_id>', methods=['DELETE'])
@jwt_required()
def delete_gallery_media(post_id):
    user_id = int(get_jwt_identity())

    post = ProviderPortfolio.query.get(post_id)
    if not post or post.provider.user_id != user_id:
        return jsonify({"error": "Publicación no encontrada o no autorizada"}), 404

    try:
        db.session.delete(post)
        db.session.commit()
        return jsonify({"message": "Publicación eliminada"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Error al eliminar"}), 500

# ============================
# ACTUALIZAR HORARIO / DISPONIBILIDAD
# ============================


@api.route('/provider/schedule', methods=['PUT'])
@jwt_required()
def update_provider_schedule():
    user_id = int(get_jwt_identity())

    provider = ProviderProfile.query.filter_by(user_id=user_id).first()
    if not provider:
        return jsonify({"error": "No eres proveedor"}), 403

    data = request.get_json()
    days = data.get("days", [])
    start_time_str = data.get("startTime", "09:00")
    end_time_str = data.get("endTime", "18:00")

    from datetime import datetime

    try:
        if hasattr(provider, 'start_time'):
            provider.start_time = start_time_str
        if hasattr(provider, 'end_time'):
            provider.end_time = end_time_str

        Availability.query.filter_by(provider_id=provider.id).delete()

        start_t = datetime.strptime(start_time_str, "%H:%M").time()
        end_t = datetime.strptime(end_time_str, "%H:%M").time()

        for day in days:
            new_avail = Availability(
                provider_id=provider.id,
                day_of_week=day,
                start_time=start_t,
                end_time=end_t
            )
            db.session.add(new_avail)

        db.session.commit()
        return jsonify({"message": "Horario actualizado exitosamente"}), 200

    except Exception as e:
        db.session.rollback()
        print("Error actualizando horario:", str(e))
        return jsonify({"error": "Error interno al guardar el horario"}), 500

# ============================
# CREAR NUEVO SERVICIO
# ============================


@api.route('/provider/services', methods=['POST'])
@jwt_required()
def add_provider_service():
    import json

    user_id = int(get_jwt_identity())

    provider = ProviderProfile.query.filter_by(user_id=user_id).first()
    if not provider:
        return jsonify({"error": "No eres proveedor"}), 403

    data = request.get_json()

    if not data.get("title") or not data.get("price") or not data.get("subcategory_id"):
        return jsonify({"error": "Faltan datos obligatorios (título, precio, especialidad)"}), 400

    try:
        new_service = Service(
            provider_id=provider.id,
            subcategory_id=data.get("subcategory_id"),
            title=data.get("title"),
            # Si dejan la descripción vacía, ponemos un texto por defecto para no romper el nullable=False
            description=data.get(
                "description") or "Sin condiciones específicas detalladas.",
            price=data.get("price"),
            price_type=data.get("price_type", "hourly"),
            estimated_duration=data.get("estimated_duration")  # Puede ser nulo
        )

        db.session.add(new_service)
        db.session.flush()  # Obtenemos el ID del servicio antes del commit

        # Notificar a todos los seguidores del proveedor
        if provider.user and provider.user.followers:
            for follower in provider.user.followers:
                notif = Notification(
                    user_id=follower.id,
                    actor_id=user_id,
                    type="new_service",
                    message=f"{provider.user.name} publicó un nuevo servicio: {new_service.title}",
                    data_json=json.dumps({
                        **new_service.serialize(),
                        "provider_user_id": user_id,
                        "provider_name": f"{provider.user.name} {provider.user.last_name or ''}".strip()
                    })
                )
                db.session.add(notif)

        db.session.commit()

        return jsonify({"message": "Servicio creado exitosamente"}), 201

    except Exception as e:
        db.session.rollback()
        print("Error creando servicio:", str(e))
        return jsonify({"error": "Error interno al crear el servicio"}), 500

    # ============================
# ELIMINAR SERCICIO
# ============================


@api.route('/provider/services/<int:service_id>', methods=['DELETE'])
@jwt_required()
def delete_provider_service(service_id):
    user_id = int(get_jwt_identity())
    provider = ProviderProfile.query.filter_by(user_id=user_id).first()

    if not provider:
        return jsonify({"error": "No eres proveedor"}), 403

    service = Service.query.filter_by(
        id=service_id, provider_id=provider.id).first()
    if not service:
        return jsonify({"error": "Servicio no encontrado"}), 404

    # 1. VERIFICAR SI HAY CITAS ACTIVAS / PENDIENTES
    active_appointments = Appointment.query.filter(
        Appointment.service_id == service.id,
        Appointment.status.in_(["pending", "upcoming", "in_progress"])
    ).first()

    if active_appointments:
        return jsonify({
            "error": "No puedes eliminar este servicio porque tiene citas pendientes o en curso. Cancélalas o complétalas primero."
        }), 400

    # 2. SI SOLO HAY CITAS PASADAS (completadas/canceladas), LIMPIAMOS Y BORRAMOS
    try:
        past_appointments = Appointment.query.filter_by(
            service_id=service.id).all()
        for app in past_appointments:
            if app.review:
                Media.query.filter_by(review_id=app.review.id).delete()
                db.session.delete(app.review)
            if app.transaction:
                db.session.delete(app.transaction)
            db.session.delete(app)

        Media.query.filter_by(service_id=service.id).delete()
        db.session.delete(service)
        db.session.commit()

        return jsonify({"message": "Servicio eliminado correctamente"}), 200

    except Exception as e:
        db.session.rollback()
        print(f"Error eliminando servicio: {str(e)}")
        return jsonify({"error": "Error interno al eliminar el servicio"}), 500

# ============================
# PANEL CLIENTE
# ============================
# ============================
# PANEL CLIENTE
# ============================
@api.route('/client/dashboard', methods=['GET'])
@jwt_required()
def get_client_dashboard():
    try:
        current_user_id = get_jwt_identity()
        user = User.query.get(current_user_id)
        
        if not user:
            return jsonify({"error": "Usuario no encontrado"}), 404

        appointments = []
        try:
            from models import Appointment
            appointments = Appointment.query.filter_by(client_id=user.id).all()
        except Exception:
            appointments = getattr(user, 'appointments', [])

        active_reservations_list = []
        latest_services_list = []
        total_invested_val = 0.0

        for a in appointments:
            status = getattr(a, 'status', 'pending')
            
            # Obtenemos el servicio asociado y su precio real
            service_obj = getattr(a, 'service', None)
            service_title = service_obj.title if service_obj else "Servicio"
            service_price = float(service_obj.price) if service_obj and hasattr(service_obj, 'price') and service_obj.price else 0.0

            # ---------------------------------------------------------
            # FORMA CORRECTA DE OBTENER EL NOMBRE Y FOTO DEL PROVEEDOR
            # ---------------------------------------------------------
            prov_name = "Profesional"
            prov_image = ""

            if service_obj and service_obj.provider and service_obj.provider.user:
                prov_user = service_obj.provider.user
                prov_name = f"{prov_user.name} {prov_user.last_name or ''}".strip()
                prov_image = prov_user.profile_image or ""
            elif hasattr(a, 'provider') and a.provider and hasattr(a.provider, 'user') and a.provider.user:
                prov_user = a.provider.user
                prov_name = f"{prov_user.name} {prov_user.last_name or ''}".strip()
                prov_image = prov_user.profile_image or ""

            raw_date = getattr(a, 'date_time', None) or getattr(a, 'date', None)
            formatted_date = str(raw_date) if raw_date else "Por definir"

            appointment_data = {
                "id": getattr(a, 'id', 1),
                "provider_name": prov_name,
                "provider_image": prov_image,
                "service_title": service_title,
                "date": formatted_date,
                "duration": getattr(a, 'duration', 60),
                "status": status,
                "price": service_price
            }

            if status == 'completed':
                total_invested_val += service_price
                latest_services_list.append(appointment_data)
            elif status in ['in_progress', 'upcoming', 'confirmed', 'pending']:
                active_reservations_list.append(appointment_data)

        created_year = user.created_at.year if hasattr(user, 'created_at') and user.created_at else 2025
        user_data = user.serialize()
        user_data['member_since'] = created_year
        
        # Obtenemos la lista real de profesionales seguidos
        following_list = []
        if hasattr(user, 'following'):
            for followed_user in user.following:
                following_list.append({
                    "id": followed_user.id,
                    "name": f"{followed_user.name} {followed_user.last_name or ''}".strip(),
                    "category": followed_user.category if hasattr(followed_user, 'category') else "Especialista",
                    "profile_image": followed_user.profile_image or ""
                })

        return jsonify({
            "user_info": user_data,
            "kpis": {
                "active_reservations": len(active_reservations_list),
                "completed_services": len(latest_services_list),
                "total_invested": total_invested_val,
                "following_count": len(following_list)
            },
            "upcoming_reservations": active_reservations_list,
            "following_professionals": following_list,
            "latest_services": latest_services_list
        }), 200
    except Exception as e:
        print(f"Error en get_client_dashboard: {str(e)}")
        return jsonify({"error": str(e)}), 500

# ============================
# MANEJADORES DE ERRORES GLOBALES
# ============================


@api.errorhandler(404)
def not_found_error(error):
    return jsonify({"error": "Ruta no encontrada"}), 404


@api.errorhandler(500)
def internal_error(error):
    return jsonify({"error": "Error interno del servidor"}), 500

# ============================
# SUBIR FOTO DE PORTADA
# ============================
@api.route('/users/<int:user_id>/cover_image', methods=['POST'])
@jwt_required()
def upload_cover_image(user_id):
    current_user_id = get_jwt_identity()

    if int(current_user_id) != user_id:
        return jsonify({"error": "No autorizado para cambiar esta imagen"}), 403

    if 'file' not in request.files:
        return jsonify({"error": "No se envió ninguna imagen"}), 400

    file = request.files['file']

    if file.filename == '':
        return jsonify({"error": "Nombre de archivo vacío"}), 400

    try:
        # Subimos la imagen a Cloudinary en una carpeta específica
        upload_result = cloudinary.uploader.upload(
            file, folder="kelaj_covers")

        image_url = upload_result.get('secure_url')

        user = User.query.get(user_id)
        user.cover_image = image_url
        db.session.commit()

        return jsonify({
            "message": "Imagen de portada actualizada",
            "cover_image": image_url
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Error subiendo la portada: {str(e)}"}), 500


# ============================
# DAR DE BAJA PERFIL DE PROVEEDOR
# ============================
@api.route('/users/<int:user_id>/provider', methods=['DELETE'])
@jwt_required()
def downgrade_provider_profile(user_id):
    current_user_id = get_jwt_identity()

    if int(current_user_id) != user_id:
        return jsonify({"error": "No autorizado para realizar esta acción"}), 403

    user = User.query.get(user_id)
    if not user or not user.is_provider or not user.providerprofile:
        return jsonify({"error": "El usuario no tiene un perfil de proveedor activo"}), 404

    # 1. Bloquear si tiene citas pendientes como CLIENTE
    pending_as_client = Appointment.query.filter(
        Appointment.client_id == user.id,
        Appointment.status.in_(["pending", "upcoming", "in_progress"])
    ).first()

    if pending_as_client:
        return jsonify({
            "error": "No puedes dar de baja tu perfil de proveedor porque tienes citas reservadas pendientes o en curso como cliente."
        }), 400

    provider_id = user.providerprofile.id

    # 2. Bloquear si tiene citas pendientes como PROVEEDOR
    pending_as_provider = Appointment.query.join(Service).filter(
        Service.provider_id == provider_id,
        Appointment.status.in_(["pending", "upcoming", "in_progress"])
    ).first()

    if pending_as_provider:
        return jsonify({
            "error": "No puedes dar de baja tu perfil de proveedor porque tienes servicios con citas pendientes o en curso."
        }), 400

    try:
        from api.models import Media, ProviderSchedule

        # Eliminamos los servicios y sus citas pasadas (reseñas y transacciones asociadas)
        provider_services = Service.query.filter_by(provider_id=provider_id).all()
        for srv in provider_services:
            srv_appointments = Appointment.query.filter_by(service_id=srv.id).all()
            for app in srv_appointments:
                if app.review:
                    Media.query.filter_by(review_id=app.review.id).delete()
                    db.session.delete(app.review)
                if app.transaction:
                    db.session.delete(app.transaction)
                db.session.delete(app)

            Media.query.filter_by(service_id=srv.id).delete()
            db.session.delete(srv)

        # Eliminamos horarios, disponibilidad y portafolio del proveedor
        Availability.query.filter_by(provider_id=provider_id).delete()
        ProviderSchedule.query.filter_by(provider_id=provider_id).delete()
        ProviderPortfolio.query.filter_by(provider_id=provider_id).delete()

        # Eliminamos el perfil de la tabla ProviderProfile
        db.session.delete(user.providerprofile)
        
        # Le quitamos el rol de proveedor al usuario
        user.is_provider = False
        user.role = "buyer"
        UserRole.query.filter_by(user_id=user.id, role="provider").delete()

        db.session.commit()

        return jsonify({
            "message": "Perfil de proveedor dado de baja exitosamente. Ahora eres un cliente estándar.",
            "user": user.serialize()
        }), 200

    except Exception as e:
        db.session.rollback()
        print(f"Error al dar de baja el perfil de proveedor: {str(e)}")
        return jsonify({"error": "Error interno al dar de baja el perfil"}), 500

    except Exception as e:
        db.session.rollback()
        print(f"Error al dar de baja el perfil de proveedor: {str(e)}")
        return jsonify({"error": "Error interno al dar de baja el perfil"}), 500


# ============================
# OBTENER LISTA DE CONVERSACIONES (BANDEJA DE ENTRADA)
# ============================
@api.route('/conversations', methods=['GET'])
@jwt_required()
def get_conversations():
    current_user_id = int(get_jwt_identity())

    # Obtenemos todos los mensajes donde participa el usuario, del más reciente al más antiguo
    messages = Message.query.filter(
        db.or_(
            Message.sender_id == current_user_id,
            Message.receiver_id == current_user_id
        )
    ).order_by(Message.timestamp.desc()).all()

    conversations_map = {}
    for msg in messages:
        other_user_id = msg.receiver_id if msg.sender_id == current_user_id else msg.sender_id

        if other_user_id not in conversations_map:
            other_user = User.query.get(other_user_id)
            if not other_user:
                continue

            conversations_map[other_user_id] = {
                "user": {
                    "id": other_user.id,
                    "name": other_user.name,
                    "last_name": other_user.last_name,
                    "profile_image": other_user.profile_image,
                    "is_provider": other_user.is_provider,
                    "city": other_user.city
                },
                "last_message": msg.content,
                "last_timestamp": msg.timestamp.isoformat() if msg.timestamp else None,
                "unread_count": 0
            }

        # Sumar mensajes no leídos que nos envió ese contacto
        if msg.sender_id == other_user_id and msg.receiver_id == current_user_id and not msg.is_read:
            conversations_map[other_user_id]["unread_count"] += 1

    return jsonify(list(conversations_map.values())), 200


# ============================
# OBTENER HISTORIAL DE CHAT ENTRE DOS USUARIOS
# ============================
@api.route('/messages/<int:user_id>', methods=['GET'])
@jwt_required()
def get_messages(user_id):
    current_user_id = int(get_jwt_identity())

    # Marcar como leídos los mensajes pendientes que nos envió este usuario
    unread_messages = Message.query.filter_by(
        sender_id=user_id,
        receiver_id=current_user_id,
        is_read=False
    ).all()

    for msg in unread_messages:
        msg.is_read = True
    if unread_messages:
        db.session.commit()

    # Buscamos mensajes en ambas direcciones ordenados cronológicamente
    messages = Message.query.filter(
        db.or_(
            db.and_(Message.sender_id == current_user_id, Message.receiver_id == user_id),
            db.and_(Message.sender_id == user_id, Message.receiver_id == current_user_id)
        )
    ).order_by(Message.timestamp.asc()).all()

    return jsonify([msg.serialize() for msg in messages]), 200




        # ============================
# OBTENER CITAS DEL CLIENTE
# ============================
@api.route('/client/appointments', methods=['GET'])
@jwt_required()
def get_client_appointments():
    current_user_id = int(get_jwt_identity())
    appointments = Appointment.query.filter_by(client_id=current_user_id).order_by(Appointment.date_time.asc()).all()

    result = []
    for app in appointments:
        provider_name = "Desconocido"
        if app.service and app.service.provider and app.service.provider.user:
            provider_name = f"{app.service.provider.user.name} {app.service.provider.user.last_name or ''}".strip()

        result.append({
            "id": app.id,
            "service_id": app.service_id,
            "service_title": app.service.title if app.service else "Servicio Eliminado",
            "provider_name": provider_name,
            "date_time": app.date_time.isoformat() if app.date_time else None,
            "status": app.status
        })

    return jsonify(result), 200


# ============================
# MODIFICAR FECHA/HORA DE CITA
# ============================
@api.route('/appointments/<int:appointment_id>', methods=['PUT'])
@jwt_required()
def update_appointment(appointment_id):
    current_user_id = int(get_jwt_identity())
    appointment = Appointment.query.get(appointment_id)

    if not appointment:
        return jsonify({"error": "Cita no encontrada"}), 404

    if int(appointment.client_id) != current_user_id:
        return jsonify({"error": "No autorizado para modificar esta cita"}), 403

    data = request.get_json()
    new_date_time = data.get("date_time")

    if not new_date_time:
        return jsonify({"error": "Debes enviar la nueva fecha y hora (date_time)"}), 400

    try:
        parsed_date = datetime.fromisoformat(new_date_time.replace("Z", "+00:00"))
    except ValueError:
        return jsonify({"error": "Formato de fecha inválido"}), 400

    # Comprobar que el nuevo horario no esté ocupado
    conflict = Appointment.query.filter(
        Appointment.service_id == appointment.service_id,
        Appointment.date_time == parsed_date,
        Appointment.id != appointment.id,
        Appointment.status != "cancelled"
    ).first()

    if conflict:
        return jsonify({"error": "Ese horario ya está ocupado. Elige otro."}), 409

    try:
        appointment.date_time = parsed_date
        db.session.commit()
        return jsonify({"message": "Cita modificada correctamente"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Error al modificar la cita: {str(e)}"}), 500


# ============================
# ENVIAR / GUARDAR MENSAJE
# ============================
@api.route('/messages', methods=['POST'])
@jwt_required()
def send_message():
    import json

    current_user_id = int(get_jwt_identity())
    data = request.get_json()

    if not data:
        return jsonify({"error": "Debes enviar datos en formato JSON"}), 400

    receiver_id = data.get("receiver_id")
    content = (data.get("content") or "").strip()

    if not receiver_id or not content:
        return jsonify({"error": "receiver_id y content son obligatorios"}), 400

    if int(receiver_id) == current_user_id:
        return jsonify({"error": "No puedes enviarte mensajes a ti mismo"}), 400

    receiver = User.query.get(receiver_id)
    if not receiver:
        return jsonify({"error": "Usuario destinatario no encontrado"}), 404

    try:
        new_message = Message(
            sender_id=current_user_id,
            receiver_id=int(receiver_id),
            content=content
        )
        db.session.add(new_message)

        # Crear notificación de mensaje recibido
        sender = User.query.get(current_user_id)
        if sender:
            notif = Notification(
                user_id=int(receiver_id),
                actor_id=current_user_id,
                type="new_message",
                message=f"Nuevo mensaje de {sender.name}: \"{content[:40]}{'...' if len(content) > 40 else ''}\"",
                data_json=json.dumps({
                    "sender_id": current_user_id,
                    "sender_name": f"{sender.name} {sender.last_name or ''}".strip(),
                    "content": content
                })
            )
            db.session.add(notif)

        db.session.commit()

        return jsonify(new_message.serialize()), 201
    except Exception as e:
        db.session.rollback()
        print(f"Error guardando mensaje: {str(e)}")
        return jsonify({"error": "Error interno al enviar el mensaje"}), 500


# ============================
# OBTENER NOTIFICACIONES DEL USUARIO
# ============================
@api.route('/notifications', methods=['GET'])
@jwt_required()
def get_notifications():
    current_user_id = int(get_jwt_identity())
    notifications = Notification.query.filter_by(user_id=current_user_id)\
        .order_by(Notification.created_at.desc())\
        .limit(30).all()
    return jsonify([n.serialize() for n in notifications]), 200


# ============================
# MARCAR UNA NOTIFICACIÓN COMO LEÍDA
# ============================
@api.route('/notifications/<int:notification_id>/read', methods=['PUT'])
@jwt_required()
def mark_notification_read(notification_id):
    current_user_id = int(get_jwt_identity())
    notif = Notification.query.filter_by(id=notification_id, user_id=current_user_id).first()
    if not notif:
        return jsonify({"error": "Notificación no encontrada"}), 404

    notif.is_read = True
    db.session.commit()
    return jsonify(notif.serialize()), 200


# ============================
# MARCAR TODAS COMO LEÍDAS
# ============================
@api.route('/notifications/read-all', methods=['PUT'])
@jwt_required()
def mark_all_notifications_read():
    current_user_id = int(get_jwt_identity())
    Notification.query.filter_by(user_id=current_user_id, is_read=False).update({"is_read": True})
    db.session.commit()
    return jsonify({"message": "Todas las notificaciones marcadas como leídas"}), 200

# ============================
# OBTENER CITAS DEL PROVEEDOR
# ============================
@api.route('/provider/appointments', methods=['GET'])
@jwt_required()
def get_provider_appointments():
    current_user_id = int(get_jwt_identity())
    provider = ProviderProfile.query.filter_by(user_id=current_user_id).first()

    if not provider:
        return jsonify({"error": "No eres proveedor"}), 403

    appointments = Appointment.query.join(Service).filter(
        Service.provider_id == provider.id
    ).order_by(Appointment.date_time.asc()).all()

    return jsonify([app.serialize() for app in appointments]), 200

# ============================
# CANCELAR CITA Y PROCESAR REEMBOLSO
# ============================
@api.route('/appointments/<int:appointment_id>/cancel', methods=['PUT'])
@jwt_required()
def cancel_appointment_with_refund(appointment_id):
    current_user_id = int(get_jwt_identity())
    
    appointment = Appointment.query.get(appointment_id)
    if not appointment:
        return jsonify({"error": "Cita no encontrada"}), 404

    # Verificar que el usuario que cancela sea el cliente de la cita o el proveedor del servicio
    is_client = appointment.client_id == current_user_id
    is_provider = appointment.service and appointment.service.provider and appointment.service.provider.user_id == current_user_id

    if not is_client and not is_provider:
        return jsonify({"error": "No estás autorizado para cancelar esta cita"}), 403

    if appointment.status == "cancelled":
        return jsonify({"error": "Esta cita ya se encuentra cancelada"}), 400

    try:
        refund_processed = False
        refund_details = None

        # Verificar si la cita tiene una transacción de pago asociada para reembolsar en Stripe
        if appointment.transaction and appointment.transaction.provider_transaction_id:
            payment_intent_id = appointment.transaction.provider_transaction_id
            
            # Llamada oficial a la API de Stripe para emitir el reembolso del PaymentIntent
            refund = stripe.Refund.create(
                payment_intent=payment_intent_id,
                reason="requested_by_customer"
            )
            
            refund_processed = True
            refund_details = refund.id

            # Actualizar el estado de la transacción local
            appointment.transaction.status = "refunded"

        # Cambiar el estado de la cita a cancelada
        appointment.status = "cancelled"
        db.session.commit()

        return jsonify({
            "message": "Cita cancelada exitosamente",
            "refund_processed": refund_processed,
            "stripe_refund_id": refund_details,
            "appointment": {
                "id": appointment.id,
                "status": appointment.status
            }
        }), 200

    except stripe.error.StripeError as e:
        db.session.rollback()
        print("Error de Stripe al reembolsar:", str(e))
        return jsonify({"error": f"Error al procesar el reembolso en Stripe: {str(e)}"}), 400
    except Exception as e:
        db.session.rollback()
        print("Error interno cancelando cita:", str(e))
        return jsonify({"error": "Error interno al cancelar la cita"}), 500