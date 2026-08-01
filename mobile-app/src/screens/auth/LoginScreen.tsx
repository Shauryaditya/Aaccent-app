import React from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { useOAuth } from '@clerk/clerk-expo';
import * as WebBrowser from 'expo-web-browser';
import Toast from 'react-native-toast-message';

WebBrowser.maybeCompleteAuthSession();

const LoginScreen: React.FC = () => {
  const { startOAuthFlow } = useOAuth({ strategy: 'oauth_google' });
  const [isSigningIn, setIsSigningIn] = React.useState(false);

  const handleSignIn = async () => {
    setIsSigningIn(true);
    try {
      const { createdSessionId, setActive } = await startOAuthFlow();

      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
      }
    } catch (error) {
      console.error('Sign in error:', error);
      Toast.show({
        type: 'error',
        text1: 'Sign in failed',
        text2: 'Check Clerk OAuth settings and try again.',
      });
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Image
          source={require('../../../assets/logo.jpeg')}
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
            loading={isSigningIn}
            disabled={isSigningIn}
            style={styles.button}
            contentStyle={styles.buttonContent}
          >
            Sign In with Google
          </Button>
          <Text variant="bodySmall" style={styles.note}>
            Use the same account you use on the LMS web app.
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
