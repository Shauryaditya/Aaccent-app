import React from 'react';
import { View, StyleSheet } from 'react-native';
import EmptyState from '../../components/common/EmptyState';

const EditCourseScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <EmptyState
        icon="create"
        title="Edit Course"
        message="Course editing form to be implemented"
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

export default EditCourseScreen;