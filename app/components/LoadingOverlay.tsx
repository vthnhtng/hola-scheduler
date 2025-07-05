import React from 'react';

export default function LoadingOverlay({ show, text = "Đang xử lý..." }: { show: boolean, text?: string }) {
  if (!show) return null;
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      background: 'rgba(128,128,128,0.35)',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div style={{
        background: 'white',
        borderRadius: 12,
        padding: '32px 48px',
        boxShadow: '0 4px 24px rgba(0,0,0,0.18)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 16,
      }}>
        <div style={{
          width: 40,
          height: 40,
          border: '5px solid #4CAF50',
          borderTop: '5px solid transparent',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          marginBottom: 12,
        }} />
        <span style={{ color: '#222', fontWeight: 600, fontSize: 18 }}>{text}</span>
        <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
} 