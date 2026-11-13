import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import MasteryZoneCompilerWorkspace from "./MasteryZoneCompilerWorkspace";
import MasteryZoneGlobalLoader from "./MasteryZoneGlobalLoader";
import { deduplicatedFetch } from "../utils/apiClient";

const API_BASE = import.meta.env.VITE_API_URL || "";

export default function ChallengeWorkspaceModal({
  challenge: propChallenge,
  questionsList = [],
  currentQuestionIndex = 0,
  onSelectQuestion,
  onClose,
  onChallengeSolved,
  isStandalone = false,
}) {
  const { challengeId } = useParams();
  const navigate = useNavigate();
  const [challenge, setChallenge] = useState(propChallenge || null);
  const [loading, setLoading] = useState(!propChallenge);
  const token = localStorage.getItem("token");
  const [historyData, setHistoryData] = useState(null);

  const currentUserId = (() => {
    try {
      const rawUser = localStorage.getItem("user");
      if (rawUser) {
        const u = JSON.parse(rawUser);
        const uid = u._id || u.id || u.userId || "";
        return uid !== "guest" ? uid : "";
      }
    } catch {}
    return "";
  })();

  const effectiveChallengeId = propChallenge?.id || challengeId;

  // Load challenge if standalone or not passed
  useEffect(() => {
    if (propChallenge) {
      setChallenge(propChallenge);
      setLoading(false);
      return;
    }
    if (!challengeId) return;

    setLoading(true);
    deduplicatedFetch(`${API_BASE}/api/coding/challenges/${challengeId}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      cacheTtlMs: 5000,
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          setChallenge(data);
        }
      })
      .catch((err) => console.error("Failed to load challenge:", err))
      .finally(() => setLoading(false));
  }, [propChallenge, challengeId, token]);

  useEffect(() => {
    if (!effectiveChallengeId || !token) return;
    deduplicatedFetch(`${API_BASE}/api/coding/challenges/${effectiveChallengeId}/history`, {
      headers: { Authorization: `Bearer ${token}` },
      cacheTtlMs: 3000,
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        const subs = Array.isArray(data) ? data : (data?.submissions || data?.attempts || []);
        if (subs.length > 0) {
          setHistoryData({
            attemptsCount: subs.length,
            bestScore: Math.max(0, ...subs.map((s) => s.score ?? Math.round(((s.passedTests || 0) / (s.totalTests || 1)) * 100))),
            latestScore: subs[0] ? (subs[0].score ?? Math.round(((subs[0].passedTests || 0) / (subs[0].totalTests || 1)) * 100)) : 0,
            attempts: subs.map((s, idx) => ({
              attemptNumber: s.attemptNumber || subs.length - idx,
              code: s.code,
              language: s.language,
              passedTests: s.passedTests,
              totalTests: s.totalTests,
              score: s.score ?? Math.round(((s.passedTests || 0) / (s.totalTests || 1)) * 100),
              status: s.status,
              timestamp: s.createdAt || s.timestamp,
            })),
          });
        }
      })
      .catch(() => {});
  }, [effectiveChallengeId, token]);

  const handleClose = () => {
    if (onClose) onClose();
    if (isStandalone || !propChallenge) {
      if (window.opener) {
        window.close();
      } else {
        navigate("/coding");
      }
    }
  };

  if (loading || !challenge) {
    return <MasteryZoneGlobalLoader message="Loading Challenge Workspace..." />;
  }

  const isPlayground = Boolean(effectiveChallengeId?.startsWith("playground-") || challenge?.id?.startsWith("playground-"));
  const targetStarterLang = challenge.starterLanguage || "python";
  const isRetakeRequested = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("retake") === "true";

  return (
    <MasteryZoneCompilerWorkspace
      key={challenge.id}
      title={isPlayground ? `Code Playground | ${challenge.title}` : `Assignment | ${challenge.title} Challenge`}
      questionId={challenge.id}
      isProctored={true}
      isRetake={isRetakeRequested}
      problemData={challenge}
      starterCodeMap={challenge.starterCode || {}}
      defaultLanguage={targetStarterLang}
      testCases={challenge.testCases || []}
      questionsList={questionsList}
      currentQuestionIndex={currentQuestionIndex}
      onSelectQuestion={onSelectQuestion}
      historyUrl={`${API_BASE}/api/coding/challenges/${challenge.id}/history`}
      initialHistory={historyData}
      onSaveDraft={async (savedCode, lang) => {
        try {
          if (currentUserId) {
            const draftKey = `mz_${currentUserId}_ch_draft_${challenge.id}_${lang}`;
            localStorage.setItem(draftKey, savedCode);
          }
        } catch {}
      }}
      initialDraft={
        (currentUserId && localStorage.getItem(`mz_${currentUserId}_ch_draft_${challenge.id}_${targetStarterLang}`)) ||
        challenge.starterCode?.[targetStarterLang] ||
        (targetStarterLang === "python" ? "# Enter your code below\n" : "// Enter your code below\n")
      }
      onRun={async (code, lang, customInput) => {
        const res = await fetch(`${API_BASE}/api/coding/challenges/${challenge.id}/test`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            language: lang,
            code,
            customInput: customInput?.trim() ? customInput : undefined,
          }),
        });
        const text = await res.text();
        try {
          return text ? JSON.parse(text) : {};
        } catch {
          return { error: text || `Server error (${res.status})` };
        }
      }}
      onRunTests={async (code, lang) => {
        const res = await fetch(`${API_BASE}/api/coding/challenges/${challenge.id}/test`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            language: lang,
            code,
          }),
        });
        const text = await res.text();
        let data = {};
        try {
          data = text ? JSON.parse(text) : {};
        } catch {
          data = { error: text || `Server error (${res.status})` };
        }
        return data;
      }}
      onSubmit={async (code, lang) => {
        const res = await fetch(`${API_BASE}/api/coding/challenges/${challenge.id}/submit`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            language: lang,
            code,
          }),
        });
        const text = await res.text();
        let data = {};
        try {
          data = text ? JSON.parse(text) : {};
        } catch {
          data = { error: text || `Server error (${res.status})` };
        }
        if (data.status === "ACCEPTED" || data.passed || (Array.isArray(data.testResults) && data.testResults.length > 0 && data.testResults.every((t) => t.passed))) {
          try {
            if (currentUserId) {
              const solvedKey = `mz_${currentUserId}_ch_solved_${challenge.id}`;
              localStorage.setItem(solvedKey, "true");
            }
            window.dispatchEvent(new CustomEvent("mz_challenge_solved", { detail: { challengeId: challenge.id, userId: currentUserId } }));
          } catch {}
          if (onChallengeSolved) {
            onChallengeSolved(challenge, data);
          }
        }
        return data;
      }}
      onClose={handleClose}
    />
  );
}
