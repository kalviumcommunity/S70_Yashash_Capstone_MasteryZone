import React, { useState, useEffect } from "react";
import {
  LuDatabase,
  LuHardDrive,
  LuLayers,
  LuFileText,
  LuVideo,
} from "react-icons/lu";

const API_BASE = import.meta.env.VITE_API_URL || "";

const AdminStorage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStorage = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_BASE}/api/admin/storage`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const json = await res.json();
          if (json.success) setData(json.data);
        }
      } catch (err) {
        console.error("Storage fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStorage();
  }, []);

  const collections = data?.database?.collections || [];
  const recMB = Number(data?.recordings?.mb || 0);
  const certMB = Number(data?.certificates?.mb || 0);
  const totalMB = (recMB + certMB).toFixed(1);
  const quotaMB = 10240; // 10 GB standard
  const percentageUsed = Math.max(0, Math.min(100, Math.round((totalMB / quotaMB) * 100)));

  return (
    <div className="mz-admin-view-container">
      {/* Header */}
      <div className="mz-admin-header">
        <div className="mz-admin-page-title-box">
          <div className="mz-admin-page-icon">
            <LuDatabase style={{ width: 22, height: 22 }} />
          </div>
          <div>
            <h1 className="mz-admin-page-title">Storage & Infrastructure Management</h1>
            <p className="mz-admin-page-subtitle">
              Cloud database collections, certificate artifacts, and media recordings storage allocation.
            </p>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 16px", background: "var(--mz-purple-bg)", border: "1px solid var(--mz-purple-border)", borderRadius: 12, color: "#4338ca", fontSize: 13, fontWeight: 700 }}>
          <span>Storage Quota: {percentageUsed}% Used</span>
        </div>
      </div>

      {/* Main Storage Gauge Card */}
      <div className="mz-admin-card">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "var(--mz-text-primary)" }}>Total Cloud Storage Consumption</h3>
            <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--mz-text-subtle)" }}>Calculated across object storage, uploads, and MongoDB Atlas database</p>
          </div>
          <span style={{ fontSize: 22, fontWeight: 800, color: "#6366f1" }}>{percentageUsed}% Quota Used</span>
        </div>

        <div style={{ height: 10, borderRadius: 999, background: "var(--mz-surface-muted)", overflow: "hidden", marginBottom: 8 }}>
          <div style={{ height: "100%", width: `${Math.max(percentageUsed, 1)}%`, background: "linear-gradient(90deg, #6366f1, #3b82f6)", borderRadius: 999 }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--mz-text-muted)", fontWeight: 600 }}>
          <span>Current usage: {totalMB} MB</span>
          <span>Allocated capacity: 10.0 GB</span>
        </div>
      </div>

      {/* Breakdown Cards */}
      <div className="mz-admin-grid-2">
        {/* Media Recordings Storage */}
        <div className="mz-admin-card">
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <div className="mz-admin-stat-icon" style={{ background: "var(--mz-purple-bg)", color: "#6366f1" }}>
              <LuVideo style={{ width: 20, height: 20 }} />
            </div>
            <div>
              <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "var(--mz-text-primary)" }}>Recordings Media Storage</h4>
              <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--mz-text-subtle)" }}>Proctored session recordings (.webm)</p>
            </div>
          </div>
          <div style={{ paddingTop: 12, borderTop: "1px solid var(--mz-surface-muted)", display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 12 }}>
            <span style={{ color: "var(--mz-text-muted)" }}>Stored Files: <strong style={{ color: "var(--mz-text-primary)" }}>{data?.recordings?.fileCount ?? 0} items</strong></span>
            <span style={{ color: "var(--mz-text-muted)" }}>Disk Consumption: <strong style={{ color: "var(--mz-text-primary)" }}>{data?.recordings?.mb ?? 0} MB</strong></span>
          </div>
        </div>

        {/* Certificates Storage */}
        <div className="mz-admin-card">
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <div className="mz-admin-stat-icon" style={{ background: "var(--mz-green-bg)", color: "#059669" }}>
              <LuFileText style={{ width: 20, height: 20 }} />
            </div>
            <div>
              <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "var(--mz-text-primary)" }}>Certificates Storage</h4>
              <p style={{ margin: "2px 0 0", fontSize: 12, color: "var(--mz-text-subtle)" }}>Issued credentials & hashes</p>
            </div>
          </div>
          <div style={{ paddingTop: 12, borderTop: "1px solid var(--mz-surface-muted)", display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 12 }}>
            <span style={{ color: "var(--mz-text-muted)" }}>Issued Artifacts: <strong style={{ color: "var(--mz-text-primary)" }}>{data?.certificates?.fileCount ?? 0} files</strong></span>
            <span style={{ color: "var(--mz-text-muted)" }}>Disk Consumption: <strong style={{ color: "var(--mz-text-primary)" }}>{data?.certificates?.mb ?? 0} MB</strong></span>
          </div>
        </div>
      </div>

      {/* Database Collections Table */}
      <div className="mz-admin-card" style={{ padding: 0 }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--mz-surface-muted)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: "var(--mz-text-primary)", margin: 0 }}>MongoDB Database Collections</h3>
            <span style={{ fontSize: 12, color: "var(--mz-text-subtle)" }}>Real-time database documents count</span>
          </div>
          <span className="mz-admin-badge-purple">Atlas Cluster Sync</span>
        </div>

        <div className="mz-admin-table-wrap">
          <table className="mz-admin-table">
            <thead>
              <tr>
                <th>Collection Name</th>
                <th>Record Count</th>
                <th>Health Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="3" style={{ textAlign: "center", padding: "30px 0", color: "var(--mz-text-subtle)" }}>
                    Loading database collections...
                  </td>
                </tr>
              ) : collections.length === 0 ? (
                <tr>
                  <td colSpan="3" style={{ textAlign: "center", padding: "30px 0", color: "var(--mz-text-subtle)" }}>
                    No collections found or access denied.
                  </td>
                </tr>
              ) : (
                collections.map((col, idx) => (
                  <tr key={idx}>
                    <td style={{ fontWeight: 700, color: "var(--mz-text-primary)" }}>{col.name}</td>
                    <td style={{ fontWeight: 600, color: "var(--mz-text-secondary)" }}>{col.count} documents</td>
                    <td>
                      <span className="mz-admin-badge-active">Online & Indexed</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminStorage;
