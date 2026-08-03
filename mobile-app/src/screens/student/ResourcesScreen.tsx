import React from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { Chip, Searchbar, Text } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import * as WebBrowser from 'expo-web-browser';
import EmptyState from '../../components/common/EmptyState';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { resourceService } from '../../services/resourceService';
import { Resource } from '../../types';
import { showToast } from '../../utils/helpers';
import { colors, radius, shadow, spacing } from '../../theme/design';

const CATEGORIES: Array<{ value: Resource['category']; label: string }> = [
  { value: 'BOARD', label: 'Board' },
  { value: 'JEE_MAINS', label: 'JEE Mains' },
  { value: 'JEE_ADVANCED', label: 'JEE Adv' },
  { value: 'NEET', label: 'NEET' },
  { value: 'OTHER', label: 'Other' },
];

const TYPES: Array<{ value: Resource['type']; label: string; icon: keyof typeof Ionicons.glyphMap }> = [
  { value: 'PAST_PAPER', label: 'Past Papers', icon: 'time-outline' },
  { value: 'SAMPLE_PAPER', label: 'Sample Papers', icon: 'documents-outline' },
  { value: 'NOTES', label: 'Notes', icon: 'reader-outline' },
];

const TYPE_ICONS: Record<Resource['type'], keyof typeof Ionicons.glyphMap> = {
  PAST_PAPER: 'time-outline',
  SAMPLE_PAPER: 'documents-outline',
  NOTES: 'reader-outline',
};

const ResourcesScreen: React.FC = () => {
  const [search, setSearch] = React.useState('');
  const [debouncedSearch, setDebouncedSearch] = React.useState('');
  const [category, setCategory] = React.useState<Resource['category'] | null>(null);
  const [type, setType] = React.useState<Resource['type'] | null>(null);

  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => clearTimeout(timer);
  }, [search]);

  const { data: resources = [], isLoading, isFetching, refetch } = useQuery<Resource[]>({
    queryKey: ['resources', category, type, debouncedSearch],
    queryFn: () =>
      resourceService.getResources({
        category: category || undefined,
        type: type || undefined,
        title: debouncedSearch || undefined,
      }),
  });

  const openResource = async (resource: Resource) => {
    try {
      await WebBrowser.openBrowserAsync(resource.url);
    } catch (error) {
      showToast('error', 'Could not open resource');
    }
  };

  // Group by subject so a long list stays scannable.
  const grouped = React.useMemo(() => {
    const map = new Map<string, Resource[]>();
    resources.forEach((resource) => {
      const key = resource.subject || 'General';
      const bucket = map.get(key);
      if (bucket) {
        bucket.push(resource);
      } else {
        map.set(key, [resource]);
      }
    });
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [resources]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      refreshControl={<RefreshControl refreshing={isFetching && !isLoading} onRefresh={refetch} />}
    >
      <Text variant="headlineSmall" style={styles.title}>Resources Library</Text>
      <Text variant="bodyMedium" style={styles.subtitle}>
        Past papers, sample papers and notes curated for your exams.
      </Text>

      <Searchbar
        placeholder="Search resources"
        value={search}
        onChangeText={setSearch}
        style={styles.search}
        inputStyle={styles.searchInput}
      />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
        {CATEGORIES.map((item) => (
          <Chip
            key={item.value}
            selected={category === item.value}
            onPress={() => setCategory(category === item.value ? null : item.value)}
            style={[styles.chip, category === item.value && styles.chipSelected]}
            textStyle={category === item.value ? styles.chipTextSelected : styles.chipText}
            showSelectedCheck={false}
          >
            {item.label}
          </Chip>
        ))}
      </ScrollView>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
        {TYPES.map((item) => (
          <Chip
            key={item.value}
            icon={() => (
              <Ionicons name={item.icon} size={15} color={type === item.value ? colors.surface : colors.muted} />
            )}
            selected={type === item.value}
            onPress={() => setType(type === item.value ? null : item.value)}
            style={[styles.chip, type === item.value && styles.chipSelected]}
            textStyle={type === item.value ? styles.chipTextSelected : styles.chipText}
            showSelectedCheck={false}
          >
            {item.label}
          </Chip>
        ))}
      </ScrollView>

      {isLoading ? (
        <View style={styles.loading}>
          <LoadingSpinner message="Loading resources..." />
        </View>
      ) : resources.length === 0 ? (
        <EmptyState
          icon="library-outline"
          title="No resources found"
          message={
            category || type || debouncedSearch
              ? 'Try clearing the filters or searching for something else.'
              : 'Your teacher has not published any resources yet.'
          }
        />
      ) : (
        grouped.map(([subject, items]) => (
          <View key={subject} style={styles.group}>
            <Text variant="titleMedium" style={styles.groupTitle}>{subject}</Text>
            {items.map((resource) => (
              <Pressable key={resource.id} style={styles.card} onPress={() => openResource(resource)}>
                <View style={styles.iconTile}>
                  <Ionicons name={TYPE_ICONS[resource.type]} size={22} color={colors.navy} />
                </View>
                <View style={styles.cardBody}>
                  <Text variant="titleSmall" style={styles.cardTitle}>{resource.title}</Text>
                  <Text variant="bodySmall" style={styles.cardMeta}>
                    {[resource.grade, resource.year ? String(resource.year) : null, resource.category.replace(/_/g, ' ')]
                      .filter(Boolean)
                      .join(' · ')}
                  </Text>
                  {!!resource.description && (
                    <Text variant="bodySmall" style={styles.cardDescription} numberOfLines={2}>
                      {resource.description}
                    </Text>
                  )}
                </View>
                <Ionicons name="open-outline" size={20} color={colors.muted} />
              </Pressable>
            ))}
          </View>
        ))
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  title: { color: colors.text, fontWeight: '800', marginBottom: spacing.xs },
  subtitle: { color: colors.muted, lineHeight: 22, marginBottom: spacing.lg },
  search: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    marginBottom: spacing.md,
  },
  searchInput: { minHeight: 44 },
  chipRow: { gap: spacing.sm, paddingRight: spacing.lg, paddingBottom: spacing.md },
  chip: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line },
  chipSelected: { backgroundColor: colors.navy, borderColor: colors.navy },
  chipText: { color: colors.muted, fontWeight: '600' },
  chipTextSelected: { color: colors.surface, fontWeight: '700' },
  loading: { height: 220 },
  group: { marginTop: spacing.lg },
  groupTitle: { color: colors.text, fontWeight: '800', marginBottom: spacing.md },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
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
    backgroundColor: colors.tealSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  cardBody: { flex: 1 },
  cardTitle: { color: colors.text, fontWeight: '800' },
  cardMeta: { color: colors.muted, marginTop: 4 },
  cardDescription: { color: colors.muted, marginTop: spacing.xs, lineHeight: 18 },
});

export default ResourcesScreen;
