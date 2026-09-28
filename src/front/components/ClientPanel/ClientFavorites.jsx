export default function ClientFavorites({ favorites = [] }) {
  return (
    <div className="summary-card-container">
      <h3>Profesionales Favoritos</h3>
      <p className="text-muted mt-1 mb-3" style={{ fontSize: '14px' }}>Especialistas a los que sigues</p>
      
      <div className="mt-3 d-flex flex-column gap-3">
        {favorites.length > 0 ? (
          favorites.map(prof => (
            <div key={prof.id} className="d-flex justify-content-between align-items-center p-3 border-bottom">
              <div className="d-flex align-items-center gap-3">
                <img src={prof.profile_image || "https://via.placeholder.com/45"} alt="" className="rounded-circle" style={{width: '45px', height: '45px', objectFit: 'cover'}} />
                <div>
                  <h5 className="mb-0 fs-6 fw-bold">{prof.name}</h5>
                  <small className="text-muted">{prof.category || "Especialista"}</small>
                </div>
              </div>
              <button className="btn btn-primary btn-sm rounded-pill px-3" style={{fontSize: '13px'}}>Agendar</button>
            </div>
          ))
        ) : (
          <p className="empty-state text-muted py-3 m-0">No sigues a ningún profesional todavía.</p>
        )}
      </div>
    </div>
  );
}