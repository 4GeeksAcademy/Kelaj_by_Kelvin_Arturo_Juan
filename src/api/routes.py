"""
This module takes care of starting the API Server, Loading the DB and Adding the endpoints
"""
from flask import Flask, request, jsonify, url_for, Blueprint
from api.models import db, User, Service, Transaction, Appointment, Category, Subcategory, ProviderProfile, Availability, ProviderPortfolio, PaymentMethod
from api.utils import generate_sitemap, APIException
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
import stripe

api = Blueprint('api', __name__)

# ============================================================
# 🔹 AUTH
# ============================================================

@api.route('/register', methods=['POST'])
def register():
    body = request.get_json()

    if body is None:
        return jsonify({"message": "Debes enviar un body en formato JSON"}), 400

    name = body.get("name")
    email = body.get("email")
    password = body.get("password")
    role = body.get("role", "buyer")  # default role is buyer

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
        is_provider=(role == "provider")
    )
    db.session.add(new_user)
    db.session.commit()
    if role == "provider":
        provider_profile = ProviderProfile(user_id=new_user.id)
        db.session.add(provider_profile)
        db.session.commit()

    return jsonify({"message": "usuario creado exitosamente", "user": new_user.serialize()}), 201


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

    roles = ["buyer","provider"] if user.is_provider else ["buyer"]

    access_token = create_access_token(identity=str(
        user.id), additional_claims={"roles": roles})

    return jsonify({"message": "login exitoso", "token": access_token, "user": user.serialize()}), 200

@api.route('/become-provider', methods=['POST'])
@jwt_required()
def become_provider():

    user_id = get_jwt_identity()

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

@api.route('/payment-methods', methods=['POST'])
@jwt_required()
def add_payment_method():
    user_id = get_jwt_identity()
    data = request.get_json()

    required = ["provider", "token_id", "brand", "last_four_digits"]
    if not all(k in data for k in required):
        return jsonify({"error": "Datos incompletos"}), 400

    method = PaymentMethod(
        user_id=user_id,
        provider=data["provider"],
        token_id=data["token_id"],
        brand=data["brand"],
        last_four_digits=data["last_four_digits"]
    )

    db.session.add(method)
    db.session.commit()

    return jsonify(method.serialize()), 201


@api.route('/payment-methods', methods=['GET'])
@jwt_required()
def get_payment_methods():
    user_id = get_jwt_identity()

    methods = PaymentMethod.query.filter_by(user_id=user_id).all()
    return jsonify([m.serialize() for m in methods]), 200


@api.route('/payment-methods/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_payment_method(id):
    user_id = get_jwt_identity()

    method = PaymentMethod.query.filter_by(id=id, user_id=user_id).first()
    if not method:
        return jsonify({"error": "Método no encontrado"}), 404

    db.session.delete(method)
    db.session.commit()

    return jsonify({"success": True}), 200


@api.route('/charge', methods=['POST'])
@jwt_required()
def create_charge():
    user_id = get_jwt_identity()
    data = request.get_json()

    required = ["appointment_id", "amount", "token_id"]
    if not all(k in data for k in required):
        return jsonify({"error": "Datos incompletos"}), 400

    appointment = Appointment.query.get(data["appointment_id"])
    if not appointment:
        return jsonify({"error": "Cita no encontrada"}), 404

    try:
        # 1. Cobrar con Stripe usando token nuevo
        charge = stripe.Charge.create(
            amount=int(data["amount"] * 100),
            currency="eur",
            source=data["token_id"],
            description=f"Cita {appointment.id} - Servicio {appointment.service_id}"
        )

        # 2. Registrar transacción en tu BD
        transaction = Transaction(
            appointment_id=appointment.id,
            user_id=user_id,
            amount=data["amount"],
            status="paid",
            provider="stripe",
            provider_transaction_id=charge.id
        )

        db.session.add(transaction)
        db.session.commit()

        return jsonify({
            "transaction_id": transaction.id,
            "charge_id": charge.id
        }), 201

    except stripe.error.CardError as e:
        return jsonify({"error": str(e)}), 402
    except Exception as e:
        print(e)
        return jsonify({"error": "Error procesando el pago"}), 500


@api.route('/charge/saved', methods=['POST'])
@jwt_required()
def create_charge_with_saved_method():
    user_id = get_jwt_identity()
    data = request.get_json()

    required = ["appointment_id", "amount", "payment_method_id"]
    if not all(k in data for k in required):
        return jsonify({"error": "Datos incompletos"}), 400

    appointment = Appointment.query.get(data["appointment_id"])
    if not appointment:
        return jsonify({"error": "Cita no encontrada"}), 404

    payment_method = PaymentMethod.query.filter_by(
        id=data["payment_method_id"],
        user_id=user_id
    ).first()

    if not payment_method:
        return jsonify({"error": "Método de pago no encontrado"}), 404

    try:
        # 1. Cobrar con Stripe usando token guardado
        charge = stripe.Charge.create(
            amount=int(data["amount"] * 100),
            currency="eur",
            source=payment_method.token_id,
            description=f"Cita {appointment.id} - Servicio {appointment.service_id}"
        )

        # 2. Registrar transacción
        transaction = Transaction(
            appointment_id=appointment.id,
            user_id=user_id,
            amount=data["amount"],
            status="paid",
            provider="stripe",
            provider_transaction_id=charge.id
        )

        db.session.add(transaction)
        db.session.commit()

        return jsonify({
            "transaction_id": transaction.id,
            "charge_id": charge.id
        }), 201

    except stripe.error.CardError as e:
        return jsonify({"error": str(e)}), 402
    except Exception as e:
        print(e)
        return jsonify({"error": "Error procesando el pago"}), 500
