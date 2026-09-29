import React, { useEffect, useState, useRef } from 'react';
import { getPaymentMethods, addPaymentMethod, deletePaymentMethod } from '../../services/paymentMethods';

export const PaymentSettings = () => {
    const [methods, setMethods] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCardInput, setShowCardInput] = useState(false);

    const stripeRef = useRef(null);
    const cardElementRef = useRef(null);

    useEffect(() => {
        getPaymentMethods()
            .then((data) => {
                if (Array.isArray(data)) setMethods(data);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    // Montar el input de tarjeta cuando el usuario abre el formulario
    useEffect(() => {
        if (!showCardInput) return;

        const stripeKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY;
        if (!stripeKey || !window.Stripe) return;

        const stripe = window.Stripe(stripeKey);
        const elements = stripe.elements();
        const cardElement = elements.create("card");

        stripeRef.current = stripe;
        cardElementRef.current = cardElement;

        cardElement.mount("#settings-card-element");

        return () => {
            if (cardElementRef.current) {
                cardElementRef.current.destroy();
                cardElementRef.current = null;
            }
        };
    }, [showCardInput]);

    const handleAddCard = async () => {
        if (!stripeRef.current || !cardElementRef.current) return;

        const { paymentMethod, error } = await stripeRef.current.createPaymentMethod({
            type: "card",
            card: cardElementRef.current,
        });

        if (error) {
            alert(error.message || "Error al procesar la tarjeta");
            return;
        }

        try {
            const newMethod = await addPaymentMethod({
                provider: "stripe",
                payment_method_id: paymentMethod.id,
                brand: paymentMethod.card.brand,
                last_four_digits: paymentMethod.card.last4
            });

            if (newMethod && !newMethod.error) {
                setMethods([...methods, newMethod]);
                setShowCardInput(false);
            }
        } catch (err) {
            console.error("Error al guardar método de pago", err);
        }
    };

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

                {showCardInput ? (
                    <div className="mt-3 p-3 border rounded-3 bg-light">
                        <div id="settings-card-element" className="bg-white p-3 rounded border mb-3"></div>
                        <div className="d-flex gap-2">
                            <button className="btn btn-primary btn-sm px-3" onClick={handleAddCard}>
                                Guardar tarjeta
                            </button>
                            <button className="btn btn-outline-secondary btn-sm px-3" onClick={() => setShowCardInput(false)}>
                                Cancelar
                            </button>
                        </div>
                    </div>
                ) : (
                    <button
                        className="btn btn-outline-primary w-100 mt-2 fw-semibold"
                        onClick={() => setShowCardInput(true)}
                    >
                        <i className="bi bi-plus-lg me-2"></i> Añadir nueva tarjeta
                    </button>
                )}
            </div>
        </div>
    );
};