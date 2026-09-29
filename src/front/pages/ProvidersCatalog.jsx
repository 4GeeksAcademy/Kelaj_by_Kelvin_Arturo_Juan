import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { getCategories } from '../services/services';
import { getUserLocation } from '../services/APIservices';
import { searchProviders, getFollowing, toggleFollow } from '../services/userServices';
import useGlobalReducer from "../hooks/useGlobalReducer";
import '../styles/ProvidersCatalog.css';

const getInitials = (name, lastName) => {
    const first = name ? name.charAt(0) : "";
    const second = lastName ? lastName.charAt(0) : "";
    return (first + second).toUpperCase() || "U";
};

const getAvatarColor = (name) => {
    const colors = ['#4285F4', '#DB4437', '#F4B400', '#0F9D58', '#673AB7', '#FF9800', '#E91E63'];
    const charCode = name ? name.charCodeAt(0) : 0;
    return colors[charCode % colors.length];
};

const StarRating = ({ rating, reviewsCount }) => {
    const numericRating = Number(rating) || 0;
    return (
        <div className="text-warning d-flex align-items-center gap-1 mb-2" style={{ fontSize: "1rem" }}>
            {[...Array(5)].map((_, i) => (
                <i key={i} className={`bi bi-star${i < Math.round(numericRating) ? '-fill' : ''}`}></i>
            ))}
            <span className="text-dark fw-bold ms-1">{numericRating.toFixed(1)}</span>
            <span className="text-muted small ms-1">({reviewsCount || 0} reseñas)</span>
        </div>
    );
};

export const ProvidersCatalog = () => {
    const { store } = useGlobalReducer();
    const location = useLocation();
    const navigate = useNavigate();

    const [categoriesData, setCategoriesData] = useState([]);
    const [allProviders, setAllProviders] = useState([]);
    const [filteredProviders, setFilteredProviders] = useState([]);
    const [followingIds, setFollowingIds] = useState([]);

    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState({ type: "all", value: "" });
    const [detectedLocation, setDetectedLocation] = useState("");

    // Control estricto: guarda únicamente el índice del dropdown abierto (o null)
    const [openDropdown, setOpenDropdown] = useState(null);
    const filtersRef = useRef(null);

    // Cerrar el dropdown si se hace clic fuera de la barra de filtros
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (filtersRef.current && !filtersRef.current.contains(event.target)) {
                setOpenDropdown(null);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Función para limpiar tanto filtros de categorías como búsquedas en la URL
    const handleClearFilters = () => {
        setActiveFilter({ type: "all", value: "" });
        setOpenDropdown(null);
        if (location.search) {
            navigate("/catalog", { replace: true });
        }
    };

    // Cargar la lista de usuarios a los que sigue el usuario logueado
    useEffect(() => {
        const fetchUserFollowing = async () => {
            if (!store.user?.id) {
                setFollowingIds([]);
                return;
            }
            try {
                const list = await getFollowing(store.user.id);
                if (Array.isArray(list)) {
                    const ids = list.map(item => (typeof item === "object" ? item.id : Number(item)));
                    setFollowingIds(ids);
                }
            } catch (error) {
                console.error("Error al cargar seguidos:", error);
            }
        };
        fetchUserFollowing();
    }, [store.user]);

    // Seguir / Dejar de seguir desde el corazón de la tarjeta
    const handleHeartClick = async (providerId) => {
        if (!store.user) {
            navigate("/login");
            return;
        }
        if (store.user.id === providerId) return;

        const isCurrentlyFollowing = followingIds.includes(providerId);

        // Actualización visual inmediata
        setFollowingIds(prev =>
            isCurrentlyFollowing
                ? prev.filter(id => id !== providerId)
                : [...prev, providerId]
        );

        const res = await toggleFollow(providerId, isCurrentlyFollowing);
        // Si hubo algún fallo en el servidor, revertimos el cambio visual
        if (!res) {
            setFollowingIds(prev =>
                isCurrentlyFollowing
                    ? [...prev, providerId]
                    : prev.filter(id => id !== providerId)
            );
        }
    };

    // 1. Detectar ubicación
    useEffect(() => {
        const fetchLocation = async () => {
            try {
                const loc = await getUserLocation();
                if (loc) setDetectedLocation(loc);
            } catch (error) {
                console.warn("Ubicación automática no disponible:", error.message);
            }
        };
        fetchLocation();
    }, []);

    // 2. Carga inicial de datos
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                // Guardamos la respuesta intacta (Categorías y sus subcategorías)
                const cats = await getCategories();
                setCategoriesData(cats);

                const provs = await searchProviders("");
                setAllProviders(provs);
            } catch (error) {
                console.error("Error al cargar datos:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchInitialData();
    }, []);

    // 3. Lógica de Filtrado y Búsqueda
    useEffect(() => {
        const searchParams = new URLSearchParams(location.search);
        const query = (searchParams.get('q') || "").toLowerCase().trim();
        const type = searchParams.get('type') || "service";
        const loc = (searchParams.get('location') || "").toLowerCase().trim();

        let result = [...allProviders];

        // A. Búsqueda por Texto
        if (query) {
            result = result.filter(prov => {
                const name = prov.name?.toLowerCase() || "";
                const lastName = prov.last_name?.toLowerCase() || "";
                const fullName = `${name} ${lastName}`;
                const services = (prov.providerprofile?.services || []).filter(s => s.visible !== false);
                const bio = prov.providerprofile?.bio?.toLowerCase() || "";
                const desc = prov.providerprofile?.description?.toLowerCase() || "";

                if (type === "person") {
                    return fullName.includes(query);
                } else if (type === "service") {
                    // Busca específicamente en los servicios ofrecidos (título y descripción del servicio)
                    return services.some(s =>
                        (s.title || "").toLowerCase().includes(query) ||
                        (s.description || "").toLowerCase().includes(query)
                    );
                } else {
                    // "profession": Busca por especialidad, subcategoría, categoría o biografía del profesional
                    const matchInProfession = services.some(s =>
                        (s.subcategory?.name || "").toLowerCase().includes(query) ||
                        (s.subcategory?.category_name || "").toLowerCase().includes(query)
                    );

                    return matchInProfession || bio.includes(query) || desc.includes(query);
                }
            });
        }

        // B. Filtro por Ubicación
        if (loc) {
            result = result.filter(prov => {
                const city = prov.city?.toLowerCase() || "";
                const area = prov.providerprofile?.coverage_area?.toLowerCase() || "";
                return city.includes(loc) || area.includes(loc);
            });
        } else {
            // Smart Sorting
            const userZone = detectedLocation || store.user?.city?.toLowerCase() || "madrid";

            result.sort((a, b) => {
                const aArea = (a.city + " " + (a.providerprofile?.coverage_area || "")).toLowerCase();
                const bArea = (b.city + " " + (b.providerprofile?.coverage_area || "")).toLowerCase();

                const aIsNear = aArea.includes(userZone) || aArea.includes("madrid");
                const bIsNear = bArea.includes(userZone) || bArea.includes("madrid");

                if (aIsNear && !bIsNear) return -1;
                if (!aIsNear && bIsNear) return 1;
                return 0;
            });
        }

        // C. Filtro Jerárquico por Categorías/Subcategorías (Dropdowns)
        if (activeFilter.type === "category") {
            // Si elige "Ver todo en [Categoría]", buscamos proveedores que tengan cualquier subcategoría de esa familia
            const targetCat = categoriesData.find(c => c.name === activeFilter.value);
            const validSubNames = targetCat ? targetCat.subcategories.map(s => s.name) : [];

            result = result.filter(prov => {
                const services = (prov.providerprofile?.services || []).filter(s => s.visible !== false);
                return services.some(s => validSubNames.includes(s.subcategory?.name));
            });
        } else if (activeFilter.type === "subcategory") {
            // Si elige una subcategoría específica
            result = result.filter(prov => {
                const services = (prov.providerprofile?.services || []).filter(s => s.visible !== false);
                return services.some(s => s.subcategory?.name === activeFilter.value);
            });
        }

        setFilteredProviders(result);
    }, [location.search, allProviders, activeFilter, store.user, detectedLocation, categoriesData]);

    return (
        <div className="pb-5 pt-4">
            <div className="container">

                {/* Cabecera y Filtros Jerárquicos */}
                <div className="mb-4">
                    <h3 className="fw-bold mb-3">Todos los servicios</h3>
                    <div className="d-flex gap-2 flex-wrap pb-2 align-items-center" ref={filtersRef}>
                        {/* Botón Todas */}
                        <button
                            className={`filter-pill fw-semibold ${activeFilter.type === "all" && !location.search ? "active" : ""}`}
                            onClick={handleClearFilters}
                        >
                            Todas
                        </button>

                        {/* Dropdowns de Categorías (Estrictamente 1 abierto a la vez) */}
                        {categoriesData.map((cat, idx) => {
                            const isActiveFamily =
                                (activeFilter.type === "category" && activeFilter.value === cat.name) ||
                                (activeFilter.type === "subcategory" && cat.subcategories.some(s => s.name === activeFilter.value));

                            const isOpen = openDropdown === idx;

                            return (
                                <div className="dropdown position-relative" key={idx}>
                                    <button
                                        className={`filter-pill fw-semibold dropdown-toggle ${isActiveFamily ? "active" : ""}`}
                                        type="button"
                                        aria-expanded={isOpen}
                                        onClick={() => setOpenDropdown(isOpen ? null : idx)}
                                    >
                                        {cat.name}
                                    </button>

                                    <ul
                                        className={`dropdown-menu shadow-sm border-0 rounded-3 mt-1 ${isOpen ? "show" : ""}`}
                                        style={isOpen ? { position: "absolute", top: "100%", left: 0, zIndex: 1050 } : {}}
                                    >
                                        {cat.subcategories.map(sub => (
                                            <li key={sub.id}>
                                                <button
                                                    type="button"
                                                    className={`dropdown-item py-2 ${activeFilter.value === sub.name ? "bg-light text-primary fw-bold" : ""}`}
                                                    onClick={() => {
                                                        setActiveFilter({ type: "subcategory", value: sub.name });
                                                        setOpenDropdown(null); // Cierra el menú al seleccionar
                                                    }}
                                                >
                                                    {sub.name}
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            );
                        })}
                    </div>
                    <div className='col-auto d-flex justify-content-end mt-3'>
                        <p className="bg-light bg-opacity-50 rounded-pill px-3 py-1 small mt-2">¡{filteredProviders.length} proveedores cerca de ti!</p>
                    </div>
                </div>

                {/* Lista de Resultados */}
                {loading ? (
                    <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>
                ) : filteredProviders.length === 0 ? (
                    <div className="text-center bg-white p-5 rounded-4 shadow-sm border border-light">
                        <i className="bi bi-search text-muted fs-1 mb-3 d-block"></i>
                        <h5 className="text-muted">No se encontraron profesionales.</h5>
                        <p className="text-muted small">Intenta buscar de otra manera o limpia los filtros.</p>
                    </div>
                ) : (
                    <div className="d-flex flex-column gap-4">
                        {filteredProviders.map(provider => {
                            const profile = provider.providerprofile;
                            const services = (profile?.services || []).filter(s => s.visible !== false);

                            const mainProfession = services[0]?.title || profile?.bio || "Profesional independiente";
                            const hasImage = provider.profile_image && !provider.profile_image.includes("ui-avatars");
                            const isFollowing = followingIds.includes(provider.id);

                            return (
                                <div key={provider.id} className="card bg-white border-0 shadow-sm rounded-4 provider-list-card position-relative overflow-hidden">
                                    <div className="card-body p-4">
                                        <div className="row align-items-sm-center">

                                            {/* Foto / Iniciales */}
                                            <div className="col-auto mb-3 mb-sm-0 position-relative">
                                                <i
                                                    onClick={() => handleHeartClick(provider.id)}
                                                    title={isFollowing ? "Siguiendo (clic para dejar de seguir)" : "Seguir proveedor"}
                                                    className={`bi ${isFollowing ? "bi-heart-fill text-danger" : "bi-heart text-muted"} position-absolute bg-white rounded-circle px-1 shadow-sm`}
                                                    style={{ top: "-5px", right: "-5px", cursor: "pointer", zIndex: 2 }}
                                                ></i>

                                                {hasImage ? (
                                                    <img src={provider.profile_image} alt={provider.name} className="avatar-square shadow-sm border" />
                                                ) : (
                                                    <div className="avatar-initials shadow-sm" style={{ backgroundColor: getAvatarColor(provider.name) }}>
                                                        {getInitials(provider.name, provider.last_name)}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Información principal */}
                                            <div className="col">
                                                <h4 className="fw-bold text-dark mb-1">{mainProfession}</h4>

                                                <div className="d-flex align-items-center mb-2">
                                                    <span className="text-muted fw-semibold me-1">{provider.name} {provider.last_name}</span>
                                                    {profile?.verified && <i className="bi bi-patch-check-fill text-primary"></i>}
                                                    <span className="text-muted small ms-3">
                                                        <i className="bi bi-geo-alt me-1"></i>{profile?.coverage_area || provider.city}
                                                    </span>
                                                </div>

                                                <StarRating rating={provider.average_rating} reviewsCount={services[0]?.reviews_data?.total_reviews} />

                                                <div className="d-flex flex-wrap gap-2 mb-3">
                                                    {services.slice(0, 3).map(s => (
                                                        <span key={s.id} className="tag-badge">{s.subcategory?.name || s.title}</span>
                                                    ))}
                                                </div>

                                                <p className="text-muted small mb-0 d-none d-md-block" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                                    {profile?.description || "Profesional verificado en Kelaj."}
                                                </p>
                                            </div>

                                            {/* Botón de acción */}
                                            <div className="col-sm-auto text-sm-end mt-3 mt-sm-0">
                                                <Link to={`/profile/${provider.id}`} className="btn btn-primary rounded-pill px-4 py-2 fw-semibold shadow-sm">
                                                    Ver perfil
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};