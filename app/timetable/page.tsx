"use client";

import React from "react";
import TimeTable from "../components/TimeTable";
import SideBar from "../components/SideBar";
import Header from "../components/Header";

function TimetablePage() {
    return (
        <>
            <Header />
            <main className="d-flex justify-content-start align-items-start" style={{ minHeight: '100vh' }}>
                <SideBar />
                <div style={{ width: '100%' }}>
                    <TimeTable />
                </div>
            </main>
        </>
    );
}

export default TimetablePage;
