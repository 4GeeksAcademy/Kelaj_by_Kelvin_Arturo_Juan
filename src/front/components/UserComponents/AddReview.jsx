import React, { useState } from 'react';

export const AddReview = ({ show, onClose, appointment, onSubmitReview }) => {
    const [rating, setRating] = useState(0);
    const [hover, setHover] = useState(0);
    const [comment, setComment] = useState('');
    const [media, setMedia] = useState(null);
    const [loading, setLoading] = useState(false);

    if (!show) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (rating === 0) {
            alert("Por favor, selecciona una calificación (estrellas).");
            return;
        }

        setLoading(true);

        // Usamos FormData para poder enviar archivos multimedia al backend
        const formData = new FormData();
        formData.append('appointment_id', appointment?.id);
        formData.append('provider_id', appointment?.provider_id);
        formData.append('rating', rating);
        formData.append('comment', comment);
        
        if (media) {
            formData.append('media', media);
        }

        // Dentro de AddReview.jsx, en la función handleSubmit:
        try {
            // Pasamos tanto formData como appointment
            await onSubmitReview(formData, appointment);
            
            // Limpiamos los campos después de enviar
            setRating(0);
            setComment('');
            setMedia(null);
            onClose();
        } catch (error) {
            console.error("Error al enviar la reseña:", error);
            alert(error.message || "Hubo un error al guardar tu reseña.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
            <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content rounded-4 border-0 shadow">
                    <div className="modal-header border-bottom-0 pb-0">
                        <h5 className="modal-title fw-bold">Califica tu experiencia</h5>
                        <button type="button" className="btn-close" onClick={onClose}></button>
                    </div>
                    <div className="modal-body">
                        <p className="text-muted small mb-4 text-center">
                            ¿Qué te pareció el servicio de <strong>{appointment?.provider_name}</strong> para <em>"{appointment?.service_title}"</em>?
                        </p>
                        
                        <form onSubmit={handleSubmit}>
                            {/* Selector de estrellas interactivo */}
                            <div className="d-flex justify-content-center mb-4">
                                {[...Array(5)].map((_, index) => {
                                    const starValue = index + 1;
                                    return (
                                        <button
                                            type="button"
                                            key={starValue}
                                            className="btn btn-link text-decoration-none p-1"
                                            onClick={() => setRating(starValue)}
                                            onMouseEnter={() => setHover(starValue)}
                                            onMouseLeave={() => setHover(0)}
                                        >
                                            <i 
                                                className={`bi fs-1 ${starValue <= (hover || rating) ? 'bi-star-fill text-warning' : 'bi-star text-muted'}`}
                                                style={{ transition: 'color 0.2s' }}
                                            ></i>
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="mb-3">
                                <label className="form-label fw-semibold">Tu opinión</label>
                                <textarea
                                    className="form-control rounded-3"
                                    rows="3"
                                    placeholder="Cuenta tu experiencia para ayudar a otros usuarios..."
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                ></textarea>
                            </div>

                            <div className="mb-4">
                                <label className="form-label fw-semibold">
                                    <i className="bi bi-camera me-2"></i>Añadir foto o video (Opcional)
                                </label>
                                <input
                                    type="file"
                                    className="form-control rounded-3"
                                    accept="image/*,video/*"
                                    onChange={(e) => setMedia(e.target.files[0])}
                                />
                            </div>

                            <button
                                type="submit"
                                className="btn btn-primary w-100 rounded-pill fw-bold py-2"
                                disabled={loading || rating === 0}
                            >
                                {loading ? <span className="spinner-border spinner-border-sm"></span> : 'Enviar Reseña'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};