import { Outlet } from "react-router-dom/dist"
import { Link } from "react-router-dom"
import ScrollToTop from "../components/ScrollToTop"
import { Navbar } from "../components/Navbar"
import useGlobalReducer from "../hooks/useGlobalReducer"


// Base component that maintains the navbar and footer throughout the page and the scroll to top functionality.
export const Layout = () => {
    const { store } = useGlobalReducer()
    const user = store.user
    const showVerifyBanner = Boolean(user && user.is_provider && user.verified === false)

    return (
        <ScrollToTop>
            {showVerifyBanner && (
                <div className="alert-warning m-0 text-center" style={{ padding: "10px 16px", fontSize: 14, borderBottom: "1px solid #ffe69c", position: "sticky", top: 0, zIndex: 1050 }}>
                    Completa tu verificación en 2 pasos para mostrar el distintivo de <strong>proveedor verificado</strong>.{" "}
                    <Link to="/verificacion" style={{ fontWeight: 700 }}>Verificarme ahora</Link>
                </div>
            )}
            <Navbar />
            <Outlet />
        </ScrollToTop>
    )
}
