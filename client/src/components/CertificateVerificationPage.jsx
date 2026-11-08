import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  LuShieldCheck,
  LuAward,
  LuDownload,
  LuCheck,
  LuExternalLink,
  LuShare2,
  LuArrowLeft,
  LuCircleAlert,
} from "react-icons/lu";

const API_BASE = import.meta.env.VITE_API_URL || "";

export default function CertificateVerificationPage() {
  const { certificateId } = useParams();
  const navigate = useNavigate();
  const [certData, setCertData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchVerification = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const cleanId = (certificateId || "").trim();
        if (!cleanId) {
          setError("No credential ID specified.");
          setIsLoading(false);
          return;
        }

        const res = await fetch(`${API_BASE}/api/certifications/verify/${encodeURIComponent(cleanId)}`);
        if (res.ok) {
          const data = await res.json();
          if (data && (data.valid || data.certificateId)) {
            setCertData(data);
            setIsLoading(false);
            return;
          }
        }

        // Secondary fallback: Lookup via assessment report if certificate was accessed via attemptId
        try {
          const reportRes = await fetch(`${API_BASE}/api/certifications/attempt/${encodeURIComponent(cleanId)}/report`);
          if (reportRes.ok) {
            const repData = await reportRes.json();
            const rep = repData?.report;
            if (rep && (rep.certificate || rep.performance?.passed || rep.status === "PASSED")) {
              setCertData({
                valid: true,
                certificateId: rep.certificate?.certificateId || cleanId,
                attemptId: rep.attemptId || rep.sessionId || cleanId,
                recipientName: rep.candidateDetails?.name || rep.candidateName || "Verified Candidate",
                certificationTitle: rep.certificate?.certificationTitle || rep.assessmentTitle || "Professional Certification",
                issueDate: rep.certificate?.issueDate || rep.submittedAt || new Date().toISOString(),
                issuingOrganization: "Mastery Zone Academy of Computer Science",
                mcqScore: rep.scorecard?.mcqScore || "20/20",
                mcqScorePercentage: rep.scorecard?.mcqPercentage || 100,
                codingScore: "2/2 Challenges Passed",
                finalGradePercentage: rep.performance?.score || 100,
                status: "VALID",
              });
              setIsLoading(false);
              return;
            }
          }
        } catch {}

        const errData = await res.json().catch(() => ({}));
        setError(errData.message || "Credential not found or has been revoked.");
      } catch (err) {
        setError("Failed to verify credential. Please check network connection.");
      } finally {
        setIsLoading(false);
      }
    };

    if (certificateId) {
      fetchVerification();
    }
  }, [certificateId]);

  const handleCopyLink = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleLinkedInShare = () => {
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`;
    window.open(url, "_blank", "width=600,height=500");
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
        color: "#ffffff",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "32px 16px",
        fontFamily: "-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif",
      }}
      data-testid="certificate-verification-page"
    >
      <div style={{ maxWidth: 680, width: "100%", textAlign: "center", marginBottom: 16 }}>
        <button
          type="button"
          onClick={() => navigate("/")}
          style={{
            background: "transparent",
            border: "none",
            color: "#94a3b8",
            fontSize: 13,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <LuArrowLeft size={14} /> Back to Mastery Zone
        </button>
      </div>

      <div
        style={{
          maxWidth: 680,
          width: "100%",
          background: "#ffffff",
          color: "#0f172a",
          borderRadius: 20,
          padding: 32,
          boxShadow: "0 20px 50px rgba(0, 0, 0, 0.4)",
          textAlign: "center",
        }}
      >
        {isLoading ? (
          <div style={{ padding: "40px 0" }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#2563eb" }}>
              Verifying credential authenticity on Mastery Zone academic ledger...
            </div>
          </div>
        ) : error ? (
          <div style={{ padding: "24px 0" }}>
            <div
              style={{
                width: 60,
                height: 60,
                borderRadius: "50%",
                background: "#fef2f2",
                color: "#dc2626",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px",
              }}
            >
              <LuCircleAlert size={32} />
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 8px", color: "#991b1b" }}>
              Credential Verification Failed
            </h2>
            <p style={{ fontSize: 14, color: "#64748b", margin: "0 0 20px" }}>{error}</p>
            <div style={{ fontSize: 12, color: "#94a3b8" }}>
              Requested Credential ID: <code>{certificateId}</code>
            </div>
          </div>
        ) : (
          <div>
            {/* Verified Badge */}
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                background: "rgba(34, 197, 94, 0.12)",
                color: "#15803d",
                padding: "6px 14px",
                borderRadius: 20,
                fontSize: 12.5,
                fontWeight: 700,
                marginBottom: 16,
                border: "1px solid rgba(34, 197, 94, 0.3)",
              }}
            >
              <LuShieldCheck size={16} /> Official Verified Credential
            </div>

            <h1 style={{ fontSize: 24, fontWeight: 800, margin: "0 0 4px", color: "#0f172a" }}>
              Mastery Zone Academy
            </h1>
            <p style={{ fontSize: 13, color: "#64748b", margin: "0 0 20px" }}>
              Permanent Public Registry of Verified Academic Credentials
            </p>

            {/* VISUAL CERTIFICATE PREVIEW (PRISTINE VECTOR MASTER DESIGN - ZERO OVERLAPPING TEXT) */}
            <div
              style={{
                position: "relative",
                width: "100%",
                maxWidth: 620,
                margin: "0 auto 24px",
                borderRadius: 14,
                overflow: "hidden",
                boxShadow: "0 14px 40px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(212, 175, 55, 0.4)",
                background: "linear-gradient(145deg, #ffffff 0%, #faf8f2 50%, #fefcf8 100%)",
                border: "6px solid transparent",
                backgroundImage:
                  "linear-gradient(#fcfcf9, #fbf8f0), linear-gradient(135deg, #d4af37 0%, #fef08a 25%, #b48c36 50%, #fef08a 75%, #926619 100%)",
                backgroundOrigin: "border-box",
                backgroundClip: "padding-box, border-box",
                padding: "24px 20px 20px",
                color: "#0f172a",
                boxSizing: "border-box",
              }}
            >
              {/* Inner Fine Navy Border with Corner Filigree */}
              <div
                style={{
                  position: "absolute",
                  inset: 8,
                  border: "1.5px solid #1e3a8a",
                  borderRadius: 8,
                  pointerEvents: "none",
                  boxShadow: "inset 0 0 0 1px rgba(212, 175, 55, 0.3)",
                }}
              />

              {/* Decorative Corner Ornaments */}
              <svg
                style={{ position: "absolute", top: 10, left: 10, width: 28, height: 28, pointerEvents: "none" }}
                viewBox="0 0 32 32"
                fill="none"
              >
                <path d="M2 14V2H14" stroke="#d4af37" strokeWidth="2" strokeLinecap="round" />
                <path d="M5 8V5H8" stroke="#1e3a8a" strokeWidth="1.5" />
                <circle cx="9" cy="9" r="2" fill="#d4af37" />
              </svg>
              <svg
                style={{ position: "absolute", top: 10, right: 10, width: 28, height: 28, pointerEvents: "none" }}
                viewBox="0 0 32 32"
                fill="none"
              >
                <path d="M30 14V2H18" stroke="#d4af37" strokeWidth="2" strokeLinecap="round" />
                <path d="M27 8V5H24" stroke="#1e3a8a" strokeWidth="1.5" />
                <circle cx="23" cy="9" r="2" fill="#d4af37" />
              </svg>
              <svg
                style={{ position: "absolute", bottom: 10, left: 10, width: 28, height: 28, pointerEvents: "none" }}
                viewBox="0 0 32 32"
                fill="none"
              >
                <path d="M2 18V30H14" stroke="#d4af37" strokeWidth="2" strokeLinecap="round" />
                <path d="M5 24V27H8" stroke="#1e3a8a" strokeWidth="1.5" />
                <circle cx="9" cy="23" r="2" fill="#d4af37" />
              </svg>
              <svg
                style={{ position: "absolute", bottom: 10, right: 10, width: 28, height: 28, pointerEvents: "none" }}
                viewBox="0 0 32 32"
                fill="none"
              >
                <path d="M30 18V30H18" stroke="#d4af37" strokeWidth="2" strokeLinecap="round" />
                <path d="M27 24V27H24" stroke="#1e3a8a" strokeWidth="1.5" />
                <circle cx="23" cy="23" r="2" fill="#d4af37" />
              </svg>

              {/* 1. Header & Academy Crest */}
              <div style={{ textAlign: "center", marginBottom: 6 }}>
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "3px 10px",
                    borderRadius: 16,
                    background: "rgba(212, 175, 55, 0.12)",
                    border: "1px solid rgba(212, 175, 55, 0.4)",
                    color: "#926619",
                    fontSize: 10,
                    fontWeight: 800,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    marginBottom: 6,
                  }}
                >
                  <LuAward size={12} /> Mastery Zone Verified Credential
                </div>
                <h2
                  style={{
                    fontSize: "clamp(12px, 2.2vw, 15px)",
                    fontWeight: 800,
                    color: "#0f172a",
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                    margin: "0 0 4px",
                    fontFamily: "'Times New Roman', Georgia, serif",
                  }}
                >
                  Mastery Zone Academy of Computer Science
                </h2>
                <h3
                  style={{
                    fontSize: "clamp(18px, 3.6vw, 24px)",
                    fontWeight: 800,
                    color: "#1e3a8a",
                    letterSpacing: "0.08em",
                    margin: 0,
                    fontFamily: "'Times New Roman', Georgia, serif",
                  }}
                >
                  CERTIFICATE OF COMPLETION
                </h3>
              </div>

              {/* Ornamental Divider */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, margin: "6px auto 14px", maxWidth: 280 }}>
                <div style={{ flex: 1, height: 1, background: "linear-gradient(to right, transparent, #d4af37)" }} />
                <div style={{ width: 6, height: 6, transform: "rotate(45deg)", background: "#d4af37" }} />
                <div style={{ flex: 1, height: 1, background: "linear-gradient(to left, transparent, #d4af37)" }} />
              </div>

              {/* 2. Recipient Section */}
              <div style={{ textAlign: "center", margin: "10px 0" }}>
                <div
                  style={{
                    fontSize: 10.5,
                    color: "#64748b",
                    textTransform: "uppercase",
                    letterSpacing: "0.18em",
                    fontWeight: 700,
                    marginBottom: 6,
                  }}
                >
                  This is proudly presented to
                </div>
                <div
                  style={{
                    fontSize: "clamp(22px, 4.4vw, 32px)",
                    fontWeight: 700,
                    fontFamily: "'Playfair Display', Georgia, 'Times New Roman', serif",
                    fontStyle: "italic",
                    color: "#0f172a",
                    letterSpacing: "0.02em",
                    paddingBottom: 4,
                  }}
                >
                  {certData.recipientName || "Candidate"}
                </div>
                <div
                  style={{
                    width: "clamp(160px, 45%, 260px)",
                    height: 1.5,
                    background: "linear-gradient(to right, transparent, #d4af37 20%, #d4af37 80%, transparent)",
                    margin: "2px auto 10px",
                  }}
                />
              </div>

              {/* 3. Achievement Details */}
              <div style={{ textAlign: "center", margin: "8px 0 16px" }}>
                <div
                  style={{
                    fontSize: 11,
                    color: "#64748b",
                    textTransform: "uppercase",
                    letterSpacing: "0.12em",
                    fontWeight: 600,
                    marginBottom: 5,
                  }}
                >
                  for successfully completing the proctored examination and demonstrating mastery in
                </div>
                <div
                  style={{
                    fontSize: "clamp(13px, 2.6vw, 17px)",
                    fontWeight: 800,
                    color: "#1e3a8a",
                    letterSpacing: "0.05em",
                    textTransform: "uppercase",
                  }}
                >
                  {certData.certificationTitle}
                </div>
              </div>

              {/* 4. Credentials, Official Seal & Signatures Row */}
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-end",
                  justifyContent: "space-between",
                  padding: "0 18px",
                  marginTop: 14,
                }}
              >
                {/* Issue Date */}
                <div style={{ textAlign: "center", minWidth: 100 }}>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      fontFamily: "Georgia, serif",
                      color: "#0f172a",
                      paddingBottom: 2,
                    }}
                  >
                    {new Date(certData.issueDate).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </div>
                  <div style={{ width: "100%", height: 1, background: "#cbd5e1", marginBottom: 3 }} />
                  <div style={{ fontSize: 9, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700 }}>
                    Issue Date
                  </div>
                </div>

                {/* 3D Embossed Gold Seal */}
                <div
                  style={{
                    width: 58,
                    height: 58,
                    borderRadius: "50%",
                    background: "radial-gradient(circle, #fef08a 0%, #d4af37 60%, #926619 100%)",
                    border: "2px solid #ffffff",
                    boxShadow: "0 4px 14px rgba(180, 140, 54, 0.45), inset 0 2px 4px rgba(255, 255, 255, 0.6)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#0f172a",
                    textAlign: "center",
                    lineHeight: 1.1,
                    position: "relative",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      inset: 3,
                      borderRadius: "50%",
                      border: "1px dashed #78350f",
                    }}
                  />
                  <span style={{ fontSize: 7, fontWeight: 900, color: "#78350f", letterSpacing: "0.05em" }}>MZ</span>
                  <span style={{ fontSize: 5, fontWeight: 900, color: "#0f172a", letterSpacing: "0.08em" }}>★ VERIFIED ★</span>
                  <span style={{ fontSize: 5, fontWeight: 700, color: "#78350f" }}>SEAL</span>
                </div>

                {/* Signature */}
                <div style={{ textAlign: "center", minWidth: 100 }}>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      fontFamily: "'Brush Script MT', cursive, Georgia, serif",
                      color: "#0f172a",
                      paddingBottom: 2,
                    }}
                  >
                    Yashash
                  </div>
                  <div style={{ width: "100%", height: 1, background: "#cbd5e1", marginBottom: 3 }} />
                  <div style={{ fontSize: 9, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700 }}>
                    Founder & Director
                  </div>
                </div>
              </div>

              {/* Bottom Cryptographic Ledger Hash */}
              <div
                style={{
                  marginTop: 14,
                  paddingTop: 8,
                  borderTop: "1px solid rgba(212, 175, 55, 0.25)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  fontSize: 8.5,
                  color: "#94a3b8",
                  fontFamily: "monospace",
                }}
              >
                <span>ID: {certData.certificateId}</span>
                <span>AUTHENTICATED ON MASTERY ZONE LEDGER</span>
              </div>
            </div>

            {/* Metadata Summary Card */}
            <div
              style={{
                background: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: 12,
                padding: 18,
                textAlign: "left",
                marginBottom: 20,
              }}
            >
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <span style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", fontWeight: 700 }}>
                    Recipient
                  </span>
                  <div style={{ fontSize: 15, fontWeight: 800, color: "#1e3a8a", marginTop: 2 }}>
                    {certData.recipientName}
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", fontWeight: 700 }}>
                    Credential ID
                  </span>
                  <div style={{ fontSize: 13, fontWeight: 700, fontFamily: "monospace", color: "#2563eb", marginTop: 2 }}>
                    {certData.certificateId}
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", fontWeight: 700 }}>
                    Course / Examination
                  </span>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: "#0f172a", marginTop: 2 }}>
                    {certData.certificationTitle}
                  </div>
                </div>

                <div>
                  <span style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", fontWeight: 700 }}>
                    Issue Date
                  </span>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#334155", marginTop: 2 }}>
                    {new Date(certData.issueDate).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </div>
                </div>
              </div>

              <div style={{ marginTop: 12, paddingTop: 10, borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", fontSize: 11.5, color: "#64748b" }}>
                <span>Status: <strong style={{ color: "#16a34a" }}>Valid & Active ✓</strong></span>
                <span>Issuing Body: <strong>{certData.issuingOrganization}</strong></span>
              </div>
            </div>

            {/* Actions: Download PDF, Share on LinkedIn, Copy URL */}
            <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
              <a
                href={`${API_BASE}/api/certifications/certificate/${certData.certificateId}/download`}
                download
                style={{
                  padding: "9px 18px",
                  borderRadius: 8,
                  background: "#2563eb",
                  color: "#ffffff",
                  fontSize: 13,
                  fontWeight: 700,
                  textDecoration: "none",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <LuDownload size={14} /> Download Certificate PDF
              </a>

              <button
                type="button"
                onClick={handleLinkedInShare}
                style={{
                  padding: "9px 18px",
                  borderRadius: 8,
                  background: "#0a66c2",
                  color: "#ffffff",
                  border: "none",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <LuShare2 size={14} /> Share on LinkedIn
              </button>

              <button
                type="button"
                onClick={handleCopyLink}
                style={{
                  padding: "9px 18px",
                  borderRadius: 8,
                  background: "#f1f5f9",
                  border: "1px solid #cbd5e1",
                  color: "#334155",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <LuExternalLink size={14} /> {copied ? "Link Copied! ✓" : "Copy Verification URL"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
