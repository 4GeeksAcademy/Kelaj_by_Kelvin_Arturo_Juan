import React from 'react';

export const ViewMediaModal = ({ show, media, onClose, isOwnProfile, onEdit, onDelete }) => {
    if (!show || !media) return null;

    const images = media.urls || [];

    return (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.85)' }} tabIndex="-1" onClick={onClose}>
            <div className="modal-dialog modal-dialog-centered modal-xl" onClick={(e) => e.stopPropagation()}>
                <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden bg-white">
                    <div className="row g-0">
                        
                        {/* Columna de las Imágenes (Carrusel Bootstrap) */}
                        <div className="col-md-7 bg-dark d-flex align-items-center justify-content-center position-relative" style={{ minHeight: "500px" }}>
                            
                            {/* ========================================== */}
                            {/* BOTÓN DE OPCIONES (Solo para el dueño)     */}
                            {/* ========================================== */}
                            {isOwnProfile && (
                                <div className="dropdown position-absolute top-0 start-0 m-3" style={{ zIndex: 1050 }}>
                                    <button 
                                        className="btn btn-dark text-white rounded-circle bg-opacity-75 border-0 shadow-sm" 
                                        type="button" 
                                        data-bs-toggle="dropdown" 
                                        aria-expanded="false" 
                                        style={{ width: '45px', height: '45px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                    >
                                        <i className="bi bi-three-dots-vertical fs-5"></i>
                                    </button>
                                    <ul className="dropdown-menu shadow border-0 rounded-3 mt-1">
                                        <li>
                                            <button className="dropdown-item fw-semibold py-2" onClick={() => onEdit && onEdit(media)}>
                                                <i className="bi bi-pencil-square me-2 text-primary"></i> Editar publicación
                                            </button>
                                        </li>
                                        <li><hr className="dropdown-divider" /></li>
                                        <li>
                                            <button className="dropdown-item fw-semibold py-2 text-danger" onClick={() => onDelete && onDelete(media.id)}>
                                                <i className="bi bi-trash me-2"></i> Eliminar
                                            </button>
                                        </li>
                                    </ul>
                                </div>
                            )}

                            {images.length > 0 ? (
                                <div id="mediaCarousel" className="carousel slide w-100 h-100 d-flex align-items-center" data-bs-ride="carousel">
                                    
                                    {/* Indicadores inferiores */}
                                    {images.length > 1 && (
                                        <div className="carousel-indicators mb-2">
                                            {images.map((_, idx) => (
                                                <button 
                                                    key={idx}
                                                    type="button" 
                                                    data-bs-target="#mediaCarousel" 
                                                    data-bs-slide-to={idx} 
                                                    className={idx === 0 ? "active" : ""}
                                                ></button>
                                            ))}
                                        </div>
                                    )}

                                    {/* Lista de Imágenes */}
                                    <div className="carousel-inner text-center w-100">
                                        {images.map((imgUrl, idx) => (
                                            <div key={idx} className={`carousel-item ${idx === 0 ? 'active' : ''}`}>
                                                <img 
                                                    src={imgUrl} 
                                                    alt={`Foto ${idx + 1} de la publicación`} 
                                                    className="img-fluid" 
                                                    style={{ maxHeight: "85vh", objectFit: "contain" }} 
                                                />
                                            </div>
                                        ))}
                                    </div>

                                    {/* Flechas Laterales */}
                                    {images.length > 1 && (
                                        <>
                                            <button className="carousel-control-prev" type="button" data-bs-target="#mediaCarousel" data-bs-slide="prev">
                                                <span className="carousel-control-prev-icon bg-dark rounded-circle p-3 bg-opacity-50" aria-hidden="true"></span>
                                            </button>
                                            <button className="carousel-control-next" type="button" data-bs-target="#mediaCarousel" data-bs-slide="next">
                                                <span className="carousel-control-next-icon bg-dark rounded-circle p-3 bg-opacity-50" aria-hidden="true"></span>
                                            </button>
                                        </>
                                    )}
                                </div>
                            ) : (
                                <div className="text-muted">No hay imágenes disponibles</div>
                            )}
                        </div>
                        
                        {/* Columna de Detalles */}
                        <div className="col-md-5 d-flex flex-column bg-white position-relative">
                            <button type="button" className="btn-close position-absolute top-0 end-0 m-3" onClick={onClose}></button>
                            
                            <div className="p-4 flex-grow-1 mt-4">
                                <div className="d-flex justify-content-between align-items-center mb-3 border-bottom pb-3">
                                    <h5 className="fw-bold mb-0 text-dark">{media.title || "Publicación"}</h5>
                                </div>
                                <p className="text-dark mb-4" style={{ lineHeight: "1.6" }}>
                                    {media.description || "Sin descripción proporcionada."}
                                </p>
                                <span className="badge bg-light text-secondary border px-3 py-2">
                                    <i className="bi bi-calendar3 me-2"></i> 
                                    Subido el {media.date || "Fecha desconocida"}
                                </span>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};