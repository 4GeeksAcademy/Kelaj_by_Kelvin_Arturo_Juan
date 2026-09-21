import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/juan.css";

const backendUrl = import.meta.env.VITE_BACKEND_URL;
const heroImage = "https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=1600&auto=format&fit=crop";

export const Register = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "buyer",
    dni: ""
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
      const response = await fetch(`${backendUrl}/api/register`, {
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

      navigate("/login");
    } catch (err) {
      setError("Ocurrió un error al conectar con el servidor");
      setLoading(false);
    }
  };

  return (
    <div className="juan-login">
      <div className="left register">
        <h2 style={{ fontWeight: 700 }}>Crea tu cuenta</h2>
        <p className="tagline">
          Únete a Kelaj y empieza a encontrar o ofrecer servicios profesionales
          en más de 52 provincias de toda España.
        </p>

        <div className="card-login">
          {error && <div className="alert alert-danger py-2">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label">Nombre</label>
              <input
                type="text"
                className="form-control"
                name="name"
                value={formData.name}
                onChange={handleChange}
              />
            </div>

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

            <div className="mb-3">
              <label className="form-label">Quiero registrarme como</label>
              <select
                className="form-select"
                name="role"
                value={formData.role}
                onChange={handleChange}
              >
                <option value="buyer">Cliente</option>
                <option value="provider">Proveedor</option>
              </select>
            </div>

            {formData.role === "provider" && (
              <div className="mb-3">
                <label className="form-label">DNI / NIE</label>
                <input
                  type="text"
                  className="form-control"
                  name="dni"
                  value={formData.dni || ""}
                  onChange={handleChange}
                  placeholder="12345678A"
                />
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary w-100"
              disabled={!formData.name || !formData.email || !formData.password || loading}
            >
              {loading ? "Creando cuenta..." : "Registrarme"}
            </button>
          </form>

          <p className="mt-3 mb-0">
            ¿Ya tienes cuenta? <a href="/login">Inicia sesión</a>
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
