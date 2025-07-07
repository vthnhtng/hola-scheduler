"use client";
import React, { useState } from "react";

export default function SchedulePage() {
  const [teamIds, setTeamIds] = useState<string>("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const handleRunAll = async () => {
    setLoading(true);
    setResult(null);
    setShowModal(true);
    const ids = teamIds.split(",").map((id) => Number(id.trim())).filter(Boolean);
    // 1. Check file status
    const statusRes = await fetch("/api/schedule-file-status", {
      method: "POST",
      body: JSON.stringify({ teamIds: ids, startDate, endDate }),
      headers: { "Content-Type": "application/json" },
    });
    const status = await statusRes.json();
    // 2. Generate schedules
    const genRes = await fetch("/api/generate-schedules", {
      method: "POST",
      body: JSON.stringify({ teamIds: ids, startDate, endDate }),
      headers: { "Content-Type": "application/json" },
    });
    const gen = await genRes.json();
    // 3. Assign lecturer/location
    const assignRes = await fetch("/api/assign-lecturer-location", {
      method: "POST",
      body: JSON.stringify({ teamIds: ids, startDate, endDate }),
      headers: { "Content-Type": "application/json" },
    });
    const assign = await assignRes.json();
    // 4. Check file status again
    const statusAfterRes = await fetch("/api/schedule-file-status", {
      method: "POST",
      body: JSON.stringify({ teamIds: ids, startDate, endDate }),
      headers: { "Content-Type": "application/json" },
    });
    const statusAfter = await statusAfterRes.json();
    setResult({ status, gen, assign, statusAfter });
    setLoading(false);
  };

  return (
    <div style={{ padding: 24 }}>
      <h2>Lập lịch môn học & phân công (All-in-one)</h2>
      <div style={{ marginBottom: 16 }}>
        <label>Team IDs (phẩy): </label>
        <input value={teamIds} onChange={e => setTeamIds(e.target.value)} style={{ width: 120, marginRight: 16 }} />
        <label>Start Date: </label>
        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={{ marginRight: 16 }} />
        <label>End Date: </label>
        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={{ marginRight: 16 }} />
        <button onClick={handleRunAll} disabled={loading || !teamIds || !startDate || !endDate}>
          Chạy tất cả & Xem kết quả
        </button>
      </div>
      {/* Modal popup */}
      {showModal && (
        <div style={{
          position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", background: "rgba(0,0,0,0.3)", zIndex: 1000,
          display: "flex", alignItems: "center", justifyContent: "center"
        }} onClick={() => setShowModal(false)}>
          <div style={{ background: "#fff", padding: 24, borderRadius: 8, minWidth: 600, maxHeight: "80vh", overflow: "auto" }} onClick={e => e.stopPropagation()}>
            <h3>Kết quả từng bước</h3>
            {loading && <div>Đang xử lý...</div>}
            {result && (
              <>
                <h4>1. Trạng thái file trước khi chạy</h4>
                <pre style={{ background: '#f5f5f5', maxHeight: 120, overflow: 'auto' }}>{JSON.stringify(result.status, null, 2)}</pre>
                <h4>2. Sinh lịch môn học</h4>
                <pre style={{ background: '#f5f5f5', maxHeight: 120, overflow: 'auto' }}>{JSON.stringify(result.gen, null, 2)}</pre>
                <h4>3. Phân công GV/Địa điểm</h4>
                <pre style={{ background: '#f5f5f5', maxHeight: 120, overflow: 'auto' }}>{JSON.stringify(result.assign, null, 2)}</pre>
                <h4>4. Trạng thái file sau khi chạy</h4>
                <pre style={{ background: '#f5f5f5', maxHeight: 120, overflow: 'auto' }}>{JSON.stringify(result.statusAfter, null, 2)}</pre>
              </>
            )}
            <div style={{ textAlign: "right", marginTop: 16 }}>
              <button onClick={() => setShowModal(false)}>Đóng</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 