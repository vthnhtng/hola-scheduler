'use client';
// Khoimom chinh style footer
import React from "react";
import logo from "../assets/logo/logo.png";

function Footer() {
  return (
    <footer className="footer bg-white text-[#27703A] py-3">
      <div className="container">
        <div className="row align-items-center">

          <div className="col-sm-3 footer-logo d-flex justify-content-center">
            <a href="https://qpan.vnu.edu.vn/">
              <img
                src={logo.src}
                className="img-fluid"
                alt="VNU Logo"
                style={{ maxHeight: "150px" }}
              />
            </a>
          </div>

          <div className="col-sm-9 text-center small-text">
            <h3 className="mb-1" style={{ fontSize: "1rem" }}>ĐẠI HỌC QUỐC GIA HÀ NỘI</h3>
            <h4 className="mb-1" style={{ fontSize: "0.9rem" }}>TRUNG TÂM GIÁO DỤC QUỐC PHÒNG VÀ AN NINH</h4>
            <h5 className="mb-3" style={{ fontSize: "0.85rem" }}>VNU - National Defense and Security Training Center</h5>
            <p className="mb-0" style={{ fontSize: "0.75rem" }}>
              <b>Địa chỉ:</b> Thôn 3, xã Thạch Hoà, huyện Thạch Thất, thành phố Hà Nội
            </p>
            <p className="mb-0" style={{ fontSize: "0.75rem" }}>
              <b>Điện thoại:</b> (+84) 024 3558 9544
            </p>
            <p className="mb-0" style={{ fontSize: "0.75rem" }}>
              <b>Website:</b>{" "}
              <a href="https://qpan.vnu.edu.vn/" className="text-black">
                qpan.vnu.edu.vn
              </a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
