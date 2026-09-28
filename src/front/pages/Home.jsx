import React from "react"
import { useNavigate, Link } from "react-router-dom"
import useGlobalReducer from "../hooks/useGlobalReducer";
import "../styles/Home.css"
import "../index.css"

export const Home = () => {
    const token = localStorage.getItem("token");

    return (
        <div className="container py-4">
            {/* CABECERA PRINCIPAL */}
            <header className="text-center mb-5 d-flex justify-content-center">
                <div className="bg-white p-3 bg-opacity-50 rounded m-5">
                    <h1 className="fw-bold text text-black mb-3 mt-3" style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)", letterSpacing: "-1px" }}>
                        Todo lo que buscas, en un solo sitio.
                    </h1>
                    <p className="text-secondary text text-black mx-auto" style={{ maxWidth: "700px", fontSize: "1.1rem" }}>
                        ¿Necesitas ayuda? Con <span className="fw-bold text-dark">Kelaj</span> puedes solucionarlo rápido y fácil: desde limpieza, reparaciones y mucho más.
                    </p>
                </div>
            </header>

            {/* BOTONES DE ACCIÓN PRINCIPALES */}
            <section className="d-flex flex-column flex-sm-row justify-content-center align-items-center gap-3 mb-5 pb-4">
                {!token && (
                    <Link to="/register" state={{ role: 'provider' }} className="btn btn-primary rounded-pill px-4 py-2 fw-semibold w-100 shadow-sm" style={{ maxWidth: "250px" }}>
                        Unirme como proveedor
                    </Link>
                )}
                <Link to="/catalog" className="btn btn-green rounded-pill px-4 py-2 fw-semibold w-100 shadow-sm" style={{ maxWidth: "250px" }}>
                    Ver todos los servicios <i className="bi bi-chevron-right ms-1" style={{ fontSize: "0.8em" }}></i>
                </Link>
            </section>

            {/* SECCIÓN 1: MENOS ESTRÉS, MÁS SOLUCIONES (TESTIMONIOS) */}
            <section className="my-5 py-3">
                <div className="text-center mb-5 bg-white bg-opacity-50 p-3 rounded mx-auto" style={{ maxWidth: "700px" }}>
                    <h2 className="fw-bold text-dark mb-2">Menos estrés, más soluciones</h2>
                    <p className="text-secondary mb-0">
                        Descubre por qué nos eligen para ser parte de la revolución de soluciones
                    </p>
                </div>

                <div className="row justify-content-center g-4 mx-auto" style={{ maxWidth: "1050px" }}>
                    {testimonials.map((item, index) => (
                        <div className="col-12 col-md-4" key={index}>
                            <div className="card bg-white border border-light-subtle rounded-4 h-100 p-4 shadow-sm d-flex flex-column justify-content-between">
                                <div>
                                    <div className="mb-2">
                                        <i className="bi bi-quote fs-1 text-danger opacity-25"></i>
                                    </div>

                                    <div className="mb-3 text-warning">
                                        {[...Array(5)].map((_, i) => (
                                            <i key={i} className="bi bi-star-fill me-1"></i>
                                        ))}
                                    </div>

                                    <p className="text-secondary small mb-4" style={{ lineHeight: "1.6" }}>
                                        {item.text}
                                    </p>
                                </div>

                                <div className="d-flex align-items-center mt-auto pt-2">
                                    <div
                                        className="rounded-circle d-flex align-items-center justify-content-center fw-bold me-3"
                                        style={{
                                            width: "40px",
                                            height: "40px",
                                            backgroundColor: "#ffd6e0",
                                            color: "#c2185b",
                                            fontSize: "0.85rem"
                                        }}
                                    >
                                        {item.initials}
                                    </div>
                                    <span className="fw-semibold text-dark small">{item.name}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* SECCIÓN 2: ¿POR QUÉ ELEGIR KELAJ? */}
            <section className="my-5 py-3">
                <div className="card bg-white bg-opacity-75 border border-light-subtle rounded-4 shadow-sm p-4 p-md-5 mx-auto" style={{ maxWidth: "1050px" }}>
                    <h3 className="fw-bold text-center text-dark mb-5">
                        ¿Por qué elegir <span className="text-primary">Kelaj</span>?
                    </h3>

                    <div className="row g-4 text-center">
                        {features.map((feat, index) => (
                            <div className="col-12 col-md-4" key={index}>
                                <div className="d-flex flex-column align-items-center px-3">
                                    <div
                                        className="rounded-circle bg-primary bg-opacity-10 d-flex align-items-center justify-content-center mb-3"
                                        style={{ width: "64px", height: "64px" }}
                                    >
                                        <div
                                            className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center shadow-sm"
                                            style={{ width: "44px", height: "44px" }}
                                        >
                                            <i className={`bi ${feat.icon} fs-5`}></i>
                                        </div>
                                    </div>
                                    <h6 className="fw-bold text-dark mb-2">{feat.title}</h6>
                                    <p className="text-secondary small mb-0" style={{ maxWidth: "240px" }}>
                                        {feat.description}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* SECCIÓN 3: GESTIÓNALO TODO EN POCOS CLICS */}
            <section className="my-5 py-3">
                <div className="card bg-white bg-opacity-75 border border-light-subtle rounded-4 shadow-sm p-4 p-md-5 mx-auto" style={{ maxWidth: "1050px" }}>
                    <div className="row align-items-center g-4">
                        <div className="col-12 col-md-8 text-center text-md-start">
                            <h2 className="fw-bold text-dark mb-3">Gestiónalo todo en pocos clics.</h2>
                            <p className="text-secondary mb-4" style={{ maxWidth: "500px", fontSize: "1.05rem" }}>
                                Entra en <span className="fw-bold text-dark">Kelaj</span> y encuentra profesionales de confianza donde y cuando quieras.
                            </p>
                            <div className="d-flex flex-wrap justify-content-center justify-content-md-start gap-3">
                                <button type="button" className="btn btn-white bg-white border rounded-pill px-4 py-2 shadow-sm fw-semibold d-flex align-items-center gap-2">
                                    <i className="bi bi-apple fs-5"></i> App Store
                                </button>
                                <button type="button" className="btn btn-white bg-white border rounded-pill px-4 py-2 shadow-sm fw-semibold d-flex align-items-center gap-2">
                                    <i className="bi bi-google-play fs-5"></i> Google Play
                                </button>
                            </div>
                        </div>

                        <div className="col-12 col-md-4 d-flex flex-column align-items-center">
                            <div
                                className="bg-white border rounded-4 p-4 shadow-sm d-flex align-items-center justify-content-center"
                                style={{ width: "160px", height: "160px" }}
                            >
                                <i className="bi bi-qr-code text-dark" style={{ fontSize: "5.5rem" }}></i>
                            </div>
                            <span className="text-muted small mt-2">Scan to download</span>
                        </div>
                    </div>
                </div>
            </section>



            
        </div>
    );
};