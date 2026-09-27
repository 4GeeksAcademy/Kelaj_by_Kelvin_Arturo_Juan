import { useEffect, useState } from "react";
import { getProviderServices, toggleServiceStatus } from "../../services/professional";
// IMPORTAMOS EL MODAL IGUAL QUE EN PROFILE.JSX
import { AddServiceModal } from "../UserComponents/AddServiceModal";

export default function Services() {
  const [services, setServices] = useState([]);
  const [showAddService, setShowAddService] = useState(false);

  const load = async () => {
    try {
      const data = await getProviderServices();
      setServices(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error al cargar servicios:", error);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // Definimos la función handleNewService para abrir el modal correctamente
  const handleNewService = () => {
    setShowAddService(true);
  };

  return (
    <div className="services-section">
      <div className="section-header">
        <div>
          <h3>Mis servicios</h3>
          <p className="text-muted mt-1 mb-0" style={{ fontSize: '14px' }}>Gestiona los servicios que ofreces en la plataforma</p>
        </div>
        <button className="btn btn-primary btn-sm rounded-pill px-3 py-2 d-inline-flex align-items-center gap-1" onClick={handleNewService}>
          <i className="bi bi-plus-lg"></i> Nuevo servicio
        </button>
      </div>

      <div className="services-list mt-3">
        {services.length > 0 ? (
          services.map(s => (
            <div key={s.id} className={`service-detail-card ${!s.visible ? "hidden" : ""}`}>
              <div className="service-header">
                <h3>{s.title}</h3>
                <span className={`status-badge ${s.visible ? "visible" : "hidden"}`}>
                  {s.visible ? "• Activo" : "• Oculto"}
                </span>
              </div>

              <p className="service-description">{s.description}</p>

              <div className="service-meta">
                <span>⏱ {s.estimated_duration || 60} min</span>
                <span>💶 {s.price} € / {s.price_type === 'hourly' ? 'hora' : 'sesión'}</span>
              </div>

              <div className="service-actions">
                <button
                  className={`btn-toggle ${s.visible ? "btn-hide" : "btn-show"}`}
                  onClick={async () => {
                    await toggleServiceStatus(s.id);
                    load();
                  }}
                >
                  {s.visible ? "Desactivar" : "Activar"}
                </button>
              </div>
            </div>
          ))
        ) : (
          <p className="empty-state text-muted py-3 m-0">No hay servicios configurados.</p>
        )}
      </div>

      {/* RENDERIZAMOS EL MODAL AQUÍ */}
      <AddServiceModal
        show={showAddService}
        onClose={() => setShowAddService(false)}
        onSuccess={() => {
          setShowAddService(false);
          load(); // Recargamos los servicios automáticamente
        }}
      />
    </div>
  );
}