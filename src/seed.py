from app import app  # Importa la instancia de tu app de Flask
from api.models import db, User, ProviderProfile, Category, Subcategory, Service, Appointment, Review, Availability
from werkzeug.security import generate_password_hash
from datetime import datetime, timedelta, time
import random


def seed_database():
    with app.app_context():
        # 1. Crear Categorías y guardarlas en un diccionario para fácil acceso
        categories_data = {
            "Tecnología": "Soporte técnico, desarrollo y hardware",
            "Salud": "Consultas médicas, psicología y bienestar",
            "Hogar y Envíos": "Asistencia en el hogar, fontanería y mensajería",
            "Educación": "Clases particulares y tutorías",
            "Fitness": "Entrenamiento personal y nutrición"
        }

        categories = {}
        for name, desc in categories_data.items():
            cat = Category(name=name, description=desc)
            db.session.add(cat)
            categories[name] = cat
        db.session.commit()

        # 2. Crear Subcategorías
        subcategories_data = [
            ("Reparación de Hardware", "Tecnología"),
            ("Desarrollo Web", "Tecnología"),
            ("Consulta Médica", "Salud"),
            ("Terapia Online", "Salud"),
            ("Mensajería Exprés", "Hogar y Envíos"),
            ("Fontanería", "Hogar y Envíos"),
            ("Programación", "Educación"),
            ("Idiomas", "Educación"),
            ("Entrenamiento de Fuerza", "Fitness")
        ]

        subcategories = {}
        for sub_name, cat_name in subcategories_data:
            sub = Subcategory(
                name=sub_name, category_id=categories[cat_name].id)
            db.session.add(sub)
            subcategories[sub_name] = sub
        db.session.commit()

        # 3. Crear Cliente de Prueba (Para generar las reservas y reseñas)
        client = User(
            name="Cliente", last_name="Demo", email="cliente@demo.com",
            password_hash=generate_password_hash("123456"), role="buyer",
            is_provider=False, is_active=True
        )
        db.session.add(client)
        db.session.commit()

        # 4. Datos de 10 Proveedores Variados (Presencial, Online, Horarios distintos)
        providers_seed = [
            {
                "user": {"name": "Carlos", "last_name": "Gómez", "email": "carlos@hardware.com", "city": "Madrid", "phone": "+34600111222"},
                "profile": {"bio": "Técnico especialista en PC Gaming y portátiles.", "description": "Limpieza, cambio de pasta térmica y optimización de componentes.", "area": "Madrid Centro", "is_home": True},
                "service": {"title": "Mantenimiento de PC a Domicilio", "desc": "Revisión completa de hardware y temperaturas.", "price": 50.0, "duration": 90, "subcat": "Reparación de Hardware", "visible": True},
                "schedule": [{"day": 1, "start": time(9, 0), "end": time(18, 0)}, {"day": 3, "start": time(9, 0), "end": time(14, 0)}],
                "review": {"rating": 5, "comment": "Mi ordenador ahora va rapidísimo, trato excelente."}
            },
            {
                "user": {"name": "Elena", "last_name": "Martínez", "email": "elena@med.com", "city": "Collado Villalba", "phone": "+34600222333"},
                "profile": {"bio": "Médico general colegiada.", "description": "Atención primaria preventiva desde la comodidad de tu casa.", "area": "Collado Villalba y alrededores", "is_home": True},
                "service": {"title": "Consulta Médica Presencial", "desc": "Evaluación general y recetas médicas.", "price": 60.0, "duration": 45, "subcat": "Consulta Médica", "visible": True},
                "schedule": [{"day": 2, "start": time(10, 0), "end": time(20, 0)}, {"day": 4, "start": time(10, 0), "end": time(20, 0)}],
                "review": {"rating": 5, "comment": "Muy atenta y puntual. Te ahorra la visita al ambulatorio."}
            },
            {
                "user": {"name": "Miguel", "last_name": "Ruiz", "email": "miguel@delivery.com", "city": "Collado Villalba", "phone": "+34600333444"},
                "profile": {"bio": "Repartidor en scooter con gran conocimiento de rutas locales.", "description": "Mensajería local súper rápida. Si cabe en el cajón de la moto, lo llevo.", "area": "Sierra de Madrid", "is_home": True},
                "service": {"title": "Envío Local Exprés (Scooter)", "desc": "Recogida y entrega en menos de 2 horas.", "price": 12.0, "duration": 120, "subcat": "Mensajería Exprés", "visible": True},
                "schedule": [{"day": 1, "start": time(19, 0), "end": time(23, 30)}, {"day": 5, "start": time(20, 0), "end": time(23, 59)}],
                "review": {"rating": 4, "comment": "Llegó a tiempo y el paquete en perfecto estado."}
            },
            {
                "user": {"name": "Laura", "last_name": "Sánchez", "email": "laura@dev.com", "city": "Online", "phone": "+34600444555"},
                "profile": {"bio": "Desarrolladora Full Stack especializada en React y Flask.", "description": "Te ayudo con tu bootcamp, proyectos personales o dudas de código.", "area": "Global (Online)", "is_home": False},
                "service": {"title": "Mentoría de Desarrollo Web (Online)", "desc": "Clases prácticas de Javascript, Python, y bases de datos relacionales.", "price": 25.0, "duration": 60, "subcat": "Programación", "visible": True},
                "schedule": [{"day": 1, "start": time(16, 0), "end": time(21, 0)}, {"day": 3, "start": time(16, 0), "end": time(21, 0)}],
                "review": {"rating": 5, "comment": "Me salvó con mi proyecto de SQLAlchemy, explica genial."}
            },
            {
                "user": {"name": "Hugo", "last_name": "Torres", "email": "hugo@fitness.com", "city": "Madrid", "phone": "+34600555666"},
                "profile": {"bio": "Entrenador personal. Amante de los hierros.", "description": "Rutinas de fuerza, hipertrofia y asesoramiento en suplementación (creatina, proteínas).", "area": "Gimnasios zona Norte / Online", "is_home": True},
                "service": {"title": "Diseño de Rutina y Sesión Presencial", "desc": "Entrenamos juntos enfocándonos en técnica (Press, Elevaciones).", "price": 40.0, "duration": 60, "subcat": "Entrenamiento de Fuerza", "visible": True},
                "schedule": [{"day": 1, "start": time(7, 0), "end": time(11, 0)}, {"day": 2, "start": time(7, 0), "end": time(11, 0)}],
                "review": {"rating": 5, "comment": "Los entrenamientos son duros pero se nota el progreso rápido."}
            },
            {
                "user": {"name": "Ana", "last_name": "López", "email": "ana@psicologia.com", "city": "Online", "phone": "+34600666777"},
                "profile": {"bio": "Psicóloga clínica con enfoque cognitivo-conductual.", "description": "Terapia online segura, privada y a tu ritmo mediante videollamada.", "area": "Global (Online)", "is_home": False},
                "service": {"title": "Sesión de Terapia Online", "desc": "Gestión de estrés, ansiedad y desarrollo personal.", "price": 55.0, "duration": 60, "subcat": "Terapia Online", "visible": True},
                "schedule": [{"day": 1, "start": time(9, 0), "end": time(15, 0)}, {"day": 5, "start": time(9, 0), "end": time(14, 0)}],
                "review": {"rating": 5, "comment": "Transmite muchísima paz, me está ayudando un montón."}
            },
            {
                "user": {"name": "Roberto", "last_name": "Díaz", "email": "roberto@plumbing.com", "city": "Madrid Sur", "phone": "+34600777888"},
                "profile": {"bio": "Fontanero autorizado con 15 años de experiencia.", "description": "Solución de averías urgentes, desatascos e instalación de grifería.", "area": "Madrid Sur y Getafe", "is_home": True},
                "service": {"title": "Reparación de Averías (Urgencia)", "desc": "Fugas de agua, atascos severos en cocina o baño.", "price": 75.0, "duration": 60, "subcat": "Fontanería", "visible": True},
                # Fin de semana
                "schedule": [{"day": 6, "start": time(8, 0), "end": time(20, 0)}, {"day": 7, "start": time(8, 0), "end": time(20, 0)}],
                "review": {"rating": 3, "comment": "Arregló el problema rápido, aunque llegó un poco tarde."}
            },
            {
                "user": {"name": "Diego", "last_name": "Fernández", "email": "diego@web.com", "city": "Online", "phone": "+34600888999"},
                "profile": {"bio": "Freelance creando webs modernas y rápidas.", "description": "Desarrollo de landing pages y e-commerce para pequeños negocios.", "area": "Global (Online)", "is_home": False},
                "service": {"title": "Creación de Landing Page", "desc": "Diseño y programación de web corporativa de una sola página.", "price": 300.0, "duration": 1440, "subcat": "Desarrollo Web", "visible": True},
                "schedule": [{"day": 1, "start": time(10, 0), "end": time(18, 0)}, {"day": 2, "start": time(10, 0), "end": time(18, 0)}],
                "review": {"rating": 4, "comment": "Diseño muy limpio y moderno. Buena comunicación."}
            },
            {
                "user": {"name": "Sofía", "last_name": "Conti", "email": "sofia@idiomas.com", "city": "Online", "phone": "+34600999000"},
                "profile": {"bio": "Profesora nativa bilingüe.", "description": "Clases conversacionales de Inglés e Italiano para todos los niveles.", "area": "Global (Online)", "is_home": False},
                "service": {"title": "Clase de Conversación (Inglés/Italiano)", "desc": "Mejora tu fluidez y pronunciación con charlas dinámicas.", "price": 20.0, "duration": 60, "subcat": "Idiomas", "visible": True},
                "schedule": [{"day": 3, "start": time(17, 0), "end": time(21, 0)}, {"day": 4, "start": time(17, 0), "end": time(21, 0)}],
                "review": {"rating": 5, "comment": "Sus clases de italiano son súper divertidas y dinámicas."}
            }
        ]

        # Imágenes genéricas de Cloudinary para alternar
        covers = [
        "https://res.cloudinary.com/demo/image/upload/sample.jpg",
        "https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg",
        "https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg"
        ]
        profiles = [
            "https://res.cloudinary.com/demo/image/upload/w_200,h_200,c_fill,r_max/sample.jpg",
            "https://res.cloudinary.com/demo/image/upload/w_200,h_200,c_fill,r_max/sample.jpg",
            "https://res.cloudinary.com/demo/image/upload/w_200,h_200,c_fill,r_max/sample.jpg"
        ]

       # 5. Iterar sobre la lista y construir las tablas en cadena
        for data in providers_seed:
            # Usuario
            u = data["user"]
            new_user = User(
                name=u["name"], last_name=u["last_name"], email=u["email"],
                city=u["city"], phone=u["phone"],
                cover_image=random.choice(covers), profile_image=random.choice(profiles),
                password_hash=generate_password_hash("password123"),
                role="provider", is_provider=True, is_active=True
            )
            db.session.add(new_user)
            db.session.flush()  # Guarda temporalmente para obtener new_user.id

            # Perfil
            p = data["profile"]
            new_profile = ProviderProfile(
                user_id=new_user.id, verified=True,
                bio=p["bio"], description=p["description"],
                coverage_area=p["area"], is_home_service=p["is_home"]
            )
            db.session.add(new_profile)
            db.session.flush()  # Obtener new_profile.id

            # Horarios de disponibilidad (Availability)
            for sched in data["schedule"]:
                avail = Availability(
                    provider_id=new_profile.id,
                    day_of_week=sched["day"],
                    start_time=sched["start"],
                    end_time=sched["end"]
                )
                db.session.add(avail)

            # Servicio
            s = data["service"]
            new_service = Service(
                provider_id=new_profile.id,
                subcategory_id=subcategories[s["subcat"]].id,
                title=s["title"], description=s["desc"],
                price=s["price"], estimated_duration=s["duration"],
                visible=s["visible"]
            )
            db.session.add(new_service)
            db.session.flush()  # Obtener new_service.id

            # Cita Completada y Reseña
            r = data["review"]
            past_date = datetime.now() - timedelta(days=random.randint(1, 15))

            new_app = Appointment(
                client_id=client.id, service_id=new_service.id,
                date_time=past_date, status="completed"
            )
            db.session.add(new_app)
            db.session.flush()  # Obtener new_app.id

            new_review = Review(
                appointment_id=new_app.id, rating=r["rating"], comment=r["comment"]
            )
            db.session.add(new_review)

        # 6. Guardar todo definitivamente en la base de datos
        db.session.commit()
        print("¡Base de datos poblada exitosamente con 10 proveedores variados, horarios y reseñas!")

print("Seed completado correctamente.")
