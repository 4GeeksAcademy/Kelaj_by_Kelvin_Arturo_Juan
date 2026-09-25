import React, { useState, useEffect } from 'react';
import { addProviderService, getCategories } from '../../services/userServices';

export const AddServiceModal = ({ show, onClose, onSuccess }) => {
    const [title, setTitle] = useState("");
    const [categoryId, setCategoryId] = useState("");
    const [subcategoryId, setSubcategoryId] = useState("");
    const [price, setPrice] = useState("");
    const [priceType, setPriceType] = useState("hourly");
    const [duration, setDuration] = useState("");
    const [description, setDescription] = useState("");
    
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (show) {
            getCategories().then(data => setCategories(data));
        } else {
            // Limpiar al cerrar
            setTitle(""); setCategoryId(""); setSubcategoryId("");
            setPrice(""); setPriceType("hourly"); setDuration(""); setDescription("");
        }
    }, [show]);

    if (!show) return null;

    const selectedCategory = categories.find(c => c.id === parseInt(categoryId));
    const subcategories = selectedCategory ? selectedCategory.subcategories : [];

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!subcategoryId) {
            alert("Por favor, selecciona una categoría y una especialidad.");
            return;
        }

        setLoading(true);
        const serviceData = {
            title,
            subcategory_id: parseInt(subcategoryId),
            price: parseFloat(price),
            price_type: priceType,
            estimated_duration: duration ? parseInt(duration) : null,
            description
        };

        const success = await addProviderService(serviceData);
        setLoading(false);

        if (success) {
            onSuccess();
        } else {
            alert("Hubo un error al crear el servicio.");
        }
    };

    return (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
            <div className="modal-dialog modal-dialog-centered modal-lg">
                <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
                    <div className="modal-header border-bottom bg-light">
                        <h5 className="modal-title fw-bold">Añadir Nuevo Servicio</h5>
                        <button type="button" className="btn-close" onClick={onClose} disabled={loading}></button>
                    </div>
                    
                    <form onSubmit={handleSubmit}>
                        <div className="modal-body p-4">
                            <div className="mb-3">
                                <label className="form-label fw-semibold">Nombre del Servicio</label>
                                <input 
                                    type="text" 
                                    className="form-control rounded-3" 
                                    placeholder="Ej: Mantenimiento de tuberías residenciales"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    required
                                    disabled={loading}
                                />
                            </div>

                            <div className="row mb-3">
                                <div className="col-md-6 mb-3 mb-md-0">
                                    <label className="form-label fw-semibold">Categoría Principal</label>
                                    <select 
                                        className="form-select rounded-3"
                                        value={categoryId}
                                        onChange={(e) => {
                                            setCategoryId(e.target.value);
                                            setSubcategoryId(""); 
                                        }}
                                        required
                                        disabled={loading}
                                    >
                                        <option value="">Selecciona una categoría...</option>
                                        {categories.map(cat => (
                                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="col-md-6">
                                    <label className="form-label fw-semibold">Especialidad (Subcategoría)</label>
                                    <select 
                                        className="form-select rounded-3"
                                        value={subcategoryId}
                                        onChange={(e) => setSubcategoryId(e.target.value)}
                                        required
                                        disabled={loading || !categoryId}
                                    >
                                        <option value="">Selecciona una especialidad...</option>
                                        {subcategories.map(sub => (
                                            <option key={sub.id} value={sub.id}>{sub.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="row mb-3">
                                <div className="col-md-4 mb-3 mb-md-0">
                                    <label className="form-label fw-semibold">Precio (€)</label>
                                    <input 
                                        type="number" 
                                        step="0.01" min="0"
                                        className="form-control rounded-3" 
                                        placeholder="Ej: 45.00"
                                        value={price}
                                        onChange={(e) => setPrice(e.target.value)}
                                        required
                                        disabled={loading}
                                    />
                                </div>
                                <div className="col-md-4 mb-3 mb-md-0">
                                    <label className="form-label fw-semibold">Tipo de Tarifa</label>
                                    <select 
                                        className="form-select rounded-3"
                                        value={priceType}
                                        onChange={(e) => {
                                            setPriceType(e.target.value);
                                            if (e.target.value === "hourly") setDuration(""); // Limpia si pasa a por hora
                                        }}
                                        disabled={loading}
                                    >
                                        <option value="hourly">Por Hora</option>
                                        <option value="flat">Tarifa Plana (Fijo)</option>
                                    </select>
                                </div>
                                <div className="col-md-4">
                                    <label className="form-label fw-semibold text-muted">Tiempo Estimado</label>
                                    <div className="input-group">
                                        <input 
                                            type="number" min="1"
                                            className="form-control rounded-start-3" 
                                            placeholder={priceType === "hourly" ? "No aplica" : "Opcional"}
                                            value={duration}
                                            onChange={(e) => setDuration(e.target.value)}
                                            disabled={loading || priceType === "hourly"} // <-- Se deshabilita si es por hora
                                        />
                                        <span className="input-group-text rounded-end-3">Min</span>
                                    </div>
                                </div>
                            </div>

                            <div className="mb-2">
                                <label className="form-label fw-semibold">Condiciones y Detalles <span className="text-muted fw-normal">(Opcional)</span></label>
                                <textarea 
                                    className="form-control rounded-3" 
                                    rows="3" 
                                    placeholder="Explica qué incluye este servicio..."
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    disabled={loading}
                                ></textarea>
                            </div>
                        </div>

                        <div className="modal-footer border-top bg-light">
                            <button type="button" className="btn btn-light rounded-pill px-4 fw-semibold border" onClick={onClose} disabled={loading}>Cancelar</button>
                            <button type="submit" className="btn btn-primary rounded-pill px-4 fw-semibold shadow-sm" disabled={loading}>
                                {loading ? <><span className="spinner-border spinner-border-sm me-2"></span>Guardando...</> : "Publicar Servicio"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};