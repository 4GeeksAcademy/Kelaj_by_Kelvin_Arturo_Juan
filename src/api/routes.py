"""
This module takes care of starting the API Server, Loading the DB and Adding the endpoints
"""
from flask import Flask, request, jsonify, url_for, Blueprint
from api.models import db, User, UserRole, Service, ServiceAvailability, Reservation, Transaction, Review, Category, Subcategory, ProviderProfile, ProviderSchedule, ProviderPortfolio
from api.utils import generate_sitemap, APIException
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity

api = Blueprint('api', __name__)

# ============================================================
# 🔹 AUTH
# ============================================================

@api.route('/auth/register', methods=['POST'])
def register_auth():
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

    return jsonify(response_body), 200


@api.route('/register', methods=['POST'])
def register():
    body = request.get_json()

    if body is None:
        return jsonify({"message": "Debes enviar un body en formato JSON"}), 400

    name = body.get("name")
    email = body.get("email")
    password = body.get("password")
    role = body.get("role")

    if not name or not email or not password or not role:
        return jsonify({"message": "nombre, email, password y rol son requeridos"}), 400

    existing_user = User.query.filter_by(email=email).first()
    if existing_user is not None:
        return jsonify({"message": "el email ya está en uso"}), 400

    new_user = User(
        name=name,
        email=email,
        password_hash=generate_password_hash(password)
    )
    db.session.add(new_user)
    db.session.commit()

    new_role = UserRole(
        user_id=new_user.id,
        role=role
    )
    db.session.add(new_role)
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

    roles = [role.role for role in user.roles]

    access_token = create_access_token(identity=str(user.id), additional_claims={"roles": roles})

    return jsonify({"message": "login exitoso", "token": access_token, "user": user.serialize()}), 200


@api.route('/services/featured', methods=['GET'])
def featured_services():
    featured = Service.query.filter_by(visible=True, featured=True).order_by(Service.id.desc()).limit(6).all()
    if not featured:
        featured = Service.query.filter_by(visible=True).order_by(Service.id.desc()).limit(6).all()
    return jsonify([s.serialize() for s in featured]), 200


@api.route('/categories', methods=['GET'])
def get_categories():
    categories = Category.query.all()
    return jsonify([c.serialize() for c in categories]), 200


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
    if not user or user.role != 'admin':
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
    if not user or user.role != 'admin':
        return jsonify({"error": "No autorizado"}), 403
    service = db.session.get(Service, service_id)
    if not service:
        return jsonify({"error": "Servicio no encontrado"}), 404
    data = request.get_json(silent=True) or {}
    service.featured = bool(data.get('featured', not service.featured))
    db.session.commit()
    return jsonify({"message": "servicio actualizado", "featured": service.featured}), 200
