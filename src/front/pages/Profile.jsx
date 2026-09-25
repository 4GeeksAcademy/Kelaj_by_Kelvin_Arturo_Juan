import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { toggleFollow, getProfile, getFollowing, deleteGalleryMedia } from '../services/userServices';
import "../styles/profileView.css"
import { VerifiedBadge } from "../components/VerifiedBadge";

import { AddMediaModal } from '../components/UserComponents/AddMediaModal';
import { ViewMediaModal } from '../components/UserComponents/ViewMediaModal';
import { EditScheduleModal } from '../components/UserComponents/EditScheduleModal';
import { AddServiceModal } from '../components/UserComponents/AddServiceModal';

const StarRating = ({ rating, reviewsCount }) => {
    const numericRating = Number(rating) || 0;
    return (
        <div className="d-flex align-items-center justify-content-center gap-1 mb-3">
            <div className="text-warning d-flex gap-1 star-rating-container">
                {[...Array(5)].map((_, i) => (
                    <i key={i} className={`bi bi-star${i < Math.round(numericRating) ? '-fill' : ''}`}></i>
                ))}
            </div>
            {reviewsCount !== undefined && (
                <>
                    <span className="fw-bold text-dark ms-1">{numericRating.toFixed(1)}</span>
                    <span className="text-muted small ms-1">({reviewsCount || 0} reseñas)</span>
                </>
            )}
        </div>
    );
};

export const Profile = () => {
    const { theId } = useParams();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("");

    const [isFollowing, setIsFollowing] = useState(false);
    const [followLoading, setFollowLoading] = useState(false);
    const [isOwnProfile, setIsOwnProfile] = useState(false);

    const [showAddMedia, setShowAddMedia] = useState(false);
    const [selectedMedia, setSelectedMedia] = useState(null);
    const [showEditSchedule, setShowEditSchedule] = useState(false);
    const [editPostData, setEditPostData] = useState(null);
    const [showAddService, setShowAddService] = useState(false);

    // =================================================================
    // NUEVA FUNCIÓN REUTILIZABLE: Carga los datos silenciosamente
    // =================================================================
const fetchProfileData = async (isInitialLoad = true) => {
        if (isInitialLoad) setLoading(true);
        
        try {
            const storedUser = JSON.parse(sessionStorage.getItem("user") || localStorage.getItem("user") || "null");
            const targetId = theId || (storedUser ? storedUser.id : null);

            if (!targetId) {
                if (isInitialLoad) setLoading(false);
                return;
            }

            const data = await getProfile(targetId);
            
            if (data) {
                setUser(data);
                
                if (isInitialLoad) {
                    setActiveTab(data.is_provider ? "servicios" : "historial");
                }

                if (storedUser) {
                    setIsOwnProfile(storedUser.id === parseInt(targetId));
                    // ¡Adiós a getFollowing! Ya no consultamos listas innecesarias.
                }
            }
        } catch (error) {
            console.error("Error cargando el perfil", error);
        } finally {
            if (isInitialLoad) setLoading(false);
        }
    };

    useEffect(() => {
        fetchProfileData(true);
    }, [theId]);

    const handleFollowClick = async () => {
        if (!localStorage.getItem("token")) {
            alert("Debes iniciar sesión para seguir a un usuario");
            return;
        }

        setFollowLoading(true);
        const result = await toggleFollow(user.id, isFollowing);

        if (result) {
            setUser(prevUser => ({
                ...prevUser,
                followers_count: prevUser.followers_count + (isFollowing ? -1 : 1)
            }));
            setIsFollowing(!isFollowing);
        }
        setFollowLoading(false);
    };

    if (loading) return <div className="text-center py-5 mt-5"><div className="spinner-border text-primary"></div></div>;
    if (!user) return <div className="text-center py-5 mt-5"><h3>Usuario no encontrado</h3></div>;

    const isProvider = user.is_provider && user.providerprofile;
    const services = isProvider ? user.providerprofile.services || [] : [];
    const mainProfession = services[0]?.title || user.providerprofile?.bio || "Profesional";
    const totalReviews = services.reduce((acc, s) => acc + (s.reviews_data?.total_reviews || 0), 0);
    const hasImage = user.profile_image && !user.profile_image.includes("ui-avatars");

    const daysOfWeek = [
        { id: 1, label: "Lun" }, { id: 2, label: "Mar" }, { id: 3, label: "Mié" },
        { id: 4, label: "Jue" }, { id: 5, label: "Vie" }, { id: 6, label: "Sáb" }, { id: 7, label: "Dom" }
    ];

    return (
        <div className="min-vh-100 pb-5">
            <div
                className="hero-banner"
                style={{ backgroundImage: `url(${user.cover_image || 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200'})` }}
            ></div>

            <main className="container profile-main-container">
                <div className="card border-0 shadow-sm rounded-4 mb-4 p-4 text-center position-relative">

                    <div className="d-flex justify-content-between position-absolute w-100 px-4 top-actions-container">
                        {!isOwnProfile ? (
                            <button
                                onClick={handleFollowClick}
                                disabled={followLoading}
                                className={`btn btn-sm rounded-pill px-3 fw-semibold border d-flex align-items-center gap-2 shadow-sm ${isFollowing ? 'bg-light text-dark' : 'bg-white text-dark'}`}
                            >
                                {followLoading ? <span className="spinner-border spinner-border-sm"></span> : (
                                    <><i className={`bi ${isFollowing ? 'bi-person-check' : 'bi-person-plus'}`}></i> {isFollowing ? 'Siguiendo' : 'Seguir'}</>
                                )}
                            </button>
                        ) : <div></div>}

                        {isOwnProfile && (
                            <Link to="/settings" className="btn btn-sm bg-white text-dark border rounded-circle shadow-sm d-flex align-items-center justify-content-center settings-btn">
                                <i className="bi bi-gear"></i>
                            </Link>
                        )}
                    </div>

                    <div className="position-relative d-inline-block mx-auto mb-2 avatar-container">
                        {hasImage ? (
                            <img src={user.profile_image} alt={user.name} className="rounded-circle border border-4 border-white shadow-sm object-fit-cover avatar-img" />
                        ) : (
                            <div className="rounded-circle border border-4 border-white shadow-sm d-flex align-items-center justify-content-center bg-secondary text-white fw-bold avatar-placeholder">
                                {(user.name || "U").charAt(0)}{(user.last_name || "").charAt(0)}
                            </div>
                        )}
                        <span className="position-absolute bottom-0 end-0 p-2 bg-success border border-3 border-white rounded-circle status-indicator"></span>
                    </div>

                    <h3 className="fw-bold mb-1 d-flex align-items-center gap-2">{user.name} {user.last_name} {user.verified && <VerifiedBadge size={22} />}</h3>

                    {isProvider ? (
                        <>
                            <p className="text-muted mb-2 small">{mainProfession} · {user.providerprofile.coverage_area || user.city || "España"}</p>
                            <StarRating rating={user.average_rating} reviewsCount={totalReviews} />

                            <div className="d-flex justify-content-center gap-2 mb-4 flex-wrap">
                                {user.providerprofile.verified && (
                                    <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 rounded-pill px-3 py-2 fw-semibold">
                                        <i className="bi bi-patch-check me-1"></i> Verificado
                                    </span>
                                )}
                                {user.average_rating >= 4.5 && (
                                    <span className="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 rounded-pill px-3 py-2 fw-semibold">
                                        <i className="bi bi-award me-1"></i> Top Profesional
                                    </span>
                                )}
                                <span className="badge bg-warning bg-opacity-10 border border-warning border-opacity-25 rounded-pill px-3 py-2 fw-semibold text-warning-dark">
                                    <i className="bi bi-clock-history me-1"></i> Responde rápido
                                </span>
                            </div>

                            <div className="d-flex justify-content-center gap-3">
                                {!isOwnProfile ? (
                                    <>
                                        <button className="btn btn-primary rounded-pill px-4 fw-semibold shadow-sm"><i className="bi bi-calendar-event me-2"></i>Agendar</button>
                                        <button className="btn btn-success rounded-pill px-4 fw-semibold shadow-sm"><i className="bi bi-chat-dots me-2"></i>Mensaje</button>
                                        <button className="btn btn-white border rounded-circle shadow-sm d-flex align-items-center justify-content-center action-btn-circle"><i className="bi bi-share"></i></button>
                                    </>
                                ) : (
                                    <>
                                        <Link to="/agenda" className="btn btn-primary rounded-pill px-4 fw-semibold shadow-sm"><i className="bi bi-calendar-check me-2"></i>Agenda</Link>
                                        <Link to="/chats" className="btn btn-success rounded-pill px-4 fw-semibold shadow-sm"><i className="bi bi-chat-left-text me-2"></i>Chats</Link>
                                    </>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="mt-2">
                            <span className="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 rounded-pill px-3 py-2 fw-semibold">
                                <i className="bi bi-person-badge me-1"></i> Cliente Kelaj
                            </span>
                            <p className="text-muted mt-3 mb-0 small"><i className="bi bi-geo-alt-fill"></i> {user.city || "Ubicación no especificada"}</p>
                        </div>
                    )}
                </div>

                {isProvider && (
                    <>
                        <div className="row g-3 mb-4 text-center">
                            <div className="col-4">
                                <div className="card border-0 shadow-sm rounded-4 py-3 h-100 justify-content-center">
                                    <h4 className="fw-bold text-primary mb-0">{services.length}+</h4>
                                    <span className="text-muted small">Servicios</span>
                                </div>
                            </div>
                            <div className="col-4">
                                <div className="card border-0 shadow-sm rounded-4 py-3 h-100 justify-content-center">
                                    <h4 className="fw-bold text-primary mb-0">{user.followers_count}</h4>
                                    <span className="text-muted small">Seguidores</span>
                                </div>
                            </div>
                            <div className="col-4">
                                <div className="card border-0 shadow-sm rounded-4 py-3 h-100 justify-content-center">
                                    <h4 className="fw-bold text-primary mb-0">{user.following_count}</h4>
                                    <span className="text-muted small">Siguiendo</span>
                                </div>
                            </div>
                        </div>

                        <div className="card border-0 shadow-sm rounded-4 mb-4 p-4">
                            <h6 className="fw-bold text-muted text-uppercase mb-3 section-subtitle">Acerca de</h6>
                            <p className="fst-italic text-dark mb-4 bio-text">
                                "{user.providerprofile.description || user.providerprofile.bio || "Este profesional aún no ha añadido una descripción detallada."}"
                            </p>
                            <hr className="text-light-subtle" />
                            <p className="text-muted mb-0 small mt-2">
                                <i className="bi bi-geo-alt text-primary me-2"></i>
                                {user.providerprofile.coverage_area || user.city || "España"}
                            </p>
                        </div>

                        <div className="card border-0 shadow-sm rounded-4 mb-4 overflow-hidden">
                            <ul className="nav nav-tabs d-flex justify-content-around bg-white pt-2 border-bottom">
                                {["servicios", "galeria", "resenas"].map(tab => (
                                    <li key={tab} className="nav-item flex-fill text-center">
                                        <button
                                            className={`nav-link w-100 border-0 fw-bold py-3 ${activeTab === tab ? "text-primary border-bottom border-primary border-2" : "text-muted"}`}
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
                                        <div className="d-flex justify-content-between align-items-center mb-4">
                                            <h5 className="fw-bold mb-0">Servicios</h5>
                                            {isOwnProfile && (
                                                <button 
                                                    className="btn btn-sm btn-outline-primary rounded-pill px-3"
                                                    onClick={() => setShowAddService(true)}
                                                >
                                                    <i className="bi bi-plus-lg me-1"></i> Añadir Servicio
                                                </button>
                                            )}
                                        </div>
                                        {services.length > 0 ? (
                                            services.map((service, idx) => (
                                                <div key={service.id} className="card border rounded-4 p-3 mb-3 shadow-sm">
                                                    <div className="row align-items-center">
                                                        <div className="col-auto">
                                                            <div className="bg-primary bg-opacity-10 text-primary rounded-3 d-flex align-items-center justify-content-center service-icon-box">
                                                                <i className="bi bi-briefcase"></i>
                                                            </div>
                                                        </div>
                                                        <div className="col">
                                                            <div className="d-flex align-items-center gap-2 mb-1">
                                                                <h6 className="fw-bold mb-0">{service.title}</h6>
                                                                {idx === 0 && <span className="badge bg-primary rounded-pill badge-small">Más solicitado</span>}
                                                            </div>
                                                            <p className="text-muted small mb-0">{service.description}</p>
                                                        </div>
                                                        <div className="col-auto text-end">
                                                            <div className="fw-bold fs-5 text-dark mb-1">
                                                                {service.price} €
                                                                {service.price_type === "hourly" && <span className="fs-6 text-muted fw-normal"> /hr</span>}
                                                            </div>
                                                            {!isOwnProfile && (
                                                                <Link to={`/checkout?serviceId=${service.id}`} className="text-primary text-decoration-none fw-bold contract-link">Contratar</Link>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-muted text-center py-4">No tiene servicios publicados.</p>
                                        )}
                                    </div>
                                )}

                                {activeTab === "galeria" && (
                                    <div>
                                        <div className="d-flex justify-content-between align-items-center mb-4">
                                            <h5 className="fw-bold mb-0">Galería de Trabajos</h5>
                                            {isOwnProfile && (
                                                <button
                                                    className="btn btn-sm btn-outline-primary rounded-pill px-3"
                                                    onClick={() => setShowAddMedia(true)}
                                                >
                                                    <i className="bi bi-plus-lg me-1"></i> Añadir Foto
                                                </button>
                                            )}
                                        </div>

                                        {user.providerprofile.gallery && user.providerprofile.gallery.length > 0 ? (
                                            <div className="row gx-1 gy-1">
                                                {user.providerprofile.gallery.map((item, idx) => {
                                                    const coverPhoto = item.urls && item.urls.length > 0 ? item.urls[0] : '';

                                                    return (
                                                        <div key={idx} className="col-4">
                                                            <img
                                                                src={coverPhoto}
                                                                alt={item.title}
                                                                className="img-fluid w-100 gallery-img cursor-pointer shadow-sm"
                                                                onClick={() => setSelectedMedia(item)}
                                                            />
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <div className="text-center py-5 text-muted">
                                                <i className="bi bi-images fs-1 d-block mb-3 text-light-subtle"></i>
                                                <p>Este profesional aún no ha subido fotos de su trabajo.</p>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {activeTab === "resenas" && (
                                    <div>
                                        <h5 className="fw-bold mb-4">Reseñas de Clientes</h5>
                                        {user.providerprofile.reviews && user.providerprofile.reviews.length > 0 ? (
                                            user.providerprofile.reviews.map(review => (
                                                <div key={review.id} className="card border rounded-4 p-4 mb-3 shadow-sm">
                                                    <div className="d-flex justify-content-between align-items-center mb-3">
                                                        <div className="d-flex align-items-center gap-3">
                                                            <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center fw-bold review-avatar">
                                                                {review.client_name ? review.client_name.charAt(0).toUpperCase() : "C"}
                                                            </div>
                                                            <div>
                                                                <h6 className="fw-bold mb-0">{review.client_name || "Cliente"}</h6>
                                                                <small className="text-muted">{review.date}</small>
                                                            </div>
                                                        </div>
                                                        <StarRating rating={review.rating} />
                                                    </div>
                                                    <p className="text-dark mb-0 fst-italic">"{review.comment}"</p>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-center py-5 text-muted">
                                                <i className="bi bi-chat-square-text fs-1 d-block mb-3 text-light-subtle"></i>
                                                <p>Este profesional aún no tiene reseñas.</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="card border-0 shadow-sm rounded-4 mb-4 p-4">
                            <div className="d-flex justify-content-between align-items-center mb-4">
                                <h6 className="fw-bold text-muted text-uppercase mb-0 section-subtitle">Disponibilidad</h6>
                                {isOwnProfile && (
                                    <button
                                        className="btn btn-sm btn-light text-primary fw-semibold rounded-pill px-3"
                                        onClick={() => setShowEditSchedule(true)}
                                    >
                                        <i className="bi bi-pencil-square me-1"></i> Modificar
                                    </button>
                                )}
                            </div>

                            <div className="d-flex justify-content-between mb-4 flex-wrap gap-2 text-center">
                                {daysOfWeek.map(day => {
                                    const isAvailable = user.providerprofile.availabilities
                                        ? user.providerprofile.availabilities.some(a => a.day_of_week === day.id)
                                        : (day.id >= 1 && day.id <= 5);

                                    return (
                                        <div key={day.id} className="flex-fill day-box">
                                            <div className="text-muted small fw-semibold mb-2">{day.label}</div>
                                            <div className={`rounded-pill py-1 ${isAvailable ? 'bg-success bg-opacity-10 text-success' : 'bg-light text-muted'}`}>
                                                {isAvailable ? <i className="bi bi-check2"></i> : <i className="bi bi-dash"></i>}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>

                            <div className="d-flex align-items-center text-muted small border-top pt-3">
                                <i className="bi bi-clock text-primary me-2"></i>
                                <span>
                                    Horario: {user.providerprofile.start_time || "9:00 AM"} – {user.providerprofile.end_time || "6:00 PM"}
                                </span>
                            </div>
                        </div>
                    </>
                )}

                {!isProvider && (
                    <div className="card border-0 shadow-sm rounded-4 mb-4 overflow-hidden">
                        <ul className="nav nav-tabs d-flex justify-content-around bg-white pt-2 border-bottom">
                            {["historial", "resenas"].map(tab => (
                                <li key={tab} className="nav-item flex-fill text-center">
                                    <button
                                        className={`nav-link w-100 border-0 fw-bold py-3 ${activeTab === tab ? "text-primary border-bottom border-primary border-2" : "text-muted"}`}
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
                                            <div key={app.id} className="card border rounded-4 p-3 mb-3 shadow-sm">
                                                <div className="d-flex align-items-center gap-3">
                                                    <div className="bg-light text-success rounded-3 d-flex align-items-center justify-content-center history-icon-box">
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
                                            <div key={review.id} className="card border rounded-4 p-3 mb-3 shadow-sm">
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

            {isOwnProfile && (
                <>
                    <AddMediaModal
                        show={showAddMedia}
                        postToEdit={editPostData}
                        onClose={() => {
                            setShowAddMedia(false);
                            setEditPostData(null);
                        }}
                        onSuccess={() => {
                            setShowAddMedia(false);
                            setEditPostData(null);
                            fetchProfileData(false); // ACTUALIZA SOLO LA DATA, SIN RECARGAR LA PÁGINA
                        }}
                    />
                    <EditScheduleModal
                        show={showEditSchedule}
                        providerData={user.providerprofile}
                        onClose={() => setShowEditSchedule(false)}
                        onSuccess={() => {
                            setShowEditSchedule(false);
                            fetchProfileData(false);
                        }}
                    />
                </>
            )}

            <AddServiceModal
                        show={showAddService}
                        onClose={() => setShowAddService(false)}
                        onSuccess={() => {
                            setShowAddService(false);
                            fetchProfileData(false); // Recarga silenciosa
                        }}
                    />
                    
            <ViewMediaModal
                show={!!selectedMedia}
                media={selectedMedia}
                onClose={() => setSelectedMedia(null)}
                isOwnProfile={isOwnProfile}
                onEdit={(media) => {
                    setSelectedMedia(null);
                    setEditPostData(media);
                    setShowAddMedia(true);
                }}
                onDelete={async (mediaId) => {
                    if (window.confirm("¿Estás seguro de que deseas eliminar esta publicación permanentemente?")) {
                        const success = await deleteGalleryMedia(mediaId);
                        if (success) {
                            setSelectedMedia(null);
                            fetchProfileData(false); // ACTUALIZA SOLO LA DATA, SIN RECARGAR LA PÁGINA
                        } else {
                            alert("No se pudo eliminar la publicación.");
                        }
                    }
                }}
            />

        </div>
    );
};
