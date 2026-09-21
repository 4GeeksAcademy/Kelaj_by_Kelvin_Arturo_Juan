import React, { useEffect, useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import "../styles/Home.css"

const categoryIcons = {
    "Clases": "🎓",
    "Reparaciones": "🔧",
    "Consultoría": "💼",
    "Salud": "🩺",
    "Hogar": "🏠",
    "Tecnología": "💻",
    "Limpieza": "🧹",
    "Transporte": "🚗",
    "Belleza": "💄",
    "Deportes": "⚽"
}

const provinciasEspaña = [
    "Álava", "Albacete", "Alicante", "Almería", "Asturias", "Ávila", "Badajoz", "Barcelona",
    "Burgos", "Cáceres", "Cádiz", "Cantabria", "Castellón", "Ciudad Real", "Córdoba", "Cuenca",
    "Girona", "Granada", "Guadalajara", "Gipuzkoa", "Huelva", "Huesca", "Illes Balears", "Jaén",
    "A Coruña", "La Rioja", "Las Palmas", "León", "Lleida", "Lugo", "Madrid", "Málaga", "Murcia",
    "Navarra", "Ourense", "Palencia", "Pontevedra", "Salamanca", "Segovia", "Sevilla", "Soria",
    "Tarragona", "Santa Cruz de Tenerife", "Teruel", "Toledo", "Valencia", "Valladolid", "Bizkaia",
    "Zamora", "Zaragoza", "Ceuta", "Melilla"
];

export const Home = () => {
    const [categories, setCategories] = useState([])
    const [services, setServices] = useState([])
    const [search, setSearch] = useState("")
    const [loading, setLoading] = useState(true)

    const [query, setQuery] = useState("")
    const [location, setLocation] = useState("")

    const navigate = useNavigate()

    const API = import.meta.env.VITE_BACKEND_URL

    useEffect(() => {
        const load = async () => {
            try {
                const [catsRes, servRes] = await Promise.all([
                    fetch(API + "/api/categories"),
                    fetch(API + "/api/services/featured")
                ])
                setCategories(await catsRes.json())
                setServices(await servRes.json())
            } catch (error) {
                console.error(error)
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [])

    const filteredServices = services.filter(s =>
        s.title.toLowerCase().includes(search.toLowerCase()) ||
        (s.subcategory && s.subcategory.name || "").toLowerCase().includes(search.toLowerCase())
    )

    const handleSearch = () => {
        const params = new URLSearchParams()
        if (query) params.append("q", query)
        if (location) params.append("location", location)

        navigate(`/search?${params.toString()}`)
    }

    return (
        <div>
            <header className="text-center mb-5 d-flex justify-content-center">
                <div className="bg-white rounded m-5">
                    <h1 className="fw-bold text dark mb-3 mt-3" style={{ fontSize: "clamp(2rem, 5vw, 3.5rem", letterSpacing: "-1px" }}>Todo lo que buscas, en un solo sitio.</h1>
                    <p className="text-secondary mx-auto" style={{ maxWidth: "700px", fontSize: "1.1rem" }}>
                        ¿Necesitas ayuda? Con <span className="fw-bold text-dark">Kelaj</span> puedes solucionarlo rápido y fácil: desde limpieza, reparaciones y mucho más.
                    </p>
                </div>
            </header>

            <section className="search-container mb-5">
                <div className="bg-white rounded-4 rounded-md-pill shadow-sm p-2 d-flex flex-column flex-md-row align-items-center">

                    <div className="flex-grow-1 w-100 position-relative py-2 py-md-0 px-3">
                        <input
                            type="text"
                            className="form-control border rounded-pill search-input bg-transparent text-center text-md-start"
                            placeholder="¿Qué servicio estás buscando?"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        />
                    </div>

                    <div className="d-none d-md-block border-end py-3" style={{ borderColor: "#eaeaea !important" }}></div>

                    <hr className="d-md-none w-100 my-1 text-light"></hr>

                    <div className="flex-grow-1 w-100 position-relative py-2 py-md-0 px-3">
                        <select
                            className="form-select border rounded-pill search-input bg-transparent text-center text-md-start"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                            style={{ cursor: "pointer", appearance: "none" }}
                        >
                            <option value="">Ciudad / Provincia</option>
                            {provinciasEspaña.map(provincia => (
                                <option key={provincia} value={provincia.toLowerCase()}>{provincia}</option>
                            ))}
                        </select>
                    </div>

                    <div className="w-100 text-end px-2" style={{ maxWidth: "fit-content" }}>
                        <button
                            className="btn btn-primary rounded-pill w-100 px-4 py-2 fw-semibold d-flex align-items-center justify-content-center gap-2"
                            onClick={handleSearch}
                        >
                            <i className="bi bi-search"></i> Buscar
                        </button>
                    </div>
                </div>
            </section>


            <section className="d-flex flex-column flex-sm-row justify-content-center align-items-center gap-3 mb-5 pb-4">
                <a href="#" className="btn btn-primary rounded-pill px-4 py-2 fw-semibold w-100" style={{ maxWidth: "250px" }}>
                    Unirme como proveedor
                </a>
                <Link to="/catalog" className="btn btn-green rounded-pill px-4 py-2 fw-semibold w-100" style={{ maxWidth: "250px" }}>
                    Ver todos los servicios <i className="bi bi-chevron-right ms-1" style={{ fontSize: "0.8em" }}></i>
                </Link>
            </section>

            <section className="text-center mt-4 mb-5 pb-5">
                <h3 className="fw-bold mb-4">Nuestras categorías</h3>

                <div className="row justify-content-center g-3 g-md-4 max-w-4xl mx-auto" style={{ maxWidth: "800px" }}>
                    <div className="col-6 col-md-3">
                        <div className="card category-card bg-white border border-light-subtle rounded-3 h-100 py-4 shadow-sm">
                            <div className="card-body d-flex flex-column align-items-center justify-content-center p-2">
                                <i className="bi bi-house fs-1 text-dark mb-2"></i>
                                <h6 className="fw-semibold text-dark mb-0 fs-6">Reparaciones</h6>
                            </div>
                        </div>
                    </div>

                    <div className="col-6 col-md-3">
                        <div className="card category-card bg-white border border-light-subtle rounded-3 h-100 py-4 shadow-sm">
                            <div className="card-body d-flex flex-column align-items-center justify-content-center p-2">
                                <i className="bi bi-house fs-1 text-dark mb-2"></i>
                                <h6 className="fw-semibold text-dark mb-0 fs-6">Belleza</h6>
                            </div>
                        </div>
                    </div>

                    <div className="col-6 col-md-3">
                        <div className="card category-card bg-white border border-light-subtle rounded-3 h-100 py-4 shadow-sm">
                            <div className="card-body d-flex flex-column align-items-center justify-content-center p-2">
                                <i className="bi bi-house fs-1 text-dark mb-2"></i>
                                <h6 className="fw-semibold text-dark mb-0 fs-6">Clases</h6>
                            </div>
                        </div>
                    </div>

                    <div className="col-6 col-md-3">
                        <div className="card category-card bg-white border border-light-subtle rounded-3 h-100 py-4 shadow-sm">
                            <div className="card-body d-flex flex-column align-items-center justify-content-center p-2">
                                <i className="bi bi-house fs-1 text-dark mb-2"></i>
                                <h6 className="fw-semibold text-dark mb-0 fs-6">Cuidados</h6>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            <section>
                <div className="row justify-content-center g-3 g-md-4 max-w-4xl mx-auto" style={{ maxWidth: "800px" }}>
                    <div className="col-6 col-md-3">
                        <div className="card category-card bg-white border border-light-subtle rounded-3 h-100 py-4 shadow-sm">
                            <div className="card-body d-flex flex-column align-items-center justify-content-center p-2">
                                <i className="bi bi-house fs-1 text-dark mb-2"></i>
                                <h6 className="fw-semibold text-dark mb-0 fs-6">Mas...</h6>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="container pb-5">
                <h2 className="mb-4" style={{ fontWeight: 700 }}>Servicios destacados</h2>
                <div className="row">
                </div>
            </section>

            <div className="row g-4 m-4">

                {/* Tarjeta 1: Curso de Inglés */}
                <div className="col-12 col-md-6 col-lg-3">
                    <div className="card h-100 shadow-sm border-0 hover-card" style={{ borderRadius: 14 }}>
                        <div style={{ height: 160, position: "relative" }}>
                            {/* Imagen de muestra (puedes cambiar la URL por tus imágenes locales) */}
                            <img
                                src="https://images.unsplash.com/photo-1546410531-b4c4fa773d57?w=500&q=80"
                                alt="Curso de Inglés"
                                style={{ width: "100%", height: "100%", objectFit: "cover", borderTopLeftRadius: 14, borderTopRightRadius: 14 }}
                            />
                            {/* Badge flotante de valoración */}
                            <span className="badge bg-white text-dark position-absolute top-0 end-0 m-2 shadow-sm px-2 py-1 fs-6">
                                <i className="bi bi-star-fill text-warning me-1"></i> 4.9
                            </span>
                        </div>
                        <div className="card-body d-flex flex-column">
                            <span className="text-primary fw-bold text-uppercase" style={{ fontSize: "0.75rem", letterSpacing: "1px" }}>Clases</span>
                            <h6 className="card-title fw-bold mt-2 mb-2 lh-base">
                                Clases de Inglés (Conversación y B2/C1)
                            </h6>
                            <p className="text-muted small mb-3">
                                <i className="bi bi-geo-alt-fill me-1"></i> Remoto / Online
                            </p>
                            <div className="mt-auto pt-3 border-top d-flex justify-content-between align-items-center">
                                <div className="d-flex align-items-center gap-2">
                                    <img src="https://ui-avatars.com/api/?name=Emma+W&background=e0e7ff&color=4f46e5" alt="Profesor" className="rounded-circle" style={{ width: 28, height: 28 }} />
                                    <small className="text-muted fw-semibold">Emma W.</small>
                                </div>
                                <span style={{ fontWeight: 700, fontSize: "1.15rem", color: "#4f46e5" }}>
                                    15€<span className="text-muted fw-normal" style={{ fontSize: "0.8rem" }}>/h</span>
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tarjeta 2: Manicura */}
                <div className="col-12 col-md-6 col-lg-3">
                    <div className="card h-100 shadow-sm border-0 hover-card" style={{ borderRadius: 14 }}>
                        <div style={{ height: 160, position: "relative" }}>
                            <img
                                src="https://images.unsplash.com/photo-1522337660859-02fbefca4702?w=500&q=80"
                                alt="Manicura"
                                style={{ width: "100%", height: "100%", objectFit: "cover", borderTopLeftRadius: 14, borderTopRightRadius: 14 }}
                            />
                            <span className="badge bg-white text-dark position-absolute top-0 end-0 m-2 shadow-sm px-2 py-1 fs-6">
                                <i className="bi bi-star-fill text-warning me-1"></i> 5.0
                            </span>
                        </div>
                        <div className="card-body d-flex flex-column">
                            <span className="text-danger fw-bold text-uppercase" style={{ fontSize: "0.75rem", letterSpacing: "1px" }}>Belleza</span>
                            <h6 className="card-title fw-bold mt-2 mb-2 lh-base">
                                Manicura semipermanente y Nail Art
                            </h6>
                            <p className="text-muted small mb-3">
                                <i className="bi bi-geo-alt-fill me-1"></i> Madrid Centro (A domicilio)
                            </p>
                            <div className="mt-auto pt-3 border-top d-flex justify-content-between align-items-center">
                                <div className="d-flex align-items-center gap-2">
                                    <img src="https://ui-avatars.com/api/?name=Laura+G&background=fee2e2&color=dc2626" alt="Profesional" className="rounded-circle" style={{ width: 28, height: 28 }} />
                                    <small className="text-muted fw-semibold">Laura G.</small>
                                </div>
                                <span style={{ fontWeight: 700, fontSize: "1.15rem", color: "#4f46e5" }}>
                                    25€
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tarjeta 3: Reparaciones */}
                <div className="col-12 col-md-6 col-lg-3">
                    <div className="card h-100 shadow-sm border-0 hover-card" style={{ borderRadius: 14 }}>
                        <div style={{ height: 160, position: "relative" }}>
                            <img
                                src="https://images.unsplash.com/photo-1581092921461-eab62e97a780?w=500&q=80"
                                alt="Reparaciones"
                                style={{ width: "100%", height: "100%", objectFit: "cover", borderTopLeftRadius: 14, borderTopRightRadius: 14 }}
                            />
                            <span className="badge bg-white text-dark position-absolute top-0 end-0 m-2 shadow-sm px-2 py-1 fs-6">
                                <i className="bi bi-star-fill text-warning me-1"></i> 4.7
                            </span>
                        </div>
                        <div className="card-body d-flex flex-column">
                            <span className="text-success fw-bold text-uppercase" style={{ fontSize: "0.75rem", letterSpacing: "1px" }}>Hogar</span>
                            <h6 className="card-title fw-bold mt-2 mb-2 lh-base">
                                Instalación y reparación de electrodomésticos
                            </h6>
                            <p className="text-muted small mb-3">
                                <i className="bi bi-geo-alt-fill me-1"></i> Comunidad de Madrid
                            </p>
                            <div className="mt-auto pt-3 border-top d-flex justify-content-between align-items-center">
                                <div className="d-flex align-items-center gap-2">
                                    <img src="https://ui-avatars.com/api/?name=Carlos+M&background=dcfce7&color=16a34a" alt="Técnico" className="rounded-circle" style={{ width: 28, height: 28 }} />
                                    <small className="text-muted fw-semibold">Carlos M.</small>
                                </div>
                                <span style={{ fontWeight: 700, fontSize: "1.15rem", color: "#4f46e5" }}>
                                    40€
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tarjeta 4: Entrenador Personal */}
                <div className="col-12 col-md-6 col-lg-3">
                    <div className="card h-100 shadow-sm border-0 hover-card" style={{ borderRadius: 14 }}>
                        <div style={{ height: 160, position: "relative" }}>
                            <img
                                src="https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=500&q=80"
                                alt="Deportes"
                                style={{ width: "100%", height: "100%", objectFit: "cover", borderTopLeftRadius: 14, borderTopRightRadius: 14 }}
                            />
                            <span className="badge bg-white text-dark position-absolute top-0 end-0 m-2 shadow-sm px-2 py-1 fs-6">
                                <i className="bi bi-star-half text-warning me-1"></i> 4.5
                            </span>
                        </div>
                        <div className="card-body d-flex flex-column">
                            <span className="text-info fw-bold text-uppercase" style={{ fontSize: "0.75rem", letterSpacing: "1px" }}>Deportes</span>
                            <h6 className="card-title fw-bold mt-2 mb-2 lh-base">
                                Entrenador personal e hipertrofia
                            </h6>
                            <p className="text-muted small mb-3">
                                <i className="bi bi-geo-alt-fill me-1"></i> Gimnasios / Aire libre
                            </p>
                            <div className="mt-auto pt-3 border-top d-flex justify-content-between align-items-center">
                                <div className="d-flex align-items-center gap-2">
                                    <img src="https://ui-avatars.com/api/?name=David+R&background=cffafe&color=0891b2" alt="Entrenador" className="rounded-circle" style={{ width: 28, height: 28 }} />
                                    <small className="text-muted fw-semibold">David R.</small>
                                </div>
                                <span style={{ fontWeight: 700, fontSize: "1.15rem", color: "#4f46e5" }}>
                                    20€<span className="text-muted fw-normal" style={{ fontSize: "0.8rem" }}>/sesión</span>
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}