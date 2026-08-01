import React from 'react';
import { View, StyleSheet } from 'react-native';
import EmptyState from '../../components/common/EmptyState';

const TakeTestScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <EmptyState
        icon="clipboard-outline"
        title="Take Test"
        message="Test taking interface to be implemented"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});

export default TakeTestScreen;
