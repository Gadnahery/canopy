import { Component, type ErrorInfo, type ReactNode } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import History from "./pages/History";
import Results from "./pages/Results";
import About from "./pages/About";
import "./index.css";

class AppErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("CANOPIX application error", error, info);
  }

  render() {
    if (this.state.failed) {
      return <main className="grid min-h-dvh place-items-center bg-base p-6 text-center text-text">
        <div className="card max-w-md p-8"><h1 className="text-xl font-bold text-primary">CANOPIX could not load</h1><p className="mt-2 text-sm text-text-secondary">Please refresh the dashboard. If this continues, clear the site data and try again.</p><button className="btn-primary mt-5" onClick={() => window.location.reload()}>Refresh dashboard</button></div>
      </main>;
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <AppErrorBoundary>
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/history" element={<History />} />
          <Route path="/results" element={<Results />} />
          <Route path="/about" element={<About />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </AppErrorBoundary>
);
