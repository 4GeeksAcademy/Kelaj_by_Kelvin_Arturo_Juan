export default function ClientReservations({ reservations = [] }) {
  return (
    <div className="summary-card-container">
      <h3>Mis Reservas</h3>
      <p className="text-muted mt-1 mb-3" style={{ fontSize: '14px' }}>Historial y gestión de tus citas</p>
      
      <div className="reservations-list mt-3">
        {reservations.length > 0 ? (
          reservations.map(res => (
            <div key={res.id} className={`reservation-card-styled status-${res.status}`}>
              <div className="reservation-card-left">
                <img src={res.provider_image || "https://via.placeholder.com/45"} alt="" className="client-avatar-placeholder" style={{objectFit: 'cover'}} />
                <div>
                  <strong className="client-name">{res.provider_name}</strong>
                  <p className="service-title-text">{res.service_title}</p>
                  <div className="reservation-meta-info">
                    <span>📅 {res.date}</span>
                    <span>⏱ {res.duration || 60} min</span>
                    <span>💻 {res.modality || "Online"}</span>
                  </div>
                </div>
              </div>
              <div className="reservation-card-right">
                <span className={`status-tag ${res.status}`}>• {res.status_label || res.status}</span>
                <span className="price-tag">{res.price} €</span>
              </div>
            </div>
          ))
        ) : (
          <p className="empty-state text-muted py-3 m-0">No tienes reservas registradas en este momento.</p>
        )}
      </div>
    </div>
  );
}