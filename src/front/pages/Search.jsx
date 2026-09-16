import React, { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { searchProviders } from "../services/userServices"; // Ajusta la ruta si es necesario

const provinciasEspaña = [
  "Álava", "Albacete", "Alicante", "Almería", "Asturias", "Ávila", "Badajoz", "Barcelona", 
  "Burgos", "Cáceres", "Cádiz", "Cantabria", "Castellón", "Ciudad Real", "Córdoba", "Cuenca", 
  "Girona", "Granada", "Guadalajara", "Gipuzkoa", "Huelva", "Huesca", "Illes Balears", "Jaén", 
  "A Coruña", "La Rioja", "Las Palmas", "León", "Lleida", "Lugo", "Madrid", "Málaga", "Murcia", 
  "Navarra", "Ourense", "Palencia", "Pontevedra", "Salamanca", "Segovia", "Sevilla", "Soria", 
  "Tarragona", "Santa Cruz de Tenerife", "Teruel", "Toledo", "Valencia", "Valladolid", "Bizkaia", 
  "Zamora", "Zaragoza", "Ceuta", "Melilla"
];

export const Search = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    
    // Leer los parámetros actuales de la URL
    const queryParam = searchParams.get("q") || "";
    const locationParam = searchParams.get("location") || "";

    // Estados locales para los inputs del buscador de esta página
    const [localQuery, setLocalQuery] = useState(queryParam);
    const [localLocation, setLocalLocation] = useState(locationParam);
    
    // Estados para los resultados
    const [providers, setProviders] = useState([]);
    const [loading, setLoading] = useState(true);

    // Se ejecuta cada vez que cambian los parámetros de la URL
    useEffect(() => {
        const fetchResults = async () => {
            setLoading(true);
            try {
                // Llamamos a la función que pasaste en tu rama actual
                const results = await searchProviders(queryParam, locationParam);
                setProviders(results);
            } catch (error) {
                console.error("Error cargando resultados:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchResults();
    }, [queryParam, locationParam]);

    // Actualiza la URL cuando el usuario usa los filtros de esta página
    const handleFilterSearch = () => {
        const params = new URLSearchParams();
        if (localQuery) params.append("q", localQuery);
        if (localLocation) params.append("location", localLocation);
        setSearchParams(params); // Esto dispara el useEffect automáticamente
    };

    return (
        <div className="bg-light min-vh-100 pb-5">
            {/* Cabecera con Buscador (Mismo estilo que el Home) */}
            <div className="bg-white border-bottom pt-4 pb-5 mb-5">
                <div className="container">
                    <h2 className="fw-bold text-dark mb-4 text-center">Encuentra a tu profesional</h2>
                    
                    <div className="bg-white rounded-4 rounded-md-pill shadow-sm border p-2 d-flex flex-column flex-md-row align-items-center mx-auto" style={{ maxWidth: "800px" }}>
                        <div className="flex-grow-1 w-100 position-relative py-2 py-md-0 px-3">
                            <input 
                                type="text" 
                                className="form-control border-0 search-input bg-transparent text-center text-md-start" 
                                placeholder="¿Qué servicio estás buscando?"
                                value={localQuery}
                                onChange={(e) => setLocalQuery(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleFilterSearch()}
                            />
                        </div>

                        <div className="d-none d-md-block border-end py-3" style={{ borderColor: "#eaeaea !important" }}></div>
                        <hr className="d-md-none w-100 my-1 text-light" />

                        <div className="flex-grow-1 w-100 position-relative py-2 py-md-0 px-3">
                            <select 
                                className="form-select border-0 search-input bg-transparent text-center text-md-start"
                                value={localLocation}
                                onChange={(e) => setLocalLocation(e.target.value)}
                                style={{ cursor: "pointer", appearance: "none" }}
                            >
                                <option value="">Cualquier ciudad</option>
                                {provinciasEspaña.map(provincia => (
                                    <option key={provincia} value={provincia.toLowerCase()}>{provincia}</option>
                                ))}
                            </select>
                        </div>

                        <div className="w-100 text-end px-2" style={{ maxWidth: "fit-content" }}>
                            <button 
                                className="btn btn-primary rounded-pill w-100 px-4 py-2 fw-semibold d-flex align-items-center justify-content-center gap-2"
                                onClick={handleFilterSearch}
                            >
                                <i className="bi bi-search"></i> Buscar
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Resultados de búsqueda */}
            <div className="container">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h4 className="fw-bold m-0">
                        Resultados {queryParam && `para "${queryParam}"`} {locationParam && `en ${locationParam}`}
                    </h4>
                    <span className="text-muted">{providers.length} profesionales encontrados</span>
                </div>

                <div className="row g-4">
                    {loading ? (
                        <div className="col-12 text-center py-5">
                            <div className="spinner-border text-primary" role="status"></div>
                            <p className="text-muted mt-3">Buscando a los mejores profesionales...</p>
                        </div>
                    ) : providers.length === 0 ? (
                        <div className="col-12 text-center py-5">
                            <i className="bi bi-emoji-frown fs-1 text-muted mb-3 d-block"></i>
                            <h5 className="fw-bold">No encontramos coincidencias</h5>
                            <p className="text-muted">Intenta buscar con otros términos o en otra provincia.</p>
                            <button className="btn btn-outline-primary rounded-pill mt-2" onClick={() => { setLocalQuery(''); setLocalLocation(''); setSearchParams({}); }}>
                                Limpiar filtros
                            </button>
                        </div>
                    ) : (
                        providers.map(provider => (
                            <div key={provider.id} className="col-12 col-md-6 col-lg-4">
                                <div className="card h-100 shadow-sm border-0 position-relative" style={{ borderRadius: 14, overflow: "visible" }}>
                                    
                                    {/* Banner superior de la tarjeta (mismo gradiente que tus servicios) */}
                                    <div style={{ height: 100, background: "linear-gradient(120deg, #e0e7ff, #f3e8ff)", borderTopLeftRadius: 14, borderTopRightRadius: 14 }}></div>
                                    
                                    <div className="card-body text-center pt-0 pb-4 px-4">
                                        {/* Avatar posicionado a la mitad del banner */}
                                        <div className="d-flex justify-content-center" style={{ marginTop: "-45px" }}>
                                            <img 
                                                src={provider.profile_image || "https://ui-avatars.com/api/?name=" + provider.name + "&background=4f46e5&color=fff"} 
                                                alt={provider.name} 
                                                className="rounded-circle shadow-sm bg-white" 
                                                style={{ width: "90px", height: "90px", objectFit: "cover", border: "4px solid #fff" }} 
                                            />
                                        </div>
                                        
                                        <h5 className="card-title fw-bold mt-3 mb-1">
                                            {provider.name} {provider.last_name}
                                        </h5>
                                        
                                        <p className="text-muted small mb-2 d-flex align-items-center justify-content-center gap-1">
                                            <i className="bi bi-geo-alt-fill"></i> 
                                            <span className="text-capitalize">{provider.providerprofile?.coverage_area || "Sin zona especificada"}</span>
                                        </p>

                                        {/* Estrellas: Promedio de reseñas calculado desde el backend */}
                                        <div className="mb-3">
                                            <span className="badge bg-warning text-dark px-3 py-2 rounded-pill fs-6">
                                                <i className="bi bi-star-fill text-dark me-1"></i> 
                                                {provider.average_rating > 0 ? Number(provider.average_rating).toFixed(1) : "Nuevo"}
                                            </span>
                                        </div>

                                        <Link to={`/profile/${provider.id}`} className="btn btn-outline-primary rounded-pill w-100 fw-semibold">
                                            Ver perfil
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};