import { useState, useEffect } from "react";
import {
  getServiceById,
  getAvailability,
  createReservation,
  createTransaction,
  confirmPayment
} from "../services/services";
import "./Checkout.css";

export default function Checkout({ serviceId }) {

  // PASOS DEL CHECKOUT
  const [step, setStep] = useState(1);

  // ESTADOS DEL CHECKOUT
  const [service, setService] = useState(null);
  const [availabilityList, setAvailabilityList] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [clientData, setClientData] = useState({ name: "", email: "", phone: "" });
  const [reservationId, setReservationId] = useState(null);
  const [transactionId, setTransactionId] = useState(null);

  // ============================
  // AUTOCOMPLETADO USER LOGUEADO Y CARGAR SERVICIO
  // ============================    
  useEffect(() => {
    const loggedUser = JSON.parse(localStorage.getItem("user"));
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


  // ============================
  // Skeleton loader mientras carga
  // ============================
  if (!service) return (
    <div className="container py-4">
      <div className="row justify-content-center">
        <div className="col-md-6 col-lg-5">
          <div className="checkout-card">
            <div className="skeleton skeleton-title mb-3"></div>
            <div className="skeleton skeleton-text mb-2"></div>
            <div className="skeleton skeleton-text mb-2"></div>
            <div className="skeleton skeleton-btn mt-3"></div>
          </div>
        </div>
      </div>
    </div>
  );

  // ============================
  // CALCULAR PRECIO
  // ============================  
  const commission = service.price * 0.05;
  const total = service.price + commission;

  // ============================
  // CREAR RESERVA
  // ============================
    const handleReservation = async () => {
    const data = {
        client_id: 1, // ID del cliente logueado
        service_id: service.id,
        availability_id: selectedSlot.id,
        date: selectedSlot.date,
        start_time: selectedSlot.start_time,
        end_time: selectedSlot.end_time,
        total_price: total
      };
      const res = await createReservation(data);
      setReservationId(res.reservation_id);
      setStep(5);
    };

  // ============================
  // CREAR TRANSACCIÓN
  // ============================
  const handleTransaction = async () => {
    const res = await createTransaction({ reservation_id: reservationId, amount: total });
    setTransactionId(res.transaction_id);
    setStep(6);
  };

  // ============================
  // CONFIRMAR PAGO + RESERVA
  // ============================
  const handleConfirmPayment = async () => {
    await confirmPayment(transactionId, reservationId);
    setStep(7);
  };

  // ============================
  // CONTAINER PREMIUM
  // ============================
  const CheckIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
  const Container = ({ children }) => (
    <div className="container py-4">
      <div className="row justify-content-center">
        <div className="col-md-6 col-lg-5">

          {/* CARD PRINCIPAL */}
          <div className="checkout-card">

            {/* PROGRESS BAR CIRCULAR CON ETIQUETAS */}
            <div className="checkout-steps mb-4">
              <div className={`step-item ${step >= 1 ? "active" : ""}`}>
                <div className="circle">
                  {step > 1 ? <CheckIcon /> : "1"}
                </div>
                <span className={step === 1 ? "current" : ""}>Servicio</span>
              </div>

              <div className={`step-item ${step >= 2 ? "active" : ""}`}>
                <div className="circle">
                  {step > 2 ? <CheckIcon /> : "2"}
                </div>
                <span className={step === 2 ? "current" : ""}>Fecha y hora</span>
              </div>

              <div className={`step-item ${step >= 3 ? "active" : ""}`}>
                <div className="circle">
                  {step > 3 ? <CheckIcon /> : "3"}
                </div>
                <span className={step === 3 ? "current" : ""}>Datos</span>
              </div>

              <div className={`step-item ${step >= 4 ? "active" : ""}`}>
                <div className="circle">
                  {step > 4 ? <CheckIcon /> : "4"}
                </div>
                <span className={step === 4 ? "current" : ""}>Confirmación</span>
              </div>
            </div>

            {/* CONTENIDO DEL PASO */}
            {children}

          </div>
        </div>
      </div>
    </div>
  );

  // ============================
  // RENDER DE PASOS
  // ============================

  if (step === 1)
    return (
      <Container>
        <h2 className="checkout-title">{service.title}</h2>
        <p>{service.description}</p>
        <p className="fw-bold">Precio base: {service.price} €</p>

        <button
          className="checkout-btn checkout-btn-primary w-100 mt-3"
          onClick={() => {
            getAvailability(service.id).then(setAvailabilityList);
            setStep(2);
          }}
        >
          Seleccionar fecha
        </button>
      </Container>
    );

  if (step === 2)
    return (
      <Container>
        <h2 className="checkout-title">Selecciona fecha y hora</h2>

        {availabilityList.map(slot => (
          <button
            key={slot.id}
            className="slot-btn btn btn-outline-primary w-100 mb-2"
            onClick={() => {
              setSelectedSlot(slot);
              setStep(3);
            }}
          >
            {slot.date} — {slot.start_time}
          </button>
        ))}
      </Container>
    );

  if (step === 3)
    return (
      <Container>
        <h2 className="checkout-title">Tus datos</h2>

        <input
          className="checkout-input form-control mb-2"
          placeholder="Nombre"
          value={clientData.name}
          onChange={e => setClientData({ ...clientData, name: e.target.value })}
        />

        <input
          className="checkout-input form-control mb-2"
          placeholder="Email"
          value={clientData.email}
          onChange={e => setClientData({ ...clientData, email: e.target.value })}
        />

        <input
          className="checkout-input form-control mb-3"
          placeholder="Teléfono"
          value={clientData.phone}
          onChange={e => setClientData({ ...clientData, phone: e.target.value })}
        />

        <button
          className="checkout-btn checkout-btn-primary w-100"
          onClick={() => setStep(4)}
        >
          Continuar
        </button>
      </Container>
    );

  if (step === 4)
    return (
      <Container>
        <h2 className="checkout-title">Confirmación</h2>

        <p><strong>Servicio:</strong> {service.title}</p>
        <p><strong>Fecha:</strong> {selectedSlot.date}</p>
        <p><strong>Hora:</strong> {selectedSlot.start_time}</p>
        <p><strong>Precio base:</strong> {service.price} €</p>
        <p><strong>Comisión Jake (5%):</strong> {commission.toFixed(2)} €</p>
        <p><strong>Total:</strong> {total.toFixed(2)} €</p>

        <button
          className="checkout-btn checkout-btn-success w-100 mt-3"
          onClick={handleReservation}
        >
          Ir al pago
        </button>
      </Container>
    );

  if (step === 5)
    return (
      <Container>
        <h2 className="checkout-title">Pago seguro</h2>

        <button
          className="checkout-btn checkout-btn-success w-100"
          onClick={handleTransaction}
        >
          Pagar ahora
        </button>
      </Container>
    );

  if (step === 6)
    return (
      <Container>
        <h2 className="checkout-title">Procesando pago...</h2>

        <button
          className="checkout-btn checkout-btn-primary w-100"
          onClick={handleConfirmPayment}
        >
          Confirmar pago
        </button>
      </Container>
    );

  if (step === 7)
    return (
      <Container>
        <h2 className="checkout-title text-success">¡Reserva confirmada!</h2>

        <p>Tu pago ha sido procesado correctamente.</p>

        <button
          className="checkout-btn checkout-btn-secondary w-100"
          onClick={() => window.location.href = "/"}
        >
          Volver al inicio
        </button>
      </Container>
    );
}