import React, { useState, useRef } from 'react';
import useGlobalReducer from '../../hooks/useGlobalReducer';

const backendUrl = import.meta.env.VITE_BACKEND_URL;

const provincesList = [
    "Álava", "Albacete", "Alicante", "Almería", "Asturias", "Ávila", "Badajoz", "Barcelona", "Burgos", 
    "Cáceres", "Cádiz", "Cantabria", "Castellón", "Ciudad Real", "Córdoba", "Cuenca", "Girona", "Granada", 
    "Guadalajara", "Gipuzkoa", "Huelva", "Huesca", "Islas Baleares", "Jaén", "La Coruña", "La Rioja", 
    "Las Palmas", "León", "Lleida", "Lugo", "Madrid", "Málaga", "Murcia", "Navarra", "Ourense", "Palencia", 
    "Pontevedra", "Salamanca", "Segovia", "Sevilla", "Soria", "Tarragona", "Santa Cruz de Tenerife", 
    "Teruel", "Toledo", "Valencia", "Valladolid", "Vizcaya", "Zamora", "Zaragoza", "Ceuta", "Melilla"
];

export const ProfileSettings = () => {
    const { store, dispatch } = useGlobalReducer();
    
    const profileInputRef = useRef(null);
    const coverInputRef = useRef(null);

    const [showEditModal, setShowEditModal] = useState(false);
    const [showPhotoMenu, setShowPhotoMenu] = useState(false);
    const [showCoverMenu, setShowCoverMenu] = useState(false);
    const [fullImageView, setFullImageView] = useState({ show: false, url: "" });
    
    const [uploadingImage, setUploadingImage] = useState(false);
    const [uploadingCover, setUploadingCover] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const [editData, setEditData] = useState({
        name: store.user?.name || "",
        last_name: store.user?.last_name || "",
        phone: store.user?.phone || "",
        city: store.user?.city || ""
    });

    const handleProfileImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setShowPhotoMenu(false);
        setUploadingImage(true);
        const formData = new FormData();
        formData.append("file", file);

        try {
            const token = localStorage.getItem("token");
            const response = await fetch(`${backendUrl}/api/users/${store.user.id}/profile_image`, {
                method: "POST",
                headers: { "Authorization": `Bearer ${token}` },
                body: formData
            });

            const data = await response.json();
            if (response.ok) {
                const updatedUser = { ...store.user, profile_image: data.profile_image };
                localStorage.setItem("user", JSON.stringify(updatedUser));
                dispatch({ type: "set_user", payload: { user: updatedUser, token } });
            }
        } catch (error) {
            console.error("Error al subir imagen", error);
        } finally {
            setUploadingImage(false);
        }
    };

    const handleCoverImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setShowCoverMenu(false);
        setUploadingCover(true);
        const formData = new FormData();
        formData.append("file", file);

        try {
            const token = localStorage.getItem("token");
            const response = await fetch(`${backendUrl}/api/users/${store.user.id}/cover_image`, {
                method: "POST",
                headers: { "Authorization": `Bearer ${token}` },
                body: formData
            });

            const data = await response.json();
            if (response.ok) {
                const updatedUser = { ...store.user, cover_image: data.cover_image };
                localStorage.setItem("user", JSON.stringify(updatedUser));
                dispatch({ type: "set_user", payload: { user: updatedUser, token } });
            }
        } catch (error) {
            console.error("Error al subir portada", error);
        } finally {
            setUploadingCover(false);
        }
    };

    const handleEditChange = (e) => {
        setEditData({ ...editData, [e.target.name]: e.target.value });
    };

    const handleSaveProfile = async () => {
        setIsSaving(true);
        const token = localStorage.getItem("token");

        try {
            const response = await fetch(`${backendUrl}/api/users/${store.user.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(editData)
            });

            const data = await response.json();
            if (response.ok) {
                const updatedUser = { ...store.user, ...data.user };
                localStorage.setItem("user", JSON.stringify(updatedUser));
                dispatch({ type: "set_user", payload: { user: updatedUser, token } });
                setShowEditModal(false);
            }
        } catch (error) {
            console.error("Error de conexión:", error);
        } finally {
            setIsSaving(false);
        }
    };

    const userProfileImage = store.user?.profile_image || "https://res.cloudinary.com/dtg0cwzzw/image/upload/v1727788484/default-avatar_g9j8x5.png";
    const userCoverImage = store.user?.cover_image || "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=800";

    return (
        <div>
            {/* Tarjeta de Resumen en la pestaña Perfil */}
            <div className="card border-0 shadow-sm mb-4">
                <div className="card-body p-4 d-flex align-items-center justify-content-between">
                    <div className="d-flex align-items-center">
                        <img 
                            src={userProfileImage} 
                            alt="Perfil" 
                            className="rounded-circle object-fit-cover shadow-sm border me-3"
                            style={{ width: "65px", height: "65px" }}
                        />
                        <div>
                            <h5 className="fw-bold mb-0">{store.user?.name} {store.user?.last_name}</h5>
                            <p className="text-muted mb-0 small">{store.user?.email}</p>
                        </div>
                    </div>
                    <button className="btn btn-outline-primary" onClick={() => setShowEditModal(true)}>
                        Editar datos
                    </button>
                </div>
            </div>

            {/* MODAL DE EDICIÓN */}
            {showEditModal && (
                <>
                    <div className="modal-backdrop fade show" style={{ zIndex: 1040 }}></div>
                    <div className="modal fade show d-block" tabIndex="-1" style={{ zIndex: 1050 }}>
                        <div className="modal-dialog modal-dialog-centered modal-lg">
                            <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
                                
                                <div className="modal-header border-0 pb-0 bg-white position-absolute top-0 end-0" style={{ zIndex: 20 }}>
                                    <button type="button" className="btn-close bg-white rounded-circle p-2 shadow" onClick={() => setShowEditModal(false)}></button>
                                </div>

                                <div className="modal-body p-0">
                                    {/* Portada */}
                                    <div className="position-relative bg-secondary" style={{ height: "160px" }}>
                                        <img 
                                            src={userCoverImage} 
                                            alt="Portada" 
                                            className={`w-100 h-100 object-fit-cover ${uploadingCover ? 'opacity-50' : ''}`}
                                        />
                                        <div 
                                            className="position-absolute top-0 start-0 w-100 h-100 bg-black opacity-25" 
                                            style={{ cursor: "pointer" }}
                                            onClick={() => setShowCoverMenu(!showCoverMenu)}
                                        ></div>

                                        <button 
                                            className="position-absolute bottom-0 end-0 m-3 btn btn-dark btn-sm rounded-pill px-3 shadow"
                                            onClick={() => setShowCoverMenu(!showCoverMenu)}
                                        >
                                            <i className="bi bi-camera-fill me-1"></i> Cambiar portada
                                        </button>

                                        {uploadingCover && (
                                            <div className="position-absolute top-50 start-50 translate-middle">
                                                <div className="spinner-border text-light" role="status"></div>
                                            </div>
                                        )}

                                        {showCoverMenu && !uploadingCover && (
                                            <div className="position-absolute bottom-0 end-0 m-3 bg-white border rounded-3 shadow p-2" style={{ zIndex: 30, width: "160px" }}>
                                                <button 
                                                    className="btn btn-sm btn-light w-100 text-start mb-1"
                                                    onClick={() => { setFullImageView({ show: true, url: userCoverImage }); setShowCoverMenu(false); }}
                                                >
                                                    <i className="bi bi-eye me-2"></i> Ver portada
                                                </button>
                                                <button 
                                                    className="btn btn-sm btn-light w-100 text-start"
                                                    onClick={() => coverInputRef.current.click()}
                                                >
                                                    <i className="bi bi-upload me-2"></i> Elegir nueva
                                                </button>
                                            </div>
                                        )}
                                        <input type="file" accept="image/*" className="d-none" ref={coverInputRef} onChange={handleCoverImageUpload} />
                                    </div>

                                    <div className="p-4 pt-0 position-relative">
                                        {/* Foto de Perfil */}
                                        <div className="d-flex align-items-end mb-4" style={{ marginTop: "-50px" }}>
                                            <div className="position-relative d-inline-block">
                                                <img 
                                                    src={userProfileImage} 
                                                    alt="Perfil" 
                                                    className={`rounded-circle object-fit-cover border border-4 border-white shadow bg-white ${uploadingImage ? 'opacity-50' : ''}`}
                                                    style={{ width: "100px", height: "100px", cursor: "pointer" }}
                                                    onClick={() => setShowPhotoMenu(!showPhotoMenu)}
                                                />
                                                <div 
                                                    className="position-absolute bottom-0 end-0 bg-primary text-white rounded-circle p-1 shadow cursor-pointer"
                                                    style={{ transform: "translate(-10%, -10%)" }}
                                                    onClick={() => setShowPhotoMenu(!showPhotoMenu)}
                                                >
                                                    <i className="bi bi-camera-fill small"></i>
                                                </div>

                                                {uploadingImage && (
                                                    <div className="position-absolute top-50 start-50 translate-middle">
                                                        <div className="spinner-border spinner-border-sm text-primary" role="status"></div>
                                                    </div>
                                                )}

                                                {showPhotoMenu && !uploadingImage && (
                                                    <div className="position-absolute top-100 start-0 mt-2 bg-white border rounded-3 shadow p-2" style={{ zIndex: 30, width: "160px" }}>
                                                        <button 
                                                            className="btn btn-sm btn-light w-100 text-start mb-1"
                                                            onClick={() => { setFullImageView({ show: true, url: userProfileImage }); setShowPhotoMenu(false); }}
                                                        >
                                                            <i className="bi bi-eye me-2"></i> Ver foto
                                                        </button>
                                                        <button 
                                                            className="btn btn-sm btn-light w-100 text-start"
                                                            onClick={() => profileInputRef.current.click()}
                                                        >
                                                            <i className="bi bi-upload me-2"></i> Elegir nueva
                                                        </button>
                                                    </div>
                                                )}
                                                <input type="file" accept="image/*" className="d-none" ref={profileInputRef} onChange={handleProfileImageUpload} />
                                            </div>
                                        </div>

                                        {/* Campos */}
                                        <div className="row g-3">
                                            <div className="col-md-6">
                                                <label className="form-label fw-semibold small">Nombre</label>
                                                <input type="text" className="form-control" name="name" value={editData.name} onChange={handleEditChange} />
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label fw-semibold small">Apellido</label>
                                                <input type="text" className="form-control" name="last_name" value={editData.last_name} onChange={handleEditChange} />
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label fw-semibold small">Teléfono</label>
                                                <input type="text" className="form-control" name="phone" value={editData.phone} onChange={handleEditChange} />
                                            </div>
                                            <div className="col-md-6">
                                                <label className="form-label fw-semibold small">Ciudad / Provincia</label>
                                                <select className="form-select" name="city" value={editData.city} onChange={handleEditChange}>
                                                    <option value="">Selecciona provincia...</option>
                                                    {provincesList.map((prov) => (
                                                        <option key={prov} value={prov}>{prov}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="modal-footer border-0 bg-light px-4 py-3">
                                    <button type="button" className="btn btn-light" onClick={() => setShowEditModal(false)}>Cancelar</button>
                                    <button type="button" className="btn btn-primary px-4" onClick={handleSaveProfile} disabled={isSaving}>
                                        {isSaving ? "Guardando..." : "Guardar cambios"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* Lightbox */}
            {fullImageView.show && (
                <div 
                    className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center bg-dark bg-opacity-75" 
                    style={{ zIndex: 1100, cursor: "pointer" }}
                    onClick={() => setFullImageView({ show: false, url: "" })}
                >
                    <img src={fullImageView.url} alt="Vista ampliada" className="img-fluid rounded-3 shadow-lg" style={{ maxWidth: "90%", maxHeight: "80vh" }} />
                    <button className="btn btn-close btn-close-white position-absolute top-0 end-0 m-4" onClick={() => setFullImageView({ show: false, url: "" })}></button>
                </div>
            )}
        </div>
    );
};