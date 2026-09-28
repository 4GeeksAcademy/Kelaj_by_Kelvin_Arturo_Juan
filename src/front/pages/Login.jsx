import { useEffect, useState } from "react";
import { useNavigate,Link } from "react-router-dom";
import useGlobalReducer from "../hooks/useGlobalReducer";
import "../styles/juan.css";

const backendUrl = import.meta.env.VITE_BACKEND_URL;
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const heroImage = "https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=1600&auto=format&fit=crop";

export const Login = () => {
  const { dispatch } = useGlobalReducer();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [googleReady, setGoogleReady] = useState(false);

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;
    if (window.google && window.google.accounts) {
      setGoogleReady(true);
      return;
    }
    const s = document.createElement("script");
    s.src = "https://accounts.google.com/gsi/client";
    s.async = true;
    s.defer = true;
    s.onload = () => setGoogleReady(true);
    document.body.appendChild(s);
  }, []);

  useEffect(() => {
    if (googleReady && window.google && document.getElementById("google-login-btn")) {
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleCredential
      });
      window.google.accounts.id.renderButton(
        document.getElementById("google-login-btn"),
        { theme: "outline", size: "large", text: "continue_with", width: 280 }
      );
    }
  }, [googleReady]);

  const handleGoogleCredential = async (response) => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`${backendUrl}/api/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential: response.credential })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message);
        setLoading(false);
        return;
      }
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      dispatch({ type: "set_user", payload: { user: data.user, token: data.token } });
      setLoading(false);
      navigate("/");
    } catch (err) {
      setError("Ocurrió un error al conectar con el servidor");
      setLoading(false);
    }
  };

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
    <div className="juan-login">
      <div className="left">
        <h2 style={{ fontWeight: 700 }}>Bienvenido de nuevo</h2>
        <p className="tagline">
          Tus proyectos avanzan hoy. Encuentra al profesional perfecto y coordina
          en más de 52 provincias de toda España.
        </p>

        <div className="card-login">
          {error && <div className="alert alert-danger py-2">{error}</div>}

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

            {GOOGLE_CLIENT_ID ? (
              <div className="d-flex justify-content-center">
                <div id="google-login-btn"></div>
              </div>
            ) : null}

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
      </div>
    </div>

  );
};
