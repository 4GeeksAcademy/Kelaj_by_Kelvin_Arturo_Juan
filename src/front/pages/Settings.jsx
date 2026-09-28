import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useGlobalReducer from '../hooks/useGlobalReducer';
import { ProfileSettings } from '../components/Settings/ProfileSettings';
import { SecuritySettings } from '../components/Settings/SecuritySettings';
import { PaymentSettings } from '../components/Settings/PaymentSettings';
import { deleteAccount, downgradeProvider } from '../services/userServices';

export const Settings = () => {
    const { store, dispatch } = useGlobalReducer();
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState("profile");

    // Estados para eliminar cuenta completa
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteConfirmation, setDeleteConfirmation] = useState("");
    const [isDeleting, setIsDeleting] = useState(false);

    // Estados para darse de baja como proveedor
    const [showDowngradeModal, setShowDowngradeModal] = useState(false);
    const [downgradeConfirmation, setDowngradeConfirmation] = useState("");
    const [isDowngrading, setIsDowngrading] = useState(false);

    const handleDeleteAccount = async () => {
        if (deleteConfirmation !== "ELIMINAR") return;
        setIsDeleting(true);

        try {
            await deleteAccount(store.user.id);

            localStorage.removeItem("token");
            localStorage.removeItem("user");
            dispatch({ type: "logout" });
            navigate("/");
        } catch (error) {
            console.error("Error al eliminar cuenta:", error);
            alert(error.message || "No se pudo eliminar la cuenta");
        } finally {
            setIsDeleting(false);
            setShowDeleteModal(false);
        }
    };

    const handleDowngradeProvider = async () => {
        if (downgradeConfirmation !== "BAJA") return;
        setIsDowngrading(true);

        try {
            const data = await downgradeProvider(store.user.id);
            const token = localStorage.getItem("token");
            const updatedUser = data.user || { ...store.user, is_provider: false, role: "buyer", providerprofile: null };

            localStorage.setItem("user", JSON.stringify(updatedUser));
            dispatch({ type: "set_user", payload: { user: updatedUser, token } });

            alert(data.message || "Te has dado de baja como proveedor exitosamente.");
            setDowngradeConfirmation("");
        } catch (error) {
            console.error("Error al dar de baja como proveedor:", error);
            alert(error.message || "No se pudo dar de baja el perfil de proveedor");
        } finally {
            setIsDowngrading(false);
            setShowDowngradeModal(false);
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

                                    {store.user?.is_provider && (
                                        <div className="mb-4 pb-4 border-bottom">
                                            <h6 className="fw-semibold mb-1">Darse de baja como proveedor</h6>
                                            <p className="text-muted small mb-3">
                                                Se eliminarán todos tus servicios, horarios, portafolio y reseñas recibidas, pero conservarás tu cuenta como cliente. Solo disponible si no tienes citas pendientes.
                                            </p>
                                            <button 
                                                className="btn btn-outline-danger" 
                                                onClick={() => setShowDowngradeModal(true)}
                                            >
                                                <i className="bi bi-person-dash me-2"></i> Dar de baja perfil de proveedor
                                            </button>
                                        </div>
                                    )}

                                    <div>
                                        <h6 className="fw-semibold mb-1">Eliminar cuenta permanentemente</h6>
                                        <p className="text-muted small mb-3">
                                            Una vez que elimines tu cuenta, se borrarán todos tus datos y no habrá vuelta atrás.
                                        </p>
                                        <button className="btn btn-danger" onClick={() => setShowDeleteModal(true)}>
                                            <i className="bi bi-trash3 me-2"></i> Eliminar mi cuenta
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {activeTab === "security" && <SecuritySettings />}
                    {activeTab === "payments" && <PaymentSettings />}
                </div>
            </div>

            {/* Modal de Baja de Proveedor */}
            {showDowngradeModal && (
                <>
                    <div className="modal-backdrop fade show" style={{ zIndex: 1040 }}></div>
                    <div className="modal fade show d-block" tabIndex="-1" style={{ zIndex: 1050 }}>
                        <div className="modal-dialog modal-dialog-centered">
                            <div className="modal-content border-0 shadow-lg">
                                <div className="modal-header bg-warning text-dark">
                                    <h5 className="modal-title fw-bold">¿Darse de baja como proveedor?</h5>
                                    <button type="button" className="btn-close" onClick={() => setShowDowngradeModal(false)}></button>
                                </div>
                                <div className="modal-body p-4">
                                    <p>
                                        Esta acción borrará todos tus <strong>servicios publicados, horarios, galería de trabajos y reseñas</strong> de proveedor. Seguirás teniendo acceso a tu cuenta como cliente.
                                    </p>
                                    <p className="text-danger small mb-3">
                                        <strong>Nota:</strong> No debes tener citas pendientes ni como proveedor ni como cliente para poder realizar esta acción.
                                    </p>
                                    <div className="mb-3">
                                        <label className="form-label text-muted small">Escribe <strong>BAJA</strong> para confirmar:</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={downgradeConfirmation}
                                            onChange={(e) => setDowngradeConfirmation(e.target.value)}
                                            placeholder="BAJA"
                                        />
                                    </div>
                                </div>
                                <div className="modal-footer bg-light">
                                    <button type="button" className="btn btn-secondary" onClick={() => setShowDowngradeModal(false)}>Cancelar</button>
                                    <button
                                        type="button"
                                        className="btn btn-danger fw-semibold"
                                        disabled={downgradeConfirmation !== "BAJA" || isDowngrading}
                                        onClick={handleDowngradeProvider}
                                    >
                                        {isDowngrading ? "Procesando..." : "Sí, darme de baja"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}

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