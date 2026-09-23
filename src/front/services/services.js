const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

// Obtener un servicio por ID
export const getServiceById = async (serviceId) => {
  const response = await fetch(`${BACKEND_URL}/api/services/${serviceId}`);

  if (!response.ok) {
    console.warn("Error al cargar el servicio:", response.status);
    return null; // evita Unexpected token '<'
  }

  return await response.json();
};

// Obtener disponibilidad de un servicio
export const getAvailability = async (serviceId) => {
  const response = await fetch(
    `${BACKEND_URL}/api/services/${serviceId}/availability`,
  );

  if (!response.ok) {
    console.warn("Error al cargar disponibilidad:", response.status);
    return []; // evita Unexpected token '<'
  }

  return await response.json();
};

// Obtener todas las categorías
export const getCategories = async () => {
  const response = await fetch(`${BACKEND_URL}/api/categories`);

  if (!response.ok) {
    console.warn("Error al cargar categorías:", response.status);
    return []; // evita Unexpected token '<'
  }

  return await response.json();
};

// Crear una reserva
export const createAppointment = async (data) => {
  const response = await fetch(`${BACKEND_URL}api/appointments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
    body: JSON.stringify(data),
  });

  const result = await response.json();

  if (!response.ok) {
    console.error("Error al crear la cita:", response.status, result);
    return null;
  }

  return result;
};

// Crear una transacción con tarjeta nueva
export async function createTransaction(data) {
  const resp = await fetch(`${BACKEND_URL}api/charge`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
    body: JSON.stringify(data),
  });

  const contentType = resp.headers.get("content-type") || "";

  // Si el backend devuelve JSON
  if (contentType.includes("application/json")) {
    const result = await resp.json();

    if (!resp.ok) {
      console.error("ERROR DEL BACKEND /api/charge:", {
        status: resp.status,
        error: result
      });

      return null;
    }

    return result;
  }

  // Si Flask devuelve HTML por un error 500
  const text = await resp.text();

  console.error("ERROR HTTP /api/charge:", {
    status: resp.status,
    contentType,
    response: text
  });

  return null;
}

// Crear una transacción con tarjeta guardada
export async function createTransactionWithSaved(data) {
  const resp = await fetch(`${BACKEND_URL}api/charge/saved`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
    body: JSON.stringify(data),
  });

  if (!resp.ok) {
    console.warn("Error al crear transacción guardada:", resp.status);
    return null; // evita Unexpected token '<'
  }
  const contentType = resp.headers.get("content-type");
  if (!contentType || !contentType.includes("application/json")) {
    console.warn("Respuesta no es JSON:", contentType);
    return null;
  }

  return await resp.json();
}
