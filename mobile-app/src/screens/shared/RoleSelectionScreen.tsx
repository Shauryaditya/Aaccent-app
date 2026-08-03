import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Card } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useUserRole } from '../../contexts/UserContext';
import { meService } from '../../services/studentService';
import { showToast } from '../../utils/helpers';

const RoleSelectionScreen: React.FC = () => {
  const { setRole } = useUserRole();

  // The server decides who may teach; this only avoids letting someone into a portal
  // that would reject every write with a 403.
  const { data: me } = useQuery({
    queryKey: ['me'],
    queryFn: meService.getMe,
  });

  const canTeach = me?.isTeacher ?? false;

  const handleRoleSelect = (role: 'student' | 'teacher') => {
    if (role === 'teacher' && !canTeach) {
      showToast(
        'info',
        'Teacher access not enabled',
        'Ask an administrator to enable teaching on your account.'
      );
      return;
    }
    setRole(role);
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text variant="headlineLarge" style={styles.title}>
          Welcome! 👋
        </Text>
        <Text variant="bodyLarge" style={styles.subtitle}>
          How would you like to use the app?
        </Text>

        <View style={styles.cardsContainer}>
          <TouchableOpacity
            style={styles.cardWrapper}
            onPress={() => handleRoleSelect('student')}
            activeOpacity={0.7}
          >
            <Card style={styles.card}>
              <Card.Content style={styles.cardContent}>
                <View style={styles.iconContainer}>
                  <Ionicons name="school" size={64} color="#6366f1" />
                </View>
                <Text variant="headlineSmall" style={styles.roleTitle}>
                  I'm a Student
                </Text>
                <Text variant="bodyMedium" style={styles.roleDescription}>
                  Browse courses, take tests, and track your learning progress
                </Text>
              </Card.Content>
            </Card>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cardWrapper}
            onPress={() => handleRoleSelect('teacher')}
            activeOpacity={0.7}
          >
            <Card style={[styles.card, !canTeach && styles.cardDisabled]}>
              <Card.Content style={styles.cardContent}>
                <View style={styles.iconContainer}>
                  <Ionicons name="person" size={64} color={canTeach ? '#16a34a' : '#9ca3af'} />
                </View>
                <Text variant="headlineSmall" style={styles.roleTitle}>
                  I'm a Teacher
                </Text>
                <Text variant="bodyMedium" style={styles.roleDescription}>
                  {canTeach
                    ? 'Create courses, manage tests, and monitor student progress'
                    : 'Not enabled for this account'}
                </Text>
              </Card.Content>
            </Card>
          </TouchableOpacity>
        </View>

        <Text variant="bodySmall" style={styles.note}>
          You can change this later in settings
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: 'bold',
  },
  subtitle: {
    textAlign: 'center',
    color: '#666',
    marginBottom: 32,
  },
  cardsContainer: {
    gap: 16,
  },
  cardWrapper: {
    width: '100%',
  },
  card: {
    elevation: 3,
  },
  cardDisabled: {
    opacity: 0.55,
  },
  cardContent: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  iconContainer: {
    marginBottom: 16,
  },
  roleTitle: {
    marginBottom: 8,
    fontWeight: 'bold',
  },
  roleDescription: {
    textAlign: 'center',
    color: '#666',
  },
  note: {
    textAlign: 'center',
    color: '#999',
    marginTop: 24,
  },
});

export default RoleSelectionScreen;