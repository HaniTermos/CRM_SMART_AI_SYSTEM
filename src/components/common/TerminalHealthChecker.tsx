/**
 * SmartStore AI — Frontend Real-Time Page Health & Error Observer
 * Tracks page navigation, rendering health, performance metrics, and catches runtime errors.
 * Emits styled logs to the browser console and syncs with backend terminal telemetry.
 */

import React, { useEffect, useRef } from "react";
import { useRouterState } from "@tanstack/react-router";

export function TerminalHealthChecker() {
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;
  const previousPathRef = useRef<string | null>(null);
  const mountTimeRef = useRef<number>(Date.now());

  // 1. Track Page Entry & Render Health
  useEffect(() => {
    if (previousPathRef.current === currentPath) return;
    previousPathRef.current = currentPath;

    const renderDuration = Date.now() - mountTimeRef.current;
    const pageTitle = document.title || "SmartStore AI";

    // Sync exclusively to machine backend terminal
    try {
      fetch("/api/health/client-nav", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: currentPath,
          pageTitle,
          loadTimeMs: renderDuration,
          status: "healthy",
          userAgent: navigator.userAgent,
        }),
      }).catch(() => {
        // Silently catch if dev server isn't answering
      });
    } catch {
      // Ignore network errors in local dev
    }

    mountTimeRef.current = Date.now();
  }, [currentPath]);

  // 2. Global Error & Unhandled Rejection Watcher — forwards directly to backend machine terminal
  useEffect(() => {
    const handleGlobalError = (event: ErrorEvent) => {
      const errorMsg = event.message || "Unknown error";
      try {
        fetch("/api/health/client-nav", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            path: currentPath,
            pageTitle: document.title,
            status: "error",
            error: `${errorMsg} (at ${event.filename}:${event.lineno})`,
          }),
        }).catch(() => {});
      } catch {}
    };

    const handleRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason?.message || String(event.reason || "Unhandled Promise Rejection");
      try {
        fetch("/api/health/client-nav", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            path: currentPath,
            pageTitle: document.title,
            status: "error",
            error: `Promise Rejection: ${reason}`,
          }),
        }).catch(() => {});
      } catch {}
    };

    window.addEventListener("error", handleGlobalError);
    window.addEventListener("unhandledrejection", handleRejection);

    return () => {
      window.removeEventListener("error", handleGlobalError);
      window.removeEventListener("unhandledrejection", handleRejection);
    };
  }, [currentPath]);

  return null;
}
