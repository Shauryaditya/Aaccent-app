import React from 'react';
import { View, StyleSheet } from 'react-native';
import EmptyState from '../../components/common/EmptyState';

const TeacherTestSeriesScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <EmptyState
        icon="clipboard"
        title="My Test Series"
        message="Test series management to be implemented"
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

export default TeacherTestSeriesScreen;