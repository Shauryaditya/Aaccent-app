import React from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { SignedIn, SignedOut, useAuth } from '@clerk/clerk-expo';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();

const LoginScreen: React.FC = () => {
  const { signIn } = useAuth();

  const handleSignIn = async () => {
    try {
      // Clerk will handle the OAuth flow
      // This is a simplified version - you'll need to implement full OAuth flow
      // or use Clerk's built-in components
    } catch (error) {
      console.error('Sign in error:', error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Image
          source={require('../../../assets/icon.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text variant="headlineLarge" style={styles.title}>
          Welcome to LMS
        </Text>
        <Text variant="bodyLarge" style={styles.subtitle}>
          Learn anytime, anywhere
        </Text>

        <View style={styles.buttonContainer}>
          <Button
            mode="contained"
            onPress={handleSignIn}
            style={styles.button}
            contentStyle={styles.buttonContent}
          >
            Sign In with Clerk
          </Button>
          <Text variant="bodySmall" style={styles.note}>
            Note: This screen needs to be integrated with Clerk's authentication flow.
            Please refer to Clerk documentation for React Native setup.
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 24,
  },
  title: {
    marginBottom: 8,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  subtitle: {
    color: '#666',
    textAlign: 'center',
    marginBottom: 48,
  },
  buttonContainer: {
    width: '100%',
    gap: 16,
  },
  button: {
    width: '100%',
  },
  buttonContent: {
    paddingVertical: 8,
  },
  note: {
    color: '#999',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default LoginScreen;