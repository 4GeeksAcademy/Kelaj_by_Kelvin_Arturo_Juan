import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useGlobalReducer from '../hooks/useGlobalReducer';
import { ProfileSettings } from '../components/Settings/ProfileSettings';
import { SecuritySettings } from '../components/Settings/SecuritySettings';
import { PaymentSettings } from '../components/Settings/PaymentSettings';

const backendUrl = import.meta.env.VITE_BACKEND_URL;

export const Settings = () => {
    const { store, dispatch } = useGlobalReducer();
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState("profile");
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteConfirmation, setDeleteConfirmation] = useState("");
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDeleteAccount = async () => {
        if (deleteConfirmation !== "ELIMINAR") return;
        setIsDeleting(true);
        const token = localStorage.getItem("token");

        try {
            const response = await fetch(`${backendUrl}/api/users/${store.user.id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                localStorage.removeItem("token");
                localStorage.removeItem("user");
                dispatch({ type: "logout" });
                navigate("/");
            }
        } catch (error) {
            console.error("Error de red", error);
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="container py-5" style={{ maxWidth: "800px" }}>
            <h2 className="fw-bold mb-4">Configuración de la Cuenta</h2>

            <div className="row g-4">
                {/* Menú Lateral */}
                <div className="col-md-4">
                    <div className="list-group shadow-sm">
                        <button 
                            className={`list-group-item list-group-item-action ${activeTab === "profile" ? "active" : ""}`}
                            onClick={() => setActiveTab("profile")}
                        >
                            <i className="bi bi-person me-2"></i> Perfil
                        </button>
                        <button 
                            className={`list-group-item list-group-item-action ${activeTab === "security" ? "active" : ""}`}
                            onClick={() => setActiveTab("security")}
                        >
                            <i className="bi bi-shield-lock me-2"></i> Seguridad y Privacidad
                        </button>
                        <button 
                            className={`list-group-item list-group-item-action ${activeTab === "payments" ? "active" : ""}`}
                            onClick={() => setActiveTab("payments")}
                        >
                            <i className="bi bi-wallet2 me-2"></i> Pagos y Cobros
                        </button>
                    </div>
                </div>

                {/* Contenido por Pestañas */}
                <div className="col-md-8">
                    {activeTab === "profile" && (
                        <>
                            <ProfileSettings />

                            <div className="card border-danger shadow-sm mt-4">
                                <div className="card-body p-4">
                                    <h5 className="fw-bold text-danger mb-3">Zona de Peligro</h5>
                                    <p className="text-muted">Una vez que elimines tu cuenta, no hay vuelta atrás.</p>
                                    <button className="btn btn-danger" onClick={() => setShowDeleteModal(true)}>
                                        <i className="bi bi-trash3 me-2"></i> Eliminar mi cuenta
                                    </button>
                                </div>
                            </div>
                        </>
                    )}

                    {activeTab === "security" && <SecuritySettings />}
                    {activeTab === "payments" && <PaymentSettings />}
                </div>
            </div>

            {/* Modal de Borrado Global */}
            {showDeleteModal && (
                <>
                    <div className="modal-backdrop fade show" style={{ zIndex: 1040 }}></div>
                    <div className="modal fade show d-block" tabIndex="-1" style={{ zIndex: 1050 }}>
                        <div className="modal-dialog modal-dialog-centered">
                            <div className="modal-content border-0 shadow-lg">
                                <div className="modal-header bg-danger text-white">
                                    <h5 className="modal-title fw-bold">¿Eliminar cuenta permanentemente?</h5>
                                    <button type="button" className="btn-close btn-close-white" onClick={() => setShowDeleteModal(false)}></button>
                                </div>
                                <div className="modal-body p-4">
                                    <p>Esta acción borrará todos tus datos, servicios y citas programadas. <strong>Esta acción no se puede deshacer.</strong></p>
                                    <div className="mb-3">
                                        <label className="form-label text-muted small">Escribe <strong>ELIMINAR</strong> para confirmar:</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={deleteConfirmation}
                                            onChange={(e) => setDeleteConfirmation(e.target.value)}
                                            placeholder="ELIMINAR"
                                        />
                                    </div>
                                </div>
                                <div className="modal-footer bg-light">
                                    <button type="button" className="btn btn-secondary" onClick={() => setShowDeleteModal(false)}>Cancelar</button>
                                    <button
                                        type="button"
                                        className="btn btn-danger fw-semibold"
                                        disabled={deleteConfirmation !== "ELIMINAR" || isDeleting}
                                        onClick={handleDeleteAccount}
                                    >
                                        {isDeleting ? "Eliminando..." : "Sí, eliminar cuenta"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};