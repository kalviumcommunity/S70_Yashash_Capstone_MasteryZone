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
        <div style={{ padding: "40px", backgroundColor: "#111", color: "#ff4444", minHeight: "100vh", fontFamily: "monospace" }}>
          <h2>Something went wrong in the application.</h2>
          <details style={{ whiteSpace: "pre-wrap", marginTop: "20px", padding: "20px", backgroundColor: "#222", borderRadius: "8px" }}>
            <summary style={{ cursor: "pointer", fontSize: "1.2rem", marginBottom: "10px" }}>View Error Details</summary>
            {this.state.error && this.state.error.toString()}
            <br />
            {this.state.errorInfo && this.state.errorInfo.componentStack}
          </details>
          <button 
            onClick={() => window.location.reload()} 
            style={{ marginTop: "30px", padding: "10px 20px", backgroundColor: "#ff4444", color: "#fff", border: "none", borderRadius: "5px", cursor: "pointer" }}
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
