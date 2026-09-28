import React from "react";
import { Outlet } from "react-router-dom";
import { Link } from "react-router-dom";
import ScrollToTop from "../components/ScrollToTop";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import useGlobalReducer from "../hooks/useGlobalReducer";

export const Layout = () => {
    const { store } = useGlobalReducer()
    const user = store.user
    const showVerifyBanner = Boolean(user && user.is_provider && user.verified === false)

    return (
        <ScrollToTop>
            {showVerifyBanner && (
                <div className="alert-warning m-0 text-center" style={{ padding: "10px 16px", fontSize: 14, borderBottom: "1px solid #ffe69c", position: "sticky", top: 0, zIndex: 1050 }}>
                    Verifícate con tu cuenta de Google para mostrar el distintivo de <strong>proveedor verificado</strong>.{" "}
                    <Link to="/verificacion" style={{ fontWeight: 700 }}>Verificarme ahora</Link>
                </div>
            )}
            {/* Contenedor principal con altura mínima del 100% de la pantalla */}
            <div className="d-flex flex-column min-vh-100">
                <Navbar />

                {/* flex-grow-1 empuja el Footer siempre hacia el fondo */}
                <main className="flex-grow-1">
                    <Outlet />
                </main>

                <Footer />
            </div>
        </ScrollToTop>
    );
};
