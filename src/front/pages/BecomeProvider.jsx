import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const backendUrl = import.meta.env.VITE_BACKEND_URL;

export const BecomeProvider = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        phone: "",
        bio: "",
        description: "",
        is_home_service: false, // Inicia en falso
        coverage_area: "",
        address: ""
    });

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem("token");

        try {
            const response = await fetch(`${backendUrl}/api/become-provider`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                // Redirigir al panel o perfil tras convertirse en proveedor exitosamente
                navigate("/provider/dashboard");
            } else {
                console.error("Error al registrarse como proveedor");
            }
        } catch (error) {
            console.error("Error de red", error);
        }
    };

    return (
        <div className="container py-5" style={{ maxWidth: "600px" }}>
            <div className="card border-0 shadow-sm rounded-4 p-4">
                <h3 className="fw-bold mb-4 text-center">Ofrece tus servicios en Kelaj</h3>
                
                <form onSubmit={handleSubmit}>
                    {/* Teléfono */}
                    <div className="mb-3">
                        <label className="form-label fw-semibold">Teléfono de contacto</label>
                        <input 
                            type="text" 
                            className="form-control" 
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            required 
                        />
                    </div>

                    {/* Biografía */}
                    <div className="mb-3">
                        <label className="form-label fw-semibold">Biografía corta</label>
                        <input 
                            type="text" 
                            className="form-control" 
                            name="bio"
                            placeholder="Ej. Especialista en reparaciones y mantenimiento"
                            value={formData.bio}
                            onChange={handleChange}
                        />
                    </div>

                    {/* Descripción detallada */}
                    <div className="mb-3">
                        <label className="form-label fw-semibold">Descripción de tu experiencia</label>
                        <textarea 
                            className="form-control" 
                            name="description"
                            rows="3"
                            value={formData.description}
                            onChange={handleChange}
                        ></textarea>
                    </div>

                    {/* INTERRUPTOR / CHECKBOX PARA SERVICIO A DOMICILIO */}
                    <div className="form-check form-switch mb-4 p-3 bg-light rounded-3 border">
                        <input 
                            className="form-check-input ms-0 me-2" 
                            type="checkbox" 
                            id="isHomeServiceCheck" 
                            name="is_home_service"
                            checked={formData.is_home_service}
                            onChange={handleChange}
                            style={{ transform: "scale(1.2)" }}
                        />
                        <label className="form-check-label fw-semibold text-dark cursor-pointer" htmlFor="isHomeServiceCheck">
                            <i className="bi bi-house-door-fill text-primary me-2"></i> ¿Ofreces servicio a domicilio?
                        </label>
                    </div>

                    {/* OPCIONES CONDICIONALES SI ES TRUE */}
                    {formData.is_home_service && (
                        <div className="border border-primary border-opacity-25 bg-primary bg-opacity-10 p-4 rounded-4 mb-4">
                            <h6 className="fw-bold text-primary mb-3">
                                <i className="bi bi-geo-alt-fill me-1"></i> Detalles de Desplazamiento
                            </h6>

                            <div className="mb-3">
                                <label className="form-label fw-semibold">Área de cobertura</label>
                                <input 
                                    type="text" 
                                    className="form-control" 
                                    name="coverage_area"
                                    placeholder="Ej. Madrid centro, Collado Villalba..."
                                    value={formData.coverage_area}
                                    onChange={handleChange}
                                    required={formData.is_home_service}
                                />
                            </div>

                            <div className="mb-0">
                                <label className="form-label fw-semibold">Dirección base o punto de partida (Opcional)</label>
                                <input 
                                    type="text" 
                                    className="form-control" 
                                    name="address"
                                    placeholder="Calle, número, ciudad..."
                                    value={formData.address}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>
                    )}

                    <button type="submit" className="btn btn-primary w-100 py-2 fw-semibold rounded-pill">
                        Completar registro como Proveedor
                    </button>
                </form>
            </div>
        </div>
    );
};