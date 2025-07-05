'use client';

import { useState, useEffect } from "react";
import { usePathname } from 'next/navigation';
import { FaHome, FaUser, FaChalkboardTeacher, FaChartBar, FaBars, FaCalendarAlt, FaCog } from "react-icons/fa";
import Link from "next/link";
import { useAuth } from '../contexts/AuthContext';

function Sidebar() {
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(true);
    const [activeItem, setActiveItem] = useState("");
    const { user } = useAuth();
    // Trạng thái mở/đóng cho từng submenu
    type SubMenuKey = 'lecturers' | 'subjects' | 'locations' | 'curriculums' | 'teams';
    type SubMenuOpenState = { [key in SubMenuKey]: boolean };
    const [subMenuOpen, setSubMenuOpen] = useState<SubMenuOpenState>({
        lecturers: false,
        subjects: false,
        locations: false,
        curriculums: false,
        teams: false,
    });

    const [openManage, setOpenManage] = useState(false);

    const menuItems = [
        { name: "Trang chủ", icon: <FaHome />, link: "/" },
        { name: "Lịch giảng dạy", icon: <FaChalkboardTeacher />, link: "/timetable" },
        { name: "Lịch nghỉ lễ", icon: <FaCalendarAlt />, link: "/holidays" },
        { name: "Tài khoản", icon: <FaUser />, link: "/users" },
    ];

    const subMenuItems = [
        { name: "Giảng viên", link: "/lecturers", key: "lecturers" },
        { name: "Học phần", link: "/subjects", key: "subjects" },
        { name: "Địa điểm học", link: "/locations", key: "locations" },
        { name: "Chương trình học", link: "/curriculums", key: "curriculums" },
        { name: "Đại đội", link: "/teams", key: "teams" },
    ];

    // Tất cả role đều thấy menu quản lý
    const showManageMenu = true;

    useEffect(() => {
        const matchedMain = menuItems.find(item => item.link === pathname);
        const matchedSub = subMenuItems.find(item => item.link === pathname);
        setActiveItem(matchedSub?.name || matchedMain?.name || "");
        // Nếu đang ở endpoint thuộc submenu thì luôn mở menu quản lý
        if (matchedSub) {
            setOpenManage(true);
        } else {
            setOpenManage(false);
        }
    }, [pathname]);

    // Nếu chưa đăng nhập, chỉ hiển thị Trang chủ và nút Ẩn/Hiện menu
    if (!user) {
        return (
            <>
                <style>
                    {`
                    .sidebar {
                        background-color: #f8f9fa;
                        border-right: 1px solid #dee2e6;
                        transition: width 0.3s ease;
                        overflow: hidden;
                    }

                    .sidebar.open {
                        width: 250px;
                    }

                    .sidebar.collapsed {
                        width: 60px;
                    }

                    .nav-link {
                        padding: 0.5rem 1rem;
                        display: flex;
                        align-items: center;
                        transition: background 0.2s;
                        white-space: nowrap;
                        color: #212529;
                        background-color: transparent;
                    }

                    .nav-link:hover {
                        background-color: #e9ecef;
                    }

                    .nav-link.active {
                        background-color: #e2e6ea;
                        font-weight: bold;
                        color: #0d6efd !important;
                    }

                    .toggle-button {
                        background-color: transparent;
                        border: none;
                        color: #212529;
                        width: 100%;
                        text-align: left;
                        display: flex;
                        align-items: center;
                    }

                    .sidebar.collapsed .toggle-button {
                        justify-content: center;
                    }

                    .submenu {
                        padding-left: 1rem;
                    }

                    .permission-badge {
                        font-size: 0.7rem;
                        padding: 0.1rem 0.3rem;
                        margin-left: 0.5rem;
                    }
                    `}
                </style>
                <div className={`sidebar ${isOpen ? "open" : "collapsed"}`} style={{ height: '100vh' }}>
                    <ul className="nav flex-column">
                        <li className="nav-item">
                            <button
                                className="toggle-button nav-link text-dark"
                                onClick={() => setIsOpen(!isOpen)}
                                title={!isOpen ? "Ẩn/Hiện menu" : ""}
                            >
                                <FaBars className="me-2" />
                                {isOpen && <span>Ẩn menu</span>}
                            </button>
                        </li>
                        <li className="nav-item">
                            <Link
                                href="/"
                                className={`nav-link ${activeItem === "Trang chủ" ? "active" : "text-dark"}`}
                                title={!isOpen ? "Trang chủ" : ""}
                            >
                                <span className="me-2"><FaHome /></span>
                                {isOpen && (
                                    <div className="d-flex align-items-center justify-content-between w-100">
                                        <span>Trang chủ</span>
                                    </div>
                                )}
                            </Link>
                        </li>
                    </ul>
                </div>
            </>
        );
    }

    return (
        <>
            <style>
                {`
                .sidebar {
                    background-color: #f8f9fa;
                    border-right: 1px solid #dee2e6;
                    transition: width 0.3s ease;
                    overflow: hidden;
                }

                .sidebar.open {
                    width: 250px;
                }

                .sidebar.collapsed {
                    width: 60px;
                }

                .nav-link {
                    padding: 0.5rem 1rem;
                    display: flex;
                    align-items: center;
                    transition: background 0.2s;
                    white-space: nowrap;
                    color: #212529;
                    background-color: transparent;
                }

                .nav-link:hover {
                    background-color: #e9ecef;
                }

                .nav-link.active {
                    background-color: #e2e6ea;
                    font-weight: bold;
                    color: #0d6efd !important;
                }

                .toggle-button {
                    background-color: transparent;
                    border: none;
                    color: #212529;
                    width: 100%;
                    text-align: left;
                    display: flex;
                    align-items: center;
                }

                .sidebar.collapsed .toggle-button {
                    justify-content: center;
                }

                .submenu {
                    padding-left: 1rem;
                }

                .permission-badge {
                    font-size: 0.7rem;
                    padding: 0.1rem 0.3rem;
                    margin-left: 0.5rem;
                }
                `}
            </style>

            <div className={`sidebar ${isOpen ? "open" : "collapsed"}`} style={{ height: pathname === '/holidays' ? '680px' : '900px' }}>
                <ul className="nav flex-column">
                    <li className="nav-item">
                        <button
                            className="toggle-button nav-link text-dark"
                            onClick={() => setIsOpen(!isOpen)}
                            title={!isOpen ? "Ẩn/Hiện menu" : ""}
                        >
                            <FaBars className="me-2" />
                            {isOpen && <span>Ẩn menu</span>}
                        </button>
                    </li>

                    {menuItems.map((item) => (
                        <li key={item.name} className="nav-item">
                            <Link
                                href={item.link}
                                className={`nav-link ${activeItem === item.name ? "active" : "text-dark"}`}
                                title={!isOpen ? item.name : ""}
                            >
                                <span className="me-2">{item.icon}</span>
                                {isOpen && (
                                    <div className="d-flex align-items-center justify-content-between w-100">
                                        <span>{item.name}</span>
                                    </div>
                                )}
                            </Link>
                        </li>
                    ))}

                    {showManageMenu && (
                        <li className="nav-item">
                            <button
                                className={`btn nav-link text-start w-100 ${(openManage || subMenuItems.some(sub => sub.link === pathname)) ? "active" : "text-dark"}`}
                                onClick={() => setOpenManage(!openManage)}
                                title={!isOpen ? "Quản lý" : ""}
                            >
                                <FaChartBar className="me-2" />
                                {isOpen && (
                                    <div className="d-flex align-items-center justify-content-between w-100">
                                        <span className={(openManage || subMenuItems.some(sub => sub.link === pathname)) ? "" : "text-dark"}>Quản lý</span>
                                    </div>
                                )}
                            </button>
                            {(openManage || subMenuItems.some(sub => sub.link === pathname)) && isOpen && (
                                <ul className="nav flex-column submenu">
                                    {subMenuItems.map((sub) => (
                                        <li key={sub.name}>
                                            <Link
                                                href={sub.link}
                                                className={`nav-link ${activeItem === sub.name ? "active" : "text-dark"}`}
                                                onClick={() => setActiveItem(sub.name)}
                                            >
                                                {sub.name}
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </li>
                    )}
                </ul>
            </div>
        </>
    );
}

export default Sidebar;