import { useEffect, useState } from "react";
import { getProviderServices, toggleServiceStatus } from "../../services/professional";

export default function Services() {
  const [services, setServices] = useState([]);

  const load = async () => {
    try {
      const data = await getProviderServices();
      if (Array.isArray(data)) {
        setServices(data);
      } else {
        console.error("Respuesta inesperada:", data);
        setServices([]);
      }
    } catch (error) {
      console.error("Error al cargar servicios:", error);
      setServices([]);
    }
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

      {Array.isArray(services) && services.length > 0 ? (
        services.map(s => (
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
        ))
      ) : (
        <p>No hay servicios disponibles</p>
      )}
    </div>
  );
}
