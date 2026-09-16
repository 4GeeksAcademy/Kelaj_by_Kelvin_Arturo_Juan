const backendUrl = import.meta.env.VITE_BACKEND_URL;

export const getProfile = async (userId) => {
    try {
        const response = await fetch(`${backendUrl}/${userId}`);
        const data = await response.json();
        
        if (response.ok) {
            console.log("Datos del perfil:", data);
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
        const response = await fetch(`${backendUrl}/${userId}/follow`, {
            method: method,
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            }
        });
        const data = await response.json();
        
        if (response.ok) {
            console.log("Éxito:", data.message);
        }
    } catch (error) {
        console.error("Error al realizar la acción:", error);
    }
};

export const searchProviders = async (query = "", location = "") => {
  const params = new URLSearchParams();
  if (query) params.append("q", query);
  if (location) params.append("location", location);

  const response = await fetch(`${BACKEND_URL}/search/providers?${params.toString()}`);
  if (!response.ok) throw new Error("Error al buscar proveedores");
  return await response.json();
};

export const createReview = async (appointmentId, rating, comment) => {
    const token = localStorage.getItem("token");

    try {
        const response = await fetch(`${backendUrl}/appointments/${appointmentId}/reviews`, {
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
        }
    } catch (error) {
        console.error("Error al enviar reseña:", error);
    }
};

