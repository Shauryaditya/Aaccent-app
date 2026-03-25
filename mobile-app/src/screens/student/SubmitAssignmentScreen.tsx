import React from 'react';
import { View, StyleSheet } from 'react-native';
import EmptyState from '../../components/common/EmptyState';

const SubmitAssignmentScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <EmptyState
        icon="cloud-upload"
        title="Submit Assignment"
        message="Assignment submission screen to be implemented"
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

export default SubmitAssignmentScreen;