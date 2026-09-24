import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import useGlobalReducer from "../hooks/useGlobalReducer";
import "../styles/Home.css";

export const Navbar = () => {
  const { store, dispatch } = useGlobalReducer();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState("service"); 

  const isCatalogView = location.pathname.includes("/catalog");

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    dispatch({ type: "logout" });
    navigate("/");
  };

  // Se ejecuta con CADA letra que el usuario escribe
  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (isCatalogView) {
      // replace: true evita llenar el historial del navegador con cada letra
      navigate(`/catalog?q=${val}&type=${searchType}`, { replace: true });
    }
  };

  // Se ejecuta al cambiar el dropdown entre Personas/Profesión
  const handleTypeChange = (type) => {
    setSearchType(type);
    if (isCatalogView && searchQuery) {
      navigate(`/catalog?q=${searchQuery}&type=${type}`, { replace: true });
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery && !isCatalogView) {
      navigate(`/catalog?q=${searchQuery}&type=${searchType}`);
    }
  };

  return (
    <nav className="navbar bg-opacity-50 navbar-expand-lg navbar-light bg-white py-3 border-bottom shadow-sm">
      <div className="container align-items-center">

        <Link className="navbar-brand fw-bold text-dark d-flex align-items-center gap-2 me-md-4" to="/">
          <div className="bg-primary text-white rounded d-flex align-items-center justify-content-center"
            style={{ width: "35px", height: "35px", fontSize: "14px" }}>
            KL
          </div>
          Kelaj
        </Link>

        {isCatalogView && (
            <form className="d-none d-md-flex flex-grow-1 mx-4" onSubmit={handleSearchSubmit} style={{ maxWidth: "550px" }}>
                <div className="input-group shadow-sm rounded-pill border bg-white align-items-center">
                    
                    <button
                        className="btn btn-white border-0 rounded-start-pill dropdown-toggle fw-semibold text-dark ps-4 pe-2 shadow-none"
                        type="button"
                        data-bs-toggle="dropdown"
                        aria-expanded="false"
                        style={{ backgroundColor: "transparent" }}
                    >
                        {searchType === "service" ? "Profesión" : "Personas"}
                    </button>
                    
                    <ul className="dropdown-menu shadow-sm border-0 mt-2 rounded-3">
                        <li>
                            <button type="button" className="dropdown-item py-2" onClick={() => handleTypeChange("service")}>
                                <i className="bi bi-briefcase me-2 text-primary"></i>Buscar por profesión
                            </button>
                        </li>
                        <li>
                            <button type="button" className="dropdown-item py-2" onClick={() => handleTypeChange("person")}>
                                <i className="bi bi-person me-2 text-primary"></i>Buscar por persona
                            </button>
                        </li>
                    </ul>

                    <div className="border-end" style={{ height: "20px", borderColor: "#e9ecef" }}></div>

                    <input 
                        type="text" 
                        className="form-control border-0 shadow-none bg-transparent ps-3" 
                        placeholder={searchType === "service" ? "Ej. Abogado, Fontanero..." : "Ej. Laura Martínez..."} 
                        value={searchQuery}
                        onChange={handleSearchChange}
                    />

                    <button type="submit" className="btn border-0 rounded-end-pill pe-4 text-primary shadow-none" style={{ backgroundColor: "transparent" }}>
                        <i className="bi bi-search fw-bold"></i>
                    </button>
                </div>
            </form>
        )}

        <div className="d-flex align-items-center gap-3 ms-auto">
          {!store.user ? (
            <Link to="/login" className="btn btn-light border rounded-pill px-4 fw-semibold d-flex align-items-center gap-2">
              <i className="bi bi-person"></i> Acceder
            </Link>
          ) : (
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
                <li>
                  <Link className="dropdown-item" to={`/profile/${store.user.id}`}>
                    <i className="bi bi-person me-2"></i> Mi Perfil
                  </Link>
                </li>
                <li>
                  <button className="dropdown-item" onClick={() => navigate("/client-panel")}>
                    <i className="bi bi-people me-2"></i> Panel cliente
                  </button>
                </li>
                {store.user.is_provider && (
                  <li>
                    <button className="dropdown-item" onClick={() => navigate("/professional-panel")}>
                      <i className="bi bi-briefcase me-2"></i> Panel profesional
                    </button>
                  </li>
                )}
                {!store.user.is_provider && (
                  <li>
                    <Link className="dropdown-item text-primary fw-semibold" to={`/become-provider`}>
                      <i className="bi bi-rocket-takeoff me-2"></i> Quiero ofrecer mis servicios
                    </Link>
                  </li>
                )}
                <li>
                  <Link className="dropdown-item" to="/settings">
                    <i className="bi bi-gear me-2"></i> Configuración
                  </Link>
                </li>
                <li><hr className="dropdown-divider" /></li>
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