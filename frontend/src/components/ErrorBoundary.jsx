import React, { Component } from 'react';
import { Box, Typography, Button, Container, Paper } from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

/**
 * Error Boundary Component
 * Catches JavaScript errors anywhere in the child component tree
 * and displays a user-friendly error UI instead of crashing
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details for debugging
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Store error info in state for display
    this.setState({
      error,
      errorInfo
    });

    // In production, you might want to log to an error reporting service
    // Example: Sentry.captureException(error, { contexts: { react: errorInfo } });
  }

  handleReset = () => {
    this.setState({ 
      hasError: false, 
      error: null,
      errorInfo: null
    });
    
    // Optionally reload the page
    if (this.props.resetOnReload) {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.handleReset);
      }

      // Default fallback UI
      return (
        <Container maxWidth="sm" sx={{ mt: 8, mb: 8 }}>
          <Paper 
            elevation={3} 
            sx={{ 
              p: 4, 
              textAlign: 'center',
              borderRadius: 2
            }}
          >
            <ErrorOutlineIcon 
              sx={{ 
                fontSize: 64, 
                color: 'error.main', 
                mb: 2 
              }} 
            />
            <Typography variant="h5" gutterBottom color="error" fontWeight="bold">
              Something Went Wrong
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              We're sorry, but something unexpected happened. Please try refreshing the page.
              If the problem persists, please contact support.
            </Typography>
            
            {import.meta.env.DEV && this.state.error && (
              <Box 
                sx={{ 
                  mt: 2, 
                  p: 2, 
                  bgcolor: 'grey.100', 
                  borderRadius: 1,
                  textAlign: 'left',
                  maxHeight: 200,
                  overflow: 'auto'
                }}
              >
                <Typography variant="caption" component="pre" sx={{ fontSize: '0.75rem' }}>
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </Typography>
              </Box>
            )}
            
            <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'center' }}>
              <Button 
                variant="contained" 
                color="primary"
                onClick={this.handleReset}
              >
                Try Again
              </Button>
              <Button 
                variant="outlined" 
                color="primary"
                onClick={() => window.location.href = '/'}
              >
                Go Home
              </Button>
            </Box>
          </Paper>
        </Container>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
