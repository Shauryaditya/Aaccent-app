import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button } from 'react-native-paper';

const SignUpScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text variant="headlineMedium" style={styles.title}>
        Create Account
      </Text>
      <Text variant="bodyMedium" style={styles.subtitle}>
        Sign up to get started
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#fff',
  },
  title: {
    marginBottom: 8,
  },
  subtitle: {
    color: '#666',
  },
});

export default SignUpScreen;