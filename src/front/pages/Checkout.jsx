import { useState, useEffect } from "react";
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

  // Dark mode
  const [darkMode, setDarkMode] = useState(false);

  // ============================
  // CARGAR SERVICIO
  // ============================    
  useEffect(() => {
    fetch(`${import.meta.env.VITE_BACKEND_URL}/services/${serviceId}`)
      .then(res => res.json())
      .then(data => setService(data));
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
  const createReservation = () => {
    fetch(`${import.meta.env.VITE_BACKEND_URL}/reservations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: 1, // ID del cliente logueado
        service_id: service.id,
        availability_id: selectedSlot.id,
        date: selectedSlot.date,
        start_time: selectedSlot.start_time,
        end_time: selectedSlot.end_time,
        total_price: total
      })
    })
      .then(res => res.json())
      .then(data => {
        setReservationId(data.reservation_id);
        setStep(5);
      });
  };

  // ============================
  // CREAR TRANSACCIÓN
  // ============================
  const createTransaction = () => {
    fetch(`${import.meta.env.VITE_BACKEND_URL}/transactions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reservation_id: reservationId,
        amount: total
      })
    })
      .then(res => res.json())
      .then(data => {
        setTransactionId(data.transaction_id);
        setStep(6);
      });
  };

  // ============================
  // CONFIRMAR PAGO + RESERVA
  // ============================
  const confirmPayment = () => {
    // Confirmar transacción
    fetch(`${import.meta.env.VITE_BACKEND_URL}/transactions/${transactionId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "paid" })
    })
      .then(res => res.json())
      .then(data => console.log("Transacción confirmada:", data));

    // Confirmar reserva
    fetch(`${import.meta.env.VITE_BACKEND_URL}/reservations/${reservationId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "confirmed" })
    })
      .then(res => res.json())
      .then(data => console.log("Reserva confirmada:", data));

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
          <div className={`checkout-card ${darkMode ? "dark" : ""}`}>

            {/* BOTÓN DARK MODE */}
            <div className="text-end mb-3">
              <button
                className="btn btn-sm btn-outline-secondary"
                onClick={() => setDarkMode(!darkMode)}
              >
                {darkMode ? "Modo claro" : "Modo oscuro"}
                <i className={`bi ${darkMode ? "bi-sun" : "bi-moon"} ms-2`}></i>
              </button>
            </div>

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
        <h2 className="checkout-title">
          <i className="bi bi-scissors icon-left"></i>
          {service.title}
        </h2>

        <p>{service.description}</p>
        <p className="fw-bold">Precio base: {service.price} €</p>

        <button className="checkout-btn checkout-btn-primary w-100 mt-3"
          onClick={() => {
            fetch(`${import.meta.env.VITE_BACKEND_URL}/services/${service.id}/availability`)
              .then(res => res.json())
              .then(data => {
                setAvailabilityList(data);
                setStep(2);
              });
          }}>
          Seleccionar fecha <i className="bi bi-calendar-check icon-right"></i>
        </button>
      </Container>
    );

  if (step === 2)
    return (
      <Container>
        <h2 className="checkout-title">
          <i className="bi bi-clock icon-left"></i>
          Selecciona fecha y hora
        </h2>

        {availabilityList.length === 0 ? (
          <p>No hay horarios disponibles.</p>
        ) : (
          availabilityList.map(slot => (
            <button
              key={slot.id}
              className="slot-btn btn btn-outline-primary w-100 mb-2"
              onClick={() => {
                setSelectedSlot(slot);
                setStep(3);
              }}>
              <i className="bi bi-calendar-event icon-left"></i>
              {slot.date} — {slot.start_time}
            </button>
          ))
        )}
      </Container>
    );

  if (step === 3)
    return (
      <Container>
        <h2 className="checkout-title">
          <i className="bi bi-person icon-left"></i>
          Tus datos
        </h2>

        <input className="checkout-input form-control mb-2" placeholder="Nombre"
          onChange={e => setClientData({ ...clientData, name: e.target.value })} />

        <input className="checkout-input form-control mb-2" placeholder="Email"
          onChange={e => setClientData({ ...clientData, email: e.target.value })} />

        <input className="checkout-input form-control mb-3" placeholder="Teléfono"
          onChange={e => setClientData({ ...clientData, phone: e.target.value })} />

        <button className="checkout-btn checkout-btn-primary w-100" onClick={() => setStep(4)}>
          Continuar <i className="bi bi-arrow-right-circle icon-right"></i>
        </button>
      </Container>
    );

  if (step === 4)
    return (
      <Container>
        <h2 className="checkout-title">
          <i className="bi bi-receipt icon-left"></i>
          Confirmación
        </h2>

        <p><strong>Servicio:</strong> {service.title}</p>
        <p><strong>Fecha:</strong> {selectedSlot.date}</p>
        <p><strong>Hora:</strong> {selectedSlot.start_time}</p>
        <p><strong>Precio base:</strong> {service.price} €</p>
        <p><strong>Comisión Jake (5%):</strong> {commission.toFixed(2)} €</p>
        <p><strong>Total:</strong> {total.toFixed(2)} €</p>

        <button className="checkout-btn checkout-btn-success w-100 mt-3" onClick={createReservation}>
          Ir al pago <i className="bi bi-credit-card icon-right"></i>
        </button>
      </Container>
    );

  if (step === 5)
    return (
      <Container>
        <h2 className="checkout-title">
          <i className="bi bi-shield-check icon-left"></i>
          Pago seguro
        </h2>

        <button className="checkout-btn checkout-btn-success w-100" onClick={createTransaction}>
          Pagar ahora <i className="bi bi-check2-circle icon-right"></i>
        </button>
      </Container>
    );

  if (step === 6)
    return (
      <Container>
        <h2 className="checkout-title">
          <i className="bi bi-hourglass-split icon-left"></i>
          Procesando pago...
        </h2>

        <button className="checkout-btn checkout-btn-primary w-100" onClick={confirmPayment}>
          Confirmar pago <i className="bi bi-check-circle icon-right"></i>
        </button>
      </Container>
    );

  if (step === 7)
    return (
      <Container>
        <h2 className="checkout-title text-success">
          <i className="bi bi-check2-all icon-left"></i>
          ¡Reserva confirmada!
        </h2>

        <p>Tu pago ha sido procesado correctamente.</p>

        <button className="checkout-btn checkout-btn-secondary w-100"
          onClick={() => window.location.href = "/"}>
          Volver al inicio <i className="bi bi-house-door icon-right"></i>
        </button>
      </Container>
    );
}
