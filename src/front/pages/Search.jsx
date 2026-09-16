import React from 'react'

const Search = () => {
    return (
        <div>

            <main className="container px-4 px-lg-5 mt-5 pt-4">

                <header className="text-center mb-5">
                    <h1 className="fw-bold text-dark mb-3" style="font-size: clamp(2rem, 5vw, 3.5rem); letter-spacing: -1px;">
                        Todo lo que buscabas, en un solo sitio
                    </h1>
                    <p className="text-secondary mx-auto" style="max-width: 700px; font-size: 1.1rem;">
                        ¿Necesitas ayuda? Con <span className="fw-bold text-dark">Jake</span> puedes solucionarlo rápido y fácil: desde limpieza, reparaciones y mucho más.
                    </p>
                </header>

                <section className="search-container mb-5">
                    <div className="bg-white rounded-4 rounded-md-pill shadow-sm p-2 d-flex flex-column flex-md-row align-items-center">

                        <div className="flex-grow-1 w-100 position-relative py-2 py-md-0 px-3">
                            <input type="text" className="form-control border-0 search-input bg-transparent text-center text-md-start" placeholder="¿Qué servicio estás buscando?"></input>
                        </div>

                        <div className="d-none d-md-block border-end py-3" style="border-color: #eaeaea !important;"></div>

                        <hr className="d-md-none w-100 my-1 text-light"></hr>

                        <div className="flex-grow-1 w-100 position-relative py-2 py-md-0 px-3">
                            <input type="text" className="form-control border-0 search-input bg-transparent text-center text-md-start" placeholder="Ciudad"></input>
                        </div>

                        <div className="w-100 text-end px-2" style="max-width: fit-content;">
                            <button className="btn btn-primary rounded-pill w-100 px-4 py-2 fw-semibold d-flex align-items-center justify-content-center gap-2">
                                <i className="bi bi-search"></i> Buscar
                            </button>
                        </div>
                    </div>
                </section>
c
                <section className="d-flex flex-column flex-sm-row justify-content-center align-items-center gap-3 mb-5 pb-4">
                    <a href="#" className="btn btn-outline-primary rounded-pill px-4 py-2 fw-semibold w-100" style="max-width: 250px;">
                        Unirme como proveedor
                    </a>
                    <a href="#" className="btn btn-green rounded-pill px-4 py-2 fw-semibold w-100" style="max-width: 250px;">
                        Ver todos los servicios <i className="bi bi-chevron-right ms-1" style="font-size: 0.8em;"></i>
                    </a>
                </section>

                <section className="text-center mt-4 mb-5 pb-5">
                    <h3 className="fw-bold mb-4">Nuestras categorías</h3>

                    <div className="row justify-content-center g-3 g-md-4 max-w-4xl mx-auto" style="max-width: 800px;">
                        <div className="col-6 col-md-3">
                            <div className="card category-card bg-white border border-light-subtle rounded-3 h-100 py-4 shadow-sm">
                                <div className="card-body d-flex flex-column align-items-center justify-content-center p-2">
                                    <i className="bi bi-house fs-1 text-dark mb-2"></i>
                                    <h6 className="fw-semibold text-dark mb-0 fs-6">Reparaciones</h6>
                                </div>
                            </div>
                        </div>

                        <div className="col-6 col-md-3">
                            <div className="card category-card bg-white border border-light-subtle rounded-3 h-100 py-4 shadow-sm">
                                <div className="card-body d-flex flex-column align-items-center justify-content-center p-2">
                                    <i className="bi bi-house fs-1 text-dark mb-2"></i>
                                    <h6 className="fw-semibold text-dark mb-0 fs-6">Belleza</h6>
                                </div>
                            </div>
                        </div>

                        <div className="col-6 col-md-3">
                            <div className="card category-card bg-white border border-light-subtle rounded-3 h-100 py-4 shadow-sm">
                                <div className="card-body d-flex flex-column align-items-center justify-content-center p-2">
                                    <i className="bi bi-house fs-1 text-dark mb-2"></i>
                                    <h6 className="fw-semibold text-dark mb-0 fs-6">Clases</h6>
                                </div>
                            </div>
                        </div>

                        <div className="col-6 col-md-3">
                            <div className="card category-card bg-white border border-light-subtle rounded-3 h-100 py-4 shadow-sm">
                                <div className="card-body d-flex flex-column align-items-center justify-content-center p-2">
                                    <i className="bi bi-house fs-1 text-dark mb-2"></i>
                                    <h6 className="fw-semibold text-dark mb-0 fs-6">Cuidados</h6>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

            </main>

            <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>
        </div >
    )
}

export default Search
