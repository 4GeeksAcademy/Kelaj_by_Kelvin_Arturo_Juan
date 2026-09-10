import { useEffect, useState } from "react";
import { getProviderServices, toggleServiceStatus } from "../../services/professional";

export default function Services() {
  const [services, setServices] = useState([]);

  const load = async () => {
    setServices(await getProviderServices());
  };

  useEffect(() => {
    load();
  }, []);

  const handleToggle = async (id) => {
    await toggleServiceStatus(id);
    load();
  };

  return (
    <div className="services-container">
      <h2>Mis servicios</h2>

      {services.map(s => (
        <div key={s.id} className="service-card">
          <div>
            <strong>{s.title}</strong>
            <p>{s.description}</p>
            <span>{s.price} €</span>
          </div>

          <button
            className={s.visible ? "btn-hide" : "btn-show"}
            onClick={() => handleToggle(s.id)}
          >
            {s.visible ? "Desactivar" : "Activar"}
          </button>
        </div>
      ))}
    </div>
  );
}
