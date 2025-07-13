'use client';

import React from "react";
import Scheduler from "../components/Scheduler";
import SideBar from "../components/SideBar";
import Header from "../components/Header";

function SchedulerPage() {
    return (
        <>
            <Header />
            <main className="d-flex justify-content-start align-items-start" style={{ minHeight: '100vh' }}>
                <SideBar />
                <div style={{ width: '100%' }}>
                    <Scheduler />
                </div>
            </main>
        </>
    );
}

export default SchedulerPage;
