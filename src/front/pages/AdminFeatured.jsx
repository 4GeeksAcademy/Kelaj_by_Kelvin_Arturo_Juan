import React, { useEffect, useState } from "react"

export const AdminFeatured = () => {
    const [services, setServices] = useState(null)
    const [unauthorized, setUnauthorized] = useState(false)
    const [loading, setLoading] = useState(true)
    const [msg, setMsg] = useState("")
    const API = import.meta.env.VITE_BACKEND_URL

    useEffect(() => {
        const load = async () => {
            const token = localStorage.getItem("token")
            try {
                const res = await fetch(API + "/api/services/manage", {
                    headers: { "Authorization": "Bearer " + token }
                })
                if (res.status === 401 || res.status === 403) {
                    setUnauthorized(true)
                    return
                }
                setServices(await res.json())
            } catch (e) {
                console.error(e)
                setMsg("Ocurrió un error al conectar")
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [])

    const toggle = async (s) => {
        const token = localStorage.getItem("token")
        try {
            const res = await fetch(API + "/api/services/" + s.id + "/featured", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer " + token
                },
                body: JSON.stringify({ featured: !s.featured })
            })
            const data = await res.json()
            if (!res.ok) {
                setMsg(data.error || "Error al actualizar")
                return
            }
            setServices(prev => prev.map(x => x.id === s.id ? { ...x, featured: data.featured } : x))
            setMsg("")
        } catch (err) {
            setMsg("Ocurrió un error al conectar")
        }
    }

    return (
        <div className="container py-5" style={{ maxWidth: 720 }}>
            <h2 style={{ fontWeight: 700 }}>Servicios destacados</h2>
            <p className="text-muted">Marca cuáles servicios aparecen en "Servicios destacados" de la home.</p>
            {msg && <div className="alert alert-warning">{msg}</div>}
            {unauthorized ? (
                <div className="alert alert-danger">No autorizado: necesitas una cuenta de administrador.</div>
            ) : loading ? (
                <p className="text-muted">Cargando...</p>
            ) : (
                <ul className="list-group">
                    {services.map(s => (
                        <li key={s.id} className="list-group-item d-flex justify-content-between align-items-center">
                            <div>
                                <strong>{s.title}</strong>
                                <small className="text-muted d-block">${s.price} · {s.subcategory}</small>
                            </div>
                            <button
                                className={"btn btn-sm " + (s.featured ? "btn-warning" : "btn-outline-warning")}
                                onClick={() => toggle(s)}
                            >
                                {s.featured ? "Destacado" : "Agregar"}
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    )
}
