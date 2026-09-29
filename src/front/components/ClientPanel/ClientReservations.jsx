import React from "react";

export default function ClientReservations({ reservations = [] }) {
  // Función para formatear el estado de la cita amigablemente
  const getStatusLabel = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending': return 'Pendiente';
      case 'confirmed': return 'Confirmada';
      case 'in_progress': return 'En curso';
      case 'completed': return 'Completada';
      case 'cancelled': return 'Cancelada';
      default: return status || 'Próxima';
    }
  };

  // Lógica de cancelación con reembolso automático en Stripe
  const handleCancelAppointment = async (appointmentId) => {
    if (!window.confirm("¿Estás seguro de que deseas cancelar esta reserva? Se procesará el reembolso automático a tu tarjeta.")) {
      return;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/appointments/${appointmentId}/cancel`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "No se pudo cancelar la cita");
        return;
      }

      alert("¡Cita cancelada con éxito! El reembolso ha sido solicitado a tu tarjeta.");
      window.location.reload(); // Recarga para actualizar los estados del panel
    } catch (error) {
      console.error("Error de red:", error);
      alert("Error de conexión al intentar cancelar la cita.");
    }
  };

  return (
    <div className="summary-card-container">
      <h3>Mis Reservas</h3>
      <p className="text-muted mt-1 mb-3" style={{ fontSize: '14px' }}>Historial y gestión de tus citas</p>
      
      <div className="reservations-list mt-3">
        {reservations.length > 0 ? (
          reservations.map(res => {
            const isCancelable = ['pending', 'confirmed', 'upcoming', 'in_progress'].includes(res.status?.toLowerCase());

            return (
              <div key={res.id} className={`reservation-card-styled status-${res.status}`}>
                <div className="reservation-card-left">
                  <img 
                    src={res.provider_image || "https://via.placeholder.com/45"} 
                    alt="Profesional" 
                    className="client-avatar-placeholder" 
                    style={{ objectFit: 'cover' }} 
                  />
                  <div>
                    <strong className="client-name">{res.provider_name || "Profesional"}</strong>
                    <p className="service-title-text">{res.service_title}</p>
                    <div className="reservation-meta-info">
                      <span>📅 {res.date}</span>
                      <span>⏱ {res.duration || 60} min</span>
                    </div>
                  </div>
                </div>

                <div className="reservation-card-right d-flex flex-column align-items-end justify-content-between">
                  <div className="d-flex align-items-center gap-2">
                    <span className={`status-tag ${res.status}`}>• {getStatusLabel(res.status)}</span>
                    <span className="price-tag">{res.price} €</span>
                  </div>

                  {/* Botón de cancelar visible solo si la cita está activa */}
                  {isCancelable && (
                    <button
                      className="btn btn-outline-danger btn-sm rounded-pill px-3 py-1 mt-2 fw-semibold"
                      style={{ fontSize: '12px' }}
                      onClick={() => handleCancelAppointment(res.id)}
                    >
                      Cancelar cita
                    </button>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <p className="empty-state text-muted py-3 m-0">No tienes reservas registradas en este momento.</p>
        )}
      </div>
    </div>
  );
}