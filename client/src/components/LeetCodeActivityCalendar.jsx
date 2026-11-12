import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  LuFlame,
  LuTrophy,
  LuCircleCheck,
  LuCalendar,
  LuChevronRight,
  LuCode,
  LuSparkles,
  LuX,
  LuRefreshCw,
  LuExternalLink,
} from "react-icons/lu";
import { toast } from "react-toastify";
import "./LeetCodeActivityCalendar.css";

const API_BASE = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/+$/, "");

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];
const DAY_LABELS = ["", "Mon", "", "Wed", "", "Fri", ""];

export default function LeetCodeActivityCalendar({
  userId,
  initialData,
  compact = false,
  onNavigate,
}) {
  const [activityData, setActivityData] = useState(initialData || null);
  const [isLoading, setIsLoading] = useState(!initialData);
  const [hoveredCell, setHoveredCell] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [selectedDayDetail, setSelectedDayDetail] = useState(null);

  const clientTimezone = useMemo(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Kolkata";
    } catch {
      return "Asia/Kolkata";
    }
  }, []);

  const fetchActivity = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token && !userId) return;

    try {
      const endpoint = userId
        ? `${API_BASE}/api/coding/activity/${userId}?tz=${encodeURIComponent(clientTimezone)}`
        : `${API_BASE}/api/coding/activity?tz=${encodeURIComponent(clientTimezone)}`;

      const res = await fetch(endpoint, {
        headers: {
          Authorization: `Bearer ${token}`,
          "x-timezone": clientTimezone,
        },
      });

      if (res.ok) {
        const json = await res.json();
        setActivityData(json);
      }
    } catch (err) {
      console.warn("Could not load activity streak calendar:", err);
    } finally {
      setIsLoading(false);
    }
  }, [userId, clientTimezone]);

  useEffect(() => {
    if (initialData) {
      setActivityData(initialData);
      setIsLoading(false);
    } else {
      fetchActivity();
    }
  }, [initialData, fetchActivity]);

  // Real-time synchronization via storage & socket events
  useEffect(() => {
    const handleSync = () => {
      fetchActivity();
    };

    window.addEventListener("storage", handleSync);
    window.addEventListener("mz_activity_updated", handleSync);
    window.addEventListener("mz_challenge_submitted", handleSync);

    return () => {
      window.removeEventListener("storage", handleSync);
      window.removeEventListener("mz_activity_updated", handleSync);
      window.removeEventListener("mz_challenge_submitted", handleSync);
    };
  }, [fetchActivity]);

  // Build the 53-week 7-day grid ending on Saturday of current week
  const { weeks, monthPositions } = useMemo(() => {
    const now = new Date();
    // Normalize to user's local date
    const todayStr = (() => {
      try {
        const fmt = new Intl.DateTimeFormat("en-CA", {
          timeZone: clientTimezone,
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        });
        return fmt.format(now);
      } catch {
        const y = now.getFullYear();
        const m = String(now.getMonth() + 1).padStart(2, "0");
        const d = String(now.getDate()).padStart(2, "0");
        return `${y}-${m}-${d}`;
      }
    })();

    const [curY, curM, curD] = todayStr.split("-").map(Number);
    const todayDate = new Date(Date.UTC(curY, curM - 1, curD));

    // End on Saturday of current week to produce a complete rectangle
    const todayDayOfWeek = todayDate.getUTCDay(); // 0 is Sun, 6 is Sat
    const daysUntilSaturday = 6 - todayDayOfWeek;
    const endGridDate = new Date(todayDate.getTime() + daysUntilSaturday * 24 * 60 * 60 * 1000);

    // 52 full weeks back from endGridDate (plus the current week = 53 weeks = 371 days)
    const TOTAL_DAYS = 53 * 7;
    const startGridDate = new Date(endGridDate.getTime() - (TOTAL_DAYS - 1) * 24 * 60 * 60 * 1000);

    const generatedWeeks = [];
    const monthsPos = [];
    let lastMonth = -1;

    for (let w = 0; w < 53; w++) {
      const daysInWeek = [];
      for (let d = 0; d < 7; d++) {
        const dayOffset = w * 7 + d;
        const cellDate = new Date(startGridDate.getTime() + dayOffset * 24 * 60 * 60 * 1000);

        const y = cellDate.getUTCFullYear();
        const m = String(cellDate.getUTCMonth() + 1).padStart(2, "0");
        const dayNum = String(cellDate.getUTCDate()).padStart(2, "0");
        const dateStr = `${y}-${m}-${dayNum}`;

        const isFuture = cellDate.getTime() > todayDate.getTime();
        const calEntry = activityData?.calendarData?.[dateStr] || null;
        const count = isFuture ? 0 : calEntry?.count || 0;
        const solvedCount = isFuture ? 0 : calEntry?.solvedCount || 0;
        const level = isFuture ? 0 : calEntry?.level !== undefined ? calEntry.level : (count > 0 ? 1 : 0);

        daysInWeek.push({
          dateStr,
          dateObj: cellDate,
          count,
          solvedCount,
          level,
          isFuture,
          isToday: dateStr === todayStr,
          details: calEntry?.details || [],
        });
      }

      // Check month header label at Sunday/first day of week
      const sundayMonth = daysInWeek[0].dateObj.getUTCMonth();
      if (sundayMonth !== lastMonth && w < 51) {
        monthsPos.push({
          weekIndex: w,
          name: MONTH_NAMES[sundayMonth],
        });
        lastMonth = sundayMonth;
      }

      generatedWeeks.push(daysInWeek);
    }

    return { weeks: generatedWeeks, monthPositions: monthsPos };
  }, [activityData, clientTimezone]);

  const handleCellMouseEnter = (e, cell) => {
    if (cell.isFuture) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltipPos({
      x: rect.left + rect.width / 2,
      y: rect.top - 8,
    });
    setHoveredCell(cell);
  };

  const handleCellMouseLeave = () => {
    setHoveredCell(null);
  };

  const handleCellClick = (cell) => {
    if (cell.isFuture) return;
    if (cell.count > 0) {
      setSelectedDayDetail(cell);
    } else {
      toast.info(`No verified coding activity recorded on ${formatDateDisplay(cell.dateStr)}.`);
    }
  };

  function formatDateDisplay(dStr) {
    if (!dStr) return "";
    try {
      const [y, m, d] = dStr.split("-").map(Number);
      const dt = new Date(Date.UTC(y, m - 1, d));
      return dt.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
        timeZone: "UTC",
      });
    } catch {
      return dStr;
    }
  }

  const currentStreak = activityData?.currentStreak || 0;
  const longestStreak = activityData?.longestStreak || 0;
  const totalProblemsSolved = activityData?.totalProblemsSolved || 0;
  const totalSubmissions = activityData?.totalSubmissions || 0;
  const activeDays = activityData?.activeDays || 0;
  const streakActiveToday = activityData?.streakActiveToday || false;

  return (
    <div className={`mz-activity-calendar-card ${compact ? "is-compact" : ""}`}>
      {/* 1. Header Bar */}
      <div className="mz-calendar-header">
        <div className="mz-calendar-title-wrap">
          <div className="mz-calendar-icon-box">
            <LuFlame size={22} className={streakActiveToday ? "mz-flame-icon-animated" : ""} />
          </div>
          <div>
            <h3 className="mz-calendar-title">
              Daily Activity Streak Calendar
              {streakActiveToday && (
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 700,
                    padding: "2px 8px",
                    borderRadius: "9999px",
                    background: "rgba(245, 158, 11, 0.15)",
                    color: "#d97706",
                    border: "1px solid rgba(245, 158, 11, 0.3)",
                  }}
                >
                  Active Today 🔥
                </span>
              )}
            </h3>
            <p className="mz-calendar-subtitle">
              {totalSubmissions} verified compiler {totalSubmissions === 1 ? "submission" : "submissions"} across {activeDays} active {activeDays === 1 ? "day" : "days"} in the past year
            </p>
          </div>
        </div>

        {/* Metric Pills */}
        <div className="mz-calendar-stats-row">
          <div className="mz-streak-pill current-streak" title="Consecutive days with verified code submissions">
            <LuFlame size={15} />
            <span>{currentStreak} {currentStreak === 1 ? "Day" : "Days"} Streak</span>
          </div>

          <div className="mz-streak-pill longest-streak" title="All-time longest streak recorded">
            <LuTrophy size={14} />
            <span>Longest: {longestStreak} {longestStreak === 1 ? "Day" : "Days"}</span>
          </div>

          <div className="mz-streak-pill solved-count" title="Unique challenges passed with 100% test cases">
            <LuCircleCheck size={14} />
            <span>{totalProblemsSolved} Solved</span>
          </div>

          <div className="mz-streak-pill active-days" title="Total active days with compiler submissions">
            <LuCalendar size={14} />
            <span>{activeDays} Active Days</span>
          </div>

          <button
            type="button"
            onClick={fetchActivity}
            title="Refresh streak data"
            style={{
              background: "transparent",
              border: "1px solid var(--mz-border)",
              borderRadius: "50%",
              width: "32px",
              height: "32px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "var(--mz-text-muted)",
              transition: "all 0.2s ease",
            }}
          >
            <LuRefreshCw size={13} className={isLoading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* 2. Heatmap Grid Layout */}
      <div className="mz-heatmap-outer-scroll">
        <div className="mz-heatmap-grid-layout">
          {/* Months Labels along Top */}
          <div className="mz-heatmap-months-row">
            {monthPositions.map((pos, idx) => (
              <span
                key={idx}
                className="mz-month-label"
                style={{ left: `${pos.weekIndex * 15.5}px` }}
              >
                {pos.name}
              </span>
            ))}
          </div>

          {/* Days Column + 53 Week Columns */}
          <div className="mz-heatmap-body">
            {/* Day of Week Labels (Mon, Wed, Fri) */}
            <div className="mz-heatmap-days-col" aria-hidden="true">
              {DAY_LABELS.map((dayLabel, idx) => (
                <div key={idx} style={{ height: "12px", display: "flex", alignItems: "center" }}>
                  {dayLabel}
                </div>
              ))}
            </div>

            {/* Heatmap Columns */}
            <div className="mz-heatmap-weeks-container" role="grid" aria-label="Coding Activity Heatmap">
              {weeks.map((week, wIdx) => (
                <div key={wIdx} className="mz-heatmap-week-col" role="row">
                  {week.map((cell, dIdx) => (
                    <div
                      key={dIdx}
                      className="mz-heatmap-cell"
                      data-level={cell.level}
                      data-date={cell.dateStr}
                      data-count={cell.count}
                      onClick={() => handleCellClick(cell)}
                      onMouseEnter={(e) => handleCellMouseEnter(e, cell)}
                      onMouseLeave={handleCellMouseLeave}
                      style={{
                        visibility: cell.isFuture ? "hidden" : "visible",
                        border: cell.isToday ? "1.5px solid var(--mz-accent-amber, #f59e0b)" : undefined,
                      }}
                      role="gridcell"
                      aria-label={`${cell.count} submissions on ${cell.dateStr}`}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Empty State Prompt for New Users */}
      {totalSubmissions === 0 && !isLoading && (
        <div className="mz-calendar-empty-prompt">
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <LuSparkles size={20} color="#6366f1" />
            <p className="mz-calendar-empty-text">
              <strong>Your activity streak starts with your first submission!</strong> Solve any algorithmic coding challenge or curriculum exercise to light up your calendar.
            </p>
          </div>
          <button
            type="button"
            className="mz-btn-ignite-streak"
            onClick={() => {
              if (onNavigate) onNavigate("/coding");
              else window.location.href = "/coding";
            }}
          >
            <LuCode size={14} />
            <span>Open Coding Arena</span>
          </button>
        </div>
      )}

      {/* 4. Footer & Legend */}
      <div className="mz-calendar-footer">
        <div className="mz-calendar-info-note">
          <span>Synced with verified compiler test evaluations and accepted problem solves.</span>
        </div>

        <div className="mz-calendar-legend">
          <span className="mz-legend-text">Less</span>
          <div className="mz-legend-cells">
            <div className="mz-heatmap-cell" data-level="0" title="0 submissions" />
            <div className="mz-heatmap-cell" data-level="1" title="1-2 submissions" />
            <div className="mz-heatmap-cell" data-level="2" title="3-4 submissions" />
            <div className="mz-heatmap-cell" data-level="3" title="5-7 submissions" />
            <div className="mz-heatmap-cell" data-level="4" title="8+ submissions" />
          </div>
          <span className="mz-legend-text">More</span>
        </div>
      </div>

      {/* 5. Tooltip Element */}
      {hoveredCell && (
        <div
          className="mz-heatmap-tooltip"
          style={{
            left: `${tooltipPos.x}px`,
            top: `${tooltipPos.y}px`,
          }}
        >
          {hoveredCell.count === 0 ? (
            <span>No activity on {formatDateDisplay(hoveredCell.dateStr)}</span>
          ) : (
            <span>
              <strong>{hoveredCell.count}</strong> {hoveredCell.count === 1 ? "submission" : "submissions"}
              {hoveredCell.solvedCount > 0 && ` (${hoveredCell.solvedCount} solved)`} on{" "}
              {formatDateDisplay(hoveredCell.dateStr)}
            </span>
          )}
        </div>
      )}

      {/* 6. Day Detail Modal */}
      {selectedDayDetail && (
        <div
          className="mz-day-detail-modal-backdrop"
          onClick={() => setSelectedDayDetail(null)}
        >
          <div
            className="mz-day-detail-dialog"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mz-day-detail-header">
              <div>
                <h4 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "var(--mz-text-primary)" }}>
                  Activity on {formatDateDisplay(selectedDayDetail.dateStr)}
                </h4>
                <p style={{ margin: "2px 0 0", fontSize: "12px", color: "var(--mz-text-muted)" }}>
                  {selectedDayDetail.count} {selectedDayDetail.count === 1 ? "submission" : "submissions"} • {selectedDayDetail.solvedCount} {selectedDayDetail.solvedCount === 1 ? "problem" : "problems"} solved
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDayDetail(null)}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--mz-text-muted)",
                }}
              >
                <LuX size={18} />
              </button>
            </div>

            <div className="mz-day-detail-body">
              {Array.isArray(selectedDayDetail.details) && selectedDayDetail.details.length > 0 ? (
                selectedDayDetail.details.map((act, idx) => {
                  const isAccepted = act.status === "ACCEPTED" || act.status === "PASSED" || act.score === 100;
                  return (
                    <div key={idx} className="mz-day-activity-item">
                      <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                        <span style={{ fontSize: "13.5px", fontWeight: 700, color: "var(--mz-text-primary)" }}>
                          {act.title || act.targetId || "Challenge Submission"}
                        </span>
                        <span style={{ fontSize: "11.5px", color: "var(--mz-text-muted)" }}>
                          Language: {(act.language || "python").toUpperCase()} •{" "}
                          {act.timestamp ? new Date(act.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Verified"}
                        </span>
                      </div>

                      <div>
                        {isAccepted ? (
                          <span className="mz-day-activity-badge-accepted">
                            <LuCircleCheck size={12} /> Solved (100%)
                          </span>
                        ) : (
                          <span className="mz-day-activity-badge-attempted">
                            Evaluated ({act.score || 0}%)
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div style={{ textAlign: "center", padding: "20px 0", color: "var(--mz-text-muted)" }}>
                  <p style={{ fontSize: "13px" }}>Verified submissions recorded on this date.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
