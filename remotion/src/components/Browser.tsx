import React from "react";

export const BrowserChrome: React.FC<{ url: string; children: React.ReactNode }> = ({ url, children }) => (
  <div style={{
    width: 1600, height: 900, margin: "90px auto", borderRadius: 16,
    background: "#1a1f2e", boxShadow: "0 40px 80px rgba(0,0,0,0.5)",
    overflow: "hidden", display: "flex", flexDirection: "column",
  }}>
    <div style={{
      height: 48, background: "#232936", display: "flex", alignItems: "center",
      padding: "0 16px", gap: 8,
    }}>
      <div style={{ width: 12, height: 12, borderRadius: 6, background: "#ff5f57" }} />
      <div style={{ width: 12, height: 12, borderRadius: 6, background: "#febc2e" }} />
      <div style={{ width: 12, height: 12, borderRadius: 6, background: "#28c840" }} />
      <div style={{
        marginLeft: 24, flex: 1, height: 30, borderRadius: 15, background: "#0f1320",
        color: "#9aa3b2", fontSize: 14, display: "flex", alignItems: "center",
        padding: "0 16px", fontFamily: "monospace",
      }}>🔒 {url}</div>
    </div>
    <div style={{ flex: 1, background: "#fff", position: "relative", overflow: "hidden" }}>{children}</div>
  </div>
);

export const Cursor: React.FC<{ x: number; y: number }> = ({ x, y }) => (
  <svg width="28" height="28" viewBox="0 0 24 24" style={{
    position: "absolute", left: x, top: y, zIndex: 100,
    filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.4))",
  }}>
    <path d="M2 2 L2 18 L7 13 L10 20 L13 19 L10 12 L17 12 Z" fill="#fff" stroke="#000" strokeWidth="1.5" />
  </svg>
);

export const StepBadge: React.FC<{ n: number; label: string }> = ({ n, label }) => (
  <div style={{
    position: "absolute", top: 40, left: 60, zIndex: 200,
    display: "flex", alignItems: "center", gap: 16,
    background: "rgba(11,15,23,0.9)", padding: "16px 28px",
    borderRadius: 999, border: "1px solid rgba(255,255,255,0.1)",
  }}>
    <div style={{
      width: 44, height: 44, borderRadius: 22, background: "#3b82f6",
      color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 22, fontWeight: 700,
    }}>{n}</div>
    <div style={{ color: "#fff", fontSize: 24, fontWeight: 600 }}>{label}</div>
  </div>
);
