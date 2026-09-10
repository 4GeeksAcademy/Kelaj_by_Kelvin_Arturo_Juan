import { useEffect, useState } from "react";
import { getProviderAppointments } from "../../services/professional";

export default function Reservations() {
  const [appointments, setAppointments] = useState([]);

  useEffect(() => {
    getProviderAppointments().then(setAppointments);
  }, []);

  const grouped = {
    in_progress: appointments.filter(a => a.status === "in_progress"),
    upcoming: appointments.filter(a => a.status === "upcoming"),
    confirmed: appointments.filter(a => a.status === "confirmed"),
    pending: appointments.filter(a => a.status === "pending")
  };

  return (
    <div className="reservations-container">
      <h2>Reservas</h2>

      <h3>En curso</h3>
      {grouped.in_progress.map(a => (
        <div key={a.id} className="reservation-card active">
          <strong>{a.client_name}</strong> — {a.service_title}
          <span>{a.date_time}</span>
        </div>
      ))}

      <h3>Próximas</h3>
      {grouped.upcoming.map(a => (
        <div key={a.id} className="reservation-card">
          <strong>{a.client_name}</strong> — {a.service_title}
          <span>{a.date_time}</span>
        </div>
      ))}

      <h3>Confirmadas</h3>
      {grouped.confirmed.map(a => (
        <div key={a.id} className="reservation-card">
          <strong>{a.client_name}</strong> — {a.service_title}
          <span>{a.date_time}</span>
        </div>
      ))}

      <h3>Pendientes</h3>
      {grouped.pending.map(a => (
        <div key={a.id} className="reservation-card pending">
          <strong>{a.client_name}</strong> — {a.service_title}
          <span>{a.date_time}</span>
        </div>
      ))}
    </div>
  );
}
