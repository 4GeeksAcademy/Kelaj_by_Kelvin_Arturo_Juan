import { useEffect, useState } from "react";
import { getProviderSummary } from "../../services/professional";

export default function Summary() {
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    getProviderSummary().then(setSummary);
  }, []);

  if (!summary) return <p>Cargando resumen...</p>;

  return (
    <div className="summary-container">
      <h2>Resumen</h2>

      <div className="summary-grid">
        <div className="summary-card">
          <strong>Total ganado</strong>
          <span>{summary.total_earned} €</span>
        </div>

        <div className="summary-card">
          <strong>Este mes</strong>
          <span>{summary.monthly_earned} €</span>
        </div>

        <div className="summary-card">
          <strong>Completadas</strong>
          <span>{summary.completed}</span>
        </div>

        <div className="summary-card">
          <strong>Pendientes</strong>
          <span>{summary.pending}</span>
        </div>

        <div className="summary-card">
          <strong>Próximas</strong>
          <span>{summary.upcoming}</span>
        </div>

        <div className="summary-card">
          <strong>En curso</strong>
          <span>{summary.in_progress}</span>
        </div>
      </div>
    </div>
  );
}
