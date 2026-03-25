import React from 'react';
import { View, StyleSheet } from 'react-native';
import EmptyState from '../../components/common/EmptyState';

const ResourcesScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <EmptyState
        icon="library"
        title="Resources Library"
        message="Resources library to be implemented"
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

export default ResourcesScreen;