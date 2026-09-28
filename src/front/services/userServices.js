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

// ==========================================
// ELIMINAR CUENTA DE USUARIO
// ==========================================
export const deleteAccount = async (userId) => {
    const token = localStorage.getItem("token");
    const response = await fetch(`${BACKEND_URL}/api/users/${userId}`, {
        method: "DELETE",
        headers: {
            "Authorization": `Bearer ${token}`
        }
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || "Error al eliminar la cuenta");
    }

    return data;
};

// ==========================================
// OBTENER, MODIFICAR Y ELIMINAR CITAS (CLIENTE)
// ==========================================
export const getClientAppointments = async () => {
    const token = localStorage.getItem("token");
    try {
        const response = await fetch(`${BACKEND_URL}/api/client/appointments`, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        if (!response.ok) return [];
        return await response.json();
    } catch (error) {
        console.error("Error obteniendo citas:", error);
        return [];
    }
};

export const updateAppointment = async (appointmentId, newDateTime) => {
    const token = localStorage.getItem("token");
    try {
        const response = await fetch(`${BACKEND_URL}/api/appointments/${appointmentId}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ date_time: newDateTime })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "No se pudo modificar la cita");
        return true;
    } catch (error) {
        console.error(error);
        alert(error.message);
        return false;
    }
};

export const cancelAppointment = async (appointmentId) => {
    const token = localStorage.getItem("token");
    try {
        const response = await fetch(`${BACKEND_URL}/api/appointments/${appointmentId}`, {
            method: "DELETE",
            headers: { "Authorization": `Bearer ${token}` }
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "No se pudo eliminar la cita");
        return true;
    } catch (error) {
        console.error(error);
        alert(error.message);
        return false;
    }
};

export const getProviderAppointments = async () => {
    const token = localStorage.getItem("token");
    try {
        const response = await fetch(`${BACKEND_URL}/api/provider/appointments`, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        if (!response.ok) return [];
        return await response.json();
    } catch (error) {
        console.error("Error obteniendo citas de proveedor:", error);
        return [];
    }
};

// ==========================================
// DAR DE BAJA PERFIL DE PROVEEDOR
// ==========================================
export const downgradeProvider = async (userId) => {
  const token = localStorage.getItem("token");
  const response = await fetch(`${BACKEND_URL}/api/users/${userId}/provider`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Error al dar de baja el perfil de proveedor");
  }

  return data;
};

// ==========================================
// SERVICIOS DE CHAT Y MENSAJERÍA
// ==========================================
export const getConversations = async () => {
  const token = localStorage.getItem("token");
  try {
    const response = await fetch(`${BACKEND_URL}/api/conversations`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) return [];
    return await response.json();
  } catch (error) {
    console.error("Error obteniendo conversaciones:", error);
    return [];
  }
};

export const getMessages = async (userId) => {
  const token = localStorage.getItem("token");
  try {
    const response = await fetch(`${BACKEND_URL}/api/messages/${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) return [];
    return await response.json();
  } catch (error) {
    console.error("Error obteniendo historial de mensajes:", error);
    return [];
  }
};

export const sendMessage = async (receiverId, content) => {
  const token = localStorage.getItem("token");
  try {
    const response = await fetch(`${BACKEND_URL}/api/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ receiver_id: receiverId, content }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Error al enviar mensaje");
    return data;
  } catch (error) {
    console.error("Error enviando mensaje:", error);
    return null;
  }
};

// ==========================================
// SERVICIOS DE NOTIFICACIONES
// ==========================================
export const getNotifications = async () => {
  const token = localStorage.getItem("token");
  if (!token) return [];
  try {
    const response = await fetch(`${BACKEND_URL}/api/notifications`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) return [];
    return await response.json();
  } catch (error) {
    console.error("Error obteniendo notificaciones:", error);
    return [];
  }
};

export const markNotificationAsRead = async (notificationId) => {
  const token = localStorage.getItem("token");
  try {
    const response = await fetch(`${BACKEND_URL}/api/notifications/${notificationId}/read`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.error("Error marcando notificación como leída:", error);
    return null;
  }
};

export const markAllNotificationsAsRead = async () => {
  const token = localStorage.getItem("token");
  try {
    const response = await fetch(`${BACKEND_URL}/api/notifications/read-all`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.ok;
  } catch (error) {
    console.error("Error marcando todas las notificaciones como leídas:", error);
    return false;
  }
};