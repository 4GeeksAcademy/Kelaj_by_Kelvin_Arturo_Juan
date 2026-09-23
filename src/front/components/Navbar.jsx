import React from "react";
import { Link, useNavigate } from "react-router-dom";
import useGlobalReducer from "../hooks/useGlobalReducer";
import "../styles/Home.css"


export const Navbar = () => {
  const { store, dispatch } = useGlobalReducer();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    dispatch({ type: "logout" });
    navigate("/");
  };

  return (
    <nav className="navbar bg-opacity-50 navbar-expand-lg navbar-light bg-white py-3">
      <div className="container">

        {/* LOGO */}
        <Link className="navbar-brand fw-bold text-dark d-flex align-items-center gap-2" to="/">
          <div className="bg-primary text-white rounded d-flex align-items-center justify-content-center"
            style={{ width: "35px", height: "35px", fontSize: "14px" }}>
            KL
          </div>
          Kelaj
        </Link>

        <div className="d-flex align-items-center gap-3 ms-auto">

          {/* SI NO ESTÁ LOGUEADO */}
          {!store.user ? (
            <Link to="/login" className="btn btn-light border rounded-pill px-4 fw-semibold d-flex align-items-center gap-2">
              <i className="bi bi-person"></i> Acceder
            </Link>
          ) : (

            /* SI ESTÁ LOGUEADO */
            <div className="dropdown">
              <button
                className="btn btn-light border rounded-pill px-3 fw-semibold d-flex align-items-center gap-2 dropdown-toggle"
                type="button"
                data-bs-toggle="dropdown"
                aria-expanded="false"
              >
                <img
                  src={store.user.profile_image || `https://ui-avatars.com/api/?name=${store.user.name}&background=4f46e5&color=fff`}
                  alt={store.user.name}
                  className="rounded-circle"
                  style={{ width: "26px", height: "26px", objectFit: "cover" }}
                />
                <span className="d-none d-sm-inline">{store.user.name}</span>
              </button>

              <ul className="dropdown-menu dropdown-menu-end shadow-sm border-0 mt-2">

                {/* PERFIL */}
                <li>
                  <Link className="dropdown-item" to={`/profile/${store.user.id}`}>
                    <i className="bi bi-person me-2"></i> Mi Perfil
                  </Link>
                </li>

                {/* PANEL CLIENTE (Todos, porque un proveedor también contrata servicios) */}
                <li>
                  <button className="dropdown-item" onClick={() => navigate("/client-panel")}>
                    <i className="bi bi-people me-2"></i> Panel cliente
                  </button>
                </li>

                {/* PANEL PROFESIONAL (Solo si ya activó su capa de proveedor) */}
                {store.user.is_provider && (
                  <li>
                    <button className="dropdown-item" onClick={() => navigate("/professional-panel")}>
                      <i className="bi bi-briefcase me-2"></i> Panel profesional
                    </button>
                  </li>
                )}

                {/* UPGRADE A PROVEEDOR (Solo si aún es un cliente básico) */}
                {!store.user.is_provider && (
                  <li>
                    <Link className="dropdown-item text-primary fw-semibold" to="/profile/${store.user.id}/become-provider">
                      <i className="bi bi-rocket-takeoff me-2"></i> Quiero ofrecer mis servicios
                    </Link>
                  </li>
                )}

                {/* CONFIGURACIÓN */}

                <li>
                  <Link className="dropdown-item" to="/settings">
                    <i className="bi bi-gear me-2"></i> Configuración
                  </Link>
                </li>
                <li><hr className="dropdown-divider" /></li>

                {/* CERRAR SESIÓN */}
                <li>
                  <button className="dropdown-item text-danger" onClick={handleLogout}>
                    <i className="bi bi-box-arrow-right me-2"></i> Cerrar sesión
                  </button>
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};