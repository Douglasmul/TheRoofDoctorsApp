import React from 'react';
import { Text, View, StyleSheet } from 'react-native';

type Props = { children: React.ReactNode };
type State = { hasError: boolean; error?: Error; errorInfo?: any };

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    // Enhanced logging for diagnostics
    console.error('=== ErrorBoundary caught error ===');
    console.error('Error:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Component stack:', errorInfo.componentStack);
    console.error('Props at error time:', {
      childrenType: typeof this.props.children,
      childrenCount: React.Children.count(this.props.children),
      hasChildren: !!this.props.children,
    });
    
    // Check for specific "contains" related errors
    if (error.message && error.message.includes('contains')) {
      console.error('⚠️  CONTAINS ERROR DETECTED - This may be the wrapper ordering issue');
      console.error('Current error context:', {
        message: error.message,
        stack: error.stack?.split('\n').slice(0, 10), // First 10 lines of stack
      });
    }
    
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Something went wrong</Text>
          <Text style={styles.errorMessage}>
            {this.state.error?.message || 'An unexpected error occurred'}
          </Text>
          <Text style={styles.errorNote}>
            Check console for detailed error information
          </Text>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#d32f2f',
    marginBottom: 10,
  },
  errorMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 10,
  },
  errorNote: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
});