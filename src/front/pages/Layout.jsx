import React from "react";
import { Outlet } from "react-router-dom";
import ScrollToTop from "../components/ScrollToTop";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";

export const Layout = () => {
    const { store } = useGlobalReducer()
    const user = store.user
    const showVerifyBanner = Boolean(user && user.is_provider && user.verified === false)

    return (
        <ScrollToTop>
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
