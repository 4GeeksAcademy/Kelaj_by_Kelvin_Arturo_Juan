import React from "react";
import { Link, useNavigate } from "react-router-dom";
import useGlobalReducer from "../hooks/useGlobalReducer";
import "../styles/Search.css"

export const Navbar = () => {
	const { store, dispatch } = useGlobalReducer();
	const navigate = useNavigate();

	const handleLogout = () => {
		localStorage.removeItem("token");
		dispatch({ type: "logout" });
		navigate("/");
	};
	return (
		<nav className="navbar navbar-expand-lg navbar-light bg-white py-3 border-bottom">
			<div className="container">
				{/* LOGO (Tu código actual del logo aquí) */}
				<Link className="navbar-brand fw-bold text-dark d-flex align-items-center gap-2" to="/">
					<div className="bg-primary text-white rounded d-flex align-items-center justify-content-center" style={{ width: "35px", height: "35px", fontSize: "14px" }}>KL</div>
					Kelaj
				</Link>

				<div className="d-flex align-items-center gap-3 ms-auto">
					{store.user ? (
						<div className="dropdown">
							<button className="btn btn-light border rounded-pill px-3 fw-semibold d-flex align-items-center gap-2 dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-expanded="false">
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

								{/* Panel si ya es proveedor */}
								{store.user.is_provider && (
									<li>
										<Link className="dropdown-item" to="/provider/dashboard">
											<i className="bi bi-briefcase me-2"></i> Mi Panel
										</Link>
									</li>
								)}

								{/* NUEVO: Opción para convertirse en proveedor si es cliente (buyer) */}
								{!store.user.is_provider && (
									<li>
										<Link className="dropdown-item text-primary fw-semibold" to="/profile/:theId/become-provider">
											<i className="bi bi-rocket-takeoff me-2"></i> Quiero ofrecer mi servicio
										</Link>
									</li>
								)}

								{/* NUEVO: Configuración general para cualquier usuario */}
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
					) : (
						<Link to="/login" className="btn btn-light border rounded-pill px-4 fw-semibold d-flex align-items-center gap-2">
							<i className="bi bi-person"></i> Acceder
						</Link>
					)}
				</div>
			</div>
		</nav>
	);
};