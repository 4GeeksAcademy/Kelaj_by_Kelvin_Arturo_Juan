import random
from datetime import datetime, time, timedelta
from werkzeug.security import generate_password_hash

# Asegúrate de importar tu app y db correctamente según la estructura de tu proyecto
from app import app 
from api.models import db, User, ProviderProfile, Category, Subcategory, Service, Availability, Appointment, Review

# 1. CATÁLOGO AMPLIADO DE CATEGORÍAS Y SUBCATEGORÍAS
CATEGORIAS = {
    "Limpieza": {
        "desc": "Servicios de limpieza para hogares y empresas.",
        "subs": ["Limpieza del Hogar", "Limpieza de Oficinas"]
    },
    "Clases": {
        "desc": "Educación, idiomas y apoyo escolar.",
        "subs": ["Idiomas", "Apoyo Escolar", "Música"]
    },
    "Hogar": {
        "desc": "Reparaciones, mantenimiento y reformas.",
        "subs": ["Fontanería", "Electricidad", "Montaje de Muebles"]
    },
    "Cuidados": {
        "desc": "Atención y cuidado para tus seres queridos.",
        "subs": ["Cuidado de Ancianos", "Cuidado de Niños"]
    },
    "Mascotas": {
        "desc": "Paseos, guardería y adiestramiento.",
        "subs": ["Paseo de Perros", "Adiestramiento"]
    },
    "Belleza": {
        "desc": "Estética y cuidado personal a domicilio.",
        "subs": ["Peluquería", "Manicura y Pedicura"]
    },
    "Otros": {
        "desc": "Servicios variados y asistencia general.",
        "subs": ["Mudanzas", "Fotografía", "Informática"]
    }
}

# Lista completa de provincias de España sincronizada con el frontend
CIUDADES = [
    "Álava", "Albacete", "Alicante", "Almería", "Asturias", "Ávila", "Badajoz", "Barcelona",
    "Burgos", "Cáceres", "Cádiz", "Cantabria", "Castellón", "Ciudad Real", "Córdoba", "Cuenca",
    "Girona", "Granada", "Guadalajara", "Gipuzkoa", "Huelva", "Huesca", "Illes Balears", "Jaén",
    "A Coruña", "La Rioja", "Las Palmas", "León", "Lleida", "Lugo", "Madrid", "Málaga", "Murcia",
    "Navarra", "Ourense", "Palencia", "Pontevedra", "Salamanca", "Segovia", "Sevilla", "Soria",
    "Tarragona", "Santa Cruz de Tenerife", "Teruel", "Toledo", "Valencia", "Valladolid", "Bizkaia",
    "Zamora", "Zaragoza", "Ceuta", "Melilla"
]

def generate_seed():
    with app.app_context():
        print("🧹 Borrando base de datos existente...")
        db.drop_all()
        
        print("🏗️ Creando tablas limpias...")
        db.create_all()

        print("🗂️ Generando Categorías y Subcategorías...")
        subcategorias_db = {}
        for cat_name, cat_data in CATEGORIAS.items():
            categoria = Category(name=cat_name, description=cat_data["desc"])
            db.session.add(categoria)
            db.session.commit()

            for sub_name in cat_data["subs"]:
                sub = Subcategory(name=sub_name, category_id=categoria.id)
                db.session.add(sub)
                db.session.commit()
                subcategorias_db[sub_name] = sub.id

        print("👥 Creando Usuarios, Servicios y Horarios en toda España...")
        password = generate_password_hash("123456")
        proveedores_creados = []
        
        # 2. MEGA LISTA DE PERFILES (2 por Subcategoría)
        perfiles = [
            ("Maria", "Gomez", "Limpieza del Hogar", "Experta en limpieza profunda y organización de espacios. Llevo mis propios productos ecológicos.", "Limpieza general por horas", 15.00),
            ("Juan", "Perez", "Limpieza del Hogar", "Limpieza eficiente y de confianza para tu tranquilidad. Especialista en cocinas y baños.", "Limpieza a fondo de cocinas y baños", 18.00),
            ("Rosa", "Martinez", "Limpieza de Oficinas", "Mantenimiento impecable para espacios de trabajo y coworking.", "Limpieza de despachos", 20.00),
            ("Carlos", "Ruiz", "Limpieza de Oficinas", "Especialista en desinfección y limpieza corporativa de grandes superficies.", "Limpieza de locales comerciales", 22.00),
            ("Emma", "White", "Idiomas", "Profesora nativa de inglés con 5 años de experiencia preparatoria para Cambridge.", "Clases de conversación en Inglés", 20.00),
            ("Pablo", "Iglesias", "Idiomas", "Preparación para exámenes oficiales de francés. Metodología dinámica.", "Clases de Francés B1/B2", 18.00),
            ("Jorge", "Velasco", "Apoyo Escolar", "Profesor de matemáticas y física para ESO y Bachillerato. Resultados garantizados.", "Refuerzo de Ciencias exactas", 15.00),
            ("Ana", "Marin", "Apoyo Escolar", "Pedagoga experta en técnicas de estudio y problemas de aprendizaje.", "Ayuda con los deberes y lectoescritura", 14.00),
            ("Luis", "Fernandez", "Música", "Clases de guitarra clásica y moderna adaptadas a tu nivel y gustos musicales.", "Aprende guitarra desde cero", 22.00),
            ("Elena", "Soto", "Música", "Profesora de piano del conservatorio. Clases tanto para niños como adultos.", "Clases de piano a domicilio", 25.00),
            ("Carlos", "Lopez", "Fontanería", "Solución rápida a fugas, atascos y goteos. Herramientas profesionales.", "Reparación de tuberías y grifos", 40.00),
            ("Miguel", "Sanz", "Fontanería", "Especialista en instalación de calderas, radiadores y termos eléctricos.", "Instalación de fontanería general", 35.00),
            ("Antonio", "Perez", "Electricidad", "Electricista autorizado. Solución a apagones, cuadros eléctricos e iluminación.", "Revisión de cuadro eléctrico", 45.00),
            ("Carmen", "Diaz", "Electricidad", "Instaladora de sistemas domóticos (luces inteligentes, persianas, etc).", "Instalación de domótica básica", 30.00),
            ("Jose", "Garcia", "Montaje de Muebles", "Monto todo tipo de muebles rápido y sin daños.", "Montaje de armarios y camas", 25.00),
            ("Roberto", "Luna", "Montaje de Muebles", "Rápido y cuidadoso. Llevo mis propias herramientas, niveladores y anclajes.", "Instalación de estanterías pesadas", 20.00),
            ("Marta", "Suarez", "Cuidado de Ancianos", "Auxiliar de enfermería con gran empatía y vocación por el cuidado geriátrico.", "Acompañamiento y cuidados básicos", 15.00),
            ("Teresa", "Vidal", "Cuidado de Ancianos", "Especialista en atención a personas con movilidad reducida y alzheimer.", "Asistencia geriátrica especializada", 18.00),
            ("Laura", "Gomez", "Cuidado de Niños", "Estudiante de educación infantil, responsable y cariñosa.", "Canguro por las tardes", 12.00),
            ("Sofia", "Mendez", "Cuidado de Niños", "Babysitter bilingüe. Hago manualidades y juegos didácticos en inglés.", "Cuidado de niños en inglés", 15.00),
            ("Alex", "Torres", "Paseo de Perros", "Amante de los animales. Paseos largos y dinámicos para perros de alta energía.", "Paseo de 1 hora para perros enérgicos", 10.00),
            ("Daniel", "Rojas", "Paseo de Perros", "Paseador canino de confianza. Llevo bolsas y premios saludables.", "Paseo grupal de socialización", 8.00),
            ("Ruben", "Castro", "Adiestramiento", "Adiestrador canino en positivo. Adiós a los tirones de correa.", "Corrección de conductas", 30.00),
            ("Javier", "Morales", "Adiestramiento", "Ayudo a que tu cachorro aprenda órdenes básicas y a socializar correctamente.", "Adiestramiento de cachorros", 25.00),
            ("Sara", "Jimenez", "Peluquería", "Peluquera estilista con servicio a domicilio. Cortes modernos y tintes sin amoniaco.", "Corte y tinte a domicilio", 35.00),
            ("Lorena", "Gil", "Peluquería", "Especialista en recogidos para eventos, comuniones y bodas.", "Peinado y recogido para eventos", 40.00),
            ("Julia", "Navarro", "Manicura y Pedicura", "Uñas esculpidas, gel y esmaltado semipermanente con decoraciones exclusivas.", "Manicura semipermanente con Nail Art", 20.00),
            ("Valeria", "Molina", "Manicura y Pedicura", "Cuidado estético integral. Tratamientos de hidratación profunda para pies.", "Spa de pedicura", 25.00),
            ("Victor", "Ortega", "Mudanzas", "Furgoneta grande (15m3). Ayudo con la carga, descarga y protección de muebles.", "Portes y pequeñas mudanzas", 50.00),
            ("Mario", "Dominguez", "Mudanzas", "Servicio rápido de embalaje y transporte. Garantía de cuidado con objetos frágiles.", "Traslado de cajas y electrodomésticos", 40.00),
            ("Andrea", "Rios", "Fotografía", "Capturando los mejores momentos. Retratos, books personales y eventos.", "Sesión de fotos retrato/exterior", 60.00),
            ("Sergio", "Campos", "Fotografía", "Fotógrafo de producto y eventos familiares. Entrega digital rápida y editada.", "Cobertura fotográfica para cumpleaños", 80.00),
            ("David", "Ruiz", "Informática", "Arreglo ordenadores a domicilio, formateos y limpieza de virus.", "Formateo y mantenimiento de PC", 30.00),
            ("Paula", "Herrera", "Informática", "Configuración de redes, extensores de WiFi y recuperación de datos perdidos.", "Configuración de Wi-Fi y redes", 35.00)
        ]

        # Iterar sobre las plantillas y crear los registros
        for i, (nombre, apellido, sub_cat, bio, titulo_servicio, precio) in enumerate(perfiles):
            email = f"{nombre.lower()}.{apellido.lower()}@kelaj.com"
            ciudad = random.choice(CIUDADES) # Ahora seleccionará de forma aleatoria entre las 52 provincias
            
            # 1. Crear Usuario
            user = User(
                name=nombre,
                last_name=apellido,
                email=email,
                password_hash=password,
                role="provider",
                city=ciudad,
                phone=f"600100{i:03d}",
                is_provider=True,
                is_active=True,
                profile_image=f"https://ui-avatars.com/api/?name={nombre}+{apellido}&background=random"
            )
            db.session.add(user)
            db.session.commit()
            
            # 2. Crear Perfil de Proveedor
            provider = ProviderProfile(
                user_id=user.id,
                phone=user.phone,
                verified=random.choice([True, True, False]), # Más probabilidad de estar verificado
                bio=f"{sub_cat} profesional en {ciudad}.",
                description=bio,
                coverage_area=f"{ciudad} y alrededores",
                is_home_service=random.choice([True, False])
            )
            db.session.add(provider)
            db.session.commit()
            
            # 3. Crear el Servicio
            servicio = Service(
                provider_id=provider.id,
                subcategory_id=subcategorias_db[sub_cat],
                title=titulo_servicio,
                description=f"Ofrezco {titulo_servicio.lower()} con la mejor calidad y atención al detalle. Garantía de satisfacción.",
                price=precio,
                estimated_duration=60,
                visible=True
            )
            db.session.add(servicio)
            
            # 4. Crear Horarios (Lunes a Viernes de 9 a 18h)
            for dia in range(1, 6): 
                horario = Availability(
                    provider_id=provider.id,
                    day_of_week=dia,
                    start_time=time(9, 0),
                    end_time=time(18, 0)
                )
                db.session.add(horario)
            
            db.session.commit()
            proveedores_creados.append((user, servicio))

        print("⭐ Simulando reservas pasadas y reseñas cruzadas...")
        comentarios_positivos = [
            "Excelente profesional, muy puntual y educado.", 
            "El servicio fue impecable, lo recomiendo sin dudar.", 
            "Resolvió mi problema rapidísimo, un 10.", 
            "Muy amable y con gran conocimiento en su área.", 
            "Repetiré sin duda, gran calidad precio.",
            "Me encantó el trato y el resultado final."
        ]
        
        for cliente, _ in proveedores_creados:
            num_resenas = random.randint(1, 3)
            
            for _ in range(num_resenas):
                proveedores_disponibles = [p for p in proveedores_creados if p[0].id != cliente.id]
                proveedor_obj, servicio_obj = random.choice(proveedores_disponibles)
                
                dias_atras = random.randint(2, 60)
                fecha_cita = datetime.now() - timedelta(days=dias_atras)
                
                cita = Appointment(
                    client_id=cliente.id,
                    service_id=servicio_obj.id,
                    date_time=fecha_cita,
                    status="completed"
                )
                db.session.add(cita)
                db.session.commit()
                
                resena = Review(
                    appointment_id=cita.id,
                    rating=random.choice([4, 5, 5, 5]), 
                    comment=random.choice(comentarios_positivos)
                )
                db.session.add(resena)
                
                if random.choice([True, False]):
                    if proveedor_obj not in cliente.following:
                        cliente.following.append(proveedor_obj)

        db.session.commit()
        print("✅ ¡Base de datos regenerada y poblada con un catálogo masivo con éxito!")

if __name__ == "__main__":
    generate_seed()