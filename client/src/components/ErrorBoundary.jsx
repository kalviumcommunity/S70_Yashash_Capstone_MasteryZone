import React from "react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ error, errorInfo });
    console.error("React Error Boundary Caught an Error:", error, errorInfo);

    // If a chunk failed to fetch (e.g., after a new production deployment changed asset hashes),
    // automatically reload the window once to pull the latest index.html and module chunks.
    const errorMessage = error?.message || String(error || "");
    const isChunkFailure =
      errorMessage.includes("Failed to fetch dynamically imported module") ||
      errorMessage.includes("Loading chunk") ||
      errorMessage.includes("error loading dynamically imported module") ||
      error?.name === "ChunkLoadError";

    if (isChunkFailure && typeof window !== "undefined") {
      const retryKey = "mz_chunk_auto_reload";
      const lastRetry = sessionStorage.getItem(retryKey);
      const now = Date.now();
      if (!lastRetry || now - parseInt(lastRetry, 10) > 12000) {
        sessionStorage.setItem(retryKey, String(now));
        console.warn("[ErrorBoundary] Automatically reloading page to fetch updated application chunks...");
        window.location.reload();
      }
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: "40px", backgroundColor: "var(--mz-bg-primary, #0f172a)", color: "var(--mz-red-text, #ef4444)", minHeight: "100vh", fontFamily: "monospace" }}>
          <h2>Something went wrong in the application.</h2>
          <details open style={{ whiteSpace: "pre-wrap", marginTop: "20px", padding: "20px", backgroundColor: "var(--mz-surface, #1e293b)", border: "1px solid var(--mz-border, #334155)", color: "var(--mz-text-primary, #f8fafc)", borderRadius: "8px" }}>
            <summary style={{ cursor: "pointer", fontSize: "1.2rem", marginBottom: "10px" }}>View Error Details</summary>
            {this.state.error && this.state.error.toString()}
            <br />
            {this.state.errorInfo && this.state.errorInfo.componentStack}
          </details>
          <button 
            onClick={() => window.location.reload()} 
            style={{ marginTop: "30px", padding: "10px 20px", backgroundColor: "#ef4444", color: "#fff", border: "none", borderRadius: "5px", cursor: "pointer" }}
          >
            Reload Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
