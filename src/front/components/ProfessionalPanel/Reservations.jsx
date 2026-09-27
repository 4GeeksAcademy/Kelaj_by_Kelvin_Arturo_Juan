import { useEffect, useState } from "react";
import { getProviderAppointments } from "../../services/professional";

export default function Reservations() {
  const [appointments, setAppointments] = useState([]);
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    getProviderAppointments().then(data => setAppointments(Array.isArray(data) ? data : []));
  }, []);

  const filters = [
    { id: "all", label: "Todas", count: appointments.length },
    { id: "pending", label: "Pendiente", count: appointments.filter(a => a.status === "pending").length },
    { id: "confirmed", label: "Confirmada", count: appointments.filter(a => a.status === "confirmed").length },
    { id: "upcoming", label: "Próxima", count: appointments.filter(a => a.status === "upcoming").length },
    { id: "in_progress", label: "En curso", count: appointments.filter(a => a.status === "in_progress").length }
  ];

  const displayedAppointments = activeTab === "all" 
    ? appointments 
    : appointments.filter(a => a.status === activeTab);

  const getStatusLabel = (status) => {
    const labels = { pending: "Pendiente", confirmed: "Confirmada", upcoming: "Próxima", in_progress: "En curso" };
    return labels[status] || status;
  };

  return (
    <div className="reservations-section">
      <div className="section-header">
        <h2>Reservas</h2>
        <p className="subtitle">Gestiona y confirma tus próximas citas</p>
      </div>

      <div className="filter-tabs">
        {filters.map(f => (
          <button 
            key={f.id} 
            className={`tab-pill ${activeTab === f.id ? "active" : ""}`}
            onClick={() => setActiveTab(f.id)}
          >
            {f.label} <span className="count">{f.count}</span>
          </button>
        ))}
      </div>

      <div className="reservations-list">
        {displayedAppointments.length > 0 ? (
          displayedAppointments.map(a => (
            <div key={a.id} className={`reservation-row status-${a.status}`}>
              <div className="client-info">
                <strong>{a.client_name}</strong>
                <span>{a.service_title}</span>
                <span className="meta">📅 {new Date(a.date_time).toLocaleString()}</span>
              </div>
              <div className="reservation-actions">
                <span className={`status-tag ${a.status}`}>• {getStatusLabel(a.status)}</span>
              </div>
            </div>
          ))
        ) : (
          <p className="empty-state">No hay reservas en esta categoría.</p>
        )}
      </div>
    </div>
  );
}