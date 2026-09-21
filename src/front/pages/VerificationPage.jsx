import { useState } from "react";
import { useNavigate } from "react-router-dom";
import useGlobalReducer from "../hooks/useGlobalReducer";
import { VerifiedBadge } from "../components/VerifiedBadge";
import "../styles/juan.css";

const backendUrl = import.meta.env.VITE_BACKEND_URL;

export const VerificationPage = () => {
    const { store, dispatch } = useGlobalReducer();
    const navigate = useNavigate();
    const token = localStorage.getItem("token");
    const user = store.user;
    const isVerified = Boolean(user && user.verified);

    const [dni, setDni] = useState("");
    const [step, setStep] = useState(1);
    const [code, setCode] = useState("");
    const [info, setInfo] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    if (!token || !user || !user.is_provider) {
        return (
            <div className="container my-5 text-center">
                <h3 style={{ fontWeight: 700 }}>Solo proveedores</h3>
                <p className="text-muted">Esta página es exclusiva para cuentas de proveedor. Inicia sesión con un proveedor para continuar.</p>
                <button className="btn btn-primary" onClick={() => navigate("/login")}>Ir a iniciar sesión</button>
            </div>
        );
    }

    if (isVerified) {
        return (
            <div className="container my-5" style={{ maxWidth: 560 }}>
                <div className="card shadow-sm border-0 text-center" style={{ borderRadius: 16, padding: 40 }}>
                    <div className="mx-auto mb-3"><VerifiedBadge size={56} /></div>
                    <h3 style={{ fontWeight: 700 }}>Proveedor verificado</h3>
                    <p className="text-muted mb-0">
                        {user.name} {user.last_name || ""} ha completado la verificación en 2 pasos.
                        Tu perfil muestra el distintivo verificado.
                    </p>
                </div>
            </div>
        );
    }

    const requestCode = async (e) => {
        e.preventDefault();
        setError(null);
        setInfo(null);
        setLoading(true);
        try {
            const res = await fetch(backendUrl + "/api/verify/start", {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": "Bearer " + token },
                body: JSON.stringify({ dni })
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.message);
                setLoading(false);
                return;
            }
            setInfo(data.message + "\\nTu código de demostración: " + data.debug_code);
            setStep(2);
            setLoading(false);
        } catch (err) {
            setError("Error al conectar con el servidor");
            setLoading(false);
        }
    };

    const confirmCode = async (e) => {
        e.preventDefault();
        setError(null);
        setInfo(null);
        setLoading(true);
        try {
            const res = await fetch(backendUrl + "/api/verify/confirm", {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": "Bearer " + token },
                body: JSON.stringify({ code })
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.message);
                setLoading(false);
                return;
            }
            localStorage.setItem("user", JSON.stringify(data.user));
            dispatch({ type: "set_user", payload: { user: data.user, token } });
            setLoading(false);
            window.location.reload();
        } catch (err) {
            setError("Error al conectar con el servidor");
            setLoading(false);
        }
    };

    return (
        <div className="container my-5" style={{ maxWidth: 560 }}>
            <div className="card shadow-sm border-0" style={{ borderRadius: 16, padding: 32 }}>
                <h3 style={{ fontWeight: 700 }}>Verificación en 2 pasos</h3>
                <p className="text-muted">
                    Verifícate para que tu perfil muestre el distintivo de <strong>proveedor verificado</strong>.
                </p>

                {info && <div className="alert alert-success py-2" style={{ whiteSpace: "pre-line" }}>{info}</div>}
                {error && <div className="alert alert-danger py-2">{error}</div>}

                {step === 1 && (
                    <form onSubmit={requestCode}>
                        <div className="mb-3">
                            <label className="form-label">DNI / NIE</label>
                            <input
                                type="text"
                                className="form-control"
                                placeholder="12345678A"
                                value={dni}
                                onChange={(e) => setDni(e.target.value)}
                            />
                        </div>
                        <button type="submit" className="btn btn-primary w-100" disabled={!dni || loading}>
                            {loading ? "Enviando..." : "Enviar código de verificación"}
                        </button>
                    </form>
                )}

                {step === 2 && (
                    <form onSubmit={confirmCode}>
                        <div className="mb-3">
                            <label className="form-label">Código de 6 dígitos</label>
                            <input
                                type="text"
                                className="form-control text-center"
                                style={{ letterSpacing: 6, fontSize: 20 }}
                                maxLength={6}
                                placeholder="••••••"
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                            />
                        </div>
                        <button type="submit" className="btn btn-primary w-100" disabled={!code || loading}>
                            {loading ? "Verificando..." : "Confirmar e ir verificado"}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};
