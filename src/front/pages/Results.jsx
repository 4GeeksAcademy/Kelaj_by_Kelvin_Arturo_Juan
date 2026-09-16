import React, { useEffect, useState } from "react"
import { useSearchParams } from "react-router-dom"

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

export const Results = () => {
    const [params] = useSearchParams()
    const q = params.get("q") || ""
    const cat = params.get("cat") ? Number(params.get("cat")) : null
    const [services, setServices] = useState([])
    const [catName, setCatName] = useState("")
    const [loading, setLoading] = useState(true)
    const API = import.meta.env.VITE_BACKEND_URL

    useEffect(() => {
        const load = async () => {
            try {
                const url = cat
                    ? API + "/api/services/search?cat=" + cat
                    : API + "/api/services/search?q=" + encodeURIComponent(q)
                const res = await fetch(url)
                setServices(await res.json())
            } catch (error) {
                console.error(error)
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [q, cat])

    useEffect(() => {
        if (!cat) return
        fetch(API + "/api/categories")
            .then(r => r.json())
            .then(cats => {
                const found = cats.find(c => c.id === cat)
                if (found) setCatName(found.name)
            })
            .catch(e => console.error(e))
    }, [cat])

    const heading = cat ? (catName || "Categoría") : `Resultados para "${q}"`

    return (
        <div className="container py-5">
            <h2 className="mb-1" style={{ fontWeight: 700 }}>{heading}</h2>
            <small className="text-muted d-block mb-4">{services.length} servicio(s) encontrado(s)</small>
            <div className="row">
                {loading ? (
                    <p className="text-muted">Buscando...</p>
                ) : services.length === 0 ? (
                    <p className="text-muted">No se encontraron servicios. Prueba con otra categoría o palabra.</p>
                ) : services.map(s => (
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
                                <div className="d-flex align-items-center mt-2">
                                    <small className="text-muted">
                                        {s.provider && s.provider.image ? <img src={s.provider.image} alt="proveedor" style={{ width: 24, height: 24, borderRadius: "50%", objectFit: "cover", marginRight: 6 }} /> : null}
                                        {s.estimated_duration ? <span>⏱ ~{s.estimated_duration} min</span> : null}
                                    </small>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
