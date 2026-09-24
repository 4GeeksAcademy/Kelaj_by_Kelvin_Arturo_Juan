import { useState } from "react";
import { useNavigate, Link } from "react-router-dom"; // Añadimos Link
import useGlobalReducer from "../hooks/useGlobalReducer";
import { loginUser } from "../services/userServices"; // Importamos el servicio

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
      // 1. Usamos el servicio limpio (él se encarga del fetch y los errores)
      const data = await loginUser(formData);

      // Compatibilidad por si tu backend envía el token con otro nombre
      const validToken = data.token || data.access_token;
      const validUser = data.user;

      // 2. Guardamos la sesión
      localStorage.setItem("token", validToken);
      localStorage.setItem("user", JSON.stringify(validUser));

      dispatch({
        type: "set_user",
        payload: { user: validUser, token: validToken }
      });

      // 3. Redirigimos al inicio
      navigate("/");
    } catch (err) {
      setError(err.message || "Ocurrió un error al conectar con el servidor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container my-5" style={{ maxWidth: "400px" }}>

      {error && <div className="alert alert-danger rounded-3">{error}</div>}

      <form onSubmit={handleSubmit} className="bg-white p-4 rounded-4 bg-opacity-50 shadow-sm border">
        <h3 className="text-center fw-bold mb-4">Iniciar sesión</h3>

        <div className="mb-3">
          <label htmlFor="email" className="form-label fw-semibold small">E-mail</label>

          <input
            type="email"
            className="form-control rounded-pill my-1 px-3 py-2"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>

        <div className="mb-4">
          <label htmlFor="password" className="form-label fw-semibold small">Contraseña</label>
          <input
            type="password"
            className="form-control rounded-pill my-1 px-3 py-2"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
          />
        </div>

        <button
          type="submit"
          className="btn btn-primary w-100 py-2 fw-semibold rounded-pill"
          disabled={!formData.email || !formData.password || loading}
        >
          {loading ? (
            <><span className="spinner-border spinner-border-sm me-2"></span>Ingresando...</>
          ) : (
            "Iniciar sesión"
          )}
        </button>

        {/* Usamos <Link> en lugar de <a> para evitar la recarga completa del navegador */}
        <p className="mt-4 text-center small">
          ¿No tienes cuenta? crea una <Link to="/register" className="text-primary fw-bold text-decoration-none">Aquí</Link>
        </p>
      </form>

    </div>
  );
};