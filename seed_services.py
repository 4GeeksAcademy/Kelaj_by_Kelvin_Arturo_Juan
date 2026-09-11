import sys
sys.path.insert(0, 'src')
from app import app
from api.models import db, User, ProviderProfile, Subcategory, Service
from werkzeug.security import generate_password_hash

app.app_context().push()

u = User.query.filter_by(email="proveedor@demo.com").first()
if not u:
    u = User(name="Proveedor Demo", email="proveedor@demo.com", password_hash=generate_password_hash("123456"), role="provider", is_provider=True)
    db.session.add(u)
    db.session.flush()

p = ProviderProfile.query.filter_by(user_id=u.id).first()
if not p:
    p = ProviderProfile(user_id=u.id, role="provider", verified=True)
    db.session.add(p)
    db.session.flush()

if Service.query.count() == 0:
    sub = Subcategory.query.first()
    db.session.add(Service(provider_id=p.id, subcategory_id=sub.id, title="Clase de matematicas online", description="Clase particular de matematicas", price=15.00, estimated_duration=60))
    db.session.add(Service(provider_id=p.id, subcategory_id=sub.id, title="Tutoria de ingles", description="Refuerzo de ingles conversacional", price=12.00, estimated_duration=45))
    db.session.commit()
    print("Servicios de prueba creados")
else:
    print("Ya existen servicios")
