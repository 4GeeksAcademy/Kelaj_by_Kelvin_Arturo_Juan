import React, { useEffect, useState } from "react"
import "../styles/Search.css"

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

export const Home = () => {
    const [categories, setCategories] = useState([])
    const [services, setServices] = useState([])
    const [search, setSearch] = useState("")
    const [loading, setLoading] = useState(true)

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

    return (
        <div>
            <header className="text-center mb-5">
                <h1 className="fw-bold text dark mb-3" style={{ fontSize: "clamp(2rem, 5vw, 3.5rem", letterSpacing: "-1px" }}>Todo lo que buscas, en un solo sitio.</h1>
                <p className="text-secondary mx-auto" style={{maxWidth: "700px", fontSize:"1.1rem"}}>
                    ¿Necesitas ayuda? Con <span className="fw-bold text-dark">Jake</span> puedes solucionarlo rápido y fácil: desde limpieza, reparaciones y mucho más.
                </p>
            </header>

            <section className="search-container mb-5">
                    <div className="bg-white rounded-4 rounded-md-pill shadow-sm p-2 d-flex flex-column flex-md-row align-items-center">

                        <div className="flex-grow-1 w-100 position-relative py-2 py-md-0 px-3">
                            <input type="text" className="form-control border-0 search-input bg-transparent text-center text-md-start" placeholder="¿Qué servicio estás buscando?"></input>
                        </div>

                        <div className="d-none d-md-block border-end py-3" style={{borderColor: "#eaeaea !important"}}></div>

                        <hr className="d-md-none w-100 my-1 text-light"></hr>

                        <div className="flex-grow-1 w-100 position-relative py-2 py-md-0 px-3">
                            <input type="text" className="form-control border-0 search-input bg-transparent text-center text-md-start" placeholder="Ciudad"></input>
                        </div>

                        <div className="w-100 text-end px-2" style={{maxWidth: "fit-content"}}>
                            <button className="btn btn-primary rounded-pill w-100 px-4 py-2 fw-semibold d-flex align-items-center justify-content-center gap-2">
                                <i className="bi bi-search"></i> Buscar
                            </button>
                        </div>
                    </div>
                </section>


            <section style={{ background: "linear-gradient(135deg, #4f46e5, #7c3aed)", color: "white", padding: "70px 16px", textAlign: "center" }}>
                <h1 style={{ fontSize: "2.8rem", fontWeight: 700 }}>Encuentra el servicio que necesitas</h1>
                <p style={{ fontSize: "1.15rem", opacity: 0.9 }}>Clases, reparaciones, consultoría y más — cerca de ti.</p>
                <div className="container" style={{ maxWidth: 560, marginTop: 24 }}>
                    <div className="input-group">
                        <input
                            type="text"
                            className="form-control form-control-lg"
                            placeholder="¿Qué servicio buscas?"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                        <button className="btn btn-warning btn-lg" type="button">Buscar</button>
                    </div>
                </div>
            </section>

            <section className="container py-5">
                <h2 className="mb-4" style={{ fontWeight: 700 }}>Categorías</h2>
                <div className="row">
                    {loading ? (
                        <p className="text-muted">Cargando categorías...</p>
                    ) : categories.length === 0 ? (
                        <p className="text-muted">Aún no hay categorías. Crea algunas en el backend.</p>
                    ) : categories.map(cat => (
                        <div key={cat.id} className="col-6 col-md-4 col-lg-3 mb-3">
                            <div className="card h-100 text-center shadow-sm border-0" style={{ borderRadius: 14, cursor: "pointer" }}>
                                <div className="card-body d-flex flex-column align-items-center justify-content-center">
                                    <span style={{ fontSize: "2.4rem" }}>{categoryIcons[cat.name] || "✨"}</span>
                                    <h5 className="mt-2 mb-0">{cat.name}</h5>
                                    <small className="text-muted">{cat.subcategories.length} servicios</small>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            <section className="container pb-5">
                <h2 className="mb-4" style={{ fontWeight: 700 }}>Servicios destacados</h2>
                <div className="row">
                    {loading ? (
                        <p className="text-muted">Cargando servicios...</p>
                    ) : filteredServices.length === 0 ? (
                        <p className="text-muted">{search ? "No se encontraron servicios con esa búsqueda." : "Aún no hay servicios destacados."}</p>
                    ) : filteredServices.map(s => (
                        <div key={s.id} className="col-12 col-md-6 col-lg-4 mb-3">
                            <div className="card h-100 shadow-sm border-0" style={{ borderRadius: 14 }}>
                                <div style={{ height: 140, background: "linear-gradient(120deg, #e0e7ff, #f3e8ff)", display: "flex", alignItems: "center", justifyContent: "center", borderTopLeftRadius: 14, borderTopRightRadius: 14 }}>
                                    {s.media[0] ? (
                                        <img src={s.media[0].url} alt={s.title} style={{ width: "100%", height: 140, objectFit: "cover", borderTopLeftRadius: 14, borderTopRightRadius: 14 }} />
                                    ) : (
                                        <span style={{ fontSize: "3rem" }}>{categoryIcons[s.subcategory ? s.subcategory.category_name : ""] || "🔨"}</span>
                                    )}
                                </div>
                                <div className="card-body">
                                    <h5 className="card-title mb-1">{s.title}</h5>
                                    <small className="text-muted">{s.subcategory ? s.subcategory.name : "Sin categoría"}</small>
                                    <div className="mt-2 d-flex justify-content-between align-items-center">
                                        <span style={{ fontWeight: 700, fontSize: "1.15rem", color: "#4f46e5" }}>${s.price}</span>
                                        <span className="badge bg-warning text-dark">★ {s.reviews_data.average_rating}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    )
}
