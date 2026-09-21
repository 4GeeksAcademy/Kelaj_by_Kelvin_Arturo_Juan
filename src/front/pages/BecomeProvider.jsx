import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useGlobalReducer from '../hooks/useGlobalReducer';
import { SuccessModal } from '../components/SuccessModal';

const backendUrl = import.meta.env.VITE_BACKEND_URL;

const categoriesData = {
    "Hogar y Mantenimiento": ["Limpieza del hogar", "Bricolaje y reparaciones", "Fontanería", "Jardinería"],
    "Bienestar y Salud": ["Entrenamiento personal", "Fisioterapia a domicilio", "Estética y peluquería"],
    "Clases y Educación": ["Apoyo escolar", "Clases de idiomas", "Música y tutorías"],
    "Tecnología y Soporte": ["Soporte informático", "Diseño gráfico", "Desarrollo web"]
};

// Array con las provincias de España para el select
const provincesList = [
    "Álava", "Albacete", "Alicante", "Almería", "Asturias", "Ávila", "Badajoz", "Barcelona", "Burgos", 
    "Cáceres", "Cádiz", "Cantabria", "Castellón", "Ciudad Real", "Córdoba", "Cuenca", "Girona", "Granada", 
    "Guadalajara", "Gipuzkoa", "Huelva", "Huesca", "Islas Baleares", "Jaén", "La Coruña", "La Rioja", 
    "Las Palmas", "León", "Lleida", "Lugo", "Madrid", "Málaga", "Murcia", "Navarra", "Ourense", "Palencia", 
    "Pontevedra", "Salamanca", "Segovia", "Sevilla", "Soria", "Tarragona", "Santa Cruz de Tenerife", 
    "Teruel", "Toledo", "Valencia", "Valladolid", "Vizcaya", "Zamora", "Zaragoza", "Ceuta", "Melilla"
];

export const BecomeProvider = () => {
    const { store, dispatch } = useGlobalReducer();
    const navigate = useNavigate();
    
    const [formData, setFormData] = useState({
        phone: "",
        bio: "",
        description: "",
        category: "",
        subcategory: "",
        is_home_service: false,
        province: "",      // Nuevo campo
        municipality: "",  // Nuevo campo
        address: ""        // Sede física
    });
    
    const [subcategories, setSubcategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showSuccessModal, setShowSuccessModal] = useState(false); 

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;

        if (name === 'phone') {
            const cleanedValue = value.replace(/[^0-9+]/g, '');
            setFormData({ ...formData, [name]: cleanedValue });
            return;
        }

        setFormData({
            ...formData,
            [name]: type === 'checkbox' ? checked : value
        });
    };

    const handleCategoryChange = (e) => {
        const selectedCategory = e.target.value;
        setFormData({ ...formData, category: selectedCategory, subcategory: "" });
        setSubcategories(categoriesData[selectedCategory] || []);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        
        const token = localStorage.getItem("token");

        // Unimos provincia y municipio para que el backend lo reciba en el campo que ya existe (coverage_area)
        let finalCoverageArea = formData.province;
        if (formData.municipality) {
            finalCoverageArea += ` - ${formData.municipality}`;
        }

        // Construimos el objeto final a enviar
        const payload = {
            phone: formData.phone,
            bio: formData.bio,
            description: formData.description,
            category: formData.category,
            subcategory: formData.subcategory,
            is_home_service: formData.is_home_service,
            coverage_area: finalCoverageArea,
            address: formData.address
        };

        try {
            const response = await fetch(`${backendUrl}/api/become-provider`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Error al registrarse como proveedor");
            }

            const updatedUser = { ...store.user, is_provider: true };
            localStorage.setItem("user", JSON.stringify(updatedUser));
            dispatch({ type: "set_user", payload: { user: updatedUser, token } });

            setShowSuccessModal(true);

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleRedirect = () => {
        setShowSuccessModal(false);
        navigate(`/profile/${store.user.id}`);
    };

    return (
        <div className="container py-5" style={{ maxWidth: "650px" }}>
            <div className="card border-0 shadow-sm rounded-4 p-4 p-md-5 bg-white position-relative">
                
                {loading && (
                    <div className="position-absolute top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center bg-white bg-opacity-75" style={{ zIndex: 10, borderRadius: "inherit" }}>
                        <div className="spinner-border text-primary" role="status"></div>
                    </div>
                )}

                <div className="text-center mb-4">
                    <div className="bg-primary bg-opacity-10 text-primary rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{ width: "60px", height: "60px", fontSize: "24px" }}>
                        <i className="bi bi-rocket-takeoff-fill"></i>
                    </div>
                    <h3 className="fw-bold">Conviértete en Proveedor</h3>
                    <p className="text-muted small">Completa tu perfil profesional para empezar a ofrecer servicios en Kelaj.</p>
                </div>

                {error && <div className="alert alert-danger">{error}</div>}
                
                <form onSubmit={handleSubmit}>
                    
                    <div className="mb-3">
                        <label className="form-label fw-semibold">Teléfono de contacto</label>
                        <input 
                            type="tel" 
                            className="form-control" 
                            name="phone"
                            placeholder="Ej. +34 600 000 000"
                            value={formData.phone}
                            onChange={handleChange}
                            required 
                        />
                    </div>

                    <div className="row">
                        <div className="col-md-6 mb-3">
                            <label className="form-label fw-semibold">Categoría principal</label>
                            <select 
                                className="form-select" 
                                name="category"
                                value={formData.category}
                                onChange={handleCategoryChange}
                                required
                            >
                                <option value="">Selecciona...</option>
                                {Object.keys(categoriesData).map((cat) => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>

                        <div className="col-md-6 mb-3">
                            <label className="form-label fw-semibold">Especialidad</label>
                            <select 
                                className="form-select" 
                                name="subcategory"
                                value={formData.subcategory}
                                onChange={handleChange}
                                disabled={!formData.category}
                                required
                            >
                                <option value="">Selecciona...</option>
                                {subcategories.map((sub) => (
                                    <option key={sub} value={sub}>{sub}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="mb-3">
                        <label className="form-label fw-semibold">Biografía corta</label>
                        <input 
                            type="text" 
                            className="form-control" 
                            name="bio"
                            placeholder="Ej. Profesional con más de 5 años de experiencia"
                            value={formData.bio}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="mb-3">
                        <label className="form-label fw-semibold">Descripción detallada</label>
                        <textarea 
                            className="form-control" 
                            name="description"
                            rows="3"
                            placeholder="Cuenta un poco más sobre tu experiencia y cómo trabajas..."
                            value={formData.description}
                            onChange={handleChange}
                        ></textarea>
                    </div>

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

                    {/* SECCIÓN DE DIRECCIÓN Y COBERTURA MODIFICADA */}
                    {formData.is_home_service && (
                        <div className="border border-primary border-opacity-25 bg-primary bg-opacity-10 p-4 rounded-4 mb-4">
                            <h6 className="fw-bold text-primary mb-3">
                                <i className="bi bi-geo-alt-fill me-1"></i> Área de Servicio y Ubicación
                            </h6>
                            
                            <div className="row">
                                <div className="col-md-6 mb-3">
                                    <label className="form-label fw-semibold">Provincia <span className="text-danger">*</span></label>
                                    <select 
                                        className="form-select" 
                                        name="province"
                                        value={formData.province}
                                        onChange={handleChange}
                                        required={formData.is_home_service}
                                    >
                                        <option value="">Selecciona provincia...</option>
                                        {provincesList.map((prov) => (
                                            <option key={prov} value={prov}>{prov}</option>
                                        ))}
                                    </select>
                                </div>
                                
                                <div className="col-md-6 mb-3">
                                    <label className="form-label fw-semibold">Municipio (Opcional)</label>
                                    <input 
                                        type="text" 
                                        className="form-control" 
                                        name="municipality"
                                        placeholder="Ej. Collado Villalba y alrededores..."
                                        value={formData.municipality}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>

                            <div className="mb-0">
                                <label className="form-label fw-semibold">Sede física o local (Opcional)</label>
                                <input 
                                    type="text" 
                                    className="form-control" 
                                    name="address"
                                    placeholder="Ej. Calle Real 12, Local 3..."
                                    value={formData.address}
                                    onChange={handleChange}
                                />
                                <div className="form-text">Si los clientes pueden visitar tu local, añade la dirección completa.</div>
                            </div>
                        </div>
                    )}

                    <button type="submit" className="btn btn-primary w-100 py-2 fw-semibold rounded-pill shadow-sm">
                        Completar registro
                    </button>
                </form>
            </div>

            <SuccessModal 
                show={showSuccessModal} 
                onRedirect={handleRedirect}
                title="¡Felicidades!"
                message="Tu perfil de proveedor se ha creado exitosamente. Ahora puedes comenzar a publicar tus servicios en Kelaj."
                buttonText="Ir a mi Perfil"
            />
        </div>
    );
};