import React, { useState, useEffect } from 'react';
import { updateSchedule } from '../../services/userServices';

const DAYS_OF_WEEK = [
    { id: 1, label: "Lunes" },
    { id: 2, label: "Martes" },
    { id: 3, label: "Miércoles" },
    { id: 4, label: "Jueves" },
    { id: 5, label: "Viernes" },
    { id: 6, label: "Sábado" },
    { id: 7, label: "Domingo" }
];

export const EditScheduleModal = ({ show, onClose, onSuccess, providerData }) => {
    const [selectedDays, setSelectedDays] = useState([]);
    const [startTime, setStartTime] = useState("09:00");
    const [endTime, setEndTime] = useState("18:00");
    const [appointmentGap, setAppointmentGap] = useState("60"); 
    const [loading, setLoading] = useState(false);

    // Rellenamos el modal con los datos actuales de la base de datos
    useEffect(() => {
        if (show && providerData) {
            setStartTime(providerData.start_time || "09:00");
            setEndTime(providerData.end_time || "18:00");
            
            if (providerData.availabilities && providerData.availabilities.length > 0) {
                const days = providerData.availabilities.map(a => a.day_of_week);
                setSelectedDays(days);
            } else {
                setSelectedDays([1, 2, 3, 4, 5]); // Lunes a Viernes por defecto
            }
        }
    }, [show, providerData]);

    if (!show) return null;

    const toggleDay = (id) => {
        if (selectedDays.includes(id)) {
            setSelectedDays(selectedDays.filter(dayId => dayId !== id));
        } else {
            setSelectedDays([...selectedDays, id].sort());
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (selectedDays.length === 0) {
            alert("Debes seleccionar al menos un día de trabajo.");
            return;
        }

        setLoading(true);
        const scheduleData = {
            days: selectedDays,
            startTime,
            endTime,
            gapMinutes: parseInt(appointmentGap)
        };

        const success = await updateSchedule(scheduleData);
        setLoading(false);

        if (success) {
            onSuccess();
        } else {
            alert("Hubo un error al guardar el horario.");
        }
    };

    return (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
            <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
                    <div className="modal-header border-bottom bg-light">
                        <h5 className="modal-title fw-bold">Configurar Disponibilidad</h5>
                        <button type="button" className="btn-close" onClick={onClose} disabled={loading}></button>
                    </div>
                    
                    <form onSubmit={handleSubmit}>
                        <div className="modal-body p-4">
                            
                            <div className="mb-4">
                                <label className="form-label fw-semibold">Días de Trabajo</label>
                                <div className="d-flex flex-wrap gap-2">
                                    {DAYS_OF_WEEK.map(day => (
                                        <button 
                                            key={day.id} 
                                            type="button"
                                            disabled={loading}
                                            onClick={() => toggleDay(day.id)}
                                            className={`btn btn-sm rounded-pill px-3 fw-semibold transition-all ${selectedDays.includes(day.id) ? 'btn-primary shadow-sm' : 'btn-outline-secondary'}`}
                                        >
                                            {day.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="row mb-4">
                                <div className="col-6">
                                    <label className="form-label fw-semibold">Hora de Inicio</label>
                                    <input 
                                        type="time" 
                                        className="form-control rounded-pill" 
                                        value={startTime}
                                        onChange={(e) => setStartTime(e.target.value)}
                                        disabled={loading}
                                        required
                                    />
                                </div>
                                <div className="col-6">
                                    <label className="form-label fw-semibold">Hora de Fin</label>
                                    <input 
                                        type="time" 
                                        className="form-control rounded-pill" 
                                        value={endTime}
                                        onChange={(e) => setEndTime(e.target.value)}
                                        disabled={loading}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="mb-3">
                                <label className="form-label fw-semibold">Espacio entre citas (Duración)</label>
                                <select 
                                    className="form-select rounded-pill" 
                                    value={appointmentGap}
                                    onChange={(e) => setAppointmentGap(e.target.value)}
                                    disabled={loading}
                                >
                                    <option value="30">30 Minutos</option>
                                    <option value="45">45 Minutos</option>
                                    <option value="60">1 Hora (60 min)</option>
                                    <option value="90">1 Hora y 30 Minutos (90 min)</option>
                                    <option value="120">2 Horas (120 min)</option>
                                </select>
                                <div className="form-text mt-2 small">
                                    El sistema dividirá tu horario en bloques de esta duración.
                                </div>
                            </div>

                        </div>
                        <div className="modal-footer border-top bg-light">
                            <button type="button" className="btn btn-light rounded-pill px-4 fw-semibold border" onClick={onClose} disabled={loading}>Cancelar</button>
                            <button type="submit" className="btn btn-primary rounded-pill px-4 fw-semibold shadow-sm" disabled={loading}>
                                {loading ? <><span className="spinner-border spinner-border-sm me-2"></span>Guardando...</> : "Guardar Horario"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};