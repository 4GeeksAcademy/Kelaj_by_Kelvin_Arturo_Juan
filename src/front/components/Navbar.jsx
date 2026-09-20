import { Link } from "react-router-dom";
import "../styles/Search.css"
import useGlobalReducer from "../hooks/useGlobalReducer";
import { useNavigate } from "react-router-dom";


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
		<nav className="navbar navbar-expand-lg navbar-light bg-white py-3">
			<div className="container-fluid px-4 px-lg-5">
				<a className="navbar-brand d-flex align-items-center gap-2" href="/">
					<div className="brand-logo rounded-circle fw-bold">JK</div>
					<span className="fw-bold fs-5 text-dark">Jake</span>
				</a>
				<button className="navbar-toggler border-0 shadow-none" type="button" data-bs-toggle="collapse" data-bs-target="#navbarContent" aria-controls="navbarContent" aria-expanded="false" aria-label="Toggle navigation">
					<span className="navbar-toggler-icon"></span>
				</button>
				<div className="collapse navbar-collapse" id="navbarContent">
					<div className="ms-auto d-flex flex-column flex-lg-row align-items-lg-center gap-3 mt-3 mt-lg-0">
						{!store.user ? (
							<>
								<Link
									to="/Register"
									className="btn btn-outline-primary rounded-pill fw-semibold px-3 py-2"
								>
									Ofrecer servicios
								</Link>

								<Link
									to="/Login"
									className="btn btn-outline-secondary rounded-pill"
								>
									<i className="bi bi-person fs-5"></i> Acceder
								</Link>
							</>
						) : (
							<>
								<div className="position-relative me-3">
									<i className="bi bi-bell fs-5 text-secondary"></i>
									<span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
										2
									</span>
								</div>
								<div
									className="dropdown d-inline-block position-relative"
									onMouseEnter={(e) =>
										e.currentTarget.querySelector(".dropdown-menu").classList.add("show")
									}
									onMouseLeave={(e) =>
										e.currentTarget.querySelector(".dropdown-menu").classList.remove("show")
									}
								>
									<span
										className="fw-semibold text-dark dropdown-toggle d-flex align-items-center"
										style={{ cursor: "pointer" }}
									>
										<i className="bi bi-person-fill me-1 text-primary"></i>
										{store.user.name}
									</span>

									<ul className="dropdown-menu shadow-sm" style={{ transform: "translateX(-80px)" }}>
										{store.user.role === "buyer" ? (
											<li>
												<button
													className="dropdown-item"
													onClick={() => navigate("/client-panel")}
												>
													Ir a mi panel
												</button>
											</li>
										) : (
											<>
												<li>
													<button
														className="dropdown-item"
														onClick={() => navigate("/professional-panel")}
													>
														Panel profesional
													</button>
												</li>
												<li>
													<button
														className="dropdown-item"
														onClick={() => navigate("/client-panel")}
													>
														Panel cliente
													</button>
												</li>
											</>
										)}
									</ul>
								</div>
								<button
									className="btn btn-outline-danger rounded-pill fw-semibold px-3 py-2"
									onClick={handleLogout}
								>
									Cerrar sesión
								</button>
							</>
						)}
					</div>
				</div>
			</div>
		</nav>
	);
};