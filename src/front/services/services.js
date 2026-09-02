// src/services/services.js

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

// Obtener un servicio por ID
export const getServiceById = async (serviceId) => {
  const response = await fetch(`${BACKEND_URL}/services/${serviceId}`);
  if (!response.ok) throw new Error("Error al cargar el servicio");
  return await response.json();
};

// Obtener disponibilidad de un servicio
export const getAvailability = async (serviceId) => {
  const response = await fetch(`${BACKEND_URL}/services/${serviceId}/availability`);
  if (!response.ok) throw new Error("Error al cargar disponibilidad");
  return await response.json();
};

// Crear una reserva
export const createReservation = async (data) => {
  const response = await fetch(`${BACKEND_URL}/reservations`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Error al crear la reserva");
  return await response.json();
};

// Crear una transacción
export const createTransaction = async (data) => {
  const response = await fetch(`${BACKEND_URL}/transactions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Error al crear la transacción");
  return await response.json();
};

// Confirmar pago
export const confirmPayment = async (transactionId, reservationId) => {
  await fetch(`${BACKEND_URL}/transactions/${transactionId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: "paid" }),
  });

  await fetch(`${BACKEND_URL}/reservations/${reservationId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: "confirmed" }),
  });
};