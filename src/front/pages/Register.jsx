import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import useGlobalReducer from "../hooks/useGlobalReducer";
import { registerUser, loginUser } from "../services/userServices"; // Importamos los servicios limpios

export const Register = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { dispatch } = useGlobalReducer();

  // Reactividad: Si viene del botón del Home, asume "provider", sino "buyer"
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
      // 1. REGISTRO (Forzamos "buyer" para que el backend lo acepte limpio)
      const payloadToBackend = { ...formData, role: "buyer" }; 
      await registerUser(payloadToBackend);

      // 2. AUTO-LOGIN
      const loginData = await loginUser({ email: formData.email, password: formData.password });

      const validToken = loginData.token || loginData.access_token;
      const validUser = loginData.user || formData;

      // 3. GUARDAR SESIÓN
      localStorage.setItem("token", validToken);
      localStorage.setItem("user", JSON.stringify(validUser));
      dispatch({ type: "set_user", payload: { user: validUser, token: validToken } });

      // 4. REDIRECCIÓN INTELIGENTE
      if (formData.role === "provider") {
        navigate(`/become-provider`);
      } else {
        navigate("/");
      }

    } catch (err) {
      // Atrapamos cualquier error de registerUser o loginUser
      setError(err.message || "Ocurrió un error al conectar con el servidor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container my-5" style={{ maxWidth: "400px" }}>
      <form onSubmit={handleSubmit} className="bg-white bg-opacity-50 p-4 rounded-4 shadow-sm border">
        
        {/* Título reactivo */}
        <h3 className="fw-bold text-center mb-4">
          {formData.role === "provider" ? "Únete como Profesional" : "Crear cuenta"}
        </h3>

        {error && <div className="alert alert-danger rounded-3">{error}</div>}

        <div className="mb-3">
          <label className="form-label fw-semibold small">Nombre y Apellido</label>
          <input 
            type="text" className="form-control rounded-pill px-3 py-2" name="name" 
            value={formData.name} onChange={handleChange} required 
          />
        </div>

        <div className="mb-3">
          <label className="form-label fw-semibold small">E-mail</label>
          <input 
            type="email" className="form-control rounded-pill px-3 py-2" name="email" 
            value={formData.email} onChange={handleChange} required 
          />
        </div>

        <div className="mb-4">
          <label className="form-label fw-semibold small">Contraseña</label>
          <input 
            type="password" className="form-control rounded-pill px-3 py-2" name="password" 
            value={formData.password} onChange={handleChange} required 
          />
        </div>

        {/* Botón reactivo */}
        <button 
          type="submit" 
          className="btn btn-primary w-100 py-2 fw-semibold rounded-pill" 
          disabled={!formData.name || !formData.email || !formData.password || loading}
        >
          {loading ? (
            <><span className="spinner-border spinner-border-sm me-2"></span>Procesando...</>
          ) : (
            formData.role === "provider" ? "Siguiente paso" : "Registrarme"
          )}
        </button>

        {/* Enlace al login solo para clientes normales */}
        {formData.role !== "provider" && (
           <p className="mt-4 text-center small">
             ¿Ya tienes cuenta? <Link to="/login" className="text-primary fw-bold text-decoration-none">Inicia sesión aquí</Link>
           </p>
        )}
      </form>
    </div>
  );
};