import { useState } from "react";
import { useNavigate } from "react-router-dom";
import useGlobalReducer from "../hooks/useGlobalReducer";
import "../styles/juan.css";

const backendUrl = import.meta.env.VITE_BACKEND_URL;
const heroImage = "https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=1600&auto=format&fit=crop";

export const Login = () => {
  const { dispatch } = useGlobalReducer();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: "", password: "" });
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
      const response = await fetch(`${backendUrl}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message);
        setLoading(false);
        return;
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      dispatch({
        type: "set_user",
        payload: { user: data.user, token: data.token }
      });

      navigate("/");
    } catch (err) {
      setError("Ocurrió un error al conectar con el servidor");
      setLoading(false);
    }
  };

  return (
    <div className="juan-login">
      <div className="left">
        <h2 style={{ fontWeight: 700 }}>Bienvenido de nuevo</h2>
        <p className="tagline">
          Tus proyectos avanzan hoy. Encuentra al profesional perfecto y coordina
          en más de 52 provincias de toda España.
        </p>

        <div className="card-login">
          {error && <div className="alert alert-danger py-2">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label">Email</label>
              <input
                type="email"
                className="form-control"
                name="email"
                value={formData.email}
                onChange={handleChange}
              />
            </div>

            <div className="mb-3">
              <label className="form-label">Contraseña</label>
              <input
                type="password"
                className="form-control"
                name="password"
                value={formData.password}
                onChange={handleChange}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary w-100"
              disabled={!formData.email || !formData.password || loading}
            >
              {loading ? "Ingresando..." : "Iniciar sesión"}
            </button>
          </form>

          <p className="mt-3 mb-0">
            ¿No tienes cuenta? <a href="/Register">crea una Aquí</a>
          </p>
        </div>
      </div>

      <div
        className="right"
        style={{ backgroundImage: `url(${heroImage})` }}
      >
        <div className="overlay">
          <p>El profesional que necesitas, a un clic de distancia.</p>
        </div>
      </div>
    </div>
  );
};
