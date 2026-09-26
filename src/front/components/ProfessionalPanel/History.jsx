import { useEffect, useState } from "react";
import { getProviderTransactions } from "../../services/professional";

export default function History() {
  const [transactions, setTransactions] = useState([]);
  const [activeFilter, setActiveFilter] = useState("all");

  useEffect(() => {
    getProviderTransactions().then(data => setTransactions(Array.isArray(data) ? data : []));
  }, []);

  const filters = [
    { id: "all", label: "Todas" },
    { id: "paid", label: "Completadas" },
    { id: "cancelled", label: "Canceladas" }
  ];

  const filtered = transactions.filter(t =>
    activeFilter === "all" ? true : t.status === activeFilter
  );

  return (
    <div className="history-section">
      <div className="section-header">
        <h2>Historial de transacciones</h2>
      </div>

      {/* Reemplazamos el select por los pills horizontales */}
      <div className="filter-tabs">
        {filters.map(f => (
          <button 
            key={f.id} 
            className={`tab-pill ${activeFilter === f.id ? "active" : ""}`}
            onClick={() => setActiveFilter(f.id)}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="reservations-list">
        {filtered.length > 0 ? (
          filtered.map(t => (
            <div key={t.id} className="reservation-row">
              <div className="client-info">
                <strong>{t.service_title || `Transacción #${t.id}`}</strong>
                <span className="meta">
                  📅 {new Date(t.transaction_date).toLocaleDateString()} 
                </span>
              </div>
              <div className="reservation-actions">
                <span className="price">{t.amount} €</span>
                <span className={`status-tag ${t.status === 'paid' ? 'confirmed' : 'pending'}`}>
                  {t.status === 'paid' ? 'Completada' : t.status}
                </span>
              </div>
            </div>
          ))
        ) : (
          <p className="empty-state">No hay transacciones disponibles en esta categoría.</p>
        )}
      </div>
    </div>
  );
}