import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { io } from "socket.io-client";
import useGlobalReducer from "../hooks/useGlobalReducer";
import { getConversations, getMessages, sendMessage, getProfile } from "../services/userServices";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

// Paleta de colores estilo Google para avatares sin foto
const googleColors = [
    "#1a73e8", "#d93025", "#188038", "#e37400",
    "#9334e6", "#007b83", "#c2185b", "#3949ab"
];

// Garantiza que nunca exista más de una conversación por cada user.id
const deduplicateConversations = (convList) => {
    const seen = new Map();
    for (const conv of convList) {
        const uid = Number(conv?.user?.id);
        if (!uid) continue;
        if (!seen.has(uid)) {
            seen.set(uid, conv);
        }
    }
    return Array.from(seen.values());
};

export const Chat = () => {
    const { store } = useGlobalReducer();
    const { userId: paramUserId } = useParams();
    const navigate = useNavigate();

    const currentUser = store.user || JSON.parse(localStorage.getItem("user") || "null");
    const currentUserId = currentUser?.id;

    const [conversations, setConversations] = useState([]);
    const [activeContact, setActiveContact] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [loadingConversations, setLoadingConversations] = useState(true);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [sending, setSending] = useState(false);

    const socketRef = useRef(null);
    const messagesEndRef = useRef(null);
    const activeContactRef = useRef(null);

    useEffect(() => {
        activeContactRef.current = activeContact;
    }, [activeContact]);

    const getInitials = (userObj) => {
        const first = userObj?.name?.trim() ? userObj.name.trim().charAt(0).toUpperCase() : "";
        const last = userObj?.last_name?.trim() ? userObj.last_name.trim().charAt(0).toUpperCase() : "";
        return (first + last) || "U";
    };

    const getAvatarColor = (userObj) => {
        const str = `${userObj?.name || ""}${userObj?.last_name || ""}`;
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        return googleColors[Math.abs(hash) % googleColors.length];
    };

    const renderAvatar = (userObj, size = 48, fontSize = "1.1rem") => {
        const hasValidImg = userObj?.profile_image && !userObj.profile_image.includes("ui-avatars");
        if (hasValidImg) {
            return (
                <img
                    src={userObj.profile_image}
                    alt={userObj.name}
                    className="rounded-circle object-fit-cover border shadow-sm flex-shrink-0"
                    style={{ width: `${size}px`, height: `${size}px` }}
                />
            );
        }
        return (
            <div
                className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold border shadow-sm user-select-none flex-shrink-0"
                style={{
                    width: `${size}px`,
                    height: `${size}px`,
                    backgroundColor: getAvatarColor(userObj),
                    fontSize: fontSize,
                    letterSpacing: "1px"
                }}
            >
                {getInitials(userObj)}
            </div>
        );
    };

    const getRoomName = (id1, id2) => {
        const a = Math.min(Number(id1), Number(id2));
        const b = Math.max(Number(id1), Number(id2));
        return `chat_${a}_${b}`;
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // 1. Conectar Socket.IO
    useEffect(() => {
        if (!currentUserId) {
            navigate("/login");
            return;
        }

        const socket = io(BACKEND_URL, {
            transports: ["websocket", "polling"]
        });
        socketRef.current = socket;

        socket.emit("join", { room: `user_${currentUserId}` });

        socket.on("receive_message", (incomingMsg) => {
            const currentActive = activeContactRef.current;

            if (
                currentActive &&
                (Number(incomingMsg.sender_id) === Number(currentActive.id) ||
                    Number(incomingMsg.receiver_id) === Number(currentActive.id))
            ) {
                setMessages((prev) => {
                    if (prev.some((m) => Number(m.id) === Number(incomingMsg.id))) return prev;
                    return [...prev, incomingMsg];
                });
            }

            updateSidebarWithMessage(incomingMsg);
        });

        socket.on("new_message_notification", (incomingMsg) => {
            updateSidebarWithMessage(incomingMsg);
        });

        return () => {
            socket.disconnect();
        };
    }, [currentUserId]);

    // Actualizar la bandeja lateral sin duplicar conversaciones
    const updateSidebarWithMessage = async (msg) => {
        const otherUserId = Number(msg.sender_id) === Number(currentUserId)
            ? Number(msg.receiver_id)
            : Number(msg.sender_id);

        const isChatOpenWithUser = Number(activeContactRef.current?.id) === otherUserId;
        let foundInList = false;

        setConversations((prev) => {
            const existingIndex = prev.findIndex((c) => Number(c.user.id) === otherUserId);

            if (existingIndex !== -1) {
                foundInList = true;
                const updatedConv = {
                    ...prev[existingIndex],
                    last_message: msg.content || msg.text,
                    last_timestamp: msg.timestamp,
                    unread_count:
                        isChatOpenWithUser || Number(msg.sender_id) === Number(currentUserId)
                            ? 0
                            : (prev[existingIndex].unread_count || 0) + 1
                };
                const rest = prev.filter((c) => Number(c.user.id) !== otherUserId);
                return deduplicateConversations([updatedConv, ...rest]);
            }
            return prev;
        });

        // Solo consultamos al servidor si era un usuario que aún no estaba en la barra lateral
        if (!foundInList) {
            const updatedList = await getConversations();
            if (updatedList.length > 0) {
                setConversations((prev) => deduplicateConversations([...updatedList, ...prev]));
            }
        }
    };

    // 2. Cargar conversaciones iniciales y gestionar el parámetro :userId sin duplicados
    useEffect(() => {
        let isMounted = true;

        const initChatData = async () => {
            if (!currentUserId) return;
            setLoadingConversations(true);

            const rawConvList = await getConversations();
            if (!isMounted) return;

            let finalConvList = deduplicateConversations(rawConvList);

            if (paramUserId && Number(paramUserId) !== Number(currentUserId)) {
                const existing = finalConvList.find(
                    (c) => Number(c.user.id) === Number(paramUserId)
                );

                if (existing) {
                    setConversations(finalConvList);
                    handleSelectContact(existing.user);
                } else {
                    const targetProfile = await getProfile(paramUserId);
                    if (!isMounted) return;

                    if (targetProfile) {
                        const newContact = {
                            id: targetProfile.id,
                            name: targetProfile.name,
                            last_name: targetProfile.last_name,
                            profile_image: targetProfile.profile_image,
                            is_provider: targetProfile.is_provider,
                            city: targetProfile.city
                        };

                        const newConvEntry = {
                            user: newContact,
                            last_message: "Nueva conversación",
                            last_timestamp: new Date().toISOString(),
                            unread_count: 0
                        };

                        finalConvList = deduplicateConversations([newConvEntry, ...finalConvList]);
                        setConversations(finalConvList);
                        handleSelectContact(newContact);
                    } else {
                        setConversations(finalConvList);
                    }
                }
            } else {
                setConversations(finalConvList);
                if (finalConvList.length > 0 && window.innerWidth >= 768) {
                    handleSelectContact(finalConvList[0].user);
                }
            }

            setLoadingConversations(false);
        };

        initChatData();

        return () => {
            isMounted = false;
        };
    }, [currentUserId, paramUserId]);

    // 3. Seleccionar un contacto y cargar sus mensajes
    const handleSelectContact = async (userObj) => {
        setActiveContact(userObj);
        setLoadingMessages(true);

        if (socketRef.current && currentUserId) {
            const room = getRoomName(currentUserId, userObj.id);
            socketRef.current.emit("join", { room });
        }

        setConversations((prev) =>
            deduplicateConversations(
                prev.map((c) =>
                    Number(c.user.id) === Number(userObj.id) ? { ...c, unread_count: 0 } : c
                )
            )
        );

        const history = await getMessages(userObj.id);
        setMessages(history);
        setLoadingMessages(false);
    };

    // 4. Enviar un mensaje
    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !activeContact || sending) return;

        const textToSend = newMessage.trim();
        setNewMessage("");
        setSending(true);

        try {
            const savedMsg = await sendMessage(activeContact.id, textToSend);

            if (savedMsg) {
                setMessages((prev) => {
                    if (prev.some((m) => Number(m.id) === Number(savedMsg.id))) return prev;
                    return [...prev, savedMsg];
                });

                if (socketRef.current) {
                    const room = getRoomName(currentUserId, activeContact.id);
                    socketRef.current.emit("send_message", {
                        ...savedMsg,
                        room
                    });
                }

                updateSidebarWithMessage(savedMsg);
            }
        } finally {
            setSending(false);
        }
    };

    const formatTime = (isoString) => {
        if (!isoString) return "";
        const date = new Date(isoString);
        if (isNaN(date.getTime())) return isoString;
        return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    };

    const formatSidebarDate = (isoString) => {
        if (!isoString) return "";
        const date = new Date(isoString);
        if (isNaN(date.getTime())) return "";
        const today = new Date();
        if (date.toDateString() === today.toDateString()) {
            return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        }
        return date.toLocaleDateString("es-ES", { day: "2-digit", month: "2-digit" });
    };

    const filteredConversations = conversations.filter((c) => {
        const fullName = `${c.user?.name || ""} ${c.user?.last_name || ""}`.toLowerCase();
        return fullName.includes(searchTerm.toLowerCase());
    });

    return (
        <div className="container py-4" style={{ maxWidth: "1100px" }}>
            <div className="d-flex align-items-center justify-content-between mb-3">
                <h3 className="fw-bold mb-0 text-dark">
                    <i className="bi bi-chat-dots-fill text-primary me-2"></i>Mensajes
                </h3>
            </div>

            <div
                className="card border-0 shadow-sm rounded-4 overflow-hidden bg-white"
                style={{ height: "76vh", minHeight: "540px" }}
            >
                <div className="row g-0 h-100">
                    
                    {/* COLUMNA IZQUIERDA: LISTA DE CONVERSACIONES */}
                    <div
                        className={`col-12 col-md-4 border-end h-100 d-flex flex-column ${
                            activeContact ? "d-none d-md-flex" : "d-flex"
                        }`}
                    >
                        <div className="p-3 border-bottom bg-light bg-opacity-50">
                            <div className="input-group">
                                <span className="input-group-text bg-white border-end-0 rounded-start-pill text-muted">
                                    <i className="bi bi-search"></i>
                                </span>
                                <input
                                    type="text"
                                    className="form-control border-start-0 rounded-end-pill ps-0"
                                    placeholder="Buscar conversación..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="flex-grow-1 overflow-auto">
                            {loadingConversations ? (
                                <div className="d-flex justify-content-center align-items-center h-100">
                                    <div className="spinner-border text-primary spinner-border-sm" role="status"></div>
                                </div>
                            ) : filteredConversations.length === 0 ? (
                                <div className="text-center p-4 text-muted mt-4">
                                    <i className="bi bi-inbox fs-1 d-block mb-2 opacity-50"></i>
                                    <p className="small mb-0">No tienes conversaciones aún.</p>
                                    <Link to="/catalog" className="btn btn-outline-primary btn-sm rounded-pill mt-3">
                                        Explorar profesionales
                                    </Link>
                                </div>
                            ) : (
                                filteredConversations.map((conv) => {
                                    const isSelected = Number(activeContact?.id) === Number(conv.user.id);
                                    return (
                                        <div
                                            key={conv.user.id}
                                            onClick={() => handleSelectContact(conv.user)}
                                            className={`p-3 border-bottom d-flex align-items-center justify-content-between transition ${
                                                isSelected ? "bg-primary bg-opacity-10" : "bg-white"
                                            }`}
                                            style={{ cursor: "pointer" }}
                                        >
                                            <div className="d-flex align-items-center overflow-hidden me-2">
                                                {renderAvatar(conv.user, 48, "1.05rem")}
                                                <div className="ms-3 overflow-hidden">
                                                    <div className="d-flex align-items-center gap-2">
                                                        <h6 className="fw-bold text-dark mb-0 text-truncate">
                                                            {conv.user.name} {conv.user.last_name}
                                                        </h6>
                                                        {conv.user.is_provider && (
                                                            <span
                                                                className="badge bg-primary bg-opacity-10 text-primary rounded-pill"
                                                                style={{ fontSize: "0.65rem" }}
                                                            >
                                                                Pro
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p
                                                        className={`small mb-0 text-truncate ${
                                                            conv.unread_count > 0 ? "fw-bold text-dark" : "text-muted"
                                                        }`}
                                                        style={{ maxWidth: "180px" }}
                                                    >
                                                        {conv.last_message}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="d-flex flex-column align-items-end flex-shrink-0">
                                                <span className="text-muted" style={{ fontSize: "0.72rem" }}>
                                                    {formatSidebarDate(conv.last_timestamp)}
                                                </span>
                                                {conv.unread_count > 0 && (
                                                    <span className="badge rounded-pill bg-primary mt-1">
                                                        {conv.unread_count}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* COLUMNA DERECHA: VENTANA DE CHAT ACTIVO */}
                    <div
                        className={`col-12 col-md-8 h-100 d-flex flex-column ${
                            !activeContact ? "d-none d-md-flex" : "d-flex"
                        }`}
                    >
                        {activeContact ? (
                            <>
                                <div className="p-3 border-bottom bg-white d-flex align-items-center justify-content-between shadow-sm" style={{ zIndex: 5 }}>
                                    <div className="d-flex align-items-center">
                                        <button
                                            type="button"
                                            className="btn btn-light btn-sm rounded-circle me-2 d-md-none"
                                            onClick={() => setActiveContact(null)}
                                        >
                                            <i className="bi bi-arrow-left"></i>
                                        </button>

                                        {renderAvatar(activeContact, 44, "1rem")}

                                        <div className="ms-3">
                                            <h6 className="fw-bold mb-0 text-dark">
                                                {activeContact.name} {activeContact.last_name}
                                            </h6>
                                            <span className="text-muted small">
                                                {activeContact.is_provider ? "Proveedor de servicios" : "Cliente"}
                                                {activeContact.city ? ` • ${activeContact.city}` : ""}
                                            </span>
                                        </div>
                                    </div>

                                    <Link
                                        to={`/profile/${activeContact.id}`}
                                        className="btn btn-outline-secondary btn-sm rounded-pill px-3"
                                    >
                                        Ver perfil
                                    </Link>
                                </div>

                                <div
                                    className="flex-grow-1 p-3 p-md-4 overflow-auto"
                                    style={{ backgroundColor: "#f8f9fa" }}
                                >
                                    {loadingMessages ? (
                                        <div className="d-flex justify-content-center align-items-center h-100">
                                            <div className="spinner-border text-primary" role="status"></div>
                                        </div>
                                    ) : messages.length === 0 ? (
                                        <div className="h-100 d-flex flex-column align-items-center justify-content-center text-center text-muted">
                                            <div className="bg-white p-4 rounded-4 shadow-sm border" style={{ maxWidth: "320px" }}>
                                                <i className="bi bi-chat-heart fs-2 text-primary d-block mb-2"></i>
                                                <h6 className="fw-bold text-dark">Inicia la conversación</h6>
                                                <p className="small mb-0">
                                                    Envía un mensaje a <strong>{activeContact.name}</strong> para resolver dudas o acordar detalles del servicio.
                                                </p>
                                            </div>
                                        </div>
                                    ) : (
                                        messages.map((msg, index) => {
                                            const isMine = Number(msg.sender_id) === Number(currentUserId);
                                            return (
                                                <div
                                                    key={msg.id || index}
                                                    className={`d-flex mb-3 ${
                                                        isMine ? "justify-content-end" : "justify-content-start"
                                                    }`}
                                                >
                                                    <div
                                                        className={`p-3 rounded-4 shadow-sm ${
                                                            isMine
                                                                ? "bg-primary text-white"
                                                                : "bg-white text-dark border"
                                                        }`}
                                                        style={{
                                                            maxWidth: "75%",
                                                            borderBottomRightRadius: isMine ? "4px" : undefined,
                                                            borderBottomLeftRadius: !isMine ? "4px" : undefined
                                                        }}
                                                    >
                                                        <p className="mb-1" style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                                                            {msg.content || msg.text}
                                                        </p>
                                                        <div
                                                            className={`text-end ${
                                                                isMine ? "text-white-50" : "text-muted"
                                                            }`}
                                                            style={{ fontSize: "0.7rem" }}
                                                        >
                                                            {formatTime(msg.timestamp)}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    )}
                                    <div ref={messagesEndRef} />
                                </div>

                                <form onSubmit={handleSendMessage} className="p-3 bg-white border-top">
                                    <div className="d-flex align-items-center gap-2">
                                        <input
                                            type="text"
                                            className="form-control rounded-pill px-4 py-2 bg-light border-0"
                                            placeholder="Escribe un mensaje..."
                                            value={newMessage}
                                            onChange={(e) => setNewMessage(e.target.value)}
                                        />
                                        <button
                                            type="submit"
                                            className="btn btn-primary rounded-circle d-flex align-items-center justify-content-center shadow-sm flex-shrink-0"
                                            style={{ width: "42px", height: "42px" }}
                                            disabled={!newMessage.trim() || sending}
                                        >
                                            <i className="bi bi-send-fill"></i>
                                        </button>
                                    </div>
                                </form>
                            </>
                        ) : (
                            <div className="h-100 d-flex flex-column align-items-center justify-content-center text-muted p-4 text-center bg-light bg-opacity-50">
                                <div
                                    className="rounded-circle bg-primary bg-opacity-10 text-primary d-flex align-items-center justify-content-center mb-3"
                                    style={{ width: "72px", height: "72px" }}
                                >
                                    <i className="bi bi-chat-square-text-fill fs-2"></i>
                                </div>
                                <h5 className="fw-bold text-dark">Tus mensajes en Kelaj</h5>
                                <p className="small text-secondary" style={{ maxWidth: "320px" }}>
                                    Selecciona una conversación del menú izquierdo para ver los mensajes o contacta con un profesional desde el catálogo.
                                </p>
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
};