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

export default function Checkout() {

  // PASOS DEL CHECKOUT
  const [step, setStep] = useState(1);

  // ESTADOS DEL CHECKOUT
  const [service, setService] = useState(null);
  const [availabilityList, setAvailabilityList] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [clientData, setClientData] = useState({ name: "", email: "", phone: "" });
  const [appointmentId, setAppointmentId] = useState(null);
  const [transactionId, setTransactionId] = useState(null)
  const [saveCard, setSaveCard] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
  const stripeRef = useRef(null);
  const elementsRef = useRef(null);
  const cardElementRef = useRef(null);
  const [searchParams] = useSearchParams();
  const serviceId = searchParams.get("serviceId");

  // ============================
  // CARGAR LOS METODOS DE PAGOS - FORM DE STRIPE STEP 5
  // ============================    
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return; // si no hay sesión, no llama al backend

    getPaymentMethods().then(setPaymentMethods);
  }, []);

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

  useEffect(() => {
    if (step !== 6 || selectedPaymentMethod) return;

    const publicKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY;

    console.log("STRIPE PUBLIC KEY:", publicKey);

    if (!publicKey) {
      console.error("Falta VITE_STRIPE_PUBLIC_KEY en el archivo .env");
      return;
    }

    if (!window.Stripe) {
      console.error("Stripe.js no está cargado");
      return;
    }

    const stripe = window.Stripe(publicKey);
    const elements = stripe.elements();

    const cardElement = elements.create("card");

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
  // CREAR CITA
  // ============================
  const handleAppointment = async () => {

    if (!selectedSlot) {
      alert("Debes seleccionar una fecha y hora");
      return;
    }

    console.log("SLOT SELECCIONADO:", selectedSlot);

    const date_time = `${selectedSlot.date}T${selectedSlot.start_time}:00`;

    const data = {
      service_id: service.id,
      date_time: date_time
    };

    console.log("DATOS DE LA CITA:", data);

    const res = await createAppointment(data);

    console.log("RESPUESTA CREAR CITA:", res);

    if (!res || !res.appointment) {
      console.error("No se pudo crear la cita:", res);
      alert("No se pudo crear la cita");
      return;
    }

    setAppointmentId(res.appointment.id);

    if (paymentMethods.length === 0) {
      setStep(6);
    } else {
      setStep(5);
    }
  };

  // ============================
  // PAGO CON TARJETA GUARDADA
  // ============================
  const handleTransactionWithSavedCard = async () => {
    const res = await createTransactionWithSaved({
      appointment_id: appointmentId,
      amount: total,
      payment_method_id: selectedPaymentMethod.id
    });

    setTransactionId(res.transaction_id);
    setStep(7);
  };

  // ============================
  // PAGO CON TARJETA NUEVA (STRIPE)
  // ============================
  const handleTransaction = async () => {

    const stripe = stripeRef.current;
    const cardElement = cardElementRef.current;

    if (!stripe) {
      alert("Stripe no está inicializado");
      console.error("stripeRef.current está vacío");
      return;
    }

    if (!cardElement) {
      alert("El formulario de tarjeta no está disponible");
      console.error("cardElementRef.current está vacío");
      return;
    }

    // Crear PaymentMethod en Stripe
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
      console.error("Error creando PaymentMethod:", error);
      alert(error.message || "Error al procesar la tarjeta");
      return;
    }

    console.log("PAYMENT METHOD STRIPE:", paymentMethod);

    // Enviar PaymentMethod al backend
    const res = await createTransaction({
      appointment_id: appointmentId,
      amount: total,
      payment_method_id: paymentMethod.id
    });

    console.log("RESPUESTA TRANSACCIÓN:", res);

    if (!res || !res.transaction_id) {
      console.error("No se pudo crear la transacción:", res);
      alert(res?.error || "No se pudo procesar el pago");
      return;
    }

    // Guardar tarjeta si el usuario lo solicita
    if (saveCard) {
      await addPaymentMethod({
        provider: "stripe",
        payment_method_id: paymentMethod.id,
        brand: paymentMethod.card.brand,
        last_four_digits: paymentMethod.card.last4
      });
    }

    setTransactionId(res.transaction_id);
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
              console.log("SLOT SELECCIONADO:", slot);
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
          onClick={handleAppointment}
        >
          Ir al pago
        </button>
      </Container>
    );

  if (step === 5)
    return (
      <Container>
        <h2 className="checkout-title">Método de pago</h2>

        {/* Si tiene tarjetas guardadas */}
        {paymentMethods.length > 0 && (
          <>
            <h5 className="mb-3">Tus tarjetas guardadas</h5>

            {paymentMethods.map(pm => (
              <button
                key={pm.id}
                className="slot-btn w-100 mb-2"
                onClick={() => {
                  setSelectedPaymentMethod(pm);
                  setStep(6); // Ir directamente al pago
                }}
              >
                {pm.brand.toUpperCase()} •••• {pm.last_four_digits}
              </button>
            ))}

            <button
              className="checkout-btn checkout-btn-primary w-100 mt-3"
              onClick={() => setStep(6)} // Usar nueva tarjeta
            >
              Usar otra tarjeta
            </button>
          </>
        )}

        {/* Si NO tiene tarjetas guardadas */}
        {paymentMethods.length === 0 && (
          <>
            <p>No tienes tarjetas guardadas.</p>
            <button
              className="checkout-btn checkout-btn-primary w-100 mt-3"
              onClick={() => setStep(6)}
            >
              Añadir tarjeta y pagar
            </button>
          </>
        )}
      </Container>
    );


  if (step === 6)
    return (
      <Container>
        <h2 className="checkout-title">Pago seguro</h2>

        {/* Si el usuario eligió tarjeta guardada */}
        {selectedPaymentMethod && (
          <>
            <p>Pagando con:</p>
            <p className="fw-bold">
              {selectedPaymentMethod.brand.toUpperCase()} •••• {selectedPaymentMethod.last_four_digits}
            </p>

            <button
              className="checkout-btn checkout-btn-success w-100 mt-4"
              onClick={handleTransactionWithSavedCard}
            >
              Pagar ahora
            </button>
          </>
        )}

        {/* Si el usuario quiere tarjeta nueva */}
        {!selectedPaymentMethod && (
          <>
            <div id="card-element" className="stripe-card-element"></div>

            <label className="mt-3 d-flex align-items-center">
              <input
                type="checkbox"
                checked={saveCard}
                onChange={() => setSaveCard(!saveCard)}
                className="me-2"
              />
              Guardar tarjeta para futuras compras
            </label>

            <button
              className="checkout-btn checkout-btn-success w-100 mt-4"
              onClick={handleTransaction}
            >
              Pagar ahora
            </button>
          </>
        )}
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