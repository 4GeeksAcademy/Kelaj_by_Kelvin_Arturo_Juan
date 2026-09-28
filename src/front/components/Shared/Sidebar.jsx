export default function Sidebar({ activeSection, setActiveSection, profile }) {
  const menu = [
    { id: "summary", label: "Resumen", icon: "bi-house-door" },
    { id: "services", label: "Servicios", icon: "bi-briefcase" },
    { id: "reservations", label: "Reservas", icon: "bi-calendar-event", badge: profile?.pending_count || 0 }, // <-- Corregido aquí
    { id: "history", label: "Historial", icon: "bi-clock-history" }
  ];

  // 1. Obtenemos al usuario directamente del almacenamiento local (idéntico a profile.jsx)
  const storedUser = JSON.parse(sessionStorage.getItem("user") || localStorage.getItem("user") || "{}");

  // 2. Extraemos la información del backend si ya cargó, o usamos la de localStorage como respaldo seguro
  const userInfo = profile?.user_info || {};
  const firstName = userInfo.name || storedUser.name || "Usuario";
  const lastName = userInfo.last_name || storedUser.last_name || "";
  const initial = firstName.charAt(0).toUpperCase();

  // 3. Profesión
  const services = profile?.services || [];
  const mainProfession = storedUser.category || profile?.bio || services[0]?.title || "Profesional";

  // 4. Ubicación: Busca en el perfil del proveedor, luego en la ciudad del localStorage, y si no, muestra "Madrid"
  const location = profile?.coverage_area || userInfo.city || storedUser.city || "Madrid";

  // 5. Cálculo de reseñas
  const reviews = profile?.reviews || [];
  const totalReviews = reviews.length;
  const averageRating = totalReviews > 0
    ? (reviews.reduce((acc, curr) => acc + curr.rating, 0) / totalReviews).toFixed(1)
    : "0.0";

  return (
    <aside className="sidebar-profile">
      <div className="profile-header">
        {(userInfo.profile_image || storedUser.profile_image) && !(userInfo.profile_image || storedUser.profile_image).includes("ui-avatars") ? (
          <img
            src={userInfo.profile_image || storedUser.profile_image}
            alt="Perfil"
            className="profile-avatar-placeholder"
            style={{ objectFit: 'cover' }}
          />
        ) : (
          <div className="profile-avatar-placeholder bg-secondary text-white fw-bold">
            {initial}
          </div>
        )}

        <div className="profile-info">
          <h2>{firstName} {lastName}</h2>

          <span className="profile-category">{mainProfession} · {location}</span>

          <div className="profile-rating text-warning mb-2 d-flex align-items-center justify-content-center gap-1">
            <i className="bi bi-star-fill"></i>
            <span className="text-dark fw-bold">{averageRating}</span>
            <span className="text-muted fw-normal" style={{ fontSize: '13px' }}>({totalReviews} reseñas)</span>
          </div>

          <span
            className="badge bg-warning bg-opacity-10 border border-warning border-opacity-25 fw-semibold"
            style={{ fontSize: '12px', color: '#b06000', borderRadius: '50px', padding: '6px 14px', display: 'inline-block' }}
          >
            <i className="bi bi-clock-history me-1"></i> Responde rápido
          </span>
        </div>
      </div>

      <nav className="sidebar-nav mt-3">
        <ul>
          {menu.map(item => (
            <li
              key={item.id}
              className={activeSection === item.id ? "active d-flex justify-content-between align-items-center" : "d-flex justify-content-between align-items-center"}
              onClick={() => setActiveSection(item.id)}
            >
              <span><i className={`bi ${item.icon} me-2`}></i>{item.label}</span>
              {item.badge > 0 && (
                <span className="badge bg-danger rounded-pill px-2">{item.badge}</span>
              )}
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}

export function ClientSidebar({ activeSection, setActiveSection, clientData }) {
  const menu = [
    { id: "summary", label: "Resumen", icon: "bi-house-door" },
    { id: "reservations", label: "Reservas", icon: "bi-calendar-event", badge: clientData?.active_reservations_count || 0 },
    { id: "favorites", label: "Favoritos", icon: "bi-heart", count: clientData?.favorites_count || 0 }
  ];

  const userInfo = clientData?.user_info || {};
  const firstName = userInfo.name || "Usuario";
  const lastName = userInfo.last_name || "";
  const initial = firstName.charAt(0).toUpperCase();
  const city = userInfo.city || "Madrid";
  const memberSince = userInfo.member_since || "2025";

  return (
    <aside className="sidebar-profile">
      <div className="profile-header text-center">
        {userInfo.profile_image && !userInfo.profile_image.includes("ui-avatars") ? (
          <img
            src={userInfo.profile_image}
            alt="Perfil"
            className="profile-avatar-placeholder"
            style={{ objectFit: 'cover' }}
          />
        ) : (
          <div className="profile-avatar-placeholder bg-secondary text-white fw-bold">
            {initial}
          </div>
        )}

        <div className="profile-info">
          <h2 className="d-flex align-items-center justify-content-center gap-1 fs-5">
            {firstName} {lastName}
          </h2>
          <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 rounded-pill px-3 py-1 mb-2 d-inline-flex align-items-center gap-1" style={{ fontSize: '11px', width: 'fit-content', margin: '0 auto' }}>
            <i className="bi bi-check-circle-fill"></i> Verificada
          </span>
          <div className="text-muted small d-flex justify-content-center gap-2">
            <span>{city}</span>
            <span>·</span>
            <span>Desde {memberSince}</span>
          </div>
        </div>
      </div>

      <nav className="sidebar-nav mt-3">
        <ul>
          {menu.map(item => (
            <li
              key={item.id}
              className={activeSection === item.id ? "active d-flex justify-content-between align-items-center" : "d-flex justify-content-between align-items-center"}
              onClick={() => setActiveSection(item.id)}
            >
              <span><i className={`bi ${item.icon} me-2`}></i>{item.label}</span>
              {item.badge > 0 && (
                <span className="badge bg-danger rounded-pill px-2">{item.badge}</span>
              )}
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}