import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useGlobalReducer from '../hooks/useGlobalReducer';
import { SuccessModal } from '../components/SuccessModal';
import {
    registerProvider,
    addProviderService,
    updateSchedule,
    getCategories
} from '../services/userServices';

const provincesList = [
    "Álava", "Albacete", "Alicante", "Almería", "Asturias", "Ávila", "Badajoz", "Barcelona", "Burgos",
    "Cáceres", "Cádiz", "Cantabria", "Castellón", "Ciudad Real", "Córdoba", "Cuenca", "Girona", "Granada",
    "Guadalajara", "Gipuzkoa", "Huelva", "Huesca", "Islas Baleares", "Jaén", "La Coruña", "La Rioja",
    "Las Palmas", "León", "Lleida", "Lugo", "Madrid", "Málaga", "Murcia", "Navarra", "Ourense", "Palencia",
    "Pontevedra", "Salamanca", "Segovia", "Sevilla", "Soria", "Tarragona", "Santa Cruz de Tenerife",
    "Teruel", "Toledo", "Valencia", "Valladolid", "Vizcaya", "Zamora", "Zaragoza", "Ceuta", "Melilla"
];

const DAYS_OF_WEEK = [
    { id: 1, label: "Lunes" },
    { id: 2, label: "Martes" },
    { id: 3, label: "Miércoles" },
    { id: 4, label: "Jueves" },
    { id: 5, label: "Viernes" },
    { id: 6, label: "Sábado" },
    { id: 7, label: "Domingo" }
];

export const BecomeProvider = () => {
    const { store, dispatch } = useGlobalReducer();
    const navigate = useNavigate();

    // Control de pasos (Paso 1 es la cuenta ya creada, empezamos en el Paso 2)
    const [step, setStep] = useState(2);
    const [profileCreated, setProfileCreated] = useState(false);

    // Estados del Paso 2: Perfil Profesional
    const [formData, setFormData] = useState({
        phone: "",
        bio: "",
        description: "",
        is_home_service: false,
        province: "",
        municipality: "",
        address: ""
    });

    // Estados del Paso 3 (Parte A): Primer Servicio
    const [categories, setCategories] = useState([]);
    const [title, setTitle] = useState("");
    const [categoryId, setCategoryId] = useState("");
    const [subcategoryId, setSubcategoryId] = useState("");
    const [price, setPrice] = useState("");
    const [priceType, setPriceType] = useState("hourly");
    const [duration, setDuration] = useState("");
    const [serviceDescription, setServiceDescription] = useState("");

    // Estados del Paso 3 (Parte B): Horario y Disponibilidad
    const [selectedDays, setSelectedDays] = useState([1, 2, 3, 4, 5]);
    const [startTime, setStartTime] = useState("09:00");
    const [endTime, setEndTime] = useState("18:00");
    const [appointmentGap, setAppointmentGap] = useState("60");

    // Estados de UI
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showSuccessModal, setShowSuccessModal] = useState(false);

    useEffect(() => {
        getCategories().then(data => setCategories(data || []));
    }, []);

    const selectedCategory = categories.find(c => c.id === parseInt(categoryId));
    const subcategories = selectedCategory ? selectedCategory.subcategories : [];

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

    const toggleDay = (id) => {
        if (selectedDays.includes(id)) {
            setSelectedDays(selectedDays.filter(dayId => dayId !== id));
        } else {
            setSelectedDays([...selectedDays, id].sort());
        }
    };

    // Avanzar del Paso 2 al Paso 3
    const handleNextStep = (e) => {
        e.preventDefault();
        setError(null);
        setStep(3);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Envío final en el Paso 3 (Crea Perfil + Primer Servicio + Horario)
    const handleFinalSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        if (!subcategoryId) {
            setError("Por favor, selecciona una categoría y una especialidad para tu servicio.");
            return;
        }

        if (selectedDays.length === 0) {
            setError("Debes seleccionar al menos un día de trabajo en tu horario.");
            return;
        }

        setLoading(true);

        let finalCoverageArea = formData.province;
        if (formData.municipality) {
            finalCoverageArea += ` - ${formData.municipality}`;
        }

        const providerPayload = {
            phone: formData.phone,
            bio: formData.bio,
            description: formData.description,
            is_home_service: formData.is_home_service,
            coverage_area: finalCoverageArea,
            address: formData.address
        };

        const servicePayload = {
            title,
            subcategory_id: parseInt(subcategoryId),
            price: parseFloat(price),
            price_type: priceType,
            estimated_duration: duration ? parseInt(duration) : null,
            description: serviceDescription
        };

        const schedulePayload = {
            days: selectedDays,
            startTime,
            endTime,
            gapMinutes: parseInt(appointmentGap)
        };

        try {
            // 1. Crear perfil de proveedor (evita duplicar si se reintenta)
            if (!profileCreated && !store.user?.is_provider) {
                await registerProvider(providerPayload);
                setProfileCreated(true);
            }

            // 2. Crear el primer servicio
            const serviceSuccess = await addProviderService(servicePayload);
            if (!serviceSuccess) {
                throw new Error("No se pudo guardar tu primer servicio. Revisa los datos e inténtalo de nuevo.");
            }

            // 3. Configurar el horario
            const scheduleSuccess = await updateSchedule(schedulePayload);
            if (!scheduleSuccess) {
                throw new Error("No se pudo guardar tu horario. Inténtalo de nuevo.");
            }

            // 4. Actualizar sesión global como proveedor
            const token = localStorage.getItem("token");
            const updatedUser = { ...store.user, is_provider: true };
            localStorage.setItem("user", JSON.stringify(updatedUser));
            dispatch({ type: "set_user", payload: { user: updatedUser, token } });

            setShowSuccessModal(true);

        } catch (err) {
            setError(err.message || "Ocurrió un error al completar el alta de proveedor.");
        } finally {
            setLoading(false);
        }
    };

    const handleRedirect = () => {
        setShowSuccessModal(false);
        navigate(`/profile/${store.user?.id || ''}`);
    };

    return (
        <div className="container py-5 hv-100" style={{ maxWidth: "800px" }}>
            <div className="card border-0 shadow-sm rounded-4 p-4 p-md-5 bg-white bg-opacity-50 position-relative">

                {loading && (
                    <div className="position-absolute top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center bg-white bg-opacity-75" style={{ zIndex: 10, borderRadius: "inherit" }}>
                        <div className="spinner-border text-primary" role="status"></div>
                    </div>
                )}

                {/* INDICADOR DE 3 PASOS */}
                <div className="text-center mb-4">
                    <h3 className="fw-bold">
                        {step === 2 ? "Configura tu Perfil Profesional" : "Tu Primer Servicio y Horario"}
                    </h3>
                    <p className="text-muted small">
                        {step === 2
                            ? "Cuéntales a tus futuros clientes quién eres y dónde trabajas."
                            : "Publica tu primer servicio y define tu disponibilidad para finalizar el alta."}
                    </p>
                </div>
                <div className="d-flex justify-content-between align-items-center mb-4 px-2 px-md-5">
                    <div className="text-center">
                        <div className="rounded-circle bg-success text-white d-inline-flex align-items-center justify-content-center fw-bold shadow-sm" style={{ width: "36px", height: "36px" }}>
                            <i className="bi bi-check-lg"></i>
                        </div>
                    </div>

                    <div className={`flex-grow-1 mx-2 border-top border-2 ${step >= 2 ? 'border-primary' : 'border-secondary-subtle'}`}></div>

                    <div className="text-center">
                        <div className={`rounded-circle d-inline-flex align-items-center justify-content-center fw-bold shadow-sm ${step === 2 ? 'bg-primary text-white' : 'bg-success text-white'}`} style={{ width: "36px", height: "36px" }}>
                            {step > 2 ? <i className="bi bi-check-lg"></i> : "2"}
                        </div>
                    </div>

                    <div className={`flex-grow-1 mx-2 border-top border-2 ${step === 3 ? 'border-primary' : 'border-secondary-subtle'}`}></div>

                    <div className="text-center">
                        <div className={`rounded-circle d-inline-flex align-items-center justify-content-center fw-bold shadow-sm ${step === 3 ? 'bg-primary text-white' : 'bg-light text-muted border'}`} style={{ width: "36px", height: "36px" }}>
                            3
                        </div>
                    </div>
                </div>


                {error && <div className="alert alert-danger rounded-3">{error}</div>}

                {/* ==========================================
                    PASO 2: DATOS DEL PERFIL PROFESIONAL
                ========================================== */}
                {step === 2 && (
                    <form onSubmit={handleNextStep}>
                        <div className="mb-3">
                            <label className="form-label fw-semibold">Teléfono de contacto</label>
                            <input
                                type="tel"
                                className="form-control rounded-pill"
                                name="phone"
                                placeholder="Ej. +34 600 000 000"
                                value={formData.phone}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="mb-3">
                            <label className="form-label fw-semibold">Biografía corta</label>
                            <input
                                type="text"
                                className="form-control rounded-pill"
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
                                className="form-control rounded-3"
                                name="description"
                                rows="3"
                                placeholder="Cuenta un poco más sobre tu experiencia y cómo trabajas..."
                                value={formData.description}
                                onChange={handleChange}
                            ></textarea>
                        </div>

                        <style>{`
                            /* Tamaño en Móvil */
                            .home-service-switch {
                                width: 2.4em !important;
                                height: 1.25em !important;
                                cursor: pointer;
                            }
                            /* Tamaño en PC (pantallas medianas y grandes) */
                            @media (min-width: 768px) {
                                .home-service-switch {
                                    width: 3em !important;
                                    height: 1.5em !important;
                                }
                            }
                        `}</style>

                        <div className="form-check form-switch mb-4 p-3 bg-light rounded-3 border d-flex align-items-center gap-3">
                            <input
                                className="form-check-input m-0 flex-shrink-0 home-service-switch"
                                type="checkbox"
                                id="isHomeServiceCheck"
                                name="is_home_service"
                                checked={formData.is_home_service}
                                onChange={handleChange}
                            />
                            <label className="form-check-label fw-semibold text-dark cursor-pointer mb-0" htmlFor="isHomeServiceCheck">
                                <i className="bi bi-house-door-fill text-primary me-2"></i> ¿Ofreces servicio a domicilio?
                            </label>
                        </div>

                        {formData.is_home_service && (
                            <div className="border border-primary border-opacity-25 bg-primary bg-opacity-10 p-4 rounded-4 mb-4">
                                <h6 className="fw-bold text-primary mb-3">
                                    <i className="bi bi-geo-alt-fill me-1"></i> Área de Servicio y Ubicación
                                </h6>

                                <div className="row">
                                    <div className="col-md-6 mb-3">
                                        <label className="form-label fw-semibold">Provincia <span className="text-danger">*</span></label>
                                        <select
                                            className="form-select rounded-pill"
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
                                        <label className="form-label fw-semibold">Municipio o ciudad (Opcional)</label>
                                        <input
                                            type="text"
                                            className="form-control rounded-pill"
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
                                        className="form-control rounded-pill"
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
                            Siguiente paso <i className="bi bi-arrow-right ms-1"></i>
                        </button>
                    </form>
                )}

                {/* ==========================================
                    PASO 3: PRIMER SERVICIO Y HORARIO
                ========================================== */}
                {step === 3 && (
                    <form onSubmit={handleFinalSubmit}>
                        {/* SECCIÓN 1: PRIMER SERVICIO */}
                        <div className="p-4 bg-light rounded-4 border mb-4">
                            <h5 className="fw-bold mb-3 text-primary">
                                <i className="bi bi-briefcase-fill me-2"></i>1. Añade tu primer servicio
                            </h5>

                            <div className="mb-3">
                                <label className="form-label fw-semibold">Nombre del Servicio</label>
                                <input
                                    type="text"
                                    className="form-control rounded-3"
                                    placeholder="Ej: Mantenimiento de tuberías residenciales"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    required
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
                                        disabled={!categoryId}
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
                                        step="0.01"
                                        min="0"
                                        className="form-control rounded-3"
                                        placeholder="Ej: 45.00"
                                        value={price}
                                        onChange={(e) => setPrice(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="col-md-4 mb-3 mb-md-0">
                                    <label className="form-label fw-semibold">Tipo de Tarifa</label>
                                    <select
                                        className="form-select rounded-3"
                                        value={priceType}
                                        onChange={(e) => {
                                            setPriceType(e.target.value);
                                            if (e.target.value === "hourly") setDuration("");
                                        }}
                                    >
                                        <option value="hourly">Por Hora</option>
                                        <option value="flat">Tarifa Plana (Fijo)</option>
                                    </select>
                                </div>
                                <div className="col-md-4">
                                    <label className="form-label fw-semibold text-muted">Tiempo Estimado</label>
                                    <div className="input-group">
                                        <input
                                            type="number"
                                            min="1"
                                            className="form-control rounded-start-3"
                                            placeholder={priceType === "hourly" ? "No aplica" : "Opcional"}
                                            value={duration}
                                            onChange={(e) => setDuration(e.target.value)}
                                            disabled={priceType === "hourly"}
                                        />
                                        <span className="input-group-text rounded-end-3">Min</span>
                                    </div>
                                </div>
                            </div>

                            <div className="mb-0">
                                <label className="form-label fw-semibold">
                                    Condiciones y Detalles <span className="text-muted fw-normal">(Opcional)</span>
                                </label>
                                <textarea
                                    className="form-control rounded-3"
                                    rows="2"
                                    placeholder="Explica qué incluye este servicio..."
                                    value={serviceDescription}
                                    onChange={(e) => setServiceDescription(e.target.value)}
                                ></textarea>
                            </div>
                        </div>

                        {/* SECCIÓN 2: HORARIO Y DISPONIBILIDAD */}
                        <div className="p-4 bg-light rounded-4 border mb-4">
                            <h5 className="fw-bold mb-3 text-primary">
                                <i className="bi bi-clock-fill me-2"></i>2. Configura tu horario
                            </h5>

                            <div className="mb-4">
                                <label className="form-label fw-semibold">Días de Trabajo</label>
                                <div className="d-flex flex-wrap gap-2">
                                    {DAYS_OF_WEEK.map(day => (
                                        <button
                                            key={day.id}
                                            type="button"
                                            onClick={() => toggleDay(day.id)}
                                            className={`btn btn-sm rounded-pill px-3 fw-semibold ${selectedDays.includes(day.id) ? 'btn-primary shadow-sm' : 'btn-outline-secondary'}`}
                                        >
                                            {day.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="row mb-3">
                                <div className="col-md-4 mb-3 mb-md-0">
                                    <label className="form-label fw-semibold">Hora de Inicio</label>
                                    <input
                                        type="time"
                                        className="form-control rounded-pill"
                                        value={startTime}
                                        onChange={(e) => setStartTime(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="col-md-4 mb-3 mb-md-0">
                                    <label className="form-label fw-semibold">Hora de Fin</label>
                                    <input
                                        type="time"
                                        className="form-control rounded-pill"
                                        value={endTime}
                                        onChange={(e) => setEndTime(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="col-md-4">
                                    <label className="form-label fw-semibold">Espacio entre citas</label>
                                    <select
                                        className="form-select rounded-pill"
                                        value={appointmentGap}
                                        onChange={(e) => setAppointmentGap(e.target.value)}
                                    >
                                        <option value="30">30 Minutos</option>
                                        <option value="45">45 Minutos</option>
                                        <option value="60">1 Hora (60 min)</option>
                                        <option value="90">1 Hora y 30 Min</option>
                                        <option value="120">2 Horas (120 min)</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* BOTONES DE NAVEGACIÓN DEL PASO 3 */}
                        <div className="d-flex gap-3">
                            <button
                                type="button"
                                className="btn btn-light border w-50 py-2 fw-semibold rounded-pill"
                                onClick={() => setStep(2)}
                                disabled={loading}
                            >
                                <i className="bi bi-arrow-left me-1"></i> Volver atrás
                            </button>
                            <button
                                type="submit"
                                className="btn btn-primary w-50 py-2 fw-semibold rounded-pill shadow-sm"
                                disabled={loading}
                            >
                                Completar registro
                            </button>
                        </div>
                    </form>
                )}
            </div>

            <SuccessModal
                show={showSuccessModal}
                onRedirect={handleRedirect}
                title="¡Felicidades!"
                message="Tu perfil profesional, tu primer servicio y tu horario se han configurado exitosamente en Kelaj."
                buttonText="Ir a mi Perfil"
            />
        </div>
    );
};