import { useState } from "react";
import { FaHome, FaUser, FaChalkboardTeacher, FaBook, FaMapMarkerAlt, FaCog, FaChartBar, FaQuestionCircle, FaBars } from "react-icons/fa";
import Link from "next/link";

function Sidebar() {
    const [isOpen, setIsOpen] = useState(true);
    const [activeItem, setActiveItem] = useState("Giảng viên");
    const [openManage, setOpenManage] = useState(false);

    const menuItems = [
        { name: "Trang chủ", icon: <FaHome />, link: "/" },
        { name: "Tài khoản", icon: <FaUser />, link: "/users" },
        { name: "Lịch giảng dạy", icon: <FaChalkboardTeacher />, link: "/"  },
        // { name: "Cài đặt", icon: <FaCog /> },
        // { name: "Thống kê", icon: <FaChartBar /> },
        // { name: "Hỗ trợ", icon: <FaQuestionCircle />, link: "/support" },
    ];

    const subMenuItems = [
        { name: "Giảng viên", link: "/lecturers" },
        { name: "Môn học", link: "/courses" },
        { name: "Địa điểm học", link: "/locations" },
    ];

    return (
        <>
            <style>
                {`
                    .sidebar {
                        transition: width 0.3s ease;
                        overflow-x: hidden;
                        white-space: nowrap;
                        background-color: #f8f9fa;
                        border-right: 1px solid #dee2e6;
                    }
                    .sidebar.open {
                        width: 250px;
                    }
                    .sidebar.collapsed {
                        width: 60px;
                    }
                    .sidebar .nav-link {
                        padding: 0.5rem 1rem;
                        transition: background 0.2s;
                    }
                    .sidebar .nav-link:hover {
                        background-color: #e9ecef;
                    }
                    .sidebar .nav-link.active {
                        background-color: #e2e6ea;
                    }
                    .sidebar .nav-link span {
                        display: inline-block;
                    }
                    .sidebar .toggle-btn {
                        display: flex;
                        align-items: center;
                        padding: 1rem 0;
                        height: 60px;
                    }
                    
                    .sidebar .toggle-btn button {
                        width: 30px;
                        height: 30px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        margin: 0 auto;
                    }
                    
                    .sidebar.open .toggle-btn {
                        justify-content: flex-start;
                        padding-left: 1rem;
                    }
                    
                    .sidebar.collapsed .toggle-btn {
                        padding-left: 0;
                    }
                    
                    .sidebar.open .toggle-btn button {
                        margin: 0;
                    }
                    
                    .sidebar.collapsed .toggle-btn button {
                        margin: 0 auto;
                    }
                `}
            </style>

            <div className={`sidebar border-end ${isOpen ? "open" : "collapsed"}`}>
                <div className="toggle-btn">
                    <button
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() => setIsOpen(!isOpen)}
                    >
                        <FaBars />
                    </button>
                </div>

                <ul className="nav flex-column">
                    {menuItems.map((item) => (
                        <li key={item.name} className="nav-item">
                            <Link
                                href={item.link}
                                className={`nav-link d-flex align-items-center ${activeItem === item.name
                                    ? "active fw-bold text-primary"
                                    : "text-dark"
                                    }`}
                                onClick={() => setActiveItem(item.name)}
                                title={!isOpen ? item.name : ""}
                            >
                                <span className="me-2">{item.icon}</span>
                                {isOpen && <span>{item.name}</span>}
                            </Link>
                        </li>
                    ))}

                    <li className="nav-item">
                        <button
                            className="btn nav-link d-flex align-items-center text-start w-100"
                            onClick={() => setOpenManage(!openManage)}
                            title={!isOpen ? "Quản lý" : ""}
                        >
                            <FaChartBar className="me-2" />
                            {isOpen && <span>Quản lý</span>}
                        </button>

                        {openManage && isOpen && (
                            <ul className="nav flex-column ps-4">
                                {subMenuItems.map((sub) => (
                                    <li key={sub.name}>
                                        <Link
                                            href={sub.link}
                                            className={`nav-link ${activeItem === sub.name ? "active text-primary fw-bold" : "text-dark"
                                                }`}
                                            onClick={() => setActiveItem(sub.name)}
                                        >
                                            {sub.name}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </li>
                </ul>
            </div>
        </>
    );
}

export default Sidebar;