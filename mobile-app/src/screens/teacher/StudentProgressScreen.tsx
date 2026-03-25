import React from 'react';
import { View, StyleSheet } from 'react-native';
import EmptyState from '../../components/common/EmptyState';

const StudentProgressScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <EmptyState
        icon="trending-up"
        title="Student Progress"
        message="Student progress tracking to be implemented"
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

export default StudentProgressScreen;