import React from "react"
import { useNavigate, Link } from "react-router-dom"
import useGlobalReducer from "../hooks/useGlobalReducer";
import "../styles/Home.css"
import "../index.css"

export const Home = () => {
    const navigate = useNavigate();
    const token = localStorage.getItem("token");

    // Función para navegar al catálogo con una búsqueda predefinida
    const goToCategory = (categoryName) => {
        navigate(`/catalog?q=${categoryName}`);
    };

    return (
        <div>
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

            {/* TARJETAS DE CATEGORÍAS */}
            <section className="text-center mt-4 mb-5 pb-5">
                <h3 className="fw-bold mb-4">Nuestras categorías</h3>

                <div className="row justify-content-center g-3 g-md-4 mx-auto" style={{ maxWidth: "800px" }}>
                    
                    <div className="col-6 col-md-3">
                        <div 
                            className="card reparaciones-button category-card bg-white border border-light-subtle rounded-3 h-100 py-4 shadow-sm"
                            onClick={() => goToCategory("reparaciones")}
                            style={{ cursor: "pointer" }}
                        >
                            <div className="card-body d-flex flex-column align-items-center justify-content-center p-2">
                                <div className="rounded bg-white bg-opacity-50 p-2">
                                    <i className="fa-solid fa-house fs-1 mb-2"></i>
                                    <h6 className="fw-semibold text-dark mb-0 fs-6">Reparaciones</h6>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="col-6 col-md-3">
                        <div 
                            className="card belleza-button category-card bg-white border border-light-subtle rounded-3 h-100 py-4 shadow-sm"
                            onClick={() => goToCategory("belleza")}
                            style={{ cursor: "pointer" }}
                        >
                            <div className="card-body d-flex flex-column align-items-center justify-content-center p-2">
                                <div className="rounded bg-white bg-opacity-50 p-2">
                                    <i className="fa-solid fa-spray-can-sparkles fs-1 mb-2"></i>
                                    <h6 className="fw-semibold text-dark mb-0 fs-6">Belleza</h6>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="col-6 col-md-3">
                        <div 
                            className="card clases-button category-card bg-white border border-light-subtle rounded-3 h-100 py-4 shadow-sm"
                            onClick={() => goToCategory("clases")}
                            style={{ cursor: "pointer" }}
                        >
                            <div className="card-body d-flex flex-column align-items-center justify-content-center p-2">
                                <div className="rounded bg-white bg-opacity-50 p-2">
                                    <i className="fa-solid fa-book fs-1 mb-2"></i>
                                    <h6 className="fw-semibold text-dark mb-0 fs-6">Clases</h6>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="col-6 col-md-3">
                        <div 
                            className="card cuidados-button category-card bg-white border border-light-subtle rounded-3 h-100 py-4 shadow-sm"
                            onClick={() => goToCategory("cuidados")}
                            style={{ cursor: "pointer" }}
                        >
                            <div className="card-body d-flex flex-column align-items-center justify-content-center p-2">
                                <div className="rounded bg-white bg-opacity-50 p-2">
                                    <i className="fa-solid fa-hand-holding-heart fs-1 mb-2"></i>
                                    <h6 className="fw-semibold text-dark mb-0 fs-6">Cuidados</h6>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </section>
            
            {/* BOTÓN MAS... */}
            <section>
                <div className="row justify-content-center g-3 g-md-4 mx-auto" style={{ maxWidth: "800px" }}>
                    <div className="col-6 col-md-3">
                        <div 
                            className="card mas-button category-card bg-white border border-light-subtle rounded-3 h-100 py-4 shadow-sm"
                            onClick={() => navigate("/catalog")}
                            style={{ cursor: "pointer" }}
                        >
                            <div className="card-body d-flex flex-column align-items-center justify-content-center p-2">
                                <div className="rounded bg-white bg-opacity-50 p-2">
                                    <i className="fa-solid fa-table-cells-large fs-1 mb-2"></i>
                                    <h6 className="fw-semibold text-dark mb-0 fs-6">Mas...</h6>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>



            
        </div>
    );
};