'use client';

import React from "react";
import Scheduler from "../components/Scheduler";
import SideBar from "../components/SideBar";
import Header from "../components/Header";
import Footer from "../components/Footer";

function SchedulerPage() {
    return (
        <>
            <Header />
            <main className="d-flex">
                <SideBar />
                <div style={{ width: '100%', minHeight: '100vh', background: '#f9fafb' }}>
                    <div className="px-4 py-3 max-w-6xl mx-auto">
                        <h2 className="page-title" style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>SẮP XẾP LỊCH GIẢNG DẠY</h2>
                        <div className="flex justify-center mt-10">
                            <div className="w-full max-w-4xl">
                                <Scheduler />
                            </div>
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
            <style jsx global>{`
                main.d-flex {
                    align-items: flex-start !important;
                }
                .sidebar {
                    height: auto !important;
                    min-height: 100vh;
                }
                .px-4.py-3.bg-gray-50 {
                    height: auto !important;
                    min-height: unset !important;
                }
            `}</style>
        </>
    );
}

export default SchedulerPage;
