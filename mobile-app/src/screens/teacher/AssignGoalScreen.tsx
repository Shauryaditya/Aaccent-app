import React from 'react';
import { View, StyleSheet } from 'react-native';
import EmptyState from '../../components/common/EmptyState';

const AssignGoalScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <EmptyState
        icon="flag"
        title="Assign Goal"
        message="Goal assignment form to be implemented"
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

export default AssignGoalScreen;