import React from 'react';
import { View, StyleSheet } from 'react-native';
import EmptyState from '../../components/common/EmptyState';

const CreateCourseScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <EmptyState
        icon="add-circle"
        title="Create Course"
        message="Course creation form to be implemented"
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

export default CreateCourseScreen;