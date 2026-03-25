import React from 'react';
import { View, StyleSheet } from 'react-native';
import EmptyState from '../../components/common/EmptyState';

const ReviewSubmissionScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <EmptyState
        icon="checkmark-circle"
        title="Review Submission"
        message="Submission review and grading to be implemented"
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

export default ReviewSubmissionScreen;