"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function SystemLoginForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const json = await res.json();
      if (res.ok) {
        router.push("/system/upgrade-requests");
      } else {
        setError(json.error ?? "Đăng nhập thất bại");
      }
    } finally { setLoading(false); }
  }

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "#0a0f1e", fontFamily: "system-ui, sans-serif",
    }}>
      <div style={{
        width: "100%", maxWidth: 380, padding: 32,
        background: "#111827", border: "1px solid rgba(255,255,255,.1)",
        borderRadius: 16, boxShadow: "0 25px 60px rgba(0,0,0,.6)",
      }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12, background: "rgba(59,91,219,.2)",
            border: "1px solid rgba(59,91,219,.4)", display: "flex", alignItems: "center",
            justifyContent: "center", margin: "0 auto 14px",
          }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="#6582ff" strokeWidth={2} strokeLinecap="round" width={22} height={22}>
              <path d="M12 2l8 4v6c0 5-3.5 8-8 10-4.5-2-8-5-8-10V6z"/>
            </svg>
          </div>
          <h1 style={{ color: "#e8eeff", fontSize: "1.2rem", fontWeight: 800, margin: 0 }}>System Admin</h1>
          <p style={{ color: "rgba(180,200,255,.5)", fontSize: ".84rem", marginTop: 6 }}>jobihome.vn — Quản trị hệ thống</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{ display: "block", fontSize: ".8rem", fontWeight: 600, color: "rgba(180,200,255,.6)", marginBottom: 6 }}>
              Username
            </label>
            <input
              type="text" value={username} onChange={e => setUsername(e.target.value)}
              autoComplete="username" required
              style={{
                width: "100%", background: "rgba(255,255,255,.05)", border: "1.5px solid rgba(255,255,255,.12)",
                borderRadius: 9, padding: "10px 13px", color: "#e8eeff", fontSize: ".92rem",
                outline: "none", fontFamily: "inherit", boxSizing: "border-box",
              }}
              onFocus={e => (e.target.style.borderColor = "rgba(99,130,255,.6)")}
              onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,.12)")}
            />
          </div>
          <div>
            <label style={{ display: "block", fontSize: ".8rem", fontWeight: 600, color: "rgba(180,200,255,.6)", marginBottom: 6 }}>
              Mật khẩu
            </label>
            <input
              type="password" value={password} onChange={e => setPassword(e.target.value)}
              autoComplete="current-password" required
              style={{
                width: "100%", background: "rgba(255,255,255,.05)", border: "1.5px solid rgba(255,255,255,.12)",
                borderRadius: 9, padding: "10px 13px", color: "#e8eeff", fontSize: ".92rem",
                outline: "none", fontFamily: "inherit", boxSizing: "border-box",
              }}
              onFocus={e => (e.target.style.borderColor = "rgba(99,130,255,.6)")}
              onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,.12)")}
            />
          </div>

          {error && (
            <div style={{
              background: "rgba(239,68,68,.12)", border: "1px solid rgba(239,68,68,.25)",
              borderRadius: 8, padding: "9px 12px", fontSize: ".84rem", color: "#f87171",
            }}>
              {error}
            </div>
          )}

          <button
            type="submit" disabled={loading}
            style={{
              background: loading ? "rgba(59,91,219,.5)" : "#3B5BDB", color: "#fff",
              border: "none", borderRadius: 10, padding: "11px 0", fontSize: ".92rem",
              fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit",
              marginTop: 4, transition: "background .15s",
            }}
          >
            {loading ? "Đang đăng nhập…" : "Đăng nhập"}
          </button>
        </form>
      </div>
    </div>
  );
}
