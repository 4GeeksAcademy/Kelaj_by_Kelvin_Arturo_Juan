export default function ClientSummary({ data, setActiveSection }) {
  if (!data) return <p className="loading">Cargando panel...</p>;

  const user = data.user_info || {};
  const activeSession = data.active_session;
  const kpis = data.kpis || {};
  const upcomingReservations = data.upcoming_reservations || [];
  const followingProfessionals = data.following_professionals || [];
  const latestServices = data.latest_services || [];

  return (
    <div className="summary-section">
      {/* Saludo inicial */}
      <div className="mb-4">
        <h2 className="fw-bold mb-1">Hola, {user.name || "Cliente"} 👋</h2>
        <p className="text-muted m-0">Aquí tienes un resumen de tu actividad</p>
      </div>

      {/* Banner de sesión en curso (si existe) */}
      {activeSession && (
        <div className="active-session-banner mb-4 d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center">
            <span className="pulse-indicator"></span>
            <span>Sesión en curso ahora mismo: <strong>{activeSession.title} con {activeSession.provider_name} - {activeSession.time}</strong></span>
          </div>
          <button className="btn btn-success btn-sm rounded-pill px-3 py-1 text-white fw-semibold" style={{fontSize: '12px'}}>Ver</button>
        </div>
      )}

      {/* 4 KPIs Principales */}
      <div className="kpi-grid mb-4" style={{gridTemplateColumns: 'repeat(2, 1fr)'}}>
        <div className="kpi-card">
          <div className="d-flex justify-content-between align-items-start">
            <span className="kpi-label">Reservas activas</span>
            <i className="bi bi-calendar-event text-primary fs-5"></i>
          </div>
          <span className="kpi-value">{kpis.active_reservations || 0}</span>
          <span className="kpi-subtext">en curso o próximas</span>
        </div>

        <div className="kpi-card">
          <div className="d-flex justify-content-between align-items-start">
            <span className="kpi-label">Completadas</span>
            <i className="bi bi-check-circle text-success fs-5"></i>
          </div>
          <span className="kpi-value">{kpis.completed_services || 0}</span>
          <span className="kpi-subtext">servicios realizados</span>
        </div>

        <div className="kpi-card">
          <div className="d-flex justify-content-between align-items-start">
            <span className="kpi-label">Total invertido</span>
            <i className="bi bi-wallet2 text-info fs-5"></i>
          </div>
          <span className="kpi-value">{kpis.total_invested || 0} €</span>
          <span className="kpi-subtext">en servicios</span>
        </div>

        <div className="kpi-card">
          <div className="d-flex justify-content-between align-items-start">
            <span className="kpi-label">Siguiendo</span>
            <i className="bi bi-heart text-danger fs-5"></i>
          </div>
          <span className="kpi-value">{kpis.following_count || 0}</span>
          <span className="kpi-subtext">profesionales</span>
        </div>
      </div>

      {/* Próximas reservas */}
      <div className="summary-card-container mb-4">
        <div className="section-header">
          <h3>Próximas reservas</h3>
          <button className="text-link" onClick={() => setActiveSection("reservations")}>Ver todas &gt;</button>
        </div>
        <div className="reservations-list mt-3">
          {upcomingReservations.length > 0 ? (
            upcomingReservations.map(res => (
              <div key={res.id} className={`reservation-card-styled status-${res.status}`}>
                <div className="reservation-card-left">
                  <img src={res.provider_image || "https://via.placeholder.com/45"} alt="Pro" className="client-avatar-placeholder" style={{objectFit: 'cover'}} />
                  <div>
                    <strong className="client-name">{res.provider_name}</strong>
                    <p className="service-title-text">{res.service_title}</p>
                    <div className="reservation-meta-info">
                      <span>📅 {res.date}</span>
                      <span>⏱ {res.duration} min</span>
                      <span>💻 {res.modality || "Online"}</span>
                    </div>
                  </div>
                </div>
                <div className="reservation-card-right">
                  <span className={`status-tag ${res.status}`}>• {res.status_label || "Próxima"}</span>
                  <span className="price-tag">{res.price} €</span>
                </div>
              </div>
            ))
          ) : (
            <p className="empty-state text-muted py-2 m-0">No tienes próximas reservas.</p>
          )}
        </div>
      </div>

      {/* Profesionales que sigues */}
      <div className="summary-card-container mb-4">
        <div className="section-header">
          <h3>Profesionales que sigues</h3>
          <button className="text-link" onClick={() => setActiveSection("favorites")}>Ver todos &gt;</button>
        </div>
        <div className="mt-3 d-flex flex-column gap-3">
          {followingProfessionals.length > 0 ? (
            followingProfessionals.map(prof => (
              <div key={prof.id} className="d-flex justify-content-between align-items-center p-2 border-bottom">
                <div className="d-flex align-items-center gap-3">
                  <img src={prof.profile_image} alt="" className="rounded-circle" style={{width: '45px', height: '45px', objectFit: 'cover'}} />
                  <div>
                    <h5 className="mb-0 fs-6 fw-bold">{prof.name}</h5>
                    <small className="text-muted">{prof.category || "Especialista"}</small>
                  </div>
                </div>
                <button className="btn btn-primary btn-sm rounded-pill px-3" style={{fontSize: '13px'}}>Agendar</button>
              </div>
            ))
          ) : (
            <p className="empty-state text-muted py-2 m-0">No sigues a ningún profesional todavía.</p>
          )}
        </div>
      </div>

      {/* Últimos servicios */}
      <div className="summary-card-container">
        <div className="section-header">
          <h3>Últimos servicios</h3>
          <button className="text-link" onClick={() => alert("Ir a historial")}>Ver historial &gt;</button>
        </div>
        <div className="reservations-list mt-3">
          {latestServices.length > 0 ? (
            latestServices.map(serv => (
              <div key={serv.id} className="reservation-card-styled status-confirmed">
                <div className="reservation-card-left">
                  <img src={serv.provider_image} alt="" className="client-avatar-placeholder" style={{objectFit: 'cover'}} />
                  <div>
                    <strong className="client-name">{serv.provider_name}</strong>
                    <p className="service-title-text">{serv.service_title}</p>
                    <div className="reservation-meta-info">
                      <span>📅 {serv.date}</span>
                      <span>⏱ {serv.duration} min</span>
                      <span>💻 {serv.modality}</span>
                    </div>
                  </div>
                </div>
                <div className="reservation-card-right">
                  <span className="status-tag confirmed">• Completada</span>
                  <span className="price-tag">{serv.price} €</span>
                </div>
              </div>
            ))
          ) : (
            <p className="empty-state text-muted py-2 m-0">No hay servicios recientes.</p>
          )}
        </div>
      </div>
    </div>
  );
}