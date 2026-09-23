import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import useGlobalReducer from "../hooks/useGlobalReducer";
import { VerifiedBadge } from "../components/VerifiedBadge";
import "../styles/juan.css";

const backendUrl = import.meta.env.VITE_BACKEND_URL;
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

const maskEmail = (email) => {
    if (!email || email.indexOf("@") === -1) return email;
    const parts = email.split("@");
    const name = parts[0];
    const shown = name.length <= 2 ? name[0] + "*" : name.slice(0, 2) + "***";
    return shown + "@" + parts[1];
};

export const VerificationPage = () => {
    const { store, dispatch } = useGlobalReducer();
    const navigate = useNavigate();
    const token = localStorage.getItem("token");
    const user = store.user;
    const isVerified = Boolean(user && user.verified);

    const [step, setStep] = useState(1);
    const [code, setCode] = useState("");
    const [info, setInfo] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [googleReady, setGoogleReady] = useState(false);

    useEffect(() => {
        if (!token || !user || !user.is_provider || isVerified) return;
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
    }, [token, user, isVerified]);

    useEffect(() => {
        if (googleReady && window.google && document.getElementById("google-verify-btn")) {
            window.google.accounts.id.initialize({
                client_id: GOOGLE_CLIENT_ID,
                callback: handleGoogleCredential
            });
            window.google.accounts.id.renderButton(
                document.getElementById("google-verify-btn"),
                { theme: "outline", size: "large", text: "continue_with", width: 280 }
            );
        }
    }, [googleReady, step]);

    const handleGoogleCredential = async (response) => {
        setError(null);
        setInfo(null);
        setLoading(true);
        try {
            const res = await fetch(backendUrl + "/api/verify/google", {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": "Bearer " + token },
                body: JSON.stringify({ credential: response.credential })
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
                body: JSON.stringify({})
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.message);
                setLoading(false);
                return;
            }
            setInfo(data.debug_code ? data.message + "\nCódigo de demostración: " + data.debug_code : data.message + "\nRevisa tu bandeja de entrada.");
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
                    Verifícate con tu cuenta de Google o recibe un código en tu correo <strong>{maskEmail(user.email)}</strong> para
                    mostrar el distintivo de <strong>proveedor verificado</strong>.
                </p>

                {info && <div className="alert alert-success py-2" style={{ whiteSpace: "pre-line" }}>{info}</div>}
                {error && <div className="alert alert-danger py-2">{error}</div>}

                {step === 1 && (
                    <form onSubmit={requestCode}>
                        <button type="submit" className="btn btn-primary w-100" disabled={loading}>
                            {loading ? "Enviando..." : "Enviar código a mi correo"}
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

                <div className="d-flex align-items-center my-3">
                    <hr className="flex-grow-1" />
                    <span className="mx-2 text-muted">o</span>
                    <hr className="flex-grow-1" />
                </div>

                {GOOGLE_CLIENT_ID ? (
                    <div className="d-flex flex-column align-items-center gap-2">
                        <div id="google-verify-btn"></div>
                        <small className="text-muted text-center">Usa la cuenta de Google que coincida con tu correo de Kelaj.</small>
                    </div>
                ) : (
                    <small className="text-muted">Configura VITE_GOOGLE_CLIENT_ID para activar la verificación con Google.</small>
                )}
            </div>
        </div>
    );
};
