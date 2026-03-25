import React from 'react';
import { View, StyleSheet } from 'react-native';
import EmptyState from '../../components/common/EmptyState';

const ManageTestsScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <EmptyState
        icon="list"
        title="Manage Tests"
        message="Test management to be implemented"
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

export default ManageTestsScreen;