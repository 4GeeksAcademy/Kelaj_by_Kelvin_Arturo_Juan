const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

export const getProfile = async (userId) => {
    try {
        const response = await fetch(`${BACKEND_URL}/api/users/${userId}`);
        const data = await response.json();
        
        if (response.ok) {
            return data;
        } else {
            console.error("Error al obtener perfil:", data.error);
        }
    } catch (error) {
        console.error("Error de conexión:", error);
    }
};

export const toggleFollow = async (userId, isFollowing) => {
    const token = localStorage.getItem("token"); 
    const method = isFollowing ? "DELETE" : "POST";

    try {
        const response = await fetch(`${BACKEND_URL}/api/users/${userId}/follow`, {
            method: method,
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            }
        });
        const data = await response.json();
        
        if (response.ok) {
            console.log("Éxito:", data.message);
            return data;
        }
    } catch (error) {
        console.error("Error al realizar la acción:", error);
    }
};

// busqueda de providers

export const searchProviders = async (query = "", location = "", subcategoryId = "") => {
  const params = new URLSearchParams();
  if (query) params.append("q", query);
  if (location) params.append("location", location);
  if (subcategoryId) params.append("subcategory_id", subcategoryId); // Añadimos a la URL

  const response = await fetch(`${BACKEND_URL}/api/search/providers?${params.toString()}`);
  if (!response.ok) throw new Error("Error al buscar proveedores");
  return await response.json();
};

export const createReview = async (appointmentId, rating, comment) => {
    const token = localStorage.getItem("token");

    try {
        const response = await fetch(`${BACKEND_URL}/api/appointments/${appointmentId}/reviews`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ rating, comment })
        });
        
        const data = await response.json();
        if (response.ok) {
            console.log("Reseña enviada:", data.message);
            return data;
        }
    } catch (error) {
        console.error("Error al enviar reseña:", error);
    }
};