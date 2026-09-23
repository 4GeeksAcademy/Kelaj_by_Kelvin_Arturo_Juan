import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import "../styles/profileView.css"

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

const StarRating = ({ rating }) => (
    <div className="text-warning">
        {[...Array(5)].map((_, i) => (
            <i key={i} className={`bi bi-star${i < rating ? '-fill' : ''}`}></i>
        ))}
    </div>
);

// Componente del Botón de Seguir integrado
const FollowButton = ({ targetUserId, initialIsFollowing }) => {
    const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
    const [loading, setLoading] = useState(false);

    const handleToggleFollow = async () => {
        // Obtenemos el token desde sessionStorage o localStorage (según como lo guardes en tu app)
        const token = sessionStorage.getItem("token") || localStorage.getItem("token");

        if (!token) {
            alert("Debes iniciar sesión para seguir a un usuario");
            return;
        }

        setLoading(true);
        const method = isFollowing ? 'DELETE' : 'POST';

        try {
            const response = await fetch(`${BACKEND_URL}/api/users/${targetUserId}/follow`, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                setIsFollowing(!isFollowing); // Invertimos el estado visualmente
            } else {
                const data = await response.json();
                console.error("Error:", data.error || data.message);
            }
        } catch (error) {
            console.error("Error de conexión:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            onClick={handleToggleFollow}
            disabled={loading}
            className={`btn rounded-pill px-4 fw-semibold ${isFollowing ? 'btn-secondary' : 'btn-outline-secondary'}`}
        >
            {loading ? (
                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
            ) : isFollowing ? (
                <><i className="bi bi-person-check-fill me-1"></i> Siguiendo</>
            ) : (
                <><i className="bi bi-person-plus me-1"></i> Seguir</>
            )}
        </button>
    );
};

export const Profile = () => {
    const { theId } = useParams();
    console.log('el Id de la url es: ', theId)
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("");
    const [isFollowing, setIsFollowing] = useState(false); // Estado para el FollowButton
    const [isOwnProfile, setIsOwnProfile] = useState(false); // Para saber si es mi propio perfil

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                // 1. Cargar los datos del perfil
                const response = await fetch(`${BACKEND_URL}/api/users/${theId}`);
                if (response.ok) {
                    const data = await response.json();
                    setUser(data);
                    setActiveTab(data.is_provider ? "servicios" : "historial");

                    // 2. Lógica para Seguidores: Verificar si el usuario actual ya sigue a este perfil
                    const token = localStorage.getItem("token");
                    const storedUser = JSON.parse(sessionStorage.getItem("user") || localStorage.getItem("user") || "null");

                    if (storedUser) {
                        // Verificamos si estamos viendo nuestro propio perfil
                        setIsOwnProfile(storedUser.id === parseInt(theId));

                        if (token && storedUser.id !== parseInt(theId)) {
                            // Consultamos a quiénes sigue el usuario logueado
                            const resFollowing = await fetch(`${BACKEND_URL}/api/users/${storedUser.id}/following`, {
                                headers: { 'Authorization': `Bearer ${token}` }
                            });

                            if (resFollowing.ok) {
                                const followingData = await resFollowing.json();
                                // Si el ID del perfil actual está en la lista de seguidos, marcamos como true
                                setIsFollowing(followingData.some(u => u.id === parseInt(theId)));
                            }
                        }
                    }
                } else {
                    console.error("Perfil no encontrado");
                }
            } catch (error) {
                console.error("Error cargando el perfil", error);
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [theId]);

    if (loading) return <div className="text-center mt-5"><div className="spinner-border text-primary"></div></div>;
    if (!user) return <div className="text-center mt-5"><h3>Usuario no encontrado</h3></div>;

    const isProvider = user.is_provider && user.providerprofile;

    return (
        <div className="min-vh-100 pb-5">
            <div style={{ height: "250px", backgroundImage: `url(${user.cover_image || 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200'})`, backgroundSize: "cover", backgroundPosition: "center" }}></div>

            <main className="container" style={{ marginTop: "-80px", maxWidth: "800px" }}>
                {/* Tarjeta Principal (Compartida) */}
                <div className="card border-0 shadow-sm rounded-4 mb-4 p-4 text-center position-relative">
                    <img
                        src={user.profile_image || "https://via.placeholder.com/200"} onError={(e) => e.target.src = "https://via.placeholder.com/200"}
                        alt={user.name}
                        className="rounded-circle border border-4 border-white mx-auto shadow-sm"
                        style={{ width: "100px", height: "100px", marginTop: "-70px", objectFit: "cover", backgroundColor: "#fff" }}
                    />

                    <h3 className="fw-bold mt-3 mb-1">{user.name} {user.last_name}</h3>

                    {isProvider ? (
                        <>
                            <p className="text-muted mb-2"><i className="bi bi-geo-alt-fill text-primary"></i> {user.providerprofile.coverage_area || user.city || "Ubicación no especificada"}</p>

                            {/* Contadores de Seguidores y Seguidos */}
                            <div className="d-flex justify-content-center gap-4 my-3 text-dark">
                                <div><span className="fw-bold fs-5">{user.followers_count}</span> <span className="text-muted small">Seguidores</span></div>
                                <div><span className="fw-bold fs-5">{user.following_count}</span> <span className="text-muted small">Siguiendo</span></div>
                            </div>

                            <div className="d-flex justify-content-center gap-3 mt-3">
                                <button className="btn btn-primary rounded-pill px-4 fw-semibold"><i className="bi bi-calendar-event"></i> Agendar</button>

                                {/* Componente de Seguir condicional */}
                                {!isOwnProfile && (
                                    <div>
                                        <FollowButton targetUserId={parseInt(theId)} initialIsFollowing={isFollowing} />
                                        <button className="btn btn-success mx-3 rounded-pill px-4 fw-semibold">Mensaje</button>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="mt-2">
                            <span className="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 rounded-pill px-3 py-2 fw-semibold">
                                <i className="bi bi-person-badge me-1"></i> Cliente Kelaj
                            </span>
                            <p className="text-muted mt-3 mb-0 small"><i className="bi bi-geo-alt-fill"></i> {user.city || "Ubicación no especificada"}</p>

                            {/* Contadores para clientes */}
                            <div className="d-flex justify-content-center gap-4 my-3 text-dark">
                                <div><span className="fw-bold fs-5">{user.followers_count}</span> <span className="text-muted small">Seguidores</span></div>
                                <div><span className="fw-bold fs-5">{user.following_count}</span> <span className="text-muted small">Siguiendo</span></div>
                            </div>

                            {!isOwnProfile && (
                                <div className="mt-3">
                                    <FollowButton targetUserId={parseInt(theId)} initialIsFollowing={isFollowing} />
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* VISTA DE PROVEEDOR */}
                {isProvider && (
                    <>
                        <div className="card border-0 shadow-sm rounded-4 mb-4 p-4">
                            <h6 className="fw-bold text-muted text-uppercase mb-3" style={{ fontSize: "0.8rem", letterSpacing: "1px" }}>Acerca de</h6>
                            <p className="fst-italic text-dark mb-0">
                                {user.providerprofile.bio || "Este profesional aún no ha escrito una biografía."}
                            </p>
                        </div>

                        <div className="card border-0 shadow-sm rounded-4 mb-4 overflow-hidden">
                            <ul className="nav nav-tabs d-flex justify-content-around bg-white pt-2">
                                {["servicios", "galeria", "resenas"].map(tab => (
                                    <li key={tab} className="nav-item flex-fill text-center">
                                        <button
                                            className={`nav-link w-100 border-0 fw-semibold py-3 ${activeTab === tab ? "text-primary border-bottom border-primary border-2" : "text-muted"}`}
                                            style={{ background: "transparent" }}
                                            onClick={() => setActiveTab(tab)}
                                        >
                                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                                        </button>
                                    </li>
                                ))}
                            </ul>

                            <div className="p-4 bg-white">
                                {activeTab === "servicios" && (
                                    <div>
                                        <h5 className="fw-bold mb-4">Servicios Ofrecidos</h5>
                                        {user.providerprofile.services && user.providerprofile.services.length > 0 ? (
                                            user.providerprofile.services.map(service => (
                                                <div key={service.id} className="card border rounded-4 p-3 mb-3 hover-shadow">
                                                    <div className="d-flex align-items-center gap-3">
                                                        <div className="flex-grow-1">
                                                            <h6 className="fw-bold mb-1">{service.title}</h6>
                                                        </div>
                                                        <div className="text-end">
                                                            <div className="fw-bold fs-6">{service.price} €</div>
                                                            <Link to={`/checkout?serviceId=${service.id}`} className="text-primary text-decoration-none fw-bold" style={{ fontSize: "0.8rem" }}>Contratar</Link>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-muted">No tiene servicios publicados.</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                )}

                {/* VISTA DE CLIENTE */}
                {!isProvider && (
                    <div className="card border-0 shadow-sm rounded-4 mb-4 overflow-hidden">
                        <ul className="nav nav-tabs d-flex justify-content-around bg-white pt-2">
                            {["historial", "resenas"].map(tab => (
                                <li key={tab} className="nav-item flex-fill text-center">
                                    <button
                                        className={`nav-link w-100 border-0 fw-semibold py-3 ${activeTab === tab ? "text-primary border-bottom border-primary border-2" : "text-muted"}`}
                                        style={{ background: "transparent" }}
                                        onClick={() => setActiveTab(tab)}
                                    >
                                        {tab === "historial" ? "Servicios Contratados" : "Reseñas Escritas"}
                                    </button>
                                </li>
                            ))}
                        </ul>

                        <div className="p-4 bg-white">
                            {activeTab === "historial" && (
                                <div>
                                    <h5 className="fw-bold mb-4">Historial de Servicios</h5>
                                    {user.client_appointments && user.client_appointments.length > 0 ? (
                                        user.client_appointments.map(app => (
                                            <div key={app.id} className="card border rounded-4 p-3 mb-3 hover-shadow">
                                                <div className="d-flex align-items-center gap-3">
                                                    <div className="bg-light text-success rounded-3 d-flex align-items-center justify-content-center" style={{ width: "48px", height: "48px", fontSize: "1.25rem" }}>
                                                        <i className="bi bi-check-circle-fill"></i>
                                                    </div>
                                                    <div className="flex-grow-1">
                                                        <h6 className="fw-bold mb-1">{app.service_title}</h6>
                                                        <p className="text-muted small mb-0">Profesional: <span className="fw-semibold text-dark">{app.provider_name}</span></p>
                                                    </div>
                                                    <div className="text-end">
                                                        <span className="badge bg-light text-secondary border">{app.date}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-4 text-muted">
                                            <i className="bi bi-bag-x fs-1 mb-2 d-block text-light-subtle"></i>
                                            <p>Aún no hay servicios contratados.</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {activeTab === "resenas" && (
                                <div>
                                    <h5 className="fw-bold mb-4">Reseñas Dejadas</h5>
                                    {user.client_reviews && user.client_reviews.length > 0 ? (
                                        user.client_reviews.map(review => (
                                            <div key={review.id} className="card border rounded-4 p-3 mb-3">
                                                <div className="d-flex justify-content-between align-items-start mb-2">
                                                    <StarRating rating={review.rating} />
                                                    <span className="badge bg-light text-secondary border">{review.date}</span>
                                                </div>
                                                <p className="text-dark mb-2 fst-italic">"{review.comment}"</p>
                                                <small className="text-muted fw-semibold">— {review.service_title}</small>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-4 text-muted">
                                            <i className="bi bi-chat-square-text fs-1 mb-2 d-block text-light-subtle"></i>
                                            <p>Aún no has escrito ninguna reseña.</p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};