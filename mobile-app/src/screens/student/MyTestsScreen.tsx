import React from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import EmptyState from '../../components/common/EmptyState';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { testService } from '../../services/testService';
import { StudentStackParamList, TestSeries } from '../../types';
import { colors, radius, shadow, spacing } from '../../theme/design';

type NavigationProp = NativeStackNavigationProp<StudentStackParamList>;

const MyTestsScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { data: testSeries = [], isLoading, isFetching, refetch } = useQuery<TestSeries[]>({
    queryKey: ['test-series'],
    queryFn: () => testService.getTestSeries(),
  });

  if (isLoading) return <LoadingSpinner message="Loading test series..." />;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} />}>
      <Text variant="headlineSmall" style={styles.title}>Test Series</Text>
      {testSeries.length === 0 ? (
        <EmptyState icon="clipboard-outline" title="No test series found" message="Published test series will appear here." />
      ) : (
        testSeries.map((series: TestSeries) => (
          <Pressable key={series.id} style={styles.card} onPress={() => navigation.navigate('TestDetail', { testSeriesId: series.id })}>
            <View style={styles.iconTile}><Ionicons name="clipboard-outline" size={22} color={colors.navy} /></View>
            <View style={styles.cardBody}>
              <Text variant="titleMedium" style={styles.cardTitle}>{series.title}</Text>
              <Text variant="bodySmall" style={styles.cardMeta}>{series.category?.name || 'Test series'} · {series.testChapters?.length || 0} chapters</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.muted} />
          </Pressable>
        ))
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  title: { color: colors.text, fontWeight: '800', marginBottom: spacing.lg },
  card: { minHeight: 82, borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, padding: spacing.md, marginBottom: spacing.md, flexDirection: 'row', alignItems: 'center', ...shadow.card },
  iconTile: { width: 44, height: 44, borderRadius: radius.sm, backgroundColor: colors.blueSoft, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  cardBody: { flex: 1 },
  cardTitle: { color: colors.text, fontWeight: '800' },
  cardMeta: { color: colors.muted, marginTop: 4 },
});

export default MyTestsScreen;

