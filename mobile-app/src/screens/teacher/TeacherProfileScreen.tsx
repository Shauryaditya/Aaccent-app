import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, Button, Avatar, List, Divider } from 'react-native-paper';
import { useUser, useAuth } from '@clerk/clerk-expo';
import { useUserRole } from '../../contexts/UserContext';

const TeacherProfileScreen: React.FC = () => {
  const { user } = useUser();
  const { signOut } = useAuth();
  const { setRole } = useUserRole();

  const handleSignOut = async () => {
    await setRole(null);
    await signOut();
  };

  const handleSwitchRole = () => {
    setRole(null);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Avatar.Image
          size={80}
          source={{ uri: user?.imageUrl || 'https://via.placeholder.com/150' }}
        />
        <Text variant="headlineSmall" style={styles.name}>
          {user?.firstName} {user?.lastName}
        </Text>
        <Text variant="bodyMedium" style={styles.email}>
          {user?.emailAddresses[0]?.emailAddress}
        </Text>
        <Text variant="bodySmall" style={styles.role}>
          Teacher Account
        </Text>
      </View>

      <View style={styles.section}>
        <List.Item
          title="Edit Profile"
          left={(props) => <List.Icon {...props} icon="account-edit" />}
          right={(props) => <List.Icon {...props} icon="chevron-right" />}
        />
        <Divider />
        <List.Item
          title="Settings"
          left={(props) => <List.Icon {...props} icon="cog" />}
          right={(props) => <List.Icon {...props} icon="chevron-right" />}
        />
        <Divider />
        <List.Item
          title="Help & Support"
          left={(props) => <List.Icon {...props} icon="help-circle" />}
          right={(props) => <List.Icon {...props} icon="chevron-right" />}
        />
      </View>

      <View style={styles.actions}>
        <Button
          mode="outlined"
          onPress={handleSwitchRole}
          style={styles.button}
          icon="swap-horizontal"
        >
          Switch to Student
        </Button>
        <Button
          mode="contained"
          onPress={handleSignOut}
          style={styles.button}
          buttonColor="#dc2626"
          icon="logout"
        >
          Sign Out
        </Button>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  name: {
    marginTop: 12,
    fontWeight: 'bold',
  },
  email: {
    color: '#666',
    marginTop: 4,
  },
  role: {
    color: '#16a34a',
    marginTop: 8,
    fontWeight: '600',
  },
  section: {
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  actions: {
    padding: 16,
    gap: 12,
  },
  button: {
    width: '100%',
  },
});

export default TeacherProfileScreen;