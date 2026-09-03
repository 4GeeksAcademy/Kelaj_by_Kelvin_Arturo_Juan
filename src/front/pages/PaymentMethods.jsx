import { useEffect, useState } from "react";
import {
  getPaymentMethods,
  addPaymentMethod,
  deletePaymentMethod
} from "../services/paymentMethods";
import "./PaymentMethods.css";

export default function PaymentMethods() {

  const [methods, setMethods] = useState([]);
  const [loading, setLoading] = useState(true);

  // Cargar métodos guardados
  useEffect(() => {
    getPaymentMethods().then(setMethods).finally(() => setLoading(false));
  }, []);

  // Añadir tarjeta (Stripe)
  const handleAddCard = async () => {
    const stripe = window.Stripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

    const { token, error } = await stripe.createToken();

    if (error) {
      alert("Error al procesar tarjeta");
      return;
    }

    const newMethod = await addPaymentMethod({
      provider: "stripe",
      token_id: token.id,
      brand: token.card.brand,
      last_four_digits: token.card.last4
    });

    setMethods([...methods, newMethod]);
  };

  // Eliminar tarjeta
  const handleDelete = async (id) => {
    await deletePaymentMethod(id);
    setMethods(methods.filter(m => m.id !== id));
  };

  if (loading) return <p>Cargando métodos de pago...</p>;

  return (
    <div className="container py-4">
      <h2 className="checkout-title">Métodos de pago</h2>

      {methods.length === 0 && (
        <p>No tienes tarjetas guardadas.</p>
      )}

      {methods.map(method => (
        <div key={method.id} className="payment-method-card">
          <strong>{method.brand.toUpperCase()}</strong> •••• {method.last_four_digits}
          <button className="btn btn-danger btn-sm float-end"
            onClick={() => handleDelete(method.id)}>
            Eliminar
          </button>
        </div>
      ))}

      <button
        className="checkout-btn checkout-btn-primary w-100 mt-3"
        onClick={handleAddCard}
      >
        Añadir tarjeta
      </button>
    </div>
  );
}
