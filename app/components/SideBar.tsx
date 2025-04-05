import { useState } from "react";
import { FaHome, FaUser, FaChalkboardTeacher, FaBook, FaMapMarkerAlt, FaCog, FaChartBar, FaQuestionCircle } from "react-icons/fa";

// Khoimom - handle action khi click (tạo property link cho từng item trong menu)
function SideBar() {
    const [openManage, setOpenManage] = useState(false);
    const [activeItem, setActiveItem] = useState("Giảng viên");

    const menuItems = [
        { name: "Trang chủ", icon: <FaHome /> },
        { name: "Tài khoản", icon: <FaUser /> },
        { name: "Lịch giảng dạy", icon: <FaChalkboardTeacher /> },
        { name: "Cài đặt", icon: <FaCog /> },
        { name: "Thống kê", icon: <FaChartBar /> },
        { name: "Hỗ trợ", icon: <FaQuestionCircle /> }
    ];

    return (
        <div className="d-flex flex-column min-vh-100 bg-light p-3 border-end  z-3" style={{ width: "250px"}}>
            <ul className="nav flex-column">
                {menuItems.map((item) => (
                    <li key={item.name} className="nav-item mb-3">
                        <a // Khoimom - có element của riêng next thay cho thẻ a href để không phải render lại element
                            href="#"
                            className={`nav-link d-flex align-items-center py-2 rounded ${activeItem === item.name ? "active text-primary fw-bold" : "text-dark"}`}
                            onClick={() => setActiveItem(item.name)}
                        >
                            {item.icon} <span className="ms-2">{item.name}</span>
                        </a>
                    </li>
                ))}

                <li className="nav-item mb-3">
                    <button className="btn text-start nav-link d-flex align-items-center w-100" onClick={() => setOpenManage(!openManage)}>
                        <FaChartBar className="me-2" /> Quản lý
                    </button>
                    {openManage && (
                        <ul className="nav flex-column ps-3">
                            {["Giảng viên", "Môn học", "Địa điểm học"].map((subItem) => (
                                <li key={subItem} className="nav-item">
                                    <a
                                        href="#"
                                        className={`nav-link ${activeItem === subItem ? "active text-primary fw-bold" : "text-dark"}`}
                                        onClick={() => setActiveItem(subItem)}
                                    >
                                        {subItem === "Giảng viên" && <FaUser className="me-2" />}
                                        {subItem === "Môn học" && <FaBook className="me-2" />}
                                        {subItem === "Địa điểm học" && <FaMapMarkerAlt className="me-2" />}
                                        {subItem}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    )}
                </li>
            </ul>
        </div>
    );
}

export default SideBar;