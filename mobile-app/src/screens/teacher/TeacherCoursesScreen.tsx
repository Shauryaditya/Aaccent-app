import React from 'react';
import { View, StyleSheet } from 'react-native';
import EmptyState from '../../components/common/EmptyState';

const TeacherCoursesScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <EmptyState
        icon="book"
        title="My Courses"
        message="Course management to be implemented"
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

export default TeacherCoursesScreen;