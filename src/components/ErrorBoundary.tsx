"use client";

import * as React from "react";

/** GS 인증(신뢰성): 예기치 않은 오류 시 사용자 안내 및 복구 가능 */
interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
      console.error("[ErrorBoundary]", error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div
          role="alert"
          aria-live="assertive"
          className="flex flex-col items-center justify-center min-h-[200px] p-6 bg-gray-50 border border-gray-200 rounded-lg"
        >
          <h2 className="text-lg font-semibold text-gray-800 mb-2">일시적인 오류가 발생했습니다</h2>
          <p className="text-sm text-gray-600 mb-4">
            페이지를 새로고침하거나 잠시 후 다시 시도해 주세요.
          </p>
          <button
            type="button"
            onClick={this.handleRetry}
            className="px-4 py-2 text-sm font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
          >
            다시 시도
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
