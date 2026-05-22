import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useGroupStore } from '../../store/groupStore';
import { useUserStore } from '../../store/userStore';
import { GroupCard } from '../../components/GroupCard';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight } from '../../constants/theme';

const CATEGORIES = ['All', 'Research', 'Security', 'Robotics', 'Community'];

export default function GroupsScreen() {
  const { groups, fetchGroups, joinGroup } = useGroupStore();
  const { user, profile } = useUserStore();
  const [activeCategory, setActiveCategory] = useState('All');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchGroups();
  }, []);

  const userId = user?.uid || 'demo-user';

  const filtered = groups.filter((g) => {
    const matchCat = activeCategory === 'All' || g.category === activeCategory;
    const matchSearch = !search || g.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const myGroups = groups.filter((g) => g.members.includes(userId));

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false} stickyHeaderIndices={[2]}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Groups</Text>
            <Text style={styles.subtitle}>Connect with IEEE members</Text>
          </View>
          <TouchableOpacity style={styles.createBtn}>
            <LinearGradient
              colors={Colors.gradientPrimary as [string, string]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.createGradient}
            >
              <Ionicons name="add" size={18} color="#fff" />
              <Text style={styles.createText}>Create</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* My Groups */}
        {myGroups.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>My Groups ({myGroups.length})</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.myGroupsScroll}>
              {myGroups.map((group) => (
                <TouchableOpacity
                  key={group.id}
                  style={styles.myGroupChip}
                  onPress={() => router.push(`/group/${group.id}`)}
                >
                  <Text style={styles.myGroupName} numberOfLines={1}>{group.name}</Text>
                  <Ionicons name="chevron-forward" size={12} color={Colors.textSecondary} />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Sticky Search + Filter */}
        <View style={styles.stickyContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={16} color={Colors.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search groups..."
              placeholderTextColor={Colors.textMuted}
              value={search}
              onChangeText={setSearch}
            />
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catScroll}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[styles.catChip, activeCategory === cat && styles.catChipActive]}
                onPress={() => setActiveCategory(cat)}
              >
                <Text style={[styles.catText, activeCategory === cat && styles.catTextActive]}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Group Cards */}
        <View style={styles.groupList}>
          {filtered.map((group) => (
            <GroupCard
              key={group.id}
              group={group}
              onPress={() => router.push(`/group/${group.id}`)}
              onJoin={() => joinGroup(group.id, userId)}
              isJoined={group.members.includes(userId)}
            />
          ))}
          {filtered.length === 0 && (
            <View style={styles.empty}>
              <Ionicons name="people-outline" size={48} color={Colors.textMuted} />
              <Text style={styles.emptyText}>No groups found</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.bgDark },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: Spacing.sm },
  title: { fontSize: FontSize.xxxl, fontWeight: FontWeight.extraBold, color: Colors.textPrimary },
  subtitle: { color: Colors.textSecondary, fontSize: FontSize.md },
  createBtn: { borderRadius: BorderRadius.md, overflow: 'hidden' },
  createGradient: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, gap: 4 },
  createText: { color: '#fff', fontSize: FontSize.sm, fontWeight: FontWeight.bold },
  section: { paddingHorizontal: Spacing.lg, marginBottom: Spacing.sm },
  sectionTitle: { color: Colors.textSecondary, fontSize: FontSize.sm, fontWeight: FontWeight.semiBold, marginBottom: 8 },
  myGroupsScroll: { gap: 8 },
  myGroupChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.primary + '22', borderRadius: BorderRadius.full, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: Colors.primary + '44', gap: 6 },
  myGroupName: { color: Colors.primary, fontSize: FontSize.sm, fontWeight: FontWeight.semiBold, maxWidth: 120 },
  stickyContainer: { backgroundColor: Colors.bgDark, paddingBottom: Spacing.sm },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.bgCard, borderRadius: BorderRadius.md, marginHorizontal: Spacing.lg, marginBottom: Spacing.sm, paddingHorizontal: Spacing.md, gap: 8, borderWidth: 1, borderColor: Colors.border },
  searchInput: { flex: 1, color: Colors.textPrimary, fontSize: FontSize.md, paddingVertical: 12 },
  catScroll: { paddingHorizontal: Spacing.lg, gap: 8 },
  catChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: BorderRadius.full, borderWidth: 1, borderColor: Colors.borderLight, backgroundColor: Colors.bgCard },
  catChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  catText: { color: Colors.textSecondary, fontSize: FontSize.sm, fontWeight: FontWeight.medium },
  catTextActive: { color: '#fff' },
  groupList: { paddingTop: Spacing.sm },
  empty: { alignItems: 'center', paddingTop: 60, gap: 12 },
  emptyText: { color: Colors.textMuted, fontSize: FontSize.lg },
});
