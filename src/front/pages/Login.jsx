import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import useGlobalReducer from "../hooks/useGlobalReducer";

const backendUrl = import.meta.env.VITE_BACKEND_URL;

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
      const response = await fetch(`${backendUrl}/api/login`, {
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
    <div className="container my-5" style={{ maxWidth: "400px" }}>

      {error && <div className="alert alert-danger">{error}</div>}

      <form onSubmit={handleSubmit} className="bg-white p-4 rounded bg-opacity-50">
        <h2 className="text-center">Iniciar sesión</h2>
        <div className="mb-3">
          <input
            type="email"
            className="form-control rounded-pill my-3"
            name="email"
            placeholder="E-mail"
            value={formData.email}
            onChange={handleChange}
          />
        </div>

        <div className="">
          <input
            type="password"
            className="form-control rounded-pill my-3"
            name="password"
            placeholder="Contraseña"
            value={formData.password}
            onChange={handleChange}
          />
        </div>

        <button
          type="submit"
          className="btn btn-primary w-100 mt-3 rounded-pill"
          disabled={!formData.email || !formData.password || loading}
        >
          {loading ? "Ingresando..." : "Iniciar sesión"}
        </button>
        <p className="mt-3">¿No tienes cuenta? crea una <Link to="/register">aquí</Link></p>

      </form>

    </div>
  );
};