"""
This module takes care of starting the API Server, Loading the DB and Adding the endpoints
"""
import os
import stripe
from flask_cors import CORS
from flask_socketio import SocketIO, emit, join_room
from flask import Flask, request, jsonify, url_for, send_from_directory
from flask_migrate import Migrate
from flask_swagger import swagger
from api.utils import APIException, generate_sitemap
from api.models import db
from api.routes import api
from api.admin import setup_admin
from api.commands import setup_commands
from flask_jwt_extended import JWTManager

app = Flask(__name__)
CORS(api)
socketio = SocketIO(app, cors_allowed_origins="*")

ENV = "development" if os.getenv("FLASK_DEBUG") == "1" else "production"
static_file_dir = os.path.join(os.path.dirname(
    os.path.realpath(__file__)), '../dist/')
app.url_map.strict_slashes = False

from flask_cors import CORS
CORS(app, resources={r"/api/*": {"origins": "*"}})

# database condiguration
db_url = os.getenv("DATABASE_URL")
if db_url is not None:
    app.config['SQLALCHEMY_DATABASE_URI'] = db_url.replace(
        "postgres://", "postgresql://")
else:
    app.config['SQLALCHEMY_DATABASE_URI'] = "sqlite:////tmp/test.db"

app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

app.config["JWT_SECRET_KEY"] = os.getenv("FLASK_APP_KEY", "super-secret-key")
jwt = JWTManager(app)

MIGRATE = Migrate(app, db, compare_type=True)
db.init_app(app)

setup_admin(app)

setup_commands(app)

app.register_blueprint(api, url_prefix='/api')


@app.errorhandler(APIException)
def handle_invalid_usage(error):
    return jsonify(error.to_dict()), error.status_code

# user entra en chat
@socketio.on('join')
def on_join(data):
    room = data['room']
    join_room(room)

# useer envia un mensaje
@socketio.on('send_message')
def handle_message(data):
    room = data['room']
    sender_id = data['sender_id']
    receiver_id = data['receiver_id']
    text = data['text']

    with app.app_context():
        try:
            new_message = Message(
                sender_id=sender_id,
                receiver_id=receiver_id,
                content=text
            )
            db.session.add(new_message)
            db.session.commit()
            
            data['timestamp'] = new_message.timestamp.strftime("%H:%M")
        except Exception as e:
            db.session.rollback()
            print(f"Error al guardar el mensaje: {e}")

    emit('receive_message', data, room=room)


@app.route('/')
def sitemap():
    if ENV == "development":
        return generate_sitemap(app)
    return send_from_directory(static_file_dir, 'index.html')

@app.route('/<path:path>', methods=['GET'])
def serve_any_other_file(path):
    if not os.path.isfile(os.path.join(static_file_dir, path)):
        path = 'index.html'
    response = send_from_directory(static_file_dir, path)
    response.cache_control.max_age = 0  # avoid cache memory
    return response


if __name__ == '__main__':
    PORT = int(os.environ.get('PORT', 3001))
    socketio.run(app, host='0.0.0.0', port=PORT, debug=True)