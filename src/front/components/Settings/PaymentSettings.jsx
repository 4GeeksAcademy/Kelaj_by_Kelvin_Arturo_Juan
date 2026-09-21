import React, { useEffect, useState } from 'react';
import { getPaymentMethods, addPaymentMethod, deletePaymentMethod } from '../../services/paymentMethods';

export const PaymentSettings = () => {
    const [methods, setMethods] = useState([]);
    const [loading, setLoading] = useState(true);

    // Cargar métodos guardados al montar el componente
    useEffect(() => {
        getPaymentMethods()
            .then((data) => {
                if (Array.isArray(data)) setMethods(data);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    // Añadir tarjeta usando Stripe (siguiendo la lógica de tu compañero)
    const handleAddCard = async () => {
        const stripeKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY;
        if (!stripeKey) {
            alert("Falta configurar la clave pública de Stripe en el archivo .env");
            return;
        }

        const stripe = window.Stripe(stripeKey);
        const { token, error } = await stripe.createToken();

        if (error) {
            alert("Error al procesar la tarjeta");
            return;
        }

        try {
            const newMethod = await addPaymentMethod({
                provider: "stripe",
                payment_method_id: token.id, // Asegurando que coincida con lo que espera tu backend
                brand: token.card.brand,
                last_four_digits: token.card.last4
            });

            if (newMethod && !newMethod.error) {
                setMethods([...methods, newMethod]);
            }
        } catch (err) {
            console.error("Error al guardar método de pago", err);
        }
    };

    // Eliminar tarjeta
    const handleDelete = async (id) => {
        try {
            await deletePaymentMethod(id);
            setMethods(methods.filter(m => m.id !== id));
        } catch (err) {
            console.error("Error al eliminar la tarjeta", err);
        }
    };

    if (loading) return <p className="text-muted">Cargando métodos de pago...</p>;

    return (
        <div className="card border-0 shadow-sm mb-4">
            <div className="card-body p-4">
                <h5 className="fw-bold mb-3"><i className="bi bi-credit-card me-2 text-primary"></i> Tus Métodos de Pago</h5>
                <p className="text-muted small">Administra tus tarjetas guardadas para contrataciones rápidas y seguras en Kelaj.</p>

                {methods.length === 0 ? (
                    <div className="alert alert-light border text-muted py-3 text-center mb-3">
                        No tienes tarjetas guardadas actualmente.
                    </div>
                ) : (
                    methods.map(method => (
                        <div key={method.id} className="d-flex justify-content-between align-items-center p-3 mb-2 border rounded-3 bg-light">
                            <div>
                                <strong className="text-uppercase">{method.brand}</strong> 
                                <span className="text-muted ms-2">•••• {method.last_four_digits}</span>
                            </div>
                            <button 
                                className="btn btn-outline-danger btn-sm"
                                onClick={() => handleDelete(method.id)}
                            >
                                <i className="bi bi-trash"></i> Eliminar
                            </button>
                        </div>
                    ))
                )}

                <button
                    className="btn btn-outline-primary w-100 mt-2 fw-semibold"
                    onClick={handleAddCard}
                >
                    <i className="bi bi-plus-lg me-2"></i> Añadir nueva tarjeta
                </button>
            </div>
        </div>
    );
};