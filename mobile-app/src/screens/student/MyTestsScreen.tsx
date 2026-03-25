import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import EmptyState from '../../components/common/EmptyState';

const MyTestsScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <EmptyState
        icon="clipboard"
        title="Tests"
        message="Test series functionality will be implemented here"
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

export default MyTestsScreen;