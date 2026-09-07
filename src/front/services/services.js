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
export const createAppointment = async (data) => {
  const response = await fetch(`${BACKEND_URL}/appointments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("token")}`
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error("Error al crear la cita");
  return await response.json();
};

// Crear una transacción con tarjeta nueva
export async function createTransaction(data) {
  const resp = await fetch(`${BACKEND_URL}/charge`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("token")}`
    },
    body: JSON.stringify(data)
  });
  return await resp.json();
}

// Crear una transacción con tarjeta guardada
export async function createTransactionWithSaved(data) {
  const resp = await fetch(`${BACKEND_URL}/charge/saved`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("token")}`
    },
    body: JSON.stringify(data)
  });
  return await resp.json();
}
