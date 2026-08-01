import React from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import * as WebBrowser from 'expo-web-browser';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { testService } from '../../services/testService';
import { Attachment, StudentStackParamList, TestChapter, TestSeries } from '../../types';
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

  const openAttachment = async (url: string) => {
    try {
      await WebBrowser.openBrowserAsync(url);
    } catch (error) {
      showToast('error', 'Could not open question paper');
    }
  };

  if (isLoading || !series) return <LoadingSpinner message="Loading test series..." />;

  const chapters = series.testChapters || [];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} />}>
      <Text variant="headlineSmall" style={styles.title}>{series.title}</Text>
      {series.description && <Text variant="bodyMedium" style={styles.description}>{series.description}</Text>}
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

            {attachments.length > 0 ? (
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
  attachmentList: { marginTop: spacing.md, gap: spacing.sm },
  attachmentButton: { borderRadius: radius.sm, alignSelf: 'stretch' },
  attachmentLabel: { fontSize: 12 },
  noPaper: { color: colors.muted, marginTop: spacing.md },
  submitButton: { borderRadius: radius.sm, marginTop: spacing.md },
});

export default TestDetailScreen;
