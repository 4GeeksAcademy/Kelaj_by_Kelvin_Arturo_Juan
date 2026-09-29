import React from "react";

export default function ClientReservations({ data }) {
  // Extraemos ambas listas directamente desde el objeto global 'data' del dashboard
  const upcoming = data?.upcoming_reservations || [];
  const completed = data?.latest_services || [];
  
  // Unimos las citas activas y las completadas en un solo array
  const allAppointments = [...upcoming, ...completed];

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

      const dataRes = await response.json();

      if (!response.ok) {
        alert(dataRes.error || "No se pudo cancelar la cita");
        return;
      }

      alert("¡Cita cancelada con éxito! El reembolso ha sido solicitado a tu tarjeta.");
      window.location.reload(); 
    } catch (error) {
      console.error("Error de red:", error);
      alert("Error de conexión al intentar cancelar la cita.");
    }
  };

  return (
    <div className="summary-card-container">
      <h3>Mis Reservas e Historial</h3>
      <p className="text-muted mt-1 mb-3" style={{ fontSize: '14px' }}>Gestión de tus citas activas y completadas</p>
      
      <div className="reservations-list mt-3">
        {allAppointments.length > 0 ? (
          allAppointments.map(res => {
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