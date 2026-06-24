/**
 * ErrorBoundary — Capture d'erreurs React
 *
 * Wrapper to place around route-level Suspense/lazy boundaries.
 * Affiche une UI de fallback en cas d'erreur de rendu.
 */

import { Component } from 'react';
import { ErrorBoundaryFallback } from '@/app/error/ServerErrorPage';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    if (typeof this.props.onError === 'function') {
      this.props.onError(error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <ErrorBoundaryFallback
          error={this.state.error}
          onReset={() => this.setState({ hasError: false, error: null })}
        />
      );
    }

    return this.props.children;
  }
}
