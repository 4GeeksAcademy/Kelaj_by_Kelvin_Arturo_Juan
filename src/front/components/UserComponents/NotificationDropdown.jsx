import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "../../services/userServices";
import { ViewMediaModal } from "./ViewMediaModal";
import { NotificationDetailModal } from "./NotificationDetailModal";

export const NotificationDropdown = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [selectedNotification, setSelectedNotification] = useState(null);

  const fetchNotifications = async () => {
    const data = await getNotifications();
    setNotifications(data);
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, []);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const handleNotificationClick = async (notif) => {
    if (!notif.is_read) {
      await markNotificationAsRead(notif.id);
      setNotifications((prev) =>
        prev.map((item) => (item.id === notif.id ? { ...item, is_read: true } : item))
      );
    }

    switch (notif.type) {
      case "new_message":
        navigate(`/chat/${notif.data?.sender_id || notif.actor_id}`);
        break;

      case "new_follower":
        navigate(`/profile/${notif.data?.follower_id || notif.actor_id}`);
        break;

      case "new_media":
        setSelectedMedia(notif.data);
        break;

      case "appointment_requested":
      case "appointment_cancelled":
      case "new_service":
      case "new_review":
        setSelectedNotification(notif);
        break;

      default:
        break;
    }
  };

  const handleMarkAllRead = async (e) => {
    e.stopPropagation();
    const ok = await markAllNotificationsAsRead();
    if (ok) {
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    }
  };

  const getIconForType = (type) => {
    switch (type) {
      case "new_message":
        return <i className="bi bi-chat-dots-fill text-primary fs-5"></i>;
      case "new_follower":
        return <i className="bi bi-person-plus-fill text-info fs-5"></i>;
      case "appointment_requested":
        return <i className="bi bi-calendar2-check-fill text-success fs-5"></i>;
      case "appointment_cancelled":
        return <i className="bi bi-calendar2-x-fill text-danger fs-5"></i>;
      case "new_service":
        return <i className="bi bi-briefcase-fill text-primary fs-5"></i>;
      case "new_media":
        return <i className="bi bi-images text-primary fs-5"></i>;
      case "new_review":
        return <i className="bi bi-star-fill text-warning fs-5"></i>;
      default:
        return <i className="bi bi-bell-fill text-secondary fs-5"></i>;
    }
  };

  return (
    <>
      {/* Estilos responsivos para evitar desbordamiento en móvil */}
      <style>{`
        .notification-dropdown-menu {
          width: 340px;
          max-height: 420px;
        }
        @media (max-width: 576px) {
          .notification-dropdown-menu {
            position: fixed !important;
            top: 66px !important;
            left: 50% !important;
            right: auto !important;
            transform: translateX(-50%) !important;
            width: calc(100vw - 24px) !important;
            max-width: 360px !important;
            z-index: 1050;
          }
        }
      `}</style>

      <div className="dropdown">
        <button
          className="btn btn-light border rounded-circle p-0 flex-shrink-0 position-relative d-flex align-items-center justify-content-center shadow-none"
          type="button"
          data-bs-toggle="dropdown"
          aria-expanded="false"
          style={{
            width: "40px",
            height: "40px",
            minWidth: "40px",
            minHeight: "40px",
            aspectRatio: "1 / 1",
          }}
          title="Notificaciones"
        >
          <i className="bi bi-bell fs-5 text-dark d-flex"></i>
          {unreadCount > 0 && (
            <span
              className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
              style={{ fontSize: "0.65rem", padding: "0.25em 0.5em" }}
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>

        <div className="dropdown-menu dropdown-menu-end shadow border-0 mt-2 rounded-4 p-0 overflow-hidden notification-dropdown-menu">
          <div className="d-flex justify-content-between align-items-center px-3 py-2 border-bottom bg-light">
            <span className="fw-bold text-dark small">Notificaciones</span>
            {unreadCount > 0 && (
              <button
                type="button"
                className="btn btn-link btn-sm text-decoration-none p-0 small"
                onClick={handleMarkAllRead}
              >
                Marcar leídas
              </button>
            )}
          </div>

          <div className="overflow-auto" style={{ maxHeight: "360px" }}>
            {notifications.length === 0 ? (
              <div className="text-center text-muted py-4 px-3 small">
                <i className="bi bi-bell-slash fs-4 d-block mb-1"></i>
                No tienes notificaciones por ahora
              </div>
            ) : (
              notifications.map((notif) => (
                <button
                  key={notif.id}
                  type="button"
                  onClick={() => handleNotificationClick(notif)}
                  className={`dropdown-item d-flex align-items-start gap-3 py-3 px-3 border-bottom text-wrap ${
                    !notif.is_read ? "bg-primary bg-opacity-10" : ""
                  }`}
                >
                  <div className="mt-1 flex-shrink-0">{getIconForType(notif.type)}</div>
                  <div className="flex-grow-1 text-start" style={{ minWidth: 0 }}>
                    <p
                      className="mb-1 small text-dark fw-semibold text-break"
                      style={{ lineHeight: "1.35" }}
                    >
                      {notif.message}
                    </p>
                    <span className="text-muted" style={{ fontSize: "0.72rem" }}>
                      {notif.created_at
                        ? new Date(notif.created_at).toLocaleString("es-ES", {
                            day: "2-digit",
                            month: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : ""}
                    </span>
                  </div>
                  {!notif.is_read && (
                    <span
                      className="rounded-circle bg-primary align-self-center flex-shrink-0"
                      style={{ width: "8px", height: "8px", minWidth: "8px" }}
                    ></span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Modal reutilizado para galería multimedia */}
      <ViewMediaModal
        show={!!selectedMedia}
        media={selectedMedia}
        onClose={() => setSelectedMedia(null)}
        isOwnProfile={false}
      />

      {/* Modal para citas, cancelaciones, nuevos servicios y reseñas */}
      <NotificationDetailModal
        show={!!selectedNotification}
        notification={selectedNotification}
        onClose={() => setSelectedNotification(null)}
      />
    </>
  );
};