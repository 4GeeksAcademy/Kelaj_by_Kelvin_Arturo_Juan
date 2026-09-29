import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import useGlobalReducer from "../hooks/useGlobalReducer";
import { VerifiedBadge } from "./VerifiedBadge";

const backendUrl = import.meta.env.VITE_BACKEND_URL;
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

export const VerificationPage = () => {
    const { store, dispatch } = useGlobalReducer();
    const navigate = useNavigate();
    const token = localStorage.getItem("token");
    const user = store.user;
    const isVerified = Boolean(user && user.verified);

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
    }, [googleReady]);

    const handleGoogleCredential = async (response) => {
        setError(null);
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
                        {user.name} {user.last_name || ""} ha completado la verificación.
                        Tu perfil muestra el distintivo verificado.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="container my-5" style={{ maxWidth: 560 }}>
            <div className="card shadow-sm border-0 text-center" style={{ borderRadius: 16, padding: 32 }}>
                <h3 style={{ fontWeight: 700 }}>Verificación de proveedor</h3>
                <p className="text-muted">
                    Pulsa el botón y entra con la cuenta de Google que coincida con tu correo de Kelaj (<strong>{user.email}</strong>) para
                    obtener el distintivo de <strong>proveedor verificado</strong>.
                </p>
                {error && <div className="alert alert-danger py-2">{error}</div>}
                {loading && <p className="text-muted">Verificando...</p>}
                <div className="d-flex justify-content-center">
                    <div id="google-verify-btn"></div>
                </div>
            </div>
        </div>
    );
};
