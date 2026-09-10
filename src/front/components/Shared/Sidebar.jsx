export default function Sidebar({ activeSection, setActiveSection }) {
  const menu = [
    { id: "summary", label: "Resumen" },
    { id: "services", label: "Servicios" },
    { id: "reservations", label: "Reservas" },
    { id: "history", label: "Historial" }
  ];

  return (
    <aside className="sidebar">
      <h3 className="sidebar-title">Panel Profesional</h3>
      <ul className="sidebar-menu">
        {menu.map(item => (
          <li
            key={item.id}
            className={activeSection === item.id ? "active" : ""}
            onClick={() => setActiveSection(item.id)}
          >
            {item.label}
          </li>
        ))}
      </ul>
    </aside>
  );
}
