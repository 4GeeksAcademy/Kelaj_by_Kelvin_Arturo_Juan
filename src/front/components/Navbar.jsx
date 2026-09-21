import { Link, useNavigate } from "react-router-dom"
import useGlobalReducer from "../hooks/useGlobalReducer"
import { VerifiedBadge } from "./VerifiedBadge"

export const Navbar = () => {
    const { store, dispatch } = useGlobalReducer()
    const navigate = useNavigate()

    const isLogged = Boolean(store.token && store.user)
    const isAdmin = isLogged && Array.isArray(store.user.roles) && store.user.roles.includes("admin")

    const handleLogout = () => {
        localStorage.removeItem("token")
        localStorage.removeItem("user")
        dispatch({ type: "logout" })
        navigate("/")
    }

    return (
        <nav className="navbar navbar-expand-lg navbar-light bg-light">
            <div className="container">
                <Link to="/" className="navbar-brand mb-0 h1" style={{ fontWeight: 700 }}>
                    Kelaj
                </Link>
                <div className="ms-auto d-flex align-items-center gap-2">
                    {isLogged && (
                        <Link to={`/profile/${store.user.id}`}>
                            <button className="btn btn-sm btn-outline-secondary">Mi perfil</button>
                        </Link>
                    )}
                    {isLogged && store.user.is_provider && (
                        <Link to="/professional-panel">
                            <button className="btn btn-sm btn-outline-secondary">Panel profesional</button>
                        </Link>
                    )}
                    {isLogged && isAdmin && (
                        <Link to="/admin/featured">
                            <button className="btn btn-sm btn-warning">Panel destacados</button>
                        </Link>
                    )}
                    {!isLogged ? (
                        <>
                            <Link to="/register">
                                <button className="btn btn-sm btn-outline-primary">Registrarse</button>
                            </Link>
                            <Link to="/login">
                                <button className="btn btn-sm btn-primary">Iniciar sesión</button>
                            </Link>
                        </>
                    ) : (
                        <>
                            {store.user.is_provider && (
                                store.user.verified ? (
                                    <VerifiedBadge size={18} />
                                ) : (
                                    <Link to="/verificacion">
                                        <button className="btn btn-sm btn-outline-secondary">Verificarse</button>
                                    </Link>
                                )
                            )}
                            <button className="btn btn-sm btn-outline-danger" onClick={handleLogout}>
                                Cerrar sesión
                            </button>
                        </>
                    )}
                </div>
            </div>
        </nav>
    )
}
