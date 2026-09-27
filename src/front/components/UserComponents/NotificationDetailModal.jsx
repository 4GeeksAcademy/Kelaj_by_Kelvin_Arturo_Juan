import React from "react";
import { useNavigate } from "react-router-dom";

export const NotificationDetailModal = ({ show, notification, onClose }) => {
  const navigate = useNavigate();

  if (!show || !notification) return null;

  const { type, data = {}, actor_info } = notification;
  const isCancelledByClient = data.cancelled_by === "client";

  const formatDateTime = (isoStr) => {
    if (!isoStr) return "Fecha no disponible";
    const d = new Date(isoStr);
    return d.toLocaleString("es-ES", {
      dateStyle: "long",
      timeStyle: "short",
    });
  };

  const renderStars = (rating = 0) => {
    return Array.from({ length: 5 }, (_, i) => (
      <i
        key={i}
        className={`bi ${
          i < rating ? "bi-star-fill text-warning" : "bi-star text-muted"
        } me-1 fs-5`}
      ></i>
    ));
  };

  return (
    <div
      className="modal fade show d-block"
      style={{ backgroundColor: "rgba(0,0,0,0.65)", zIndex: 1055 }}
      tabIndex="-1"
      onClick={onClose}
    >
      <div
        className="modal-dialog modal-dialog-centered"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
          <div className="modal-header border-bottom-0 pb-0 pt-4 px-4">
            <h5 className="modal-title fw-bold d-flex align-items-center gap-2">
              {type === "appointment_requested" && (
                <>
                  <i className="bi bi-calendar-check text-primary"></i>
                  Nueva Solicitud de Cita
                </>
              )}
              {type === "appointment_cancelled" && (
                <>
                  <i className="bi bi-calendar-x text-danger"></i>
                  {isCancelledByClient
                    ? "Cita Cancelada por el Cliente"
                    : "Cita Cancelada por el Proveedor"}
                </>
              )}
              {type === "new_service" && (
                <>
                  <i className="bi bi-briefcase-fill text-success"></i>
                  Nuevo Servicio Publicado
                </>
              )}
              {type === "new_review" && (
                <>
                  <i className="bi bi-star-fill text-warning"></i>
                  Nueva Reseña Recibida
                </>
              )}
            </h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>

          <div className="modal-body p-4">
            {/* 1. DETALLES DE CITA SOLICITADA */}
            {type === "appointment_requested" && (
              <div>
                <p className="text-muted mb-3">
                  Un cliente ha reservado uno de tus servicios:
                </p>
                <div className="bg-light rounded-3 p-3 mb-3 border">
                  <div className="mb-2">
                    <span className="text-secondary small d-block">Servicio</span>
                    <strong className="text-dark fs-6">{data.service_title}</strong>
                  </div>
                  <div className="mb-2">
                    <span className="text-secondary small d-block">Cliente</span>
                    <strong className="text-dark">{data.client_name}</strong>
                    {data.client_phone && (
                      <span className="text-muted ms-2 small">({data.client_phone})</span>
                    )}
                  </div>
                  <div className="mb-2">
                    <span className="text-secondary small d-block">Fecha y hora</span>
                    <strong className="text-primary">{formatDateTime(data.date_time)}</strong>
                  </div>
                  {data.price && (
                    <div>
                      <span className="text-secondary small d-block">Tarifa</span>
                      <strong className="text-dark">{data.price} €</strong>
                    </div>
                  )}
                </div>
                <div className="d-flex justify-content-end gap-2 mt-3">
                  <button className="btn btn-light border rounded-pill px-3" onClick={onClose}>
                    Cerrar
                  </button>
                  <button
                    className="btn btn-primary rounded-pill px-4"
                    onClick={() => {
                      onClose();
                      navigate("/professional-panel");
                    }}
                  >
                    Ir a mi panel profesional
                  </button>
                </div>
              </div>
            )}

            {/* 2. DETALLES DE CITA CANCELADA (BILATERAL) */}
            {type === "appointment_cancelled" && (
              <div>
                <div className="alert alert-danger d-flex align-items-center gap-2 rounded-3 py-2">
                  <i className="bi bi-exclamation-triangle-fill"></i>
                  <span className="small">
                    {isCancelledByClient
                      ? "El cliente ha cancelado su reserva y el horario ha quedado libre."
                      : "El proveedor ha cancelado esta cita y ya no está activa."}
                  </span>
                </div>
                <div className="bg-light rounded-3 p-3 mb-3 border">
                  <div className="mb-2">
                    <span className="text-secondary small d-block">Servicio cancelado</span>
                    <strong className="text-dark fs-6">{data.service_title}</strong>
                  </div>
                  <div className="mb-2">
                    <span className="text-secondary small d-block">
                      {isCancelledByClient ? "Cliente" : "Proveedor"}
                    </span>
                    <strong className="text-dark">
                      {isCancelledByClient ? data.client_name : data.provider_name}
                    </strong>
                  </div>
                  <div className="mb-2">
                    <span className="text-secondary small d-block">Fecha original de la cita</span>
                    <strong className="text-decoration-line-through text-muted">
                      {formatDateTime(data.date_time)}
                    </strong>
                  </div>
                  {data.cancelled_at && (
                    <div>
                      <span className="text-secondary small d-block">Fecha de cancelación</span>
                      <span className="text-dark small">{formatDateTime(data.cancelled_at)}</span>
                    </div>
                  )}
                </div>
                <div className="d-flex justify-content-end gap-2 mt-3">
                  <button className="btn btn-light border rounded-pill px-3" onClick={onClose}>
                    Cerrar
                  </button>
                  {isCancelledByClient ? (
                    <button
                      className="btn btn-outline-primary rounded-pill px-4"
                      onClick={() => {
                        onClose();
                        navigate("/professional-panel");
                      }}
                    >
                      Ir a mi panel profesional
                    </button>
                  ) : (
                    data.provider_id && (
                      <button
                        className="btn btn-outline-primary rounded-pill px-4"
                        onClick={() => {
                          onClose();
                          navigate(`/profile/${data.provider_id}`);
                        }}
                      >
                        Ver perfil del proveedor
                      </button>
                    )
                  )}
                </div>
              </div>
            )}

            {/* 3. DETALLES DE NUEVO SERVICIO */}
            {type === "new_service" && (
              <div>
                <div className="d-flex align-items-center gap-3 mb-3">
                  <img
                    src={
                      actor_info?.profile_image ||
                      `https://ui-avatars.com/api/?name=${data.provider_name || "P"}&background=4f46e5&color=fff`
                    }
                    alt={data.provider_name}
                    className="rounded-circle"
                    style={{ width: "45px", height: "45px", objectFit: "cover" }}
                  />
                  <div>
                    <h6 className="mb-0 fw-bold">{data.provider_name}</h6>
                    <small className="text-muted">Ha añadido un nuevo servicio</small>
                  </div>
                </div>

                <div className="bg-light rounded-3 p-3 mb-3 border">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <h6 className="fw-bold text-dark mb-0">{data.title}</h6>
                    <span className="badge bg-primary rounded-pill px-3 py-2">
                      {data.price} € {data.price_type === "hourly" ? "/ hora" : ""}
                    </span>
                  </div>
                  <p className="text-secondary small mb-2">{data.description}</p>
                  {data.estimated_duration && (
                    <span className="badge bg-white text-secondary border">
                      <i className="bi bi-clock me-1"></i>
                      Duración estimada: {data.estimated_duration} min
                    </span>
                  )}
                </div>

                <div className="d-flex justify-content-end gap-2 mt-3">
                  <button className="btn btn-light border rounded-pill px-3" onClick={onClose}>
                    Cerrar
                  </button>
                  <button
                    className="btn btn-primary rounded-pill px-4"
                    onClick={() => {
                      onClose();
                      navigate(`/profile/${data.provider_user_id || notification.actor_id}`);
                    }}
                  >
                    Ver en el perfil
                  </button>
                </div>
              </div>
            )}

            {/* 4. DETALLES DE NUEVA RESEÑA */}
            {type === "new_review" && (
              <div>
                <div className="d-flex align-items-center gap-3 mb-3">
                  <img
                    src={
                      actor_info?.profile_image ||
                      `https://ui-avatars.com/api/?name=${data.client_name || "C"}&background=4f46e5&color=fff`
                    }
                    alt={data.client_name}
                    className="rounded-circle"
                    style={{ width: "45px", height: "45px", objectFit: "cover" }}
                  />
                  <div>
                    <h6 className="mb-0 fw-bold">{data.client_name}</h6>
                    <small className="text-muted">
                      Valoró tu servicio <strong>{data.service_title}</strong>
                    </small>
                  </div>
                </div>

                <div className="bg-light rounded-3 p-3 mb-3 border">
                  <div className="mb-2 d-flex align-items-center">
                    {renderStars(data.rating)}
                    <span className="fw-bold text-dark ms-1">({data.rating}/5)</span>
                  </div>
                  <p className="text-dark mb-2 fst-italic">
                    "{data.comment || "Sin comentario adicional."}"
                  </p>
                  {data.created_at && (
                    <span className="text-muted small d-block">
                      Publicada el {formatDateTime(data.created_at)}
                    </span>
                  )}
                </div>

                <div className="d-flex justify-content-end gap-2 mt-3">
                  <button className="btn btn-light border rounded-pill px-3" onClick={onClose}>
                    Cerrar
                  </button>
                  <button
                    className="btn btn-primary rounded-pill px-4"
                    onClick={() => {
                      onClose();
                      navigate(`/profile/${data.provider_user_id || notification.user_id}`);
                    }}
                  >
                    Ver en mi perfil
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};