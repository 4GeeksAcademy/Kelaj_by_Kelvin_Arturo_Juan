import { useSearchParams } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import "../styles/Checkout.css";
import {
  getServiceById,
  getAvailability,
  createAppointment,
  createTransaction,
  createTransactionWithSaved,
} from "../services/services";
import {
  getPaymentMethods,
  addPaymentMethod,
} from "../services/paymentMethods";

const CheckIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const CheckoutContainer = ({ children, step, setStep, maxReachedStep, hideSteps = false }) => {
  const stepsList = [
    { num: 1, label: "Servicio" },
    { num: 2, label: "Fecha y hora" },
    { num: 3, label: "Datos" },
    { num: 4, label: "Confirmación" }
  ];

  return (
    <div className="container py-4">
      <div className="row justify-content-center">
        <div className="col-md-6 col-lg-5">
          <div className="checkout-card">
            {!hideSteps && (
              <div className="checkout-steps mb-4">
                {stepsList.map((s) => {
                  const isCompleted = step > s.num || s.num <= maxReachedStep;
                  const isActive = step === s.num;
                  
                  return (
                    <div 
                      key={s.num} 
                      className={`step-item ${isActive ? "active" : ""} ${isCompleted ? "completed" : ""} ${s.num < step ? "clickable" : ""}`}
                      onClick={() => {
                        if (s.num < step || s.num <= maxReachedStep) {
                          setStep(s.num);
                        }
                      }}
                    >
                      <div className="circle">
                        {step > s.num || (s.num < step && isCompleted) ? <CheckIcon /> : s.num}
                      </div>
                      <span className={isActive ? "current" : ""}>{s.label}</span>
                    </div>
                  );
                })}
              </div>
            )}

            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default function Checkout() {
  const [step, setStep] = useState(1);
  const [maxReachedStep, setMaxReachedStep] = useState(1);
  const [service, setService] = useState(null);
  const [availabilityList, setAvailabilityList] = useState([]);
  
  const [selectedDate, setSelectedDate] = useState(""); 
  const [selectedSlot, setSelectedSlot] = useState(null);
  
  const [clientData, setClientData] = useState({ name: "", email: "", phone: "" });
  const [appointmentId, setAppointmentId] = useState(null);
  const [transactionId, setTransactionId] = useState(null);
  const [saveCard, setSaveCard] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
  
  const stripeRef = useRef(null);
  const elementsRef = useRef(null);
  const cardElementRef = useRef(null);
  
  const [searchParams] = useSearchParams();
  const serviceId = searchParams.get("serviceId");

  const changeStep = (newStep) => {
    setStep(newStep);
    if (newStep > maxReachedStep) {
      setMaxReachedStep(newStep);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return; 
    getPaymentMethods().then(setPaymentMethods);
  }, []);

  useEffect(() => {
    const loggedUser = JSON.parse(localStorage.getItem("user") || "{}");
    if (loggedUser) {
      setClientData({
        name: loggedUser.name || "",
        email: loggedUser.email || "",
        phone: loggedUser.phone || ""
      });
    }
  }, []);

  useEffect(() => {
    getServiceById(serviceId).then(setService).catch(console.error);
  }, [serviceId]);

  useEffect(() => {
    setAppointmentId(null);
  }, [selectedSlot, selectedDate]);

  useEffect(() => {
    if (step !== 6 || selectedPaymentMethod) return;

    const publicKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY;
    if (!publicKey || !window.Stripe) return;

    const stripe = window.Stripe(publicKey);
    const elements = stripe.elements();
    
    const cardElement = elements.create("card", {
      hidePostalCode: true,
      style: {
        base: {
          fontSize: '15px',
          color: '#32325d',
          fontFamily: '"Inter", sans-serif',
          '::placeholder': { color: '#aab7c4' },
        },
      },
    });

    stripeRef.current = stripe;
    elementsRef.current = elements;
    cardElementRef.current = cardElement;

    cardElement.mount("#card-element");

    return () => {
      if (cardElementRef.current) {
        cardElementRef.current.destroy();
        cardElementRef.current = null;
      }
    };
  }, [step, selectedPaymentMethod]);

  if (!service) return (
    <div className="container py-4">
      <div className="row justify-content-center">
        <div className="col-md-6 col-lg-5">
          <div className="checkout-card bg-white">
            <div className="skeleton skeleton-title mb-3"></div>
            <div className="skeleton skeleton-text mb-2"></div>
            <div className="skeleton skeleton-text mb-2"></div>
            <div className="skeleton skeleton-btn mt-3"></div>
          </div>
        </div>
      </div>
    </div>
  );

  const commission = service.price * 0.05;
  const total = service.price + commission;

const handleAppointment = async () => {
    if (!selectedSlot) {
      alert("Debes seleccionar una fecha y hora");
      return;
    }

    // Si ya se había creado una cita en un intento previo, la reutilizamos sin duplicar
    if (appointmentId) {
      if (paymentMethods.length === 0) {
        changeStep(6);
      } else {
        changeStep(5);
      }
      return;
    }

    const date_time = `${selectedSlot.date}T${selectedSlot.start_time}:00`;

    const data = {
      service_id: service.id,
      date_time: date_time
    };

    const res = await createAppointment(data);

    if (!res || !res.appointment) {
      alert("No se pudo crear la cita");
      return;
    }

    setAppointmentId(res.appointment.id);

    if (paymentMethods.length === 0) {
      changeStep(6);
    } else {
      changeStep(5);
    }
  };

  const handleTransactionWithSavedCard = async () => {
    const res = await createTransactionWithSaved({
      appointment_id: appointmentId,
      amount: total,
      payment_method_id: selectedPaymentMethod.id
    });
    if (res && res.transaction_id) {
      setTransactionId(res.transaction_id);
      changeStep(7);
    }
  };

  const handleTransaction = async () => {
    const stripe = stripeRef.current;
    const cardElement = cardElementRef.current;
    if (!stripe || !cardElement) return;

    const { paymentMethod, error } = await stripe.createPaymentMethod({
      type: "card",
      card: cardElement,
      billing_details: {
        name: clientData.name,
        email: clientData.email,
        phone: clientData.phone
      }
    });

    if (error) {
      alert(error.message || "Error al procesar la tarjeta");
      return;
    }

    const res = await createTransaction({
      appointment_id: appointmentId,
      amount: total,
      payment_method_id: paymentMethod.id
    });

    if (!res || !res.transaction_id) {
      alert(res?.error || "No se pudo procesar el pago");
      return;
    }

    if (saveCard) {
      await addPaymentMethod({
        provider: "stripe",
        payment_method_id: paymentMethod.id,
        brand: paymentMethod.card.brand,
        last_four_digits: paymentMethod.card.last4
      });
    }

    setTransactionId(res.transaction_id);
    changeStep(7);
  };

  const handleStep3Submit = () => {
    if (!clientData.name.trim() || !clientData.email.trim() || !clientData.phone.trim()) {
      alert("Por favor, completa todos los campos (Nombre, Email y Teléfono) para continuar.");
      return;
    }
    changeStep(4);
  };

  if (step === 1)
    return (
      <CheckoutContainer step={step} setStep={changeStep} maxReachedStep={maxReachedStep}>
        <h2 className="checkout-title">{service.title}</h2>
        <p className="text-muted">{service.description}</p>
        <p className="fw-bold fs-5 mb-4">Precio base: {service.price} €</p>

        <button
          className="checkout-btn checkout-btn-primary w-100 rounded-pill shadow-sm"
          onClick={() => {
            getAvailability(service.id).then(setAvailabilityList);
            changeStep(2);
          }}
        >
          Seleccionar fecha
        </button>
      </CheckoutContainer>
    );

  if (step === 2) {
    const availableSlotsForDate = availabilityList.filter(slot => slot.date === selectedDate);
    const today = new Date().toISOString().split("T")[0];

    return (
      <CheckoutContainer step={step} setStep={changeStep} maxReachedStep={maxReachedStep}>
        <h2 className="checkout-title mb-4">Selecciona fecha y hora</h2>

        <div className="mb-4">
            <label className="form-label text-muted fw-semibold small text-uppercase">1. Elige un día</label>
            <input 
                type="date" 
                className="form-control p-3 border-2 shadow-sm rounded-3" 
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={today}
                style={{ cursor: "pointer" }}
            />
        </div>

        <div className="mb-3" style={{ minHeight: "120px" }}>
            <label className="form-label text-muted fw-semibold small text-uppercase">2. Horarios disponibles</label>
            
            {!selectedDate ? (
                <div className="p-3 text-center bg-light rounded-3 text-muted border border-dashed">
                    Selecciona un día en el calendario para ver las horas.
                </div>
            ) : availableSlotsForDate.length > 0 ? (
                <div className="d-flex flex-wrap gap-2">
                    {availableSlotsForDate.map(slot => (
                        <button
                            key={slot.id}
                            className="btn btn-outline-primary fw-semibold px-4 py-2 rounded-pill shadow-sm"
                            onClick={() => {
                                setSelectedSlot(slot);
                                changeStep(3);
                            }}
                        >
                            {slot.start_time}
                        </button>
                    ))}
                </div>
            ) : (
                <div className="p-3 text-center bg-light rounded-3 text-danger border border-dashed">
                    Lo sentimos, no hay horas disponibles para este día.
                </div>
            )}
        </div>
      </CheckoutContainer>
    );
  }

  if (step === 3)
    return (
      <CheckoutContainer step={step} setStep={changeStep} maxReachedStep={maxReachedStep}>
        <h2 className="checkout-title">Tus datos</h2>
        <p className="text-muted small mb-3">Todos los campos son obligatorios para continuar.</p>

        <div className="mb-3">
          <label className="form-label small fw-semibold text-muted">Nombre completo</label>
          <input
            className="checkout-input form-control"
            placeholder="Introduce tu nombre"
            value={clientData.name}
            onChange={e => setClientData({ ...clientData, name: e.target.value })}
            required
          />
        </div>

        <div className="mb-3">
          <label className="form-label small fw-semibold text-muted">Correo electrónico</label>
          <input
            type="email"
            className="checkout-input form-control"
            placeholder="tucorreo@email.com"
            value={clientData.email}
            onChange={e => setClientData({ ...clientData, email: e.target.value })}
            required
          />
        </div>

        <div className="mb-4">
          <label className="form-label small fw-semibold text-muted">Teléfono de contacto</label>
          <input
            type="tel"
            className="checkout-input form-control"
            placeholder="+34 600 000 000"
            value={clientData.phone}
            onChange={e => setClientData({ ...clientData, phone: e.target.value })}
            required
          />
        </div>

        <button
          className="checkout-btn checkout-btn-primary w-100 rounded-pill shadow-sm"
          onClick={handleStep3Submit}
        >
          Continuar
        </button>
      </CheckoutContainer>
    );

  if (step === 4)
    return (
      <CheckoutContainer step={step} setStep={changeStep} maxReachedStep={maxReachedStep}>
        <h2 className="checkout-title">Confirmación</h2>

        <div className="bg-light p-3 rounded-3 mb-4 shadow-sm border">
            <p className="mb-2"><strong>Servicio:</strong> {service.title}</p>
            <p className="mb-2"><strong>Fecha:</strong> <span className="badge bg-primary text-white">{selectedSlot.date}</span></p>
            <p className="mb-0"><strong>Hora:</strong> <span className="badge bg-primary text-white">{selectedSlot.start_time}</span></p>
        </div>

        <div className="d-flex justify-content-between mb-2 text-muted">
            <span>Precio base:</span>
            <span>{service.price} €</span>
        </div>
        <div className="d-flex justify-content-between mb-3 text-muted">
            <span>Gastos de gestión:</span>
            <span>{commission.toFixed(2)} €</span>
        </div>
        <div className="d-flex justify-content-between fw-bold fs-5 border-top pt-3 mb-4 text-dark">
            <span>Total:</span>
            <span>{total.toFixed(2)} €</span>
        </div>

        <button
          className="checkout-btn checkout-btn-success w-100 rounded-pill shadow-sm mt-2"
          onClick={handleAppointment}
        >
          Ir al pago
        </button>
      </CheckoutContainer>
    );

  if (step === 5)
    return (
      <CheckoutContainer step={step} setStep={changeStep} maxReachedStep={maxReachedStep}>
        <h2 className="checkout-title">Método de pago</h2>

        {paymentMethods.length > 0 && (
          <>
            <h5 className="mb-3 text-muted fs-6 uppercase">Tus tarjetas guardadas</h5>
            {paymentMethods.map(pm => (
              <button
                key={pm.id}
                className="slot-btn w-100 mb-2 fw-semibold d-flex justify-content-between align-items-center px-4"
                onClick={() => {
                  setSelectedPaymentMethod(pm);
                  changeStep(6); 
                }}
              >
                <span>{pm.brand.toUpperCase()} •••• {pm.last_four_digits}</span>
                <i className="bi bi-chevron-right"></i>
              </button>
            ))}
            <button
              className="checkout-btn checkout-btn-primary w-100 rounded-pill mt-3 shadow-sm"
              onClick={() => changeStep(6)}
            >
              Usar otra tarjeta
            </button>
          </>
        )}

        {paymentMethods.length === 0 && (
          <>
            <p className="text-muted">No tienes tarjetas guardadas.</p>
            <button
              className="checkout-btn checkout-btn-primary w-100 rounded-pill mt-3 shadow-sm"
              onClick={() => changeStep(6)}
            >
              Añadir tarjeta y pagar
            </button>
          </>
        )}
      </CheckoutContainer>
    );

  if (step === 6)
    return (
      <CheckoutContainer step={step} setStep={changeStep} maxReachedStep={maxReachedStep}>
        <h2 className="checkout-title">Pago seguro</h2>

        {selectedPaymentMethod && (
          <>
            <p className="text-muted">Pagando con tarjeta guardada:</p>
            <p className="fw-bold mb-4">
              {selectedPaymentMethod.brand.toUpperCase()} •••• {selectedPaymentMethod.last_four_digits}
            </p>
            <button
              className="checkout-btn checkout-btn-success w-100 rounded-pill shadow-sm"
              onClick={handleTransactionWithSavedCard}
            >
              Pagar ahora ({total.toFixed(2)} €)
            </button>
          </>
        )}

        {!selectedPaymentMethod && (
          <>
            <div className="stripe-card-container mb-3">
              <label className="form-label small fw-semibold text-muted mb-2">Detalles de la tarjeta</label>
              <div id="card-element"></div>
            </div>

            <label className="d-flex align-items-center text-muted small mb-4" style={{ cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={saveCard}
                onChange={() => setSaveCard(!saveCard)}
                className="me-2 form-check-input"
                style={{ width: '18px', height: '18px' }}
              />
              Guardar tarjeta de forma segura para futuras compras
            </label>

            <button
              className="checkout-btn checkout-btn-success w-100 rounded-pill shadow-sm"
              onClick={handleTransaction}
            >
              Pagar ahora ({total.toFixed(2)} €)
            </button>
          </>
        )}
      </CheckoutContainer>
    );

  if (step === 7)
    return (
      <CheckoutContainer step={step} setStep={changeStep} maxReachedStep={maxReachedStep} hideSteps={true}>
        <div className="text-center py-3">
            <i className="bi bi-check-circle-fill text-success" style={{ fontSize: "4rem" }}></i>
            <h2 className="checkout-title text-success mt-3">¡Reserva confirmada!</h2>
            <p className="text-muted mb-4">Tu pago se ha procesado correctamente y el profesional ha sido notificado.</p>
            <button
              className="checkout-btn checkout-btn-primary w-100 rounded-pill shadow-sm"
              onClick={() => window.location.href = "/"}
            >
              Volver al inicio
            </button>
        </div>
      </CheckoutContainer>
    );
}