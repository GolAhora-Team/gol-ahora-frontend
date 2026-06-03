import React from 'react';
import { View, Text, ScrollView } from 'react-native';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, backgroundColor: '#f8d7da', padding: 20, paddingTop: 50 }}>
          <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#721c24', marginBottom: 10 }}>Algo salió mal.</Text>
          <ScrollView>
            <Text style={{ color: '#721c24', fontWeight: 'bold', marginBottom: 10 }}>{this.state.error && this.state.error.toString()}</Text>
            <Text style={{ color: '#721c24', fontSize: 12 }}>{this.state.errorInfo && this.state.errorInfo.componentStack}</Text>
          </ScrollView>
        </View>
      );
    }
    return this.props.children;
  }
}
