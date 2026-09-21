import React, { useState } from 'react';

const backendUrl = import.meta.env.VITE_BACKEND_URL;

export const SecuritySettings = () => {
    const [passwordData, setPasswordData] = useState({
        current_password: "",
        new_password: "",
        confirm_password: ""
    });
    const [passwordError, setPasswordError] = useState(null);
    const [passwordSuccess, setPasswordSuccess] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [hideOnlineStatus, setHideOnlineStatus] = useState(false);

    const handlePasswordChangeInput = (e) => {
        setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
    };

    const handleSavePassword = async (e) => {
        e.preventDefault();
        setPasswordError(null);
        setPasswordSuccess(null);

        if (passwordData.new_password !== passwordData.confirm_password) {
            setPasswordError("Las nuevas contraseñas no coinciden");
            return;
        }

        setIsSaving(true);
        const token = localStorage.getItem("token");

        try {
            const response = await fetch(`${backendUrl}/api/users/change-password`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    current_password: passwordData.current_password,
                    new_password: passwordData.new_password
                })
            });

            const data = await response.json();

            if (response.ok) {
                setPasswordSuccess("¡Contraseña actualizada correctamente!");
                setPasswordData({ current_password: "", new_password: "", confirm_password: "" });
            } else {
                setPasswordError(data.error || "Error al actualizar la contraseña");
            }
        } catch (error) {
            setPasswordError("Error de conexión con el servidor");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div>
            {/* Cambio de Contraseña */}
            <div className="card border-0 shadow-sm mb-4">
                <div className="card-body p-4">
                    <h5 className="fw-bold mb-3"><i className="bi bi-key me-2 text-primary"></i> Cambiar Contraseña</h5>
                    
                    {passwordError && <div className="alert alert-danger py-2">{passwordError}</div>}
                    {passwordSuccess && <div className="alert alert-success py-2">{passwordSuccess}</div>}

                    <form onSubmit={handleSavePassword}>
                        <div className="mb-3">
                            <label className="form-label small fw-semibold">Contraseña actual</label>
                            <input 
                                type="password" 
                                className="form-control" 
                                name="current_password"
                                value={passwordData.current_password}
                                onChange={handlePasswordChangeInput}
                                required 
                            />
                        </div>
                        <div className="mb-3">
                            <label className="form-label small fw-semibold">Nueva contraseña</label>
                            <input 
                                type="password" 
                                className="form-control" 
                                name="new_password"
                                value={passwordData.new_password}
                                onChange={handlePasswordChangeInput}
                                required 
                            />
                        </div>
                        <div className="mb-3">
                            <label className="form-label small fw-semibold">Confirmar nueva contraseña</label>
                            <input 
                                type="password" 
                                className="form-control" 
                                name="confirm_password"
                                value={passwordData.confirm_password}
                                onChange={handlePasswordChangeInput}
                                required 
                            />
                        </div>
                        <button type="submit" className="btn btn-primary" disabled={isSaving}>
                            {isSaving ? "Actualizando..." : "Actualizar contraseña"}
                        </button>
                    </form>
                </div>
            </div>

            {/* Privacidad */}
            <div className="card border-0 shadow-sm mb-4">
                <div className="card-body p-4">
                    <h5 className="fw-bold mb-3"><i className="bi bi-eye-slash me-2 text-primary"></i> Opciones de Privacidad</h5>
                    <div className="form-check form-switch py-2">
                        <input 
                            className="form-check-input" 
                            type="checkbox" 
                            id="onlineStatusSwitch"
                            checked={hideOnlineStatus}
                            onChange={(e) => setHideOnlineStatus(e.target.checked)}
                            style={{ transform: "scale(1.2)", marginRight: "10px" }}
                        />
                        <label className="form-check-label fw-semibold" htmlFor="onlineStatusSwitch">
                            Ocultar mi estado "En línea"
                        </label>
                        <div className="form-text">Otros usuarios no podrán ver cuándo estás activo en la plataforma.</div>
                    </div>
                </div>
            </div>
        </div>
    );
};