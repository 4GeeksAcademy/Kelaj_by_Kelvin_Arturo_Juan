import { useEffect, useState } from "react";
import { getProviderTransactions } from "../../services/professional";

export default function History() {
  const [transactions, setTransactions] = useState([]);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    getProviderTransactions().then(setTransactions);
  }, []);

  const filtered = transactions.filter(t =>
    filter === "all" ? true : t.status === filter
  );

  return (
    <div className="history-container">
      <h2>Historial</h2>

      <select onChange={e => setFilter(e.target.value)}>
        <option value="all">Todas</option>
        <option value="paid">Completadas</option>
        <option value="cancelled">Canceladas</option>
      </select>

      {Array.isArray(filtered) && filtered.length > 0 ? (
        filtered.map(t => (
          <div key={t.id} className="transaction-card">
            <strong>{t.service_title}</strong>
            <span>{t.amount} €</span>
            <span>{new Date(t.transaction_date).toLocaleDateString()}</span>
          </div>
        ))
      ) : (
        <p>No hay transacciones disponibles</p>
      )}

    </div>
  );
}
