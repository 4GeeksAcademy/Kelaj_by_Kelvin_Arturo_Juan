import React, { useState, useEffect } from "react";
import io from "socket.io-client";

// Iniciamos la conexión fuera del componente para evitar reconexiones múltiples
const socket = io(import.meta.env.VITE_BACKEND_URL);

export const ChatBox = ({ currentUser, receiverUser }) => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");

    // Generamos un ID de sala único y consistente (ej: "chat_2_5")
    const room = `chat_${Math.min(currentUser.id, receiverUser.id)}_${Math.max(currentUser.id, receiverUser.id)}`;

    useEffect(() => {
        // Unirse a la sala al abrir el chat
        socket.emit("join", { room });

        // Escuchar el evento que configuramos en Flask
        socket.on("receive_message", (data) => {
            setMessages((prevMessages) => [...prevMessages, data]);
        });

        // Limpiar el oyente al desmontar el componente
        return () => socket.off("receive_message");
    }, [room]);

    const sendMessage = () => {
        if (newMessage.trim() === "") return;

        const messageData = {
            room: room,
            sender_id: currentUser.id,
            text: newMessage,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        socket.emit("send_message", messageData);
        setNewMessage(""); // Limpiar input
    };

    return (
        <div className="card shadow border-0" style={{ width: "100%", maxWidth: "400px" }}>
            <div className="card-header bg-primary text-white fw-bold d-flex justify-content-between">
                <span>Chat con {receiverUser.name}</span>
            </div>
            
            <div className="card-body bg-light" style={{ height: "350px", overflowY: "auto" }}>
                {messages.map((msg, idx) => (
                    <div key={idx} className={`mb-3 d-flex ${msg.sender_id === currentUser.id ? "justify-content-end" : "justify-content-start"}`}>
                        <div className={`px-3 py-2 rounded-4 shadow-sm ${msg.sender_id === currentUser.id ? "bg-primary text-white" : "bg-white text-dark border"}`} style={{ maxWidth: "80%" }}>
                            <p className="mb-0" style={{ fontSize: "0.95rem" }}>{msg.text}</p>
                            <small className={msg.sender_id === currentUser.id ? "text-white-50" : "text-muted"} style={{ fontSize: "0.7rem" }}>
                                {msg.timestamp}
                            </small>
                        </div>
                    </div>
                ))}
            </div>
            
            <div className="card-footer bg-white p-3">
                <div className="input-group">
                    <input 
                        type="text" 
                        className="form-control rounded-start-pill"
                        placeholder="Escribe un mensaje..."
                        value={newMessage} 
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    />
                    <button className="btn btn-primary rounded-end-pill px-3" onClick={sendMessage}>
                        <i className="bi bi-send-fill"></i>
                    </button>
                </div>
            </div>
        </div>
    );
};