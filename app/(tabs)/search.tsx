import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFeedStore } from '../../store/feedStore';
import { useGroupStore } from '../../store/groupStore';
import { extractSearchKeywords, getSearchSuggestions } from '../../services/nlpService';
import { IEEE_BRANCHES, IEEE_TOPICS } from '../../config/api';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight } from '../../constants/theme';

const TRENDING = ['AI Workshop', 'Hackathon 2026', 'Quantum Computing', 'Cybersecurity', 'IoT Projects'];

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'posts' | 'communities' | 'branches' | 'news'>('posts');
  const { posts, news, fetchIEEENews, fetchPosts, isLoading } = useFeedStore();
  const { groups, fetchGroups } = useGroupStore();

  useEffect(() => {
    if (posts.length === 0) {
      fetchPosts();
    }
  }, []);

  const suggestions = getSearchSuggestions(query, IEEE_TOPICS);

  const filteredPosts = query.trim()
    ? posts.filter((p) => {
        const kw = extractSearchKeywords(query);
        const text = `${p.title} ${p.summary} ${p.tags.join(' ')}`.toLowerCase();
        return kw.some((k) => text.includes(k));
      })
    : posts;

  const filteredBranches = query.trim()
    ? IEEE_BRANCHES.filter(
        (b) =>
          b.name.toLowerCase().includes(query.toLowerCase()) ||
          b.university.toLowerCase().includes(query.toLowerCase()) ||
          b.city.toLowerCase().includes(query.toLowerCase())
      )
    : IEEE_BRANCHES;

  const filteredGroups = query.trim()
    ? groups.filter(g => 
        g.name.toLowerCase().includes(query.toLowerCase()) || 
        g.description?.toLowerCase().includes(query.toLowerCase())
      )
    : groups;

  const handleNewsSearch = useCallback(async () => {
    if (query.trim()) {
      await fetchIEEENews(query);
    } else {
      await fetchIEEENews('IEEE technology engineering');
    }
  }, [query]);

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Explore</Text>
        <Text style={styles.subtitle}>Search posts, branches & news</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchBar}>
        <Ionicons name="search" size={18} color={Colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search IEEE content..."
          placeholderTextColor={Colors.textMuted}
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={handleNewsSearch}
          returnKeyType="search"
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery('')}>
            <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Suggestions */}
      {query.length > 1 && suggestions.length > 0 && (
        <View style={styles.suggestionsBox}>
          {suggestions.map((s) => (
            <TouchableOpacity key={s} style={styles.suggestion} onPress={() => setQuery(s)}>
              <Ionicons name="trending-up" size={14} color={Colors.accent} />
              <Text style={styles.suggestionText}>{s}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Trending (when empty) */}
      {!query && (
        <View style={styles.trendingSection}>
          <Text style={styles.sectionTitle}>🔥 Trending Now</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.trendingScroll}>
            {TRENDING.map((t) => (
              <TouchableOpacity key={t} style={styles.trendChip} onPress={() => setQuery(t)}>
                <Text style={styles.trendText}>{t}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Tabs */}
      <View style={styles.tabs}>
        {(['posts', 'communities', 'branches', 'news'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => {
              setActiveTab(tab);
              if (tab === 'news') handleNewsSearch();
              if (tab === 'communities' && groups.length === 0) fetchGroups('All');
            }}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Results */}
      {isLoading && <ActivityIndicator color={Colors.primary} style={{ marginTop: 40 }} />}

      {!isLoading && activeTab === 'posts' && (
        <FlatList
          data={filteredPosts.slice(0, 10)}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.resultItem} onPress={() => router.push(`/post/${item.id}`)}>
              {item.imageUrl && (
                <Image source={{ uri: item.imageUrl }} style={styles.resultImage} />
              )}
              <View style={styles.resultContent}>
                <View style={styles.resultTag}>
                  <Text style={styles.resultTagText}>{item.type.toUpperCase()}</Text>
                </View>
                <Text style={styles.resultTitle} numberOfLines={2}>{item.title}</Text>
                <Text style={styles.resultMeta}>{item.author}</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      {!isLoading && activeTab === 'communities' && (
        <FlatList
          data={filteredGroups}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.branchCard} onPress={() => router.push(`/group/${item.id}`)}>
              <View style={styles.branchAvatar}>
                {item.avatar ? (
                  <Image source={{uri: item.avatar}} style={{width: 48, height: 48, borderRadius: 24}} />
                ) : (
                  <Text style={styles.branchAvatarText}>{item.name[0]}</Text>
                )}
              </View>
              <View style={styles.branchInfo}>
                <Text style={styles.branchName}>{item.name}</Text>
                <Text style={styles.branchCity}>
                  <Ionicons name="people" size={12} color={Colors.textMuted} /> {item.memberCount} members
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          )}
        />
      )}

      {!isLoading && activeTab === 'branches' && (
        <FlatList
          data={filteredBranches}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.branchCard} onPress={() => router.push(`/branch/${item.id}`)}>
              <View style={styles.branchAvatar}>
                <Text style={styles.branchAvatarText}>{item.name[0]}</Text>
              </View>
              <View style={styles.branchInfo}>
                <Text style={styles.branchName}>{item.university}</Text>
                <Text style={styles.branchCity}>
                  <Ionicons name="location" size={12} color={Colors.textMuted} /> {item.city}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          )}
        />
      )}

      {!isLoading && activeTab === 'news' && (
        <FlatList
          data={news.length ? news : []}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyNews}>
              <Ionicons name="globe-outline" size={40} color={Colors.textMuted} />
              <Text style={styles.emptyText}>Press search to load IEEE news</Text>
              <TouchableOpacity style={styles.loadNewsBtn} onPress={handleNewsSearch}>
                <Text style={styles.loadNewsBtnText}>Load IEEE News</Text>
              </TouchableOpacity>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.newsItem}>
              {item.urlToImage && (
                <Image source={{ uri: item.urlToImage }} style={styles.newsImage} />
              )}
              <View style={styles.newsContent}>
                <Text style={styles.newsSource}>{item.source}</Text>
                <Text style={styles.newsTitle} numberOfLines={3}>{item.title}</Text>
                <Text style={styles.newsDesc} numberOfLines={2}>{item.description}</Text>
              </View>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bgDark },
  header: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: Spacing.sm },
  title: { fontSize: FontSize.xxxl, fontWeight: FontWeight.extraBold, color: Colors.textPrimary },
  subtitle: { color: Colors.textSecondary, fontSize: FontSize.md },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.bgCard, borderRadius: BorderRadius.lg, marginHorizontal: Spacing.lg, marginBottom: Spacing.md, paddingHorizontal: Spacing.md, gap: 10, borderWidth: 1, borderColor: Colors.border },
  searchInput: { flex: 1, color: Colors.textPrimary, fontSize: FontSize.md, paddingVertical: 14 },
  suggestionsBox: { marginHorizontal: Spacing.lg, backgroundColor: Colors.bgCard, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.border, marginBottom: Spacing.sm, overflow: 'hidden' },
  suggestion: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: Spacing.md, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: Colors.border },
  suggestionText: { color: Colors.textPrimary, fontSize: FontSize.md },
  trendingSection: { paddingHorizontal: Spacing.lg, marginBottom: Spacing.md },
  sectionTitle: { color: Colors.textPrimary, fontSize: FontSize.base, fontWeight: FontWeight.bold, marginBottom: 10 },
  trendingScroll: { gap: 8 },
  trendChip: { backgroundColor: Colors.bgCard, borderRadius: BorderRadius.full, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: Colors.borderLight },
  trendText: { color: Colors.textSecondary, fontSize: FontSize.sm, fontWeight: FontWeight.medium },
  tabs: { flexDirection: 'row', marginHorizontal: Spacing.lg, backgroundColor: Colors.bgCard, borderRadius: BorderRadius.md, padding: 4, marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.border },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: BorderRadius.sm },
  tabActive: { backgroundColor: Colors.primary },
  tabText: { color: Colors.textMuted, fontSize: FontSize.sm, fontWeight: FontWeight.medium },
  tabTextActive: { color: '#fff' },
  list: { paddingHorizontal: Spacing.lg, paddingBottom: 100, gap: 12 },
  resultItem: { flexDirection: 'row', backgroundColor: Colors.bgCard, borderRadius: BorderRadius.lg, overflow: 'hidden', borderWidth: 1, borderColor: Colors.border },
  resultImage: { width: 90, height: 80 },
  resultContent: { flex: 1, padding: 12, gap: 4 },
  resultTag: { backgroundColor: Colors.primary + '22', borderRadius: BorderRadius.full, paddingHorizontal: 8, paddingVertical: 2, alignSelf: 'flex-start' },
  resultTagText: { color: Colors.primary, fontSize: FontSize.xs, fontWeight: FontWeight.bold },
  resultTitle: { color: Colors.textPrimary, fontSize: FontSize.sm, fontWeight: FontWeight.semiBold, lineHeight: 18 },
  resultMeta: { color: Colors.textMuted, fontSize: FontSize.xs },
  branchCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.bgCard, borderRadius: BorderRadius.lg, padding: Spacing.md, borderWidth: 1, borderColor: Colors.border, gap: 12 },
  branchAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center' },
  branchAvatarText: { color: '#fff', fontSize: FontSize.xl, fontWeight: FontWeight.bold },
  branchInfo: { flex: 1 },
  branchName: { color: Colors.textPrimary, fontSize: FontSize.md, fontWeight: FontWeight.semiBold },
  branchCity: { color: Colors.textMuted, fontSize: FontSize.sm, marginTop: 2 },
  newsItem: { backgroundColor: Colors.bgCard, borderRadius: BorderRadius.lg, overflow: 'hidden', borderWidth: 1, borderColor: Colors.border },
  newsImage: { width: '100%', height: 150 },
  newsContent: { padding: 12, gap: 6 },
  newsSource: { color: Colors.accent, fontSize: FontSize.xs, fontWeight: FontWeight.bold },
  newsTitle: { color: Colors.textPrimary, fontSize: FontSize.md, fontWeight: FontWeight.semiBold, lineHeight: 22 },
  newsDesc: { color: Colors.textSecondary, fontSize: FontSize.sm, lineHeight: 18 },
  emptyNews: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyText: { color: Colors.textMuted, fontSize: FontSize.md },
  loadNewsBtn: { backgroundColor: Colors.primary, borderRadius: BorderRadius.md, paddingHorizontal: 24, paddingVertical: 12 },
  loadNewsBtnText: { color: '#fff', fontWeight: FontWeight.bold },
});
