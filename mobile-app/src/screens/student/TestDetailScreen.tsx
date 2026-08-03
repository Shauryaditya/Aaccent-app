import React from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import * as WebBrowser from 'expo-web-browser';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { testService } from '../../services/testService';
import { usePurchase } from '../../hooks/usePurchase';
import { Attachment, StudentStackParamList, TestChapter, TestSeries } from '../../types';
import { formatCurrency } from '../../utils/format';
import { showToast } from '../../utils/helpers';
import { colors, radius, shadow, spacing } from '../../theme/design';

type RouteProps = RouteProp<StudentStackParamList, 'TestDetail'>;
type NavigationProp = NativeStackNavigationProp<StudentStackParamList>;

const TestDetailScreen: React.FC = () => {
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NavigationProp>();
  const { testSeriesId } = route.params;
  const { data: series, isLoading, isFetching, refetch } = useQuery<TestSeries>({
    queryKey: ['test-series-detail', testSeriesId],
    queryFn: () => testService.getTestSeriesById(testSeriesId),
  });

  const { hasTestSeries, purchase, isPurchasing, isLoadingEntitlements } = usePurchase();

  const openAttachment = async (url: string) => {
    try {
      await WebBrowser.openBrowserAsync(url);
    } catch (error) {
      showToast('error', 'Could not open question paper');
    }
  };

  if (isLoading || !series) return <LoadingSpinner message="Loading test series..." />;

  const chapters = series.testChapters || [];
  const isPurchased = hasTestSeries(testSeriesId);
  const isPaid = !!series.price && series.price > 0;
  const isLocked = isPaid && !isPurchased && !isLoadingEntitlements;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} />}>
      <Text variant="headlineSmall" style={styles.title}>{series.title}</Text>
      {series.description && <Text variant="bodyMedium" style={styles.description}>{series.description}</Text>}

      {isLocked && (
        <View style={styles.paywall}>
          <Text variant="headlineSmall" style={styles.paywallPrice}>{formatCurrency(series.price!)}</Text>
          <Text variant="bodySmall" style={styles.paywallCopy}>
            Buy this series to download question papers and submit your answers for review.
          </Text>
          <Button
            mode="contained"
            icon="lock-open-outline"
            onPress={() => purchase({ type: 'testSeries', id: testSeriesId })}
            loading={isPurchasing}
            disabled={isPurchasing}
            style={styles.paywallButton}
          >
            {isPurchasing ? 'Completing payment...' : 'Buy Test Series'}
          </Button>
          <Text variant="bodySmall" style={styles.paywallNote}>
            You'll pay securely via Razorpay, then return to the app.
          </Text>
        </View>
      )}

      <Text variant="titleMedium" style={styles.sectionTitle}>Chapters</Text>
      {chapters.map((chapter: TestChapter) => {
        const latest = chapter.submissions?.[0];
        const attachments = chapter.attachments || [];
        return (
          <View key={chapter.id} style={styles.card}>
            <View style={styles.cardTop}>
              <View style={styles.iconTile}><Ionicons name="document-text-outline" size={22} color={colors.navy} /></View>
              <View style={styles.cardBody}>
                <Text variant="titleMedium" style={styles.cardTitle}>{chapter.title}</Text>
                <Text variant="bodySmall" style={styles.cardMeta}>{latest ? `Latest: ${latest.status}` : 'Submit photos for review'}</Text>
              </View>
            </View>

            {chapter.description && <Text variant="bodySmall" style={styles.chapterDescription}>{chapter.description}</Text>}

            {(chapter.tests || []).length > 0 && (
              <View style={styles.testList}>
                {(chapter.tests || []).map((test) => (
                  <Pressable
                    key={test.id}
                    style={styles.testRow}
                    onPress={() => navigation.navigate('TakeTest', { testId: test.id })}
                  >
                    <Ionicons name="timer-outline" size={18} color={colors.navy} />
                    <View style={styles.testInfo}>
                      <Text variant="bodyMedium" style={styles.testTitle}>{test.title}</Text>
                      <Text variant="bodySmall" style={styles.testMeta}>
                        {test.duration} min · {test.totalMarks} marks
                        {test._count?.questions ? ` · ${test._count.questions} questions` : ''}
                        {test.isFree ? ' · Free' : ''}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={colors.muted} />
                  </Pressable>
                ))}
              </View>
            )}

            {isLocked ? (
              <Text variant="bodySmall" style={styles.lockedNote}>
                <Ionicons name="lock-closed" size={12} color={colors.muted} /> Buy the series to unlock question papers.
              </Text>
            ) : attachments.length > 0 ? (
              <View style={styles.attachmentList}>
                {attachments.map((attachment: Attachment) => (
                  <Button
                    key={attachment.id}
                    mode="outlined"
                    icon="file-document-outline"
                    compact
                    style={styles.attachmentButton}
                    labelStyle={styles.attachmentLabel}
                    onPress={() => openAttachment(attachment.url)}
                  >
                    {attachment.name || 'Question paper'}
                  </Button>
                ))}
              </View>
            ) : (
              <Text variant="bodySmall" style={styles.noPaper}>Question paper has not been uploaded yet.</Text>
            )}

            <Button
              mode="contained"
              icon="camera-outline"
              style={styles.submitButton}
              disabled={isLocked}
              onPress={() => navigation.navigate('SubmitAssignment', { testSeriesId, testChapterId: chapter.id })}
            >
              Submit Answers
            </Button>
          </View>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  title: { color: colors.text, fontWeight: '800', marginBottom: spacing.sm },
  description: { color: colors.muted, lineHeight: 22, marginBottom: spacing.xl },
  sectionTitle: { color: colors.text, fontWeight: '800', marginBottom: spacing.md },
  card: { borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, padding: spacing.md, marginBottom: spacing.md, ...shadow.card },
  cardTop: { minHeight: 52, flexDirection: 'row', alignItems: 'center' },
  iconTile: { width: 44, height: 44, borderRadius: radius.sm, backgroundColor: colors.tealSoft, alignItems: 'center', justifyContent: 'center', marginRight: spacing.md },
  cardBody: { flex: 1 },
  cardTitle: { color: colors.text, fontWeight: '800' },
  cardMeta: { color: colors.muted, marginTop: 4 },
  chapterDescription: { color: colors.muted, lineHeight: 20, marginTop: spacing.sm },
  testList: { marginTop: spacing.md, gap: spacing.sm },
  testRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 52,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
    backgroundColor: colors.blueSoft,
  },
  testInfo: { flex: 1 },
  testTitle: { color: colors.text, fontWeight: '700' },
  testMeta: { color: colors.muted, marginTop: 2 },
  attachmentList: { marginTop: spacing.md, gap: spacing.sm },
  attachmentButton: { borderRadius: radius.sm, alignSelf: 'stretch' },
  attachmentLabel: { fontSize: 12 },
  noPaper: { color: colors.muted, marginTop: spacing.md },
  lockedNote: { color: colors.muted, marginTop: spacing.md, fontStyle: 'italic' },
  paywall: {
    backgroundColor: colors.navy,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    alignItems: 'center',
  },
  paywallPrice: { color: colors.surface, fontWeight: '800' },
  paywallCopy: {
    color: colors.teal,
    textAlign: 'center',
    marginTop: spacing.sm,
    lineHeight: 20,
  },
  paywallButton: { borderRadius: radius.sm, marginTop: spacing.lg, alignSelf: 'stretch' },
  paywallNote: { color: colors.teal, marginTop: spacing.sm, opacity: 0.8, textAlign: 'center' },
  submitButton: { borderRadius: radius.sm, marginTop: spacing.md },
});

export default TestDetailScreen;
