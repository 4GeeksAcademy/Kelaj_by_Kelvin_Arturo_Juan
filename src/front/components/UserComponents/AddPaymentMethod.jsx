import React, { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import {
  createSetupIntent,
  getPaymentMethods,
  addPaymentMethod,
  deletePaymentMethod,
} from "../../services/paymentMethods";

// Usa la variable de entorno pública de Stripe configurada en tu .env
const stripePromise = loadStripe(
  import.meta.env.VITE_STRIPE_PUBLIC_KEY ||
    import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY ||
    ""
);

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      color: "#212529",
      fontFamily: "system-ui, -apple-system, sans-serif",
      fontSmoothing: "antialiased",
      fontSize: "16px",
      "::placeholder": {
        color: "#6c757d",
      },
    },
    invalid: {
      color: "#dc3545",
      iconColor: "#dc3545",
    },
  },
  hidePostalCode: true,
};

// Subcomponente del formulario conectado a Stripe Elements
const CardForm = ({ onCardSaved }) => {
  const stripe = useStripe();
  const elements = useElements();

  const [cardholderName, setCardholderName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!stripe || !elements) return;

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) return;

    setSubmitting(true);

    try {
      // 1. Llamamos a /api/stripe/setup-intent para asegurar que el usuario tenga stripe_customer_id en la BD
      const setupData = await createSetupIntent();
      if (!setupData || !setupData.client_secret) {
        throw new Error("No se pudo inicializar la configuración con Stripe.");
      }

      // 2. Creamos el PaymentMethod en Stripe con los datos de la tarjeta
      const { error, paymentMethod } = await stripe.createPaymentMethod({
        type: "card",
        card: cardElement,
        billing_details: {
          name: cardholderName.trim() || undefined,
        },
      });

      if (error) {
        throw new Error(error.message || "Datos de tarjeta inválidos.");
      }

      // 3. Guardamos en nuestro backend (/api/payment-methods) enviando los 4 campos requeridos en routes.py
      const savedMethod = await addPaymentMethod({
        provider: "stripe",
        payment_method_id: paymentMethod.id,
        brand: paymentMethod.card.brand,
        last_four_digits: paymentMethod.card.last4,
      });

      if (!savedMethod || !savedMethod.id) {
        throw new Error("No se pudo guardar la tarjeta en tu cuenta.");
      }

      cardElement.clear();
      setCardholderName("");
      setSuccessMsg("Tarjeta añadida correctamente.");

      if (onCardSaved) {
        onCardSaved(savedMethod);
      }
    } catch (err) {
      setErrorMsg(err.message || "Ocurrió un error al registrar la tarjeta.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-light p-3 rounded-4 border mb-4">
      <h6 className="fw-bold mb-3 text-dark">
        <i className="bi bi-credit-card-2-front me-2 text-primary"></i>
        Agregar nueva tarjeta
      </h6>

      {errorMsg && (
        <div className="alert alert-danger py-2 small rounded-3 mb-3">
          <i className="bi bi-exclamation-circle me-2"></i>
          {errorMsg}
        </div>
      )}

      {successMsg && (
        <div className="alert alert-success py-2 small rounded-3 mb-3">
          <i className="bi bi-check-circle me-2"></i>
          {successMsg}
        </div>
      )}

      <div className="mb-3">
        <label className="form-label small text-muted fw-semibold mb-1">
          Titular de la tarjeta
        </label>
        <input
          type="text"
          className="form-control rounded-3"
          placeholder="Ej. Laura Martínez"
          value={cardholderName}
          onChange={(e) => setCardholderName(e.target.value)}
          required
        />
      </div>

      <div className="mb-3">
        <label className="form-label small text-muted fw-semibold mb-1">
          Datos de la tarjeta
        </label>
        <div className="form-control py-2 px-3 bg-white rounded-3">
          <CardElement options={CARD_ELEMENT_OPTIONS} />
        </div>
      </div>

      <div className="d-flex justify-content-end">
        <button
          type="submit"
          className="btn btn-primary rounded-pill px-4 fw-semibold"
          disabled={!stripe || submitting}
        >
          {submitting ? (
            <>
              <span className="spinner-border spinner-border-sm me-2"></span>
              Guardando...
            </>
          ) : (
            <>
              <i className="bi bi-plus-lg me-1"></i> Guardar tarjeta
            </>
          )}
        </button>
      </div>
    </form>
  );
};

// Componente principal para UserComponents
export const AddPaymentMethod = ({ onSelectMethod }) => {
  const [methods, setMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

  const fetchMethods = async () => {
    setLoading(true);
    const data = await getPaymentMethods();
    setMethods(Array.isArray(data) ? data : []);
    setLoading(false);
  };

  useEffect(() => {
    fetchMethods();
  }, []);

  const handleCardSaved = (newMethod) => {
    setMethods((prev) => [...prev, newMethod]);
    if (onSelectMethod) {
      onSelectMethod(newMethod);
    }
  };

  const handleDelete = async (id) => {
    setDeletingId(id);
    const ok = await deletePaymentMethod(id);
    if (ok) {
      setMethods((prev) => prev.filter((m) => m.id !== id));
    }
    setDeletingId(null);
  };

  const formatBrand = (brand = "") => {
    const b = brand.toLowerCase();
    if (b === "visa") return "Visa";
    if (b === "mastercard") return "Mastercard";
    if (b === "amex") return "American Express";
    return brand.toUpperCase() || "Tarjeta";
  };

  return (
    <div className="card border-0 shadow-sm rounded-4">
      <div className="card-body p-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <div>
            <h5 className="fw-bold mb-1 text-dark">Métodos de Pago</h5>
            <p className="text-muted small mb-0">
              Administra tus tarjetas guardadas para reservar servicios de forma rápida y segura.
            </p>
          </div>
          <i className="bi bi-shield-check text-success fs-3"></i>
        </div>

        {/* Formulario de nueva tarjeta envuelto en Stripe Elements */}
        <Elements stripe={stripePromise}>
          <CardForm onCardSaved={handleCardSaved} />
        </Elements>

        {/* Lista de tarjetas guardadas */}
        <h6 className="fw-bold text-dark mb-3">Tarjetas guardadas</h6>

        {loading ? (
          <div className="text-center py-4">
            <div className="spinner-border spinner-border-sm text-primary"></div>
          </div>
        ) : methods.length === 0 ? (
          <div className="text-center py-4 bg-light rounded-4 border border-dashed">
            <i className="bi bi-credit-card text-muted fs-2 d-block mb-1"></i>
            <span className="text-muted small">
              Aún no tienes ninguna tarjeta guardada en tu cuenta.
            </span>
          </div>
        ) : (
          <div className="d-flex flex-column gap-2">
            {methods.map((method) => (
              <div
                key={method.id}
                className="d-flex align-items-center justify-content-between p-3 border rounded-3 bg-white"
              >
                <div className="d-flex align-items-center gap-3">
                  <div
                    className="bg-primary bg-opacity-10 text-primary rounded-3 d-flex align-items-center justify-content-center"
                    style={{ width: "42px", height: "42px" }}
                  >
                    <i className="bi bi-credit-card-fill fs-5"></i>
                  </div>
                  <div>
                    <div className="fw-bold text-dark">
                      {formatBrand(method.brand)} •••• {method.last_four_digits}
                    </div>
                    <small className="text-muted">Tarjeta verificada con Stripe</small>
                  </div>
                </div>

                <div className="d-flex align-items-center gap-2">
                  {onSelectMethod && (
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-primary rounded-pill px-3"
                      onClick={() => onSelectMethod(method)}
                    >
                      Usar
                    </button>
                  )}
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-danger rounded-circle d-flex align-items-center justify-content-center"
                    style={{ width: "34px", height: "34px" }}
                    onClick={() => handleDelete(method.id)}
                    disabled={deletingId === method.id}
                    title="Eliminar tarjeta"
                  >
                    {deletingId === method.id ? (
                      <span className="spinner-border spinner-border-sm"></span>
                    ) : (
                      <i className="bi bi-trash"></i>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};