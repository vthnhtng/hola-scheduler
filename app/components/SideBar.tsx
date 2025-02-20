import { useState } from "react";
import { FaHome, FaUser, FaChalkboardTeacher, FaBook, FaMapMarkerAlt, FaCog, FaChartBar, FaQuestionCircle,} from "react-icons/fa";

function SideBar() {
  const [openManage, setOpenManage] = useState(false);
  const [activeItem, setActiveItem] = useState("Giảng viên");

  return (
    <div className="d-flex flex-column bg-light vh-100 p-3 border-end" style={{ width: "250px" }}>
      <ul className="nav flex-column">
        <li className="nav-item">
          <a
            href="#"
            className={`nav-link d-flex align-items-center ${activeItem === "Trang chủ" ? "active text-primary fw-bold" : "text-dark"}`}
            onClick={() => setActiveItem("Trang chủ")}
          >
            <FaHome className="me-2" /> Trang chủ
          </a>
        </li>

        <li className="nav-item">
          <a
            href="#"
            className={`nav-link d-flex align-items-center ${activeItem === "Tài khoản" ? "active text-primary fw-bold" : "text-dark"}`}
            onClick={() => setActiveItem("Tài khoản")}
          >
            <FaUser className="me-2" /> Tài khoản
          </a>
        </li>

        <li className="nav-item">
          <a
            href="#"
            className={`nav-link d-flex align-items-center ${activeItem === "Lịch giảng dạy" ? "active text-primary fw-bold" : "text-dark"}`}
            onClick={() => setActiveItem("Lịch giảng dạy")}
          >
            <FaChalkboardTeacher className="me-2" /> Lịch giảng dạy
          </a>
        </li>

        <li className="nav-item">
          <button
            className="btn text-start nav-link d-flex align-items-center w-100"
            onClick={() => setOpenManage(!openManage)}
          >
            <FaChartBar className="me-2" /> Quản lý
          </button>
          {openManage && (
            <ul className="nav flex-column ps-3">
              <li className="nav-item">
                <a
                  href="#"
                  className={`nav-link ${activeItem === "Giảng viên" ? "active text-primary fw-bold" : "text-dark"}`}
                  onClick={() => setActiveItem("Giảng viên")}
                >
                  <FaUser className="me-2" /> Giảng viên
                </a>
              </li>
              <li className="nav-item">
                <a
                  href="#"
                  className={`nav-link ${activeItem === "Môn học" ? "active text-primary fw-bold" : "text-dark"}`}
                  onClick={() => setActiveItem("Môn học")}
                >
                  <FaBook className="me-2" /> Môn học
                </a>
              </li>
              <li className="nav-item">
                <a
                  href="#"
                  className={`nav-link ${activeItem === "Địa điểm học" ? "active text-primary fw-bold" : "text-dark"}`}
                  onClick={() => setActiveItem("Địa điểm học")}
                >
                  <FaMapMarkerAlt className="me-2" /> Địa điểm học
                </a>
              </li>
            </ul>
          )}
        </li>

        <li className="nav-item">
          <a
            href="#"
            className={`nav-link d-flex align-items-center ${activeItem === "Cài đặt" ? "active text-primary fw-bold" : "text-dark"}`}
            onClick={() => setActiveItem("Cài đặt")}
          >
            <FaCog className="me-2" /> Cài đặt
          </a>
        </li>

        <li className="nav-item">
          <a
            href="#"
            className={`nav-link d-flex align-items-center ${activeItem === "Thống kê" ? "active text-primary fw-bold" : "text-dark"}`}
            onClick={() => setActiveItem("Thống kê")}
          >
            <FaChartBar className="me-2" /> Thống kê
          </a>
        </li>

        <li className="nav-item">
          <a
            href="#"
            className={`nav-link d-flex align-items-center ${activeItem === "Hỗ trợ" ? "active text-primary fw-bold" : "text-dark"}`}
            onClick={() => setActiveItem("Hỗ trợ")}
          >
            <FaQuestionCircle className="me-2" /> Hỗ trợ
          </a>
        </li>
      </ul>
    </div>
  );
}

export default SideBar;
