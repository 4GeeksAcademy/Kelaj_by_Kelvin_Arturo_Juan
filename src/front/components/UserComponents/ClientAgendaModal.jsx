import React, { useState, useEffect } from 'react';

export const ClientAgendaModal = ({
    show,
    onClose,
    isProvider,
    clientAppointments = [],
    providerAppointments = [],
    onUpdateAppointment,
    onCancelAppointment
}) => {
    const [activeTab, setActiveTab] = useState("client");
    const [editingId, setEditingId] = useState(null);
    const [newDateTime, setNewDateTime] = useState("");

    useEffect(() => {
        if (show) {
            setActiveTab(isProvider ? "provider" : "client");
            setEditingId(null);
        }
    }, [show, isProvider]);

    if (!show) return null;

    const pendingClientApps = clientAppointments.filter(
        app => ["pending", "upcoming", "in_progress"].includes(app.status)
    );

    const pendingProviderApps = providerAppointments.filter(
        app => ["pending", "upcoming", "in_progress"].includes(app.status)
    );

    const currentList = activeTab === "provider" ? pendingProviderApps : pendingClientApps;

    const handleStartEdit = (app) => {
        setEditingId(app.id);
        setNewDateTime(app.date_time ? app.date_time.slice(0, 16) : "");
    };

    const handleSaveEdit = async (appId) => {
        if (!newDateTime) return;
        const success = await onUpdateAppointment(appId, newDateTime);
        if (success) {
            setEditingId(null);
            setNewDateTime("");
        }
    };

    return (
        <>
            <div className="modal-backdrop fade show" style={{ zIndex: 1040 }}></div>
            <div className="modal fade show d-block" tabIndex="-1" style={{ zIndex: 1050 }}>
                <div className="modal-dialog modal-dialog-centered modal-lg">
                    <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
                        <div className="modal-header bg-primary text-white">
                            <h5 className="modal-title fw-bold">
                                <i className="bi bi-calendar-event me-2"></i>Mi Agenda de Citas
                            </h5>
                            <button type="button" className="btn-close btn-close-white" onClick={onClose}></button>
                        </div>

                        {/* Pestañas visibles si el usuario es proveedor */}
                        {isProvider && (
                            <ul className="nav nav-tabs d-flex justify-content-around bg-white pt-2 border-bottom">
                                <li className="nav-item flex-fill text-center">
                                    <button
                                        className={`nav-link w-100 border-0 fw-bold py-3 ${activeTab === "provider" ? "text-primary border-bottom border-primary border-2" : "text-muted"}`}
                                        onClick={() => { setActiveTab("provider"); setEditingId(null); }}
                                    >
                                        <i className="bi bi-briefcase me-2"></i>
                                        Como Proveedor ({pendingProviderApps.length})
                                    </button>
                                </li>
                                <li className="nav-item flex-fill text-center">
                                    <button
                                        className={`nav-link w-100 border-0 fw-bold py-3 ${activeTab === "client" ? "text-primary border-bottom border-primary border-2" : "text-muted"}`}
                                        onClick={() => { setActiveTab("client"); setEditingId(null); }}
                                    >
                                        <i className="bi bi-person me-2"></i>
                                        Como Cliente ({pendingClientApps.length})
                                    </button>
                                </li>
                            </ul>
                        )}

                        <div className="modal-body p-4 bg-light" style={{ maxHeight: "65vh", overflowY: "auto" }}>
                            {currentList.length > 0 ? (
                                currentList.map(app => (
                                    <div key={app.id} className="card border-0 shadow-sm rounded-4 p-3 mb-3 bg-white">
                                        <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
                                            <div>
                                                <h6 className="fw-bold mb-1">{app.service_title}</h6>
                                                <p className="text-muted small mb-2">
                                                    {activeTab === "provider" ? (
                                                        <>Cliente: <span className="text-dark fw-semibold">{app.client_name}</span></>
                                                    ) : (
                                                        <>Profesional: <span className="text-dark fw-semibold">{app.provider_name}</span></>
                                                    )}
                                                </p>

                                                {editingId === app.id ? (
                                                    <div className="d-flex align-items-center gap-2 mt-2 flex-wrap">
                                                        <input
                                                            type="datetime-local"
                                                            className="form-control form-control-sm"
                                                            style={{ width: "auto" }}
                                                            value={newDateTime}
                                                            onChange={(e) => setNewDateTime(e.target.value)}
                                                        />
                                                        <button
                                                            className="btn btn-sm btn-success rounded-pill px-3"
                                                            onClick={() => handleSaveEdit(app.id)}
                                                        >
                                                            Guardar
                                                        </button>
                                                        <button
                                                            className="btn btn-sm btn-light border rounded-pill px-3"
                                                            onClick={() => setEditingId(null)}
                                                        >
                                                            Cancelar
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <span className="badge bg-warning bg-opacity-10 text-dark border border-warning border-opacity-25 rounded-pill px-3 py-1">
                                                        <i className="bi bi-clock me-1"></i>
                                                        {app.date_time ? new Date(app.date_time).toLocaleString() : "Sin fecha"}
                                                    </span>
                                                )}
                                            </div>

                                            {editingId !== app.id && (
                                                <div className="d-flex gap-2">
                                                    <button
                                                        className="btn btn-sm btn-outline-primary rounded-pill px-3 fw-semibold"
                                                        onClick={() => handleStartEdit(app)}
                                                    >
                                                        <i className="bi bi-pencil-square me-1"></i> Modificar
                                                    </button>
                                                    <button
                                                        className="btn btn-sm btn-outline-danger rounded-pill px-3 fw-semibold"
                                                        onClick={() => onCancelAppointment(app.id)}
                                                    >
                                                        <i className="bi bi-trash me-1"></i> Eliminar
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-5 text-muted">
                                    <i className="bi bi-calendar-x fs-1 d-block mb-3 text-light-subtle"></i>
                                    <p className="mb-0">
                                        {activeTab === "provider"
                                            ? "No tienes citas pendientes por atender como proveedor."
                                            : "No tienes citas pendientes contratadas como cliente."}
                                    </p>
                                </div>
                            )}
                        </div>
                        <div className="modal-footer bg-white border-0">
                            <button type="button" className="btn btn-secondary rounded-pill px-4" onClick={onClose}>Cerrar</button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};