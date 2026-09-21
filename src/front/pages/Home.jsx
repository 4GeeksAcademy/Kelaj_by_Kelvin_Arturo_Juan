import React, { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { CategoryIcon, ClockIcon } from "../components/CategoryIcon"

const provinciasEspana = [
    "Álava", "Albacete", "Alicante", "Almería", "Asturias", "Ávila", "Badajoz", "Barcelona",
    "Burgos", "Cáceres", "Cádiz", "Cantabria", "Castellón", "Ciudad Real", "Córdoba", "Cuenca",
    "Girona", "Granada", "Guadalajara", "Gipuzkoa", "Huelva", "Huesca", "Illes Balears", "Jaén",
    "A Coruña", "La Rioja", "Las Palmas", "León", "Lleida", "Lugo", "Madrid", "Málaga", "Murcia",
    "Navarra", "Ourense", "Palencia", "Pontevedra", "Salamanca", "Segovia", "Sevilla", "Soria",
    "Tarragona", "Santa Cruz de Tenerife", "Teruel", "Toledo", "Valencia", "Valladolid", "Bizkaia",
    "Zamora", "Zaragoza", "Ceuta", "Melilla"
]

export const Home = () => {
    const [categories, setCategories] = useState([])
    const [services, setServices] = useState([])
    const [search, setSearch] = useState("")
    const [loading, setLoading] = useState(true)
    const [provinciaQuery, setProvinciaQuery] = useState("")
    const [provinciasOpen, setProvinciasOpen] = useState(false)
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

    const handleSearch = (e) => {
        e.preventDefault()
        navigate("/results?q=" + encodeURIComponent(search))
    }

    return (
        <div>
            <section style={{ background: "linear-gradient(135deg, #4f46e5, #7c3aed)", color: "white", padding: "70px 16px", textAlign: "center" }}>
                <h1 style={{ fontSize: "2.8rem", fontWeight: 700 }}>Encuentra el servicio que necesitas</h1>
                <p style={{ fontSize: "1.15rem", opacity: 0.9 }}>Clases, reparaciones, consultoría y más — cerca de ti.</p>
                <div className="container" style={{ maxWidth: 560, marginTop: 24 }}>
                    <form className="input-group" onSubmit={handleSearch}>
                        <input
                            type="text"
                            className="form-control form-control-lg"
                            placeholder="¿Qué servicio buscas?"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                        <button className="btn btn-warning btn-lg" type="submit">Buscar</button>
                    </form>
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
                            <div className="card h-100 text-center shadow-sm border-0" style={{ borderRadius: 14, cursor: "pointer" }} onClick={() => navigate("/results?cat=" + cat.id)}>
                                <div className="card-body d-flex flex-column align-items-center justify-content-center">
                                    <CategoryIcon name={cat.name} />
                                    <h5 className="mt-2 mb-0">{cat.name}</h5>
                                    <small className="text-muted">{cat.subcategories.length} servicios</small>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            <section className="container py-5">
                <button
                    className="btn btn-outline-primary w-100 d-flex justify-content-between align-items-center"
                    style={{ maxWidth: 480, fontWeight: 600 }}
                    onClick={() => setProvinciasOpen(!provinciasOpen)}
                >
                    <span>Provincias donde operamos</span>
                    <span>{provinciasOpen ? "▲" : "▼"}</span>
                </button>
                {provinciasOpen && (
                    <div className="mt-3" style={{ maxHeight: 260, overflowY: "auto", maxWidth: 480, border: "1px solid #e5e7eb", borderRadius: 10, padding: 16 }}>
                        <input
                            type="text"
                            className="form-control form-control-sm mb-3"
                            placeholder="Busca tu provincia..."
                            value={provinciaQuery}
                            onChange={(e) => setProvinciaQuery(e.target.value)}
                        />
                        <div className="d-flex flex-wrap gap-2">
                            {provinciasEspana
                                .filter(p => p.toLowerCase().includes(provinciaQuery.toLowerCase()))
                                .sort((a, b) => a.localeCompare(b, "es"))
                                .map(p => (
                                    <span key={p} className="badge rounded-pill text-bg-primary" style={{ padding: "8px 12px", cursor: "pointer" }} onClick={() => navigate("/providers?location=" + encodeURIComponent(p))}>
                                        {p}
                                    </span>
                                ))}
                            {provinciasEspana.filter(p => p.toLowerCase().includes(provinciaQuery.toLowerCase())).length === 0 && (
                                <small className="text-muted">No se encontraron provincias para "{provinciaQuery}".</small>
                            )}
                        </div>
                    </div>
                )}
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
                                        <CategoryIcon name={s.subcategory ? s.subcategory.category_name : ""} size={56} />
                                    )}
                                </div>
                                <div className="card-body">
                                    <h5 className="card-title mb-1">{s.title}</h5>
                                    <small className="text-muted">{s.subcategory ? s.subcategory.name : "Sin categoría"}</small>
                                    <div className="mt-2 d-flex justify-content-between align-items-center">
                                        <span style={{ fontWeight: 700, fontSize: "1.15rem", color: "#4f46e5" }}>${s.price}</span>
                                        <span className="badge bg-warning text-dark">★ {s.reviews_data.average_rating}</span>
                                    </div>
                                    <div className="d-flex align-items-center mt-2">
                                        <small className="text-muted">
                                            {s.provider && s.provider.image ? <img src={s.provider.image} alt="proveedor" style={{ width: 24, height: 24, borderRadius: "50%", objectFit: "cover", marginRight: 6 }} /> : null}
                                            {s.estimated_duration ? <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><ClockIcon size={14} />~{s.estimated_duration} min</span> : null}
                                        </small>
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
