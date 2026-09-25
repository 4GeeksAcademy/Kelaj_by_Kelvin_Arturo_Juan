import React, { useEffect, useState } from "react"
import { useSearchParams } from "react-router-dom"

export const Providers = () => {
    const [params] = useSearchParams()
    const location = params.get("location") || ""
    const [providers, setProviders] = useState(null)
    const [loading, setLoading] = useState(true)
    const API = import.meta.env.VITE_BACKEND_URL

    useEffect(() => {
        const load = async () => {
            try {
                const res = await fetch(API + "/api/search/providers?location=" + encodeURIComponent(location))
                setProviders(await res.json())
            } catch (e) {
                console.error(e)
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [location])

    return (
        <div className="container py-5">
            <h2 style={{ fontWeight: 700 }}>Profesionales en {location}</h2>
            <small className="text-muted d-block mb-4">
                {providers ? providers.length : "..."} proveedor(es) en esta zona
            </small>
            <div className="row">
                {loading ? (
                    <p className="text-muted">Buscando...</p>
                ) : providers.length === 0 ? (
                    <p className="text-muted">Aún no hay proveedores en {location}. Muy pronto se sumarán sus ofertas.</p>
                ) : providers.map(p => (
                    <div key={p.id} className="col-12 col-md-6 col-lg-4 mb-3">
                        <div className="card h-100 shadow-sm border-0" style={{ borderRadius: 14 }}>
                            <div className="card-body">
                                <div className="d-flex align-items-center">
                                    {p.profile_image ? (
                                        <img src={p.profile_image} alt={p.name} style={{ width: 48, height: 48, borderRadius: "50%", objectFit: "cover", marginRight: 10 }} />
                                    ) : (
                                        <span className="bg-primary text-white d-flex align-items-center justify-content-center me-2" style={{ width: 48, height: 48, borderRadius: "50%", fontSize: 20 }}>
                                            {(p.name || "P")[0].toUpperCase()}
                                        </span>
                                    )}
                                    <div>
                                        <h5 className="mb-0">{p.name} {p.last_name || ""}</h5>
                                        <small className="text-muted">Rating: {p.average_rating}</small>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
