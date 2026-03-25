import React from 'react';
import { View, StyleSheet } from 'react-native';
import EmptyState from '../../components/common/EmptyState';

const EditTestSeriesScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <EmptyState
        icon="create"
        title="Edit Test Series"
        message="Test series editing to be implemented"
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

export default EditTestSeriesScreen;