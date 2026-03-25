import React from 'react';
import { View, StyleSheet } from 'react-native';
import EmptyState from '../../components/common/EmptyState';

const CreateTestScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <EmptyState
        icon="add-circle"
        title="Create Test"
        message="Test creation form to be implemented"
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

export default CreateTestScreen;