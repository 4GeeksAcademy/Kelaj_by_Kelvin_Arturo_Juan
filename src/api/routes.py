"""
This module takes care of starting the API Server, Loading the DB and Adding the endpoints
"""
import cloudinary
import cloudinary.uploader
from flask import Flask, request, jsonify, url_for, Blueprint
from sqlalchemy import func
from api.models import db, User, UserRole, Service, Transaction, Appointment, Category, Subcategory, ProviderProfile, Availability, ProviderPortfolio, PaymentMethod, Review
from api.utils import generate_sitemap, APIException
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
import stripe
import os
import random

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
        upload_result = cloudinary.uploader.upload(file, folder="kelaj_profiles")
        
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

    try:
        UserRole.query.filter_by(user_id=user.id).delete()
        PaymentMethod.query.filter_by(user_id=user.id).delete()
        Transaction.query.filter_by(user_id=user.id).delete()
        
        user.followers.clear()
        user.following.clear()

        if user.providerprofile:
            provider_id = user.providerprofile.id
            
            # Borramos primero las dependencias del proveedor
            Service.query.filter_by(provider_id=provider_id).delete()
            Availability.query.filter_by(provider_id=provider_id).delete()
            ProviderPortfolio.query.filter_by(provider_id=provider_id).delete()
            
            db.session.delete(user.providerprofile)

        db.session.delete(user)
        db.session.commit()

        return jsonify({"message": "Cuenta eliminada exitosamente"}), 200

    except Exception as e:
        db.session.rollback() # Si algo sale mal, revertimos todo para no corromper la BD
        print(f"Error borrando usuario: {str(e)}")
        return jsonify({"error": "Error interno al eliminar la cuenta"}), 500


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
    services = Service.query.filter_by(visible=True).order_by(Service.id.desc()).limit(6).all()
    return jsonify([s.serialize() for s in services]), 200


@api.route('/categories', methods=['GET'])
def get_categories():
    categories = Category.query.all()
    return jsonify([c.serialize() for c in categories]), 200

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

# ============================
# CREAR SETUP INTENT (GUARDAR TARJETA)
# ============================
@api.route('/stripe/setup-intent', methods=['POST'])
@jwt_required()
def create_setup_intent():
    user_id = get_jwt_identity()
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
    user_id = get_jwt_identity()
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
    user_id = get_jwt_identity()
    methods = PaymentMethod.query.filter_by(user_id=user_id).all()
    return jsonify([m.serialize() for m in methods]), 200

# ============================
# ELIMINAR TARJETA GUARDADA
# ============================
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

# ============================
# COBRO CON TARJETA NUEVA
# ============================
@api.route('/charge', methods=['POST'])
@jwt_required()
def create_charge():
    user_id = get_jwt_identity()
    data = request.get_json()

    required = ["appointment_id", "amount", "payment_method_id"]
    if not all(k in data for k in required):
        return jsonify({"error": "Datos incompletos"}), 400

    appointment = Appointment.query.get(data["appointment_id"])
    if not appointment:
        return jsonify({"error": "Cita no encontrada"}), 404

    user = User.query.get(user_id)
    if not user.stripe_customer_id:
        return jsonify({"error": "Cliente Stripe no encontrado"}), 400

    try:
        # PaymentIntent con tarjeta nueva (confirmada en frontend)
        payment_intent = stripe.PaymentIntent.create(
            amount=int(data["amount"] * 100),
            currency="eur",
            customer=user.stripe_customer_id,
            payment_method=data["payment_method_id"],
            confirm=True,
            off_session=False
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


# ============================
# COBRO CON TARJETA GUARDADA
# ============================
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
            amount=int(data["amount"] * 100),
            currency="eur",
            customer=user.stripe_customer_id,
            payment_method=method.stripe_payment_method_id,
            off_session=True,
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
    user_id = get_jwt_identity()
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
    user_id = get_jwt_identity()
    provider = ProviderProfile.query.filter_by(user_id=user_id).first()

    if not provider:
        return jsonify({"error": "No eres proveedor"}), 403

    services = Service.query.filter_by(provider_id=provider.id).all()
    return jsonify([s.serialize() for s in services]), 200

@api.route('/provider/services/<int:id>/toggle', methods=['PUT'])
@jwt_required()
def toggle_service(id):
    user_id = get_jwt_identity()
    provider = ProviderProfile.query.filter_by(user_id=user_id).first()

    service = Service.query.filter_by(id=id, provider_id=provider.id).first()
    if not service:
        return jsonify({"error": "Servicio no encontrado"}), 404

    service.visible = not service.visible
    db.session.commit()

    return jsonify(service.serialize()), 200

@api.route('/provider/appointments', methods=['GET'])
@jwt_required()
def provider_appointments():
    user_id = get_jwt_identity()
    provider = ProviderProfile.query.filter_by(user_id=user_id).first()

    appointments = Appointment.query.join(Service).filter(
        Service.provider_id == provider.id
    ).all()

    return jsonify([a.serialize() for a in appointments]), 200

@api.route('/provider/transactions', methods=['GET'])
@jwt_required()
def provider_transactions():
    user_id = get_jwt_identity()
    provider = ProviderProfile.query.filter_by(user_id=user_id).first()

    transactions = Transaction.query.join(Appointment).join(Service).filter(
        Service.provider_id == provider.id
    ).all()

    return jsonify([t.serialize() for t in transactions]), 200

#para obtener los perfiles publicos:

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

#para seguir y ser seguido:

@api.route('/users/<int:user_id>/follow', methods=['POST', 'DELETE'])
@jwt_required()
def toggle_follow(user_id):
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
            db.session.commit()
            return jsonify({"message": f"Ahora sigues a {target_user.name}"}), 200
        return jsonify({"message": "Ya sigues a este usuario"}), 400

    if request.method == 'DELETE':
        if target_user in current_user.following:
            current_user.following.remove(target_user)
            db.session.commit()
            return jsonify({"message": f"Dejaste de seguir a {target_user.name}"}), 200
        return jsonify({"message": "No sigues a este usuario"}), 400
    
#sistema de reviews:

@api.route('/appointments/<int:appointment_id>/reviews', methods=['POST'])
@jwt_required()
def create_review(appointment_id):
    current_user_id = get_jwt_identity()
    body = request.get_json()
    
    rating = body.get("rating")
    comment = body.get("comment")
    
    if not rating or not isinstance(rating, int) or rating < 1 or rating > 5:
        return jsonify({"error": "El rating debe ser un número entre 1 y 5"}), 400

    appointment = Appointment.query.get(appointment_id)
    
    if not appointment:
        return jsonify({"error": "Cita no encontrada"}), 404
        
    if int(appointment.client_id) != int(current_user_id):
        return jsonify({"error": "Solo el cliente de la cita puede dejar una reseña"}), 403
        
    if appointment.review:
        return jsonify({"error": "Esta cita ya tiene una reseña"}), 400

    new_review = Review(
        appointment_id=appointment.id,
        rating=rating,
        comment=comment
    )
    
    db.session.add(new_review)
    db.session.commit()
    
    return jsonify({"message": "Reseña creada exitosamente", "review": new_review.serialize()}), 201

#busquedas

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
        search = search.filter(ProviderProfile.coverage_area.ilike(f'%{location}%'))
        
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

@api.route('/services/search', methods=['GET'])
def search_services():
    q = request.args.get('q', '')
    cat = request.args.get('cat', type=int)
    query = Service.query.filter_by(visible=True)
    if q or cat:
        query = query.join(Subcategory)
    if cat:
        query = query.filter(Subcategory.category_id == cat)
    if q:
        query = query.filter(
            Service.title.ilike('%' + q + '%') |
            Service.description.ilike('%' + q + '%') |
            Subcategory.name.ilike('%' + q + '%')
        )
    return jsonify([s.serialize() for s in query.order_by(Service.id.desc()).limit(30).all()]), 200


@api.route('/services/manage', methods=['GET'])
@jwt_required()
def admin_list_services():
    user = db.session.get(User, int(get_jwt_identity()))
    if not user or not any(r.role == 'admin' for r in user.roles):
        return jsonify({"error": "No autorizado"}), 403
    services = Service.query.order_by(Service.id.desc()).all()
    return jsonify([{
        "id": s.id,
        "title": s.title,
        "price": float(s.price),
        "featured": s.featured,
        "visible": s.visible,
        "subcategory": s.subcategory.name if s.subcategory else "Sin categoria"
    } for s in services]), 200


@api.route('/services/<int:service_id>/featured', methods=['PUT'])
@jwt_required()
def toggle_service_featured(service_id):
    user = db.session.get(User, int(get_jwt_identity()))
    if not user or not any(r.role == 'admin' for r in user.roles):
        return jsonify({"error": "No autorizado"}), 403
    service = db.session.get(Service, service_id)
    if not service:
        return jsonify({"error": "Servicio no encontrado"}), 404
    data = request.get_json(silent=True) or {}
    service.featured = bool(data.get('featured', not service.featured))
    db.session.commit()
    return jsonify({"message": "servicio actualizado", "featured": service.featured}), 200


@api.route('/verify/start', methods=['POST'])
@jwt_required()
def verify_start():
    body = request.get_json() or {}
    dni = (body.get("dni") or "").strip()
    user = User.query.filter_by(id=int(get_jwt_identity())).first()
    if user is None:
        return jsonify({"message": "Usuario no encontrado"}), 404
    if not user.is_provider:
        return jsonify({"message": "Solo los proveedores pueden verificarse"}), 400
    if not dni:
        return jsonify({"message": "El DNI es obligatorio"}), 400
    user.dni = dni
    user.verification_code = str(random.randint(100000, 999999))
    db.session.commit()
    return jsonify({
        "message": "Te enviamos un cód\u00edgo de 6 d\u00edgitos al email asociado",
        "debug_code": user.verification_code
    }), 200


@api.route('/verify/confirm', methods=['POST'])
@jwt_required()
def verify_confirm():
    body = request.get_json() or {}
    code = (body.get("code") or "").strip()
    user = User.query.filter_by(id=int(get_jwt_identity())).first()
    if user is None or not user.is_provider:
        return jsonify({"message": "Solo los proveedores pueden verificarse"}), 400
    if not user.verification_code or user.verification_code != code:
        return jsonify({"message": "C\u00f3digo incorrecto. Intenta de nuevo"}), 400
    if user.providerprofile is None:
        db.session.add(ProviderProfile(user_id=user.id))
    user.providerprofile.verified = True
    user.verification_code = None
    db.session.commit()
    return jsonify({"message": "¡Verificado!", "user": user.serialize()}), 200
