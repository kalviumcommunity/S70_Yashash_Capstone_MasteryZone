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
