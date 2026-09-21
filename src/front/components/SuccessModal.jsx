import React from 'react';

export const SuccessModal = ({ show, onRedirect, title, message, buttonText }) => {
    if (!show) return null;

    return (
        <>
            {/* Fondo oscuro del modal */}
            <div className="modal-backdrop fade show" style={{ zIndex: 1040 }}></div>
            
            {/* Contenedor principal del modal */}
            <div className="modal fade show d-block" tabIndex="-1" style={{ zIndex: 1050 }} role="dialog">
                <div className="modal-dialog modal-dialog-centered">
                    <div className="modal-content rounded-4 border-0 shadow-lg text-center p-4">
                        <div className="modal-body">
                            <div className="text-success mb-3">
                                <i className="bi bi-check-circle-fill" style={{ fontSize: "4rem" }}></i>
                            </div>
                            <h4 className="fw-bold mb-2">{title || "¡Felicidades!"}</h4>
                            <p className="text-muted mb-4">
                                {message || "La operación se ha completado con éxito."}
                            </p>
                            <button 
                                type="button" 
                                className="btn btn-primary px-5 rounded-pill fw-semibold shadow-sm"
                                onClick={onRedirect}
                            >
                                {buttonText || "Continuar"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};