import React from 'react';
import { View, StyleSheet } from 'react-native';
import EmptyState from '../../components/common/EmptyState';

const ManageQuestionsScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <EmptyState
        icon="help-circle"
        title="Manage Questions"
        message="Question bank management to be implemented"
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

export default ManageQuestionsScreen;