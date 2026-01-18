import React from 'react';
import { useToast } from './ToastNotification';

class ErrorBoundaryInner extends React.Component<any, { hasError: boolean; error?: Error }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: any) {
    // You can log error to an external service here
    // For now, rely on Toast via wrapper
    console.error('Unhandled error caught by ErrorBoundary:', error, info);
  }

  render() {
    if (this.state.hasError) {
      // Render fallback UI (actual message handled by toast wrapper)
      return (
        <div style={{ padding: 'var(--spectrum-spacing-400)' }}>
          <h2>Something went wrong</h2>
          <p>We've captured the error and you can continue using the add-on. Try reloading the tab.</p>
        </div>
      );
    }

    return this.props.children;
  }
}

// Wrapper to use toast in functional component space
const ErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const toast = useToast();

  return (
    <React.Fragment>
      <ErrorBoundaryInner>
        {children}
      </ErrorBoundaryInner>
    </React.Fragment>
  );
};

export default ErrorBoundary;
