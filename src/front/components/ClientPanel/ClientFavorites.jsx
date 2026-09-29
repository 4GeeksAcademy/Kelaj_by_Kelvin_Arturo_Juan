export default function ClientFavorites({ favorites = [] }) {
  return (
    <div className="summary-card-container">
      <h3>Profesionales Favoritos</h3>
      <p className="text-muted mt-1 mb-3" style={{ fontSize: '14px' }}>Especialistas a los que sigues</p>
      
      <div className="mt-3 d-flex flex-column gap-3">
        {favorites.length > 0 ? (
          favorites.map(prof => (
            <div key={prof.id} className="d-flex justify-content-between align-items-center p-3 border rounded-3 bg-white shadow-sm">
              <div className="d-flex align-items-center gap-3">
                <img 
                  src={prof.profile_image || "https://via.placeholder.com/45"} 
                  alt={prof.name} 
                  className="rounded-circle shadow-sm border" 
                  style={{ width: '50px', height: '50px', objectFit: 'cover' }} 
                />
                <div>
                  <h5 className="mb-0 fs-6 fw-bold text-dark">{prof.name}</h5>
                  <small className="text-muted">{prof.category || "Especialista"}</small>
                </div>
              </div>
              <a 
                href={`/profile/${prof.id}`} 
                className="btn btn-outline-primary btn-sm rounded-pill px-3 py-2 fw-semibold" 
                style={{ fontSize: '13px' }}
              >
                Ver perfil
              </a>
            </div>
          ))
        ) : (
          <p className="empty-state text-muted py-3 m-0">No sigues a ningún profesional todavía.</p>
        )}
      </div>
    </div>
  );
}