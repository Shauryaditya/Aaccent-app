import React from 'react';
import { View, StyleSheet } from 'react-native';
import EmptyState from '../../components/common/EmptyState';

const SubmissionsScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <EmptyState
        icon="document-text"
        title="Student Submissions"
        message="Submission review interface to be implemented"
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

export default SubmissionsScreen;