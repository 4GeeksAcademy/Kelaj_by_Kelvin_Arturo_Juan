import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getCategories } from '../services/services';
import { searchProviders } from '../services/userServices';

// Lista de provincias
const provincesList = [
    "Álava", "Albacete", "Alicante", "Almería", "Asturias", "Ávila", "Badajoz", "Barcelona", "Burgos", 
    "Cáceres", "Cádiz", "Cantabria", "Castellón", "Ciudad Real", "Córdoba", "Cuenca", "Girona", "Granada", 
    "Guadalajara", "Gipuzkoa", "Huelva", "Huesca", "Islas Baleares", "Jaén", "La Coruña", "La Rioja", 
    "Las Palmas", "León", "Lleida", "Lugo", "Madrid", "Málaga", "Murcia", "Navarra", "Ourense", "Palencia", 
    "Pontevedra", "Salamanca", "Segovia", "Sevilla", "Soria", "Tarragona", "Santa Cruz de Tenerife", 
    "Teruel", "Toledo", "Valencia", "Valladolid", "Vizcaya", "Zamora", "Zaragoza", "Ceuta", "Melilla"
];

// Mini componente para pintar las estrellas
const StarRating = ({ rating }) => {
    const numericRating = Number(rating) || 0;
    return (
        <div className="text-warning mb-2" style={{ fontSize: "1.1rem" }}>
            {[...Array(5)].map((_, i) => (
                <i key={i} className={`bi bi-star${i < Math.round(numericRating) ? '-fill' : ''} me-1`}></i>
            ))}
            <span className="text-muted ms-1 small fw-semibold">({numericRating.toFixed(1)})</span>
        </div>
    );
};

export const ProvidersCatalog = () => {
    const [categories, setCategories] = useState([]);
    const [providers, setProviders] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Estados de filtros
    const [activeSubcategory, setActiveSubcategory] = useState("");
    const [activeCategory, setActiveCategory] = useState(null);
    const [selectedProvince, setSelectedProvince] = useState("");

    useEffect(() => {
        const fetchData = async () => {
            try {
                const cats = await getCategories();
                setCategories(cats);
                
                const provs = await searchProviders();
                setProviders(provs);
            } catch (error) {
                console.error("Error cargando el catálogo:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // Filtrar por Categoría (mantiene la provincia actual)
    const handleCategoryFilter = async (subcategoryId, categoryId) => {
        setLoading(true);
        setActiveSubcategory(subcategoryId);
        setActiveCategory(categoryId);
        try {
            const provs = await searchProviders("", selectedProvince, subcategoryId);
            setProviders(provs);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    // Filtrar por Provincia (mantiene la categoría actual)
    const handleProvinceChange = async (e) => {
        const province = e.target.value;
        setSelectedProvince(province);
        setLoading(true);
        try {
            const provs = await searchProviders("", province, activeSubcategory);
            setProviders(provs);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    // Limpiar todos los filtros
    const clearFilters = async () => {
        setLoading(true);
        setActiveSubcategory("");
        setActiveCategory(null);
        setSelectedProvince("");
        try {
            const provs = await searchProviders();
            setProviders(provs);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container py-5 mt-4">
            <div className="row mb-4">
                <div className="col">
                    <h2 className="fw-bold">Nuestros Profesionales</h2>
                    <p className="text-muted">Los expertos mejor valorados, listos para ayudarte.</p>
                </div>
            </div>

            <div className="row g-4">
                {/* SIDEBAR: Filtros */}
                <div className="col-lg-3">
                    <div className="card border-0 shadow-sm sticky-top" style={{ top: "100px", zIndex: 1 }}>
                        <div className="card-body p-4">
                            
                            <div className="d-flex justify-content-between align-items-center mb-4">
                                <h5 className="fw-bold mb-0">Filtros</h5>
                                {(activeSubcategory || selectedProvince) && (
                                    <button className="btn btn-sm btn-link text-danger p-0 text-decoration-none" onClick={clearFilters}>
                                        Limpiar todo
                                    </button>
                                )}
                            </div>

                            {/* SELECTOR DE PROVINCIA */}
                            <div className="mb-4">
                                <label className="form-label fw-semibold small text-muted text-uppercase" style={{ letterSpacing: "1px" }}>Ubicación</label>
                                <select 
                                    className="form-select rounded-pill" 
                                    value={selectedProvince}
                                    onChange={handleProvinceChange}
                                >
                                    <option value="">Toda España</option>
                                    {provincesList.map((prov) => (
                                        <option key={prov} value={prov}>{prov}</option>
                                    ))}
                                </select>
                            </div>
                            
                            {/* ACORDEÓN DE CATEGORÍAS */}
                            <label className="form-label fw-semibold small text-muted text-uppercase mb-2" style={{ letterSpacing: "1px" }}>Categorías</label>
                            <div className="accordion accordion-flush" id="categoriesAccordion">
                                {categories.map((category) => (
                                    <div className="accordion-item border-0" key={category.id}>
                                        <h2 className="accordion-header">
                                            <button 
                                                className={`accordion-button ${activeCategory === category.id ? '' : 'collapsed'} px-0 py-3 fw-semibold bg-white`} 
                                                type="button" 
                                                data-bs-toggle="collapse" 
                                                data-bs-target={`#collapseCat${category.id}`}
                                            >
                                                {category.name}
                                            </button>
                                        </h2>
                                        <div id={`collapseCat${category.id}`} className={`accordion-collapse collapse ${activeCategory === category.id ? 'show' : ''}`} data-bs-parent="#categoriesAccordion">
                                            <div className="accordion-body px-0 pt-0 pb-3">
                                                <div className="list-group list-group-flush">
                                                    {category.subcategories.map(sub => (
                                                        <button 
                                                            key={sub.id}
                                                            className={`list-group-item list-group-item-action border-0 px-3 py-2 small rounded-pill mb-1 ${activeSubcategory === sub.id ? 'active bg-primary text-white shadow-sm' : 'text-muted'}`}
                                                            onClick={() => handleCategoryFilter(sub.id, category.id)}
                                                        >
                                                            {sub.name}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                        </div>
                    </div>
                </div>

                {/* CONTENIDO PRINCIPAL: Profesionales */}
                <div className="col-lg-9">
                    {loading ? (
                        <div className="text-center py-5">
                            <div className="spinner-border text-primary" role="status"></div>
                            <p className="mt-3 text-muted">Buscando a los mejores...</p>
                        </div>
                    ) : (
                        <>
                            <div className="mb-3 d-flex justify-content-between align-items-center">
                                <span className="text-muted small">Mostrando {providers.length} profesionales</span>
                                <span className="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 rounded-pill px-3 py-2">
                                    <i className="bi bi-trophy-fill me-1"></i> Ordenados por puntuación
                                </span>
                            </div>

                            {providers.length === 0 ? (
                                <div className="text-center py-5 bg-light rounded-4 border">
                                    <i className="bi bi-people fs-1 text-muted mb-3 d-block"></i>
                                    <h5>No encontramos profesionales</h5>
                                    <p className="text-muted">Intenta cambiar la provincia o eliminar los filtros.</p>
                                    <button className="btn btn-outline-primary mt-2 rounded-pill px-4" onClick={clearFilters}>
                                        Ver todos
                                    </button>
                                </div>
                            ) : (
                                <div className="row g-4">
                                    {providers.map(provider => {
                                        const profileInfo = provider.providerprofile;
                                        
                                        return (
                                            <div className="col-md-6" key={provider.id}>
                                                <div className="card h-100 border-0 shadow-sm rounded-4 hover-shadow">
                                                    <div className="card-body p-4 text-center d-flex flex-column">
                                                        
                                                        {/* Foto y Puntuación */}
                                                        <div className="mb-3 position-relative">
                                                            <img 
                                                                src={provider.profile_image || `https://ui-avatars.com/api/?name=${provider.name}&background=e0e7ff&color=4f46e5`} 
                                                                alt={provider.name}
                                                                className="rounded-circle object-fit-cover shadow-sm border border-3 border-white"
                                                                style={{ width: "90px", height: "90px" }}
                                                            />
                                                            {provider.average_rating >= 4.5 && (
                                                                <span className="position-absolute top-0 start-50 translate-middle-x badge bg-danger rounded-pill shadow-sm" style={{ marginTop: "-10px" }}>
                                                                    Top Pro
                                                                </span>
                                                            )}
                                                        </div>

                                                        <h5 className="fw-bold mb-1">{provider.name} {provider.last_name}</h5>
                                                        
                                                        <StarRating rating={provider.average_rating} />
                                                        
                                                        <p className="text-muted small mb-3">
                                                            <i className="bi bi-geo-alt-fill text-primary me-1"></i>
                                                            {profileInfo?.coverage_area || provider.city || "Ubicación remota"}
                                                        </p>

                                                        <p className="text-muted small mb-4 flex-grow-1" style={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                                            {profileInfo?.bio || "Profesional verificado en Kelaj."}
                                                        </p>

                                                        <div className="mt-auto">
                                                            <Link to={`/profile/${provider.id}`} className="btn btn-outline-primary w-100 rounded-pill fw-semibold">
                                                                Ver perfil y servicios
                                                            </Link>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};