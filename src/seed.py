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
    "Informática": {
        "desc": "Soporte técnico, programación, redes y soluciones digitales.",
        "subs": [
            "Reparación de Ordenadores",
            "Desarrollo Web y Programación",
            "Redes y Ciberseguridad",
            "Soporte Técnico y Software"
        ]
    },
    "Otros": {
        "desc": "Servicios variados y asistencia general.",
        "subs": ["Mudanzas", "Fotografía"]
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

        # 2. MEGA LISTA DE PERFILES (4 por Subcategoría existente + 3 por cada Subcategoría de Informática)
        perfiles = [
            # --- LIMPIEZA DEL HOGAR ---
            ("Maria", "Gomez", "Limpieza del Hogar", "Experta en limpieza profunda y organización de espacios. Llevo mis propios productos ecológicos.", "Limpieza general por horas", 15.00),
            ("Juan", "Perez", "Limpieza del Hogar", "Limpieza eficiente y de confianza para tu tranquilidad. Especialista en cocinas y baños.", "Limpieza a fondo de cocinas y baños", 18.00),
            ("Lucia", "Serrano", "Limpieza del Hogar", "Especialista en limpieza post-mudanza y puesta a punto de viviendas.", "Limpieza integral de pisos y casas", 16.00),
            ("Fernando", "Blanco", "Limpieza del Hogar", "Limpieza detallada de cristales, persianas, terrazas y tapicerías a domicilio.", "Limpieza de cristales y tapicerías", 17.00),

            # --- LIMPIEZA DE OFICINAS ---
            ("Rosa", "Martinez", "Limpieza de Oficinas", "Mantenimiento impecable para espacios de trabajo y coworking.", "Limpieza de despachos", 20.00),
            ("Carlos", "Ruiz", "Limpieza de Oficinas", "Especialista en desinfección y limpieza corporativa de grandes superficies.", "Limpieza de locales comerciales", 22.00),
            ("Beatriz", "Molina", "Limpieza de Oficinas", "Servicio discreto y flexible fuera del horario de oficina para empresas.", "Mantenimiento higiénico de oficinas", 19.00),
            ("Alberto", "Suarez", "Limpieza de Oficinas", "Tratamiento de suelos delicados y desinfección de equipos de oficina.", "Desinfección de clínicas y despachos", 24.00),

            # --- IDIOMAS ---
            ("Emma", "White", "Idiomas", "Profesora nativa de inglés con 5 años de experiencia preparatoria para Cambridge.", "Clases de conversación en Inglés", 20.00),
            ("Pablo", "Iglesias", "Idiomas", "Preparación para exámenes oficiales de francés. Metodología dinámica.", "Clases de Francés B1/B2", 18.00),
            ("Claire", "Dubois", "Idiomas", "Traductora y profesora nativa de francés e inglés para negocios y viajes.", "Francés e Inglés comercial", 22.00),
            ("Marco", "Rossi", "Idiomas", "Profesor nativo de italiano. Aprende el idioma de forma práctica y fluida.", "Clases de Italiano todos los niveles", 17.00),

            # --- APOYO ESCOLAR ---
            ("Jorge", "Velasco", "Apoyo Escolar", "Profesor de matemáticas y física para ESO y Bachillerato. Resultados garantizados.", "Refuerzo de Ciencias exactas", 15.00),
            ("Ana", "Marin", "Apoyo Escolar", "Pedagoga experta en técnicas de estudio y problemas de aprendizaje.", "Ayuda con los deberes y lectoescritura", 14.00),
            ("Hector", "Cano", "Apoyo Escolar", "Ingeniero imparte clases particulares de química, matemáticas y dibujo técnico.", "Preparación intensiva para EBAU / Selectividad", 18.00),
            ("Nuria", "Pascual", "Apoyo Escolar", "Graduada en Filología Hispánica. Refuerzo en lengua, sintaxis, historia y comentario de texto.", "Clases de Humanidades y Lengua", 15.00),

            # --- MÚSICA ---
            ("Luis", "Fernandez", "Música", "Clases de guitarra clásica y moderna adaptadas a tu nivel y gustos musicales.", "Aprende guitarra desde cero", 22.00),
            ("Elena", "Soto", "Música", "Profesora de piano del conservatorio. Clases tanto para niños como adultos.", "Clases de piano a domicilio", 25.00),
            ("Gabriel", "Nunez", "Música", "Baterista y productor musical. Ritmo, lectura musical y producción básica.", "Clases de batería y percusión", 23.00),
            ("Clara", "Vega", "Música", "Cantante lírica y moderna. Técnica vocal, respiración y afinación sin dañar la voz.", "Clases de canto y técnica vocal", 26.00),

            # --- FONTANERÍA ---
            ("Carlos", "Lopez", "Fontanería", "Solución rápida a fugas, atascos y goteos. Herramientas profesionales.", "Reparación de tuberías y grifos", 40.00),
            ("Miguel", "Sanz", "Fontanería", "Especialista en instalación de calderas, radiadores y termos eléctricos.", "Instalación de fontanería general", 35.00),
            ("Raul", "Fuentes", "Fontanería", "Desatascos urgentes, cambio de cisternas y renovación de grifería de cocina y baño.", "Desatascos y cambio de sanitarios", 38.00),
            ("Oscar", "Carrasco", "Fontanería", "Técnico especialista en localización de fugas sin obra y termos de bajo consumo.", "Mantenimiento e instalación de termos", 42.00),

            # --- ELECTRICIDAD ---
            ("Antonio", "Perez", "Electricidad", "Electricista autorizado. Solución a apagones, cuadros eléctricos e iluminación.", "Revisión de cuadro eléctrico", 45.00),
            ("Carmen", "Diaz", "Electricidad", "Instaladora de sistemas domóticos (luces inteligentes, persianas, etc).", "Instalación de domótica básica", 30.00),
            ("Ivan", "Guerrero", "Electricidad", "Boletines eléctricos, cambio de cableado antiguo e instalación de enchufes.", "Instalación de iluminación LED y enchufes", 35.00),
            ("Natalia", "Cortes", "Electricidad", "Especialista en eficiencia energética y puntos de recarga para vehículos eléctricos.", "Revisión eléctrica y ahorro energético", 40.00),

            # --- MONTAJE DE MUEBLES ---
            ("Jose", "Garcia", "Montaje de Muebles", "Monto todo tipo de muebles rápido y sin daños.", "Montaje de armarios y camas", 25.00),
            ("Roberto", "Luna", "Montaje de Muebles", "Rápido y cuidadoso. Llevo mis propias herramientas, niveladores y anclajes.", "Instalación de estanterías pesadas", 20.00),
            ("Samuel", "Garrido", "Montaje de Muebles", "Experto en mobiliario tipo IKEA, Leroy Merlin y cocinas modulares.", "Montaje de muebles de salón y oficina", 22.00),
            ("Cristina", "Lozano", "Montaje de Muebles", "Colocación de soportes de TV en pared, cortinas, estores y espejos de baño.", "Anclaje de muebles y accesorios a pared", 24.00),

            # --- CUIDADO DE ANCIANOS ---
            ("Marta", "Suarez", "Cuidado de Ancianos", "Auxiliar de enfermería con gran empatía y vocación por el cuidado geriátrico.", "Acompañamiento y cuidados básicos", 15.00),
            ("Teresa", "Vidal", "Cuidado de Ancianos", "Especialista en atención a personas con movilidad reducida y alzheimer.", "Asistencia geriátrica especializada", 18.00),
            ("Pilar", "Caballero", "Cuidado de Ancianos", "Acompañamiento a citas médicas, paseos diarios y control de medicación.", "Cuidado diurno y acompañamiento", 16.00),
            ("Manuel", "Reyes", "Cuidado de Ancianos", "Cuidador titulado con amplia experiencia en asistencia nocturna y movilizaciones.", "Asistencia domiciliaria y recados", 17.00),

            # --- CUIDADO DE NIÑOS ---
            ("Laura", "Gomez", "Cuidado de Niños", "Estudiante de educación infantil, responsable y cariñosa.", "Canguro por las tardes", 12.00),
            ("Sofia", "Mendez", "Cuidado de Niños", "Babysitter bilingüe. Hago manualidades y juegos didácticos en inglés.", "Cuidado de niños en inglés", 15.00),
            ("Irene", "Hidalgo", "Cuidado de Niños", "Monitora de tiempo libre y primeros auxilios pediátricos. Recogida del colegio.", "Recogida escolar y cuidado infantil", 13.00),
            ("Rocio", "Santana", "Cuidado de Niños", "Experiencia con bebés y niños pequeños. Rutinas de sueño, comidas y juegos.", "Cuidado infantil de fin de semana", 14.00),

            # --- PASEO DE PERROS ---
            ("Alex", "Torres", "Paseo de Perros", "Amante de los animales. Paseos largos y dinámicos para perros de alta energía.", "Paseo de 1 hora para perros enérgicos", 10.00),
            ("Daniel", "Rojas", "Paseo de Perros", "Paseador canino de confianza. Llevo bolsas y premios saludables.", "Paseo grupal de socialización", 8.00),
            ("Mateo", "Aguilar", "Paseo de Perros", "Paseos individuales adaptados a perros senior o con necesidades especiales.", "Paseo tranquilo personalizado", 11.00),
            ("Alba", "Crespo", "Paseo de Perros", "Rutas por parques y zonas verdes con envío de ubicación y fotos en tiempo real.", "Paseo canino por parques", 9.00),

            # --- ADIESTRAMIENTO ---
            ("Ruben", "Castro", "Adiestramiento", "Adiestrador canino en positivo. Adiós a los tirones de correa.", "Corrección de conductas", 30.00),
            ("Javier", "Morales", "Adiestramiento", "Ayudo a que tu cachorro aprenda órdenes básicas y a socializar correctamente.", "Adiestramiento de cachorros", 25.00),
            ("Gonzalo", "Pastor", "Adiestramiento", "Etólogo canino especialista en ansiedad por separación y reactividad.", "Terapia de comportamiento canino", 35.00),
            ("Miriam", "Bravo", "Adiestramiento", "Educación canina familiar y obediencia básica sin estrés para tu mascota.", "Sesión de obediencia en casa", 28.00),

            # --- PELUQUERÍA ---
            ("Sara", "Jimenez", "Peluquería", "Peluquera estilista con servicio a domicilio. Cortes modernos y tintes sin amoniaco.", "Corte y tinte a domicilio", 35.00),
            ("Lorena", "Gil", "Peluquería", "Especialista en recogidos para eventos, comuniones y bodas.", "Peinado y recogido para eventos", 40.00),
            ("Noelia", "Mora", "Peluquería", "Experta en mechas balayage, hidratación capilar y alisados de keratina.", "Tratamiento de keratina y corte", 45.00),
            ("Alvaro", "Vicente", "Peluquería", "Barbero y estilista masculino a domicilio. Corte degradado y arreglo de barba.", "Corte de caballero y barbería", 22.00),

            # --- MANICURA Y PEDICURA ---
            ("Julia", "Navarro", "Manicura y Pedicura", "Uñas esculpidas, gel y esmaltado semipermanente con decoraciones exclusivas.", "Manicura semipermanente con Nail Art", 20.00),
            ("Valeria", "Molina", "Manicura y Pedicura", "Cuidado estético integral. Tratamientos de hidratación profunda para pies.", "Spa de pedicura", 25.00),
            ("Claudia", "Romero", "Manicura y Pedicura", "Especialista en uñas acrílicas, reconstrucción y manicura rusa con torno.", "Manicura rusa y refuerzo en gel", 24.00),
            ("Diana", "Soler", "Manicura y Pedicura", "Servicio completo de manos y pies a domicilio con material esterilizado.", "Pack manicura y pedicura express", 32.00),

            # --- INFORMÁTICA: REPARACIÓN DE ORDENADORES ---
            ("David", "Ruiz", "Reparación de Ordenadores", "Arreglo ordenadores a domicilio, formateos y limpieza de virus.", "Formateo y mantenimiento de PC", 30.00),
            ("Adrian", "Delgado", "Reparación de Ordenadores", "Técnico de hardware. Cambio de pasta térmica, ampliación de RAM/SSD y montaje de PCs a medida.", "Optimización con SSD y limpieza interna", 35.00),
            ("Silvia", "Montero", "Reparación de Ordenadores", "Especialista en reparación de portátiles y equipos Apple (MacBook e iMac).", "Diagnóstico y reparación de portátiles", 40.00),

            # --- INFORMÁTICA: DESARROLLO WEB Y PROGRAMACIÓN ---
            ("Alejandro", "Mendoza", "Desarrollo Web y Programación", "Desarrollador Full Stack con experiencia en React, Python y bases de datos.", "Creación y diseño de páginas web", 50.00),
            ("Carla", "Esteban", "Desarrollo Web y Programación", "Especialista en tiendas online (WordPress, WooCommerce y Shopify) y optimización SEO.", "Diseño de tienda online y e-commerce", 45.00),
            ("Marcos", "Acosta", "Desarrollo Web y Programación", "Programador de scripts de automatización, APIs REST y tutorías de programación.", "Automatización de procesos y código a medida", 40.00),

            # --- INFORMÁTICA: REDES Y CIBERSEGURIDAD ---
            ("Paula", "Herrera", "Redes y Ciberseguridad", "Configuración de redes, extensores de WiFi y recuperación de datos perdidos.", "Configuración de Wi-Fi y redes", 35.00),
            ("Nicolas", "Gallardo", "Redes y Ciberseguridad", "Administrador de sistemas. Instalación de redes Mesh, VPN para teletrabajo y servidores NAS.", "Instalación de red Mesh y copias de seguridad", 45.00),
            ("Eva", "Pardo", "Redes y Ciberseguridad", "Consultora de ciberseguridad doméstica y PYME. Eliminación de malware y protección de cuentas.", "Auditoría de seguridad y limpieza de malware", 50.00),

            # --- INFORMÁTICA: SOPORTE TÉCNICO Y SOFTWARE ---
            ("Hugo", "Ibanez", "Soporte Técnico y Software", "Asistencia informática a domicilio o en remoto. Instalación de Windows, Office e impresoras.", "Configuración de equipos e impresoras", 25.00),
            ("Celia", "Lara", "Soporte Técnico y Software", "Recuperación de archivos borrados en discos duros y configuración de correo corporativo.", "Recuperación de datos y soporte de software", 38.00),
            ("Bruno", "Salazar", "Soporte Técnico y Software", "Clases de informática para mayores y puesta a punto de móviles, tablets y Smart TV.", "Puesta a punto de dispositivos y asesoría digital", 22.00),

            # --- MUDANZAS ---
            ("Victor", "Ortega", "Mudanzas", "Furgoneta grande (15m3). Ayudo con la carga, descarga y protección de muebles.", "Portes y pequeñas mudanzas", 50.00),
            ("Mario", "Dominguez", "Mudanzas", "Servicio rápido de embalaje y transporte. Garantía de cuidado con objetos frágiles.", "Traslado de cajas y electrodomésticos", 40.00),
            ("Tomas", "Benitez", "Mudanzas", "Mudanzas completas de pisos y oficinas con desmontaje y montaje de mobiliario.", "Mudanza integral con operarios", 65.00),
            ("Enrique", "Vargas", "Mudanzas", "Portes urgentes en el mismo día, recogidas en tiendas de muebles y trasteros.", "Portes rápidos en furgoneta", 35.00),

            # --- FOTOGRAFÍA ---
            ("Andrea", "Rios", "Fotografía", "Capturando los mejores momentos. Retratos, books personales y eventos.", "Sesión de fotos retrato/exterior", 60.00),
            ("Sergio", "Campos", "Fotografía", "Fotógrafo de producto y eventos familiares. Entrega digital rápida y editada.", "Cobertura fotográfica para cumpleaños", 80.00),
            ("Marina", "Arias", "Fotografía", "Fotografía inmobiliaria para alquileres o ventas y reportajes corporativos.", "Fotografía de interiores y negocios", 70.00),
            ("Diego", "Pena", "Fotografía", "Sesiones familiares, maternidad y mascotas al aire libre con luz natural.", "Book fotográfico familiar o mascotas", 55.00)
        ]

        # Iterar sobre las plantillas y crear los registros
        for i, (nombre, apellido, sub_cat, bio, titulo_servicio, precio) in enumerate(perfiles):
            email = f"{nombre.lower()}.{apellido.lower()}@kelaj.com"
            ciudad = random.choice(CIUDADES)

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
                verified=random.choice([True, True, False]),
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

        print("⭐ Simulando reservas pasadas y reseñas garantizadas para cada servicio...")
        comentarios_positivos = [
            "Excelente profesional, muy puntual y educado.",
            "El servicio fue impecable, lo recomiendo sin dudar.",
            "Resolvió mi problema rapidísimo, un 10.",
            "Muy amable y con gran conocimiento en su área.",
            "Repetiré sin duda, gran calidad precio.",
            "Me encantó el trato y el resultado final.",
            "Trabajo súper limpio, rápido y muy profesional.",
            "Superó mis expectativas, atención de primera."
        ]

        # Garantizamos que CADA servicio reciba entre 2 y 3 reseñas de otros usuarios distintos
        for proveedor_obj, servicio_obj in proveedores_creados:
            num_resenas = random.randint(2, 3)
            clientes_disponibles = [u for u, _ in proveedores_creados if u.id != proveedor_obj.id]
            clientes_seleccionados = random.sample(clientes_disponibles, num_resenas)

            for cliente in clientes_seleccionados:
                dias_atras = random.randint(2, 60)
                fecha_cita = datetime.now() - timedelta(days=dias_atras)

                cita = Appointment(
                    client_id=cliente.id,
                    service_id=servicio_obj.id,
                    date_time=fecha_cita,
                    status="completed"
                )
                db.session.add(cita)
                db.session.flush()

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
        print(f"✅ ¡Base de datos regenerada con {len(proveedores_creados)} proveedores, servicios y sus reseñas con éxito!")


if __name__ == "__main__":
    generate_seed()