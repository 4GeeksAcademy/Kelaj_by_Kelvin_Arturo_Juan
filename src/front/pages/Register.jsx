import { useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import useGlobalReducer from "../hooks/useGlobalReducer";

const backendUrl = import.meta.env.VITE_BACKEND_URL;

export const Register = () => {
  const navigate = useNavigate();
  const location = useLocation()
  const { dispatch } = useGlobalReducer()
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: location.state?.role || "buyer"
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const payloadToBackend = { ...formData, role: "buyer" };
      const response = await fetch(`${backendUrl}/api/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payloadToBackend)
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message);
        setLoading(false);
        return;
      }

      const loginResponse = await fetch(`${backendUrl}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email, password: formData.password })
      });

      if (!loginResponse.ok) {
        navigate("/login"); 
        return;
      }

      const loginData = await loginResponse.json();

      // Guardamos la sesión
      localStorage.setItem("token", loginData.token);
      localStorage.setItem("user", JSON.stringify(loginData.user));
      dispatch({ type: "set_user", payload: { user: loginData.user, token: loginData.token } });

      if (formData.role === "provider") {
        navigate("/profile/${store.user.id}/become-provider");
      } else {
        navigate("/")
      };
    } catch (err) {
      setError("Ocurrió un error al conectar con el servidor");
      setLoading(false);
    }
  };

  return (
    <div className="container my-5 bg-white p-4 rounded bg-opacity-50" style={{ maxWidth: "400px" }}>
      <h2 className="text-center">{formData.role === "provider" ? "Únete como Profesional" : "Crear cuenta"}</h2>

      {error && <div className="alert alert-danger">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <input
            type="text"
            className="form-control rounded-pill"
            placeholder="Nombre completo"
            name="name"
            value={formData.name}
            onChange={handleChange}
          />
        </div>

        <div className="mb-3">
          <input
            type="email"
            className="form-control rounded-pill"
            placeholder="E-mail"
            name="email"
            value={formData.email}
            onChange={handleChange}
          />
        </div>

        <div className="mb-3">
          <input
            type="password"
            className="form-control rounded-pill"
            placeholder="Contraseña"
            name="password"
            value={formData.password}
            onChange={handleChange}
          />
        </div>
        <div className="col-6">
          <button
            type="submit"
            className="col-6 btn btn-primary mt-3 w-100 rounded-pill"
            disabled={!formData.name || !formData.email || !formData.password || loading}
          >
            {loading ? "Procesando..." : (formData.role === "provider" ? "Siguiente paso" : "Registrarme")}
          </button>
        </div>
      </form>
    </div>
  );
};