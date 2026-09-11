import sys
sys.path.insert(0, 'src')
from app import app
from api.models import db, Category, Subcategory, User, ProviderProfile, Service
from werkzeug.security import generate_password_hash

app.app_context().push()

if Category.query.count() == 0:
    cats = [
        ("Clases", "Clases particulares, talleres y cursos"),
        ("Reparaciones", "Arreglos y mantenimiento en general"),
        ("Consultoría", "Asesoría profesional y de negocios"),
        ("Salud", "Cuidado personal y bienestar"),
        ("Hogar", "Servicios para tu casa"),
    ]
    subs = {
        "Clases": ["Matemáticas", "Inglés", "Música"],
        "Reparaciones": ["Plomería", "Electricidad", "Carpintería"],
        "Consultoría": ["Marketing", "Finanzas"],
        "Salud": ["Entrenador", "Nutrición"],
        "Hogar": ["Limpieza", "Jardinería"],
    }
    for name, desc in cats:
        c = Category(name=name, description=desc)
        db.session.add(c)
        db.session.flush()
        for sname in subs[name]:
            db.session.add(Subcategory(name=sname, category_id=c.id))
    db.session.commit()
    print("Categorias creadas")

if User.query.count() == 0:
    u = User(name="Proveedor Demo", email="proveedor@demo.com", password_hash=generate_password_hash("123456"), role="provider", is_provider=True)
    db.session.add(u)
    db.session.flush()
    p = ProviderProfile(user_id=u.id, role="provider", verified=True)
    db.session.add(p)
    db.session.flush()
    sub = Subcategory.query.first()
    db.session.add(Service(provider_id=p.id, subcategory_id=sub.id, title="Clase de matematicas online", description="Clase particular de matematicas", price=15.00, estimated_duration=60))
    db.session.add(Service(provider_id=p.id, subcategory_id=sub.id, title="Tutoria de ingles", description="Refuerzo de ingles conversacional", price=12.00, estimated_duration=45))
    db.session.commit()
    print("Servicios de prueba creados")
