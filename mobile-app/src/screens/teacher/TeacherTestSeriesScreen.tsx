import React from 'react';
import { ScrollView, StyleSheet, View, RefreshControl, Pressable } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import EmptyState from '../../components/common/EmptyState';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { TestSeries, TeacherStackParamList } from '../../types';
import { testService } from '../../services/testService';
import { colors, radius, shadow, spacing } from '../../theme/design';

type NavigationProp = NativeStackNavigationProp<TeacherStackParamList>;

const TeacherTestSeriesScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const {
    data: testSeries = [],
    isLoading,
    isFetching,
    refetch,
  } = useQuery<TestSeries[]>({
    queryKey: ['teacher-test-series'],
    queryFn: () => testService.getTeacherTestSeries(),
  });

  if (isLoading) {
    return <LoadingSpinner message="Loading test series..." />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text variant="headlineSmall" style={styles.title}>Test Series</Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            {testSeries.length} {testSeries.length === 1 ? 'series' : 'series'} created
          </Text>
        </View>
        <Button mode="contained" icon="plus" onPress={() => navigation.navigate('CreateTestSeries')}>
          Create
        </Button>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} />}
      >
        {testSeries.length === 0 ? (
          <EmptyState
            icon="clipboard-outline"
            title="No test series yet"
            message="Create your first test series to start adding tests."
            actionLabel="Create Test Series"
            onAction={() => navigation.navigate('CreateTestSeries')}
          />
        ) : (
          testSeries.map((series: TestSeries) => (
            <Pressable
              key={series.id}
              style={styles.card}
              onPress={() => navigation.navigate('EditTestSeries', { testSeriesId: series.id })}
            >
              <View style={styles.iconTile}>
                <Ionicons name="clipboard-outline" size={20} color={colors.navy} />
              </View>
              <View style={styles.cardBody}>
                <Text variant="titleMedium" style={styles.cardTitle}>{series.title}</Text>
                <Text variant="bodySmall" style={styles.cardMeta}>
                  {series.category?.name || 'No category'} · {series.testChapters?.length || 0} chapters
                </Text>
              </View>
              <View style={[styles.statusDot, series.isPublished && styles.statusDotLive]} />
            </Pressable>
          ))
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: spacing.lg,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  title: {
    fontWeight: '800',
    color: colors.text,
  },
  subtitle: {
    color: colors.muted,
    marginTop: 2,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    flexGrow: 1,
  },
  card: {
    minHeight: 82,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    padding: spacing.md,
    marginBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    ...shadow.card,
  },
  iconTile: {
    width: 44,
    height: 44,
    borderRadius: radius.sm,
    backgroundColor: colors.blueSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  cardBody: {
    flex: 1,
  },
  cardTitle: {
    fontWeight: '700',
    color: colors.text,
  },
  cardMeta: {
    color: colors.muted,
    marginTop: 4,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.line,
  },
  statusDotLive: {
    backgroundColor: colors.success,
  },
});

export default TeacherTestSeriesScreen;

