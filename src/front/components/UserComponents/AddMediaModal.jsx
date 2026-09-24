import React, { useState, useEffect } from 'react';
import { uploadGalleryMedia, updateGalleryMedia } from '../../services/userServices';

export const AddMediaModal = ({ show, onClose, onSuccess, postToEdit }) => {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [items, setItems] = useState([]); // Array de { file, preview }
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (postToEdit) {
            setTitle(postToEdit.title || "");
            setDescription(postToEdit.description || "");
            // MODO EDICIÓN: Cargamos las URLs existentes para que se puedan reordenar
            if (postToEdit.urls) {
                setItems(postToEdit.urls.map(url => ({ preview: url })));
            } else {
                setItems([]);
            }
        } else {
            setTitle("");
            setDescription("");
            setItems([]);
        }
    }, [postToEdit, show]);

    if (!show) return null;

    const handleFileChange = (e) => {
        const selectedFiles = Array.from(e.target.files);
        const newItems = selectedFiles.map(file => ({
            file,
            preview: URL.createObjectURL(file) 
        }));
        setItems(prev => [...prev, ...newItems]);
    };

    const moveItem = (index, direction) => {
        const newItems = [...items];
        if (direction === -1 && index > 0) {
            [newItems[index - 1], newItems[index]] = [newItems[index], newItems[index - 1]];
        } else if (direction === 1 && index < newItems.length - 1) {
            [newItems[index + 1], newItems[index]] = [newItems[index], newItems[index + 1]];
        }
        setItems(newItems);
    };

    const removeItem = (index) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (items.length === 0) {
            alert("La publicación debe tener al menos una imagen.");
            return;
        }

        setLoading(true);

        if (postToEdit) {
            // MODO EDICIÓN: Enviamos título, descripción y el nuevo orden de URLs
            const reorderedUrls = items.map(item => item.preview);
            const success = await updateGalleryMedia(postToEdit.id, { 
                title, 
                description,
                urls: reorderedUrls 
            });
            
            setLoading(false);
            if (success) onSuccess();
            else alert("Error al editar la publicación.");
            
        } else {
            // MODO CREACIÓN: Subimos los archivos reales
            const formData = new FormData();
            formData.append("title", title);
            formData.append("description", description);
            items.forEach(item => formData.append("files", item.file));

            const success = await uploadGalleryMedia(formData);
            setLoading(false);
            if (success) onSuccess();
            else alert("Error al subir publicación.");
        }
    };

    return (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
            <div className="modal-dialog modal-dialog-centered modal-lg">
                <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
                    <div className="modal-header border-bottom bg-light">
                        <h5 className="modal-title fw-bold">
                            {postToEdit ? "Editar Publicación" : "Nueva Publicación"}
                        </h5>
                        <button type="button" className="btn-close" onClick={onClose} disabled={loading}></button>
                    </div>
                    <form onSubmit={handleSubmit}>
                        <div className="modal-body p-4">
                            
                            {/* SOLO SE PUEDEN AGREGAR FOTOS NUEVAS AL CREAR */}
                            {!postToEdit && (
                                <div className="mb-4 text-center">
                                    <div className={`border border-2 border-dashed border-primary rounded-4 p-4 position-relative ${loading ? 'bg-light opacity-50' : 'bg-primary bg-opacity-10'}`} style={{ borderStyle: 'dashed' }}>
                                        <i className="bi bi-images fs-1 text-primary"></i>
                                        <p className="mb-0 text-muted small mt-2">Arrastra o haz clic para añadir fotos</p>
                                        <input 
                                            type="file" 
                                            className="position-absolute top-0 start-0 w-100 h-100 opacity-0 cursor-pointer" 
                                            accept="image/*"
                                            multiple 
                                            onChange={handleFileChange}
                                            disabled={loading}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* PREVISUALIZACIÓN Y REORDENAMIENTO (Visible al crear y editar) */}
                            {items.length > 0 && (
                                <div className="mb-4 p-3 bg-light rounded-3 border">
                                    <p className="small fw-bold mb-2 text-start text-muted">Orden de las imágenes (la primera será la portada):</p>
                                    <div className="d-flex gap-3 overflow-auto pb-2">
                                        {items.map((item, idx) => (
                                            <div key={idx} className="position-relative flex-shrink-0" style={{ width: "120px" }}>
                                                {/* Etiqueta Portada */}
                                                {idx === 0 && (
                                                    <span className="badge bg-primary position-absolute top-0 start-50 translate-middle-x mt-1 z-3 shadow-sm">Portada</span>
                                                )}
                                                
                                                <img src={item.preview} alt="preview" className="img-thumbnail w-100 object-fit-cover shadow-sm" style={{ height: "120px" }} />
                                                
                                                {/* Botón Borrar (Solo quitar imagen del array) */}
                                                <button type="button" className="btn btn-sm btn-danger position-absolute top-0 end-0 m-1 rounded-circle" style={{ width: "25px", height: "25px", padding: 0 }} onClick={() => removeItem(idx)}>
                                                    <i className="bi bi-x"></i>
                                                </button>

                                                {/* Flechas de orden */}
                                                <div className="d-flex justify-content-between mt-1">
                                                    <button type="button" className="btn btn-sm btn-outline-secondary py-0 px-2" disabled={idx === 0} onClick={() => moveItem(idx, -1)}>
                                                        <i className="bi bi-chevron-left"></i>
                                                    </button>
                                                    <button type="button" className="btn btn-sm btn-outline-secondary py-0 px-2" disabled={idx === items.length - 1} onClick={() => moveItem(idx, 1)}>
                                                        <i className="bi bi-chevron-right"></i>
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="mb-3">
                                <label className="form-label fw-semibold">Título</label>
                                <input 
                                    type="text"
                                    className="form-control rounded-3" 
                                    placeholder="Ej: Cambio de tuberías en cocina"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    disabled={loading}
                                    required
                                />
                            </div>
                            
                            <div className="mb-3">
                                <label className="form-label fw-semibold">Descripción</label>
                                <textarea 
                                    className="form-control rounded-3" 
                                    rows="4" 
                                    placeholder="Cuenta los detalles..."
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    disabled={loading}
                                ></textarea>
                            </div>
                        </div>
                        <div className="modal-footer border-top bg-light">
                            <button type="button" className="btn btn-light rounded-pill px-4 fw-semibold border" onClick={onClose} disabled={loading}>Cancelar</button>
                            <button type="submit" className="btn btn-primary rounded-pill px-4 fw-semibold shadow-sm" disabled={loading}>
                                {loading ? <><span className="spinner-border spinner-border-sm me-2"></span>Cargando...</> : (postToEdit ? "Guardar Cambios" : "Publicar")}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};