import React, { useRef, useState, useEffect } from "react";
import {
  LuPencil,
  LuEraser,
  LuSquare,
  LuCircle,
  LuMinus,
  LuTrash2,
  LuDownload,
  LuRotateCcw,
} from "react-icons/lu";

export default function MasteryZoneWhiteboard({
  meetingId,
  socket,
  currentUser,
  whiteboardData = "[]",
}) {
  const canvasRef = useRef(null);
  const [tool, setTool] = useState("pencil"); // "pencil" | "eraser" | "line" | "rect" | "circle"
  const [color, setColor] = useState("#2563eb");
  const [lineWidth, setLineWidth] = useState(3);
  const [isDrawing, setIsDrawing] = useState(false);
  const [strokes, setStrokes] = useState([]);
  const startPosRef = useRef({ x: 0, y: 0 });

  // Load existing strokes on mount
  useEffect(() => {
    try {
      const parsed = JSON.parse(whiteboardData);
      if (Array.isArray(parsed) && parsed.length > 0) {
        setStrokes(parsed);
        redrawAll(parsed);
      }
    } catch {}
  }, [whiteboardData]);

  // Redraw helper
  const redrawAll = (strokeList) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    strokeList.forEach((st) => {
      ctx.beginPath();
      ctx.strokeStyle = st.color;
      ctx.lineWidth = st.width;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      if (st.type === "free" && st.points && st.points.length > 1) {
        ctx.moveTo(st.points[0].x, st.points[0].y);
        for (let i = 1; i < st.points.length; i++) {
          ctx.lineTo(st.points[i].x, st.points[i].y);
        }
        ctx.stroke();
      } else if (st.type === "line") {
        ctx.moveTo(st.x1, st.y1);
        ctx.lineTo(st.x2, st.y2);
        ctx.stroke();
      } else if (st.type === "rect") {
        ctx.strokeRect(st.x, st.y, st.w, st.h);
      } else if (st.type === "circle") {
        ctx.arc(st.cx, st.cy, st.r, 0, 2 * Math.PI);
        ctx.stroke();
      }
    });
  };

  // Socket listener for peer strokes
  useEffect(() => {
    if (!socket) return;

    socket.on("meeting_whiteboard_updated", ({ stroke, clearAll }) => {
      if (clearAll) {
        setStrokes([]);
        const canvas = canvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext("2d");
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
      } else if (stroke) {
        setStrokes((prev) => {
          const updated = [...prev, stroke];
          redrawAll(updated);
          return updated;
        });
      }
    });

    return () => {
      socket.off("meeting_whiteboard_updated");
    };
  }, [socket]);

  const handleMouseDown = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setIsDrawing(true);
    startPosRef.current = { x, y };

    if (tool === "pencil" || tool === "eraser") {
      const newStroke = {
        type: "free",
        color: tool === "eraser" ? "#ffffff" : color,
        width: tool === "eraser" ? 20 : lineWidth,
        points: [{ x, y }],
      };
      strokes.push(newStroke);
    }
  };

  const handleMouseMove = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const ctx = canvas.getContext("2d");

    if (tool === "pencil" || tool === "eraser") {
      const current = strokes[strokes.length - 1];
      if (current && current.points) {
        current.points.push({ x, y });

        ctx.beginPath();
        ctx.strokeStyle = current.color;
        ctx.lineWidth = current.width;
        ctx.lineCap = "round";
        const len = current.points.length;
        if (len > 1) {
          ctx.moveTo(current.points[len - 2].x, current.points[len - 2].y);
          ctx.lineTo(x, y);
          ctx.stroke();
        }
      }
    }
  };

  const handleMouseUp = (e) => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    let finalStroke = null;

    if (tool === "pencil" || tool === "eraser") {
      finalStroke = strokes[strokes.length - 1];
    } else if (tool === "line") {
      finalStroke = {
        type: "line",
        color,
        width: lineWidth,
        x1: startPosRef.current.x,
        y1: startPosRef.current.y,
        x2: x,
        y2: y,
      };
      strokes.push(finalStroke);
      redrawAll(strokes);
    } else if (tool === "rect") {
      finalStroke = {
        type: "rect",
        color,
        width: lineWidth,
        x: Math.min(startPosRef.current.x, x),
        y: Math.min(startPosRef.current.y, y),
        w: Math.abs(x - startPosRef.current.x),
        h: Math.abs(y - startPosRef.current.y),
      };
      strokes.push(finalStroke);
      redrawAll(strokes);
    }

    if (finalStroke && socket) {
      socket.emit("meeting_whiteboard_stroke", {
        meetingId,
        stroke: finalStroke,
        allStrokes: strokes,
      });
    }
  };

  const handleClear = () => {
    setStrokes([]);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    if (socket) {
      socket.emit("meeting_whiteboard_stroke", {
        meetingId,
        clearAll: true,
        allStrokes: [],
      });
    }
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `whiteboard_${meetingId}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  return (
    <div className="mz-whiteboard-root">
      {/* Whiteboard Toolbar */}
      <div className="mz-wb-toolbar">
        <div className="mz-wb-tool-group">
          <button
            className={`mz-wb-btn ${tool === "pencil" ? "active" : ""}`}
            onClick={() => setTool("pencil")}
            title="Pen / Pencil"
          >
            <LuPencil size={15} />
          </button>
          <button
            className={`mz-wb-btn ${tool === "eraser" ? "active" : ""}`}
            onClick={() => setTool("eraser")}
            title="Eraser"
          >
            <LuEraser size={15} />
          </button>
          <button
            className={`mz-wb-btn ${tool === "line" ? "active" : ""}`}
            onClick={() => setTool("line")}
            title="Line"
          >
            <LuMinus size={15} />
          </button>
          <button
            className={`mz-wb-btn ${tool === "rect" ? "active" : ""}`}
            onClick={() => setTool("rect")}
            title="Rectangle"
          >
            <LuSquare size={15} />
          </button>
        </div>

        <div className="mz-wb-tool-group">
          {["#2563eb", "#10b981", "#ef4444", "#8b5cf6", "#f59e0b", "#0f172a"].map((c) => (
            <button
              key={c}
              className={`mz-wb-color-swatch ${color === c ? "active" : ""}`}
              style={{ background: c }}
              onClick={() => setColor(c)}
            />
          ))}
        </div>

        <div className="mz-wb-tool-group">
          <button className="mz-wb-btn danger" onClick={handleClear} title="Clear Board">
            <LuTrash2 size={15} />
          </button>
          <button className="mz-wb-btn" onClick={handleDownload} title="Export Board">
            <LuDownload size={15} />
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div className="mz-wb-canvas-container">
        <canvas
          ref={canvasRef}
          width={800}
          height={550}
          className="mz-wb-canvas"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
        />
      </div>
    </div>
  );
}
