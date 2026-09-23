import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import useGlobalReducer from "../hooks/useGlobalReducer";

const backendUrl = import.meta.env.VITE_BACKEND_URL;
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

export const Register = () => {
  const { dispatch } = useGlobalReducer();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "buyer"
  });
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
    if (googleReady && window.google && document.getElementById("google-register-btn")) {
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleCredential
      });
      window.google.accounts.id.renderButton(
        document.getElementById("google-register-btn"),
        { theme: "outline", size: "large", text: "signup_with", width: 280 }
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
        body: JSON.stringify({ credential: response.credential, role: formData.role })
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
    <div className="container my-5" style={{ maxWidth: "400px" }}>
      <h2>Crear cuenta</h2>

      {error && <div className="alert alert-danger">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label className="form-label">Nombre completo</label>
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

        <button
          type="submit"
          className="btn btn-primary mt-3 w-100"
          disabled={!formData.name || !formData.email || !formData.password || loading}
        >
          {loading ? "Creando cuenta..." : "Registrarme"}
        </button>
      </form>

      <div className="d-flex align-items-center my-3">
        <hr className="flex-grow-1" />
        <span className="mx-2 text-muted">o</span>
        <hr className="flex-grow-1" />
      </div>

      {GOOGLE_CLIENT_ID ? (
        <div className="d-flex justify-content-center">
          <div id="google-register-btn"></div>
        </div>
      ) : null}
    </div>
  );
};
