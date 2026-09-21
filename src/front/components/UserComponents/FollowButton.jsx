import React, { useState } from 'react';

export const FollowButton = ({ targetUserId, initialIsFollowing }) => {
    // initialIsFollowing debe ser un booleano (true/false) que te indique 
    // si el usuario actual ya seguía a este proveedor al cargar la página.
    const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
    const [loading, setLoading] = useState(false);

    const handleToggleFollow = async () => {
        // Obtener el token de donde lo guardes (sessionStorage, localStorage o Context)
        const token = sessionStorage.getItem("token"); 
        
        if (!token) {
            alert("Debes iniciar sesión para seguir a un usuario");
            return;
        }

        setLoading(true);
        // Si ya lo sigue, el método será DELETE. Si no lo sigue, será POST.
        const method = isFollowing ? 'DELETE' : 'POST';

        try {
            const response = await fetch(`${process.env.BACKEND_URL}/api/users/${targetUserId}/follow`, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (response.ok) {
                // Invertimos el estado visual del botón
                setIsFollowing(!isFollowing);
            } else {
                console.error("Error del servidor:", data.error || data.message);
            }
        } catch (error) {
            console.error("Error de conexión:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <button 
            onClick={handleToggleFollow} 
            disabled={loading}
            className={`btn ${isFollowing ? 'btn-outline-danger' : 'btn-primary'}`}
        >
            {loading ? (
                <span>Cargando...</span>
            ) : isFollowing ? (
                'Dejar de seguir'
            ) : (
                'Seguir'
            )}
        </button>
    );
};