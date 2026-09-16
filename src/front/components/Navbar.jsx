import { Link } from "react-router-dom";
import "../styles/Search.css"

export const Navbar = () => {
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
						<a href="/" className="btn btn-outline-primary rounded-pill fw-semibold px-3 py-2">Ofrecer servicios</a>
						<a href="#" className="text-secondary d-none d-lg-block">
							<i className="bi bi-globe fs-5"></i>
						</a>
						<Link to="/Login" className="btn btn-outline-secondary rounded-pill"><i className="bi bi-person fs-5"></i>Acceder</Link>
					</div>
				</div>
			</div>
		</nav>

	);
};