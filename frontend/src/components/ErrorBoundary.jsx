import { Component } from "react";

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    console.error("Application render error", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="mx-auto grid min-h-screen w-full max-w-3xl place-items-center px-6">
          <section className="rounded-lg border border-red-200 bg-red-50 p-6 text-red-900">
            <h1 className="text-2xl font-semibold">Something went wrong</h1>
            <p className="mt-2 text-sm">
              The dashboard could not render this view. Refresh the page after
              checking the latest data response.
            </p>
          </section>
        </main>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
