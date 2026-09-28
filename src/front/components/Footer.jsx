import React from "react";
import { Link, useNavigate } from "react-router-dom";

export const Footer = () => {
    const navigate = useNavigate();
    const token = localStorage.getItem("token");

    const goToCategory = (categoryName) => {
        navigate(`/catalog?q=${categoryName}`);
    };

    return (
        <footer className="bg-light border-top mt-auto py-3">
            <div className="container" style={{ maxWidth: "1050px" }}>
                <div className="row g-4 justify-content-between">
                    
                    {/* Columna 1: Marca y Redes Sociales */}
                    <div className="col-12 col-md-4">
                        <Link to="/" className="d-inline-flex align-items-center text-decoration-none mb-3">
                            <div
                                className="bg-primary text-white fw-bold rounded-3 d-flex align-items-center justify-content-center me-2 shadow-sm"
                                style={{ width: "36px", height: "36px", fontSize: "0.95rem" }}
                            >
                                KJ
                            </div>
                            <span className="fw-bold fs-5 text-dark">Kelaj</span>
                        </Link>

                        <p className="text-secondary small mb-3" style={{ maxWidth: "240px", lineHeight: "1.5" }}>
                            Tu plataforma de confianza, nos encargamos de dar soluciones garantizadas.
                        </p>

                        <div className="d-flex align-items-center gap-2">
                            <a
                                href="https://facebook.com"
                                target="_blank"
                                rel="noreferrer"
                                className="rounded-circle d-flex align-items-center justify-content-center text-white text-decoration-none"
                                style={{ width: "34px", height: "34px", backgroundColor: "#3b5998" }}
                            >
                                <i className="bi bi-facebook"></i>
                            </a>
                            <a
                                href="https://x.com"
                                target="_blank"
                                rel="noreferrer"
                                className="rounded-circle d-flex align-items-center justify-content-center text-white bg-dark text-decoration-none"
                                style={{ width: "34px", height: "34px" }}
                            >
                                <i className="bi bi-twitter-x"></i>
                            </a>
                            <a
                                href="https://linkedin.com"
                                target="_blank"
                                rel="noreferrer"
                                className="rounded-circle d-flex align-items-center justify-content-center text-white text-decoration-none"
                                style={{ width: "34px", height: "34px", backgroundColor: "#0077b5" }}
                            >
                                <i className="bi bi-linkedin"></i>
                            </a>
                        </div>
                    </div>

                    {/* Columna 2: Enlaces de Acceso */}
                    <div className="col-6 col-md-2 d-flex flex-column justify-content-center">
                        <ul className="list-unstyled mb-0 d-flex flex-column gap-2 small">
                            <li>
                                <Link to="/contact" className="text-secondary text-decoration-none">
                                    Contáctanos
                                </Link>
                            </li>
                            {!token && (
                                <>
                                    <li>
                                        <Link to="/register" className="text-secondary text-decoration-none">
                                            Regístrate
                                        </Link>
                                    </li>
                                    <li>
                                        <Link to="/login" className="text-secondary text-decoration-none">
                                            Accede
                                        </Link>
                                    </li>
                                </>
                            )}
                        </ul>
                    </div>

                    {/* Columna 3: Categorías */}
                    <div className="col-6 col-md-2">
                        <h6 className="fw-bold text-dark mb-3">Categorías</h6>
                        <ul className="list-unstyled mb-0 d-flex flex-column gap-2 small">
                            <li>
                                <span
                                    className="text-secondary"
                                    style={{ cursor: "pointer" }}
                                    onClick={() => goToCategory("reparaciones")}
                                >
                                    Hogar
                                </span>
                            </li>
                            <li>
                                <span
                                    className="text-secondary"
                                    style={{ cursor: "pointer" }}
                                    onClick={() => goToCategory("belleza")}
                                >
                                    Belleza
                                </span>
                            </li>
                            <li>
                                <span
                                    className="text-secondary"
                                    style={{ cursor: "pointer" }}
                                    onClick={() => goToCategory("clases")}
                                >
                                    Clases
                                </span>
                            </li>
                            <li>
                                <span
                                    className="text-secondary"
                                    style={{ cursor: "pointer" }}
                                    onClick={() => goToCategory("cuidados")}
                                >
                                    Cuidados
                                </span>
                            </li>
                        </ul>
                    </div>

                    {/* Columna 4: CTA Proveedor */}
                    <div className="col-12 col-md-3">
                        <h6 className="fw-bold text-dark mb-2">¿Forma parte de la solución?</h6>
                        <p className="text-secondary small mb-3">
                            Ofrece tus servicios como aliado de nuestra web
                        </p>
                    </div>

                </div>
            </div>
        </footer>
    );
};