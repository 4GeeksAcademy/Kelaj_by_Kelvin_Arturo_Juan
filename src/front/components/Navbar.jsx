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
								<span className="fw-semibold text-dark">
									👤 {store.user.name}
								</span>

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