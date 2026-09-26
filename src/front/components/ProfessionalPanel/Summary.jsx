import { useEffect, useState } from "react";
import { getProviderSummary, getProviderAppointments, getProviderServices } from "../../services/professional";

export default function Summary({ setActiveSection }) {
  const [summary, setSummary] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [services, setServices] = useState([]);

  useEffect(() => {
    getProviderSummary().then(setSummary);
    getProviderAppointments().then(data => setAppointments(Array.isArray(data) ? data : []));
    getProviderServices().then(data => setServices(Array.isArray(data) ? data : []));
  }, []);

  if (!summary) return <p className="loading">Cargando resumen...</p>;

  const upcomingAppointments = appointments.slice(0, 3);
  const topServices = services.slice(0, 4);

  const getStatusLabel = (status) => {
    const labels = { in_progress: "En curso", upcoming: "Próxima", confirmed: "Confirmada", pending: "Pendiente" };
    return labels[status] || status;
  };

  return (
    <div className="summary-section">
      {/* KPIs Superiores */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="d-flex justify-content-between align-items-start">
            <span className="kpi-label">Total ganado</span>
            <i className="bi bi-wallet2 text-primary fs-5"></i>
          </div>
          <span className="kpi-value">{summary.total_earned || 0} €</span>
          <span className="kpi-subtext">histórico</span>
        </div>
        <div className="kpi-card">
          <div className="d-flex justify-content-between align-items-start">
            <span className="kpi-label">Completados</span>
            <i className="bi bi-check-circle text-success fs-5"></i>
          </div>
          <span className="kpi-value">{summary.completed || 0}</span>
          <span className="kpi-subtext">servicios totales</span>
        </div>
        <div className="kpi-card highlight">
          <div className="d-flex justify-content-between align-items-start">
            <span className="kpi-label">Este mes</span>
            <i className="bi bi-graph-up-arrow text-primary fs-5"></i>
          </div>
          <span className="kpi-value">{summary.monthly_earned || 0} €</span>
          <span className="kpi-subtext">mes actual</span>
        </div>
      </div>

      {/* BLOQUE 1: Próximas reservas (Dentro de una tarjeta contenedora blanca) */}
      <div className="summary-card-container mb-4">
        <div className="section-header">
          <h3>Próximas reservas</h3>
          <button className="text-link" onClick={() => setActiveSection("reservations")}>Ver todas &gt;</button>
        </div>

        <div className="reservations-list mt-3">
          {upcomingAppointments.length > 0 ? (
            upcomingAppointments.map(a => (
              <div key={a.id} className={`reservation-card-styled status-${a.status}`}>
                <div className="reservation-card-left">
                  <div className="client-avatar-placeholder">
                    {a.client_name ? a.client_name.charAt(0).toUpperCase() : "C"}
                  </div>
                  <div>
                    <strong className="client-name">{a.client_name}</strong>
                    <p className="service-title-text">{a.service_title}</p>
                    <div className="reservation-meta-info">
                      <span>📅 {a.date_time}</span>
                      <span>⏱ 60 min</span>
                      <span>💻 Online</span>
                    </div>
                  </div>
                </div>
                <div className="reservation-card-right">
                  <span className={`status-tag ${a.status}`}>• {getStatusLabel(a.status)}</span>
                  <span className="price-tag">120 €</span>
                </div>
              </div>
            ))
          ) : (
            <p className="empty-state text-muted py-3 m-0">No hay próximas reservas pendientes.</p>
          )}
        </div>
      </div>

      {/* BLOQUE 2: Mis servicios (Dentro de una tarjeta contenedora blanca) */}
      <div className="summary-card-container">
        <div className="section-header">
          <h3>Mis servicios</h3>
          <button className="text-link" onClick={() => setActiveSection("services")}>Gestionar &gt;</button>
        </div>

        <div className="services-summary-list mt-3">
          {topServices.length > 0 ? (
            topServices.map(s => (
              <div key={s.id} className="service-summary-row">
                <div className="service-row-left">
                  <div className="service-icon-box">
                    <i className="bi bi-briefcase"></i>
                  </div>
                  <div>
                    <h4 className="service-row-title">{s.title}</h4>
                    <span className="service-row-sub">0 reservas • {s.price} €</span>
                  </div>
                </div>
                <div className="service-row-right">
                  <span className={`status-dot-badge ${s.visible ? "active" : "hidden"}`}>
                    {s.visible ? "• Activo" : "• Oculto"}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <p className="empty-state text-muted py-3 m-0">No hay servicios configurados.</p>
          )}
        </div>
      </div>
    </div>
  );
}