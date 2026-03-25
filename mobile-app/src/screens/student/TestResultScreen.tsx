import React from 'react';
import { View, StyleSheet } from 'react-native';
import EmptyState from '../../components/common/EmptyState';

const TestResultScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <EmptyState
        icon="trophy"
        title="Test Results"
        message="Test results screen to be implemented"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
});

export default TestResultScreen;