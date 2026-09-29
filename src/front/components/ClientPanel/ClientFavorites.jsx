import React from "react";
import { Link } from "react-router-dom";

export default function ClientFavorites({ data }) {
  // Extraemos la lista de profesionales seguidos de forma segura
  const followingProfessionals = data?.following_professionals || [];

  return (
    <div className="summary-card-container">
      <h3>Profesionales Favoritos</h3>
      <p className="text-muted mt-1 mb-3" style={{ fontSize: '14px' }}>Especialistas a los que sigues</p>
      
      <div className="mt-3 d-flex flex-column gap-3">
        {followingProfessionals.length > 0 ? (
          followingProfessionals.map(prof => (
            <div key={prof.id} className="d-flex justify-content-between align-items-center p-3 border rounded-3 bg-white shadow-sm">
              <div className="d-flex align-items-center gap-3">
                <img 
                  src={prof.profile_image || "https://via.placeholder.com/45"} 
                  alt={prof.name} 
                  className="rounded-circle shadow-sm border object-fit-cover" 
                  style={{ width: '50px', height: '50px' }} 
                />
                <div>
                  <h5 className="mb-0 fs-6 fw-bold text-dark">{prof.name}</h5>
                  <small className="text-muted">{prof.category || "Especialista"} · {prof.city || "Madrid"}</small>
                </div>
              </div>
              <Link 
                to={`/profile/${prof.id}`} 
                className="btn btn-outline-primary btn-sm rounded-pill px-3 py-2 fw-semibold text-decoration-none" 
                style={{ fontSize: '13px' }}
              >
                Ver perfil
              </Link>
            </div>
          ))
        ) : (
          <p className="empty-state text-muted py-3 m-0">No sigues a ningún profesional todavía.</p>
        )}
      </div>
    </div>
  );
}