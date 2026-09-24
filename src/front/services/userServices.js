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

// servicio para registrar usuario
export const registerUser = async (userData) => {
    const response = await fetch(`${BACKEND_URL}/api/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData)
    });
    
    const data = await response.json();
    
    if (!response.ok) {
        throw new Error(data.message || "Error al registrar la cuenta");
    }
    
    return data;
};

// servicio de login
export const loginUser = async (credentials) => {

    const response = await fetch(`${BACKEND_URL}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials)
    });
    
    const data = await response.json();
    
    if (!response.ok) {
        throw new Error(data.message || "Error al iniciar sesión");
    }
    
    return data;
};

// registrar proveedor
export const registerProvider = async (payload) => {
    const token = localStorage.getItem("token");
    
    const response = await fetch(`${BACKEND_URL}/api/become-provider`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || "Error al registrarse como proveedor");
    }

    return data;
};

// obtener seguidores
export const getFollowing = async (userId) => {
    const token = localStorage.getItem("token");
    try {
        const response = await fetch(`${BACKEND_URL}/api/users/${userId}/following`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
            return await response.json();
        }
        return [];
    } catch (error) {
        console.error("Error al obtener lista de seguidos:", error);
        return [];
    }
};

// subir multimedia
export const uploadGalleryMedia = async (formData) => {
    const token = localStorage.getItem("token");
    try {
        const response = await fetch(`${BACKEND_URL}/api/provider/gallery`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`
            },
            body: formData
        });
        
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error || "Error al subir la imagen");
        }
        
        return await response.json();
    } catch (error) {
        console.error("Error en uploadGalleryMedia:", error);
        return null;
    }
};

// editar multimedia 
export const updateGalleryMedia = async (postId, data) => {
    const token = localStorage.getItem("token");
    try {
        const response = await fetch(`${BACKEND_URL}/api/provider/gallery/${postId}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error("Error al actualizar la publicación");
        return true;
    } catch (error) {
        console.error(error);
        return false;
    }
};

// borrar multimedia 
export const deleteGalleryMedia = async (postId) => {
    const token = localStorage.getItem("token");
    try {
        const response = await fetch(`${BACKEND_URL}/api/provider/gallery/${postId}`, {
            method: "DELETE",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });
        if (!response.ok) throw new Error("Error al eliminar la publicación");
        return true;
    } catch (error) {
        console.error(error);
        return false;
    }
};

// ==========================================
// ACTUALIZAR HORARIO DEL PROVEEDOR
// ==========================================
export const updateSchedule = async (scheduleData) => {
    const token = localStorage.getItem("token");
    try {
        const response = await fetch(`${BACKEND_URL}/api/provider/schedule`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(scheduleData)
        });
        if (!response.ok) throw new Error("Error al actualizar el horario");
        return true;
    } catch (error) {
        console.error(error);
        return false;
    }
};

// ==========================================
// AÑADIR SERVICIO
// ==========================================
export const addProviderService = async (serviceData) => {
    const token = localStorage.getItem("token");
    try {
        const response = await fetch(`${BACKEND_URL}/api/provider/services`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify(serviceData)
        });
        if (!response.ok) throw new Error("Error al crear el servicio");
        return true;
    } catch (error) {
        console.error(error);
        return false;
    }
};

// ==========================================
// OBTENER CATEGORÍAS (PARA EL SELECTOR)
// ==========================================
export const getCategories = async () => {
    try {
        const response = await fetch(`${BACKEND_URL}/api/categories`);
        if (!response.ok) return [];
        return await response.json();
    } catch (error) {
        console.error("Error obteniendo categorías", error);
        return [];
    }
};