'use client';

import { useState, useEffect } from "react";
import { usePathname } from 'next/navigation';
import { FaHome, FaUser, FaChalkboardTeacher, FaChartBar, FaBars } from "react-icons/fa";
import Link from "next/link";

function Sidebar() {
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(true);
    const [activeItem, setActiveItem] = useState("");
    const [openManage, setOpenManage] = useState(false);

    const menuItems = [
        { name: "Trang chủ", icon: <FaHome />, link: "/" },
        { name: "Tài khoản", icon: <FaUser />, link: "/users" },
        { name: "Lịch giảng dạy", icon: <FaChalkboardTeacher />, link: "/schedule" },
    ];

    const subMenuItems = [
        { name: "Giảng viên", link: "/lecturers" },
        { name: "Học phần", link: "/subjects" },
        { name: "Địa điểm học", link: "/locations" },
        { name: "Chương trình học", link: "/curriculums" },
        { name: "Đại đội", link: "/teams" },
    ];

    useEffect(() => {
        const matchedMain = menuItems.find(item => item.link === pathname);
        const matchedSub = subMenuItems.find(item => item.link === pathname);
        setActiveItem(matchedSub?.name || matchedMain?.name || "");
        setOpenManage(Boolean(matchedSub));
    }, [pathname]);

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
                `}
            </style>

            <div className={`sidebar ${isOpen ? "open" : "collapsed"}`}>
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
                                {isOpen && <span>{item.name}</span>}
                            </Link>
                        </li>
                    ))}

                    <li className="nav-item">
                        <button
                            className={`btn nav-link text-start w-100 ${openManage ? "active" : "text-dark"}`}
                            onClick={() => setOpenManage(!openManage)}
                            title={!isOpen ? "Quản lý" : ""}
                        >
                            <FaChartBar className="me-2" />
                            {isOpen && <span className={openManage ? "" : "text-dark"}>Quản lý</span>}
                        </button>

                        {openManage && isOpen && (
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
                </ul>
            </div>
        </>
    );
}

export default Sidebar;