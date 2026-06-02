import { Component } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import './ErrorBoundary.css';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info?.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <div className="error-boundary__card">
            <div className="error-boundary__icon">
              <AlertTriangle size={28} />
            </div>
            <h2 className="error-boundary__title">Algo salió mal</h2>
            <p className="error-boundary__desc">
              {this.props.message || 'Ocurrió un error inesperado en esta sección.'}
            </p>
            <button
              className="btn btn-primary error-boundary__btn"
              onClick={() => this.setState({ hasError: false, error: null })}
            >
              <RefreshCw size={14} /> Reintentar
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
