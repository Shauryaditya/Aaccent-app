import React from 'react';
import { View, StyleSheet, ScrollView, Clipboard, Platform } from 'react-native';
import { Text, Button, Avatar, List, Divider } from 'react-native-paper';
import { useUser, useAuth } from '@clerk/clerk-expo';
import { useUserRole } from '../../contexts/UserContext';
import { getApiBaseUrl } from '../../services/api';
import { showToast } from '../../utils/helpers';

const TeacherProfileScreen: React.FC = () => {
  const { user } = useUser();
  const { signOut } = useAuth();
  const { setRole } = useUserRole();
  const [showDiagnostics, setShowDiagnostics] = React.useState(false);

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
        <Divider />
        <List.Item
          title="Connection Diagnostics"
          description="Signed-in account and server address"
          left={(props) => <List.Icon {...props} icon="bug-outline" />}
          right={(props) => (
            <List.Icon {...props} icon={showDiagnostics ? 'chevron-up' : 'chevron-down'} />
          )}
          onPress={() => setShowDiagnostics((current) => !current)}
        />
      </View>

      {showDiagnostics && (
        <View style={styles.diagnostics}>
          <Text variant="bodySmall" style={styles.diagLabel}>Clerk user ID</Text>
          <Text selectable style={styles.diagValue}>{user?.id || 'not signed in'}</Text>
          <Text variant="bodySmall" style={styles.diagHint}>
            This must match an entry in NEXT_PUBLIC_TEACHER_IDS, and must be the account that
            owns your courses. If it differs, the teacher lists will be empty.
          </Text>

          <Text variant="bodySmall" style={[styles.diagLabel, styles.diagSpacer]}>API base URL</Text>
          <Text selectable style={styles.diagValue}>{getApiBaseUrl()}</Text>

          <Text variant="bodySmall" style={[styles.diagLabel, styles.diagSpacer]}>Sign-in method</Text>
          <Text selectable style={styles.diagValue}>
            {user?.externalAccounts?.length
              ? user.externalAccounts.map((a: any) => a.provider).join(', ')
              : 'email / password'}
          </Text>

          <Button
            mode="outlined"
            icon="content-copy"
            style={styles.diagButton}
            onPress={() => {
              Clipboard.setString(user?.id || '');
              showToast('success', 'User ID copied');
            }}
          >
            Copy User ID
          </Button>
        </View>
      )}

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
  diagnostics: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 8,
  },
  diagLabel: {
    color: '#6f7890',
    fontWeight: '700',
    textTransform: 'uppercase',
    fontSize: 11,
  },
  diagValue: {
    color: '#111827',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 12,
    marginTop: 4,
  },
  diagHint: {
    color: '#6f7890',
    marginTop: 8,
    lineHeight: 18,
  },
  diagSpacer: {
    marginTop: 16,
  },
  diagButton: {
    marginTop: 16,
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