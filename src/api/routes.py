"""
This module takes care of starting the API Server, Loading the DB and Adding the endpoints
"""
from flask import Flask, request, jsonify, url_for, Blueprint
from api.models import db, User, UserRole
from api.utils import generate_sitemap, APIException
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import create_access_token

api = Blueprint('api', __name__)

# Allow CORS requests to this API
CORS(api)


@api.route('/hello', methods=['POST', 'GET'])
def handle_hello():

    response_body = {
        "message": "Hello! I'm a message that came from the backend, check the network tab on the google inspector and you will see the GET request"
    }

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