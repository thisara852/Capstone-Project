import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Group } from '../store/groupStore';
import { Colors, BorderRadius, FontSize, Spacing, FontWeight } from '../constants/theme';

interface GroupCardProps {
  group: Group;
  onPress: () => void;
  onJoin: () => void;
  isJoined: boolean;
}

export function GroupCard({ group, onPress, onJoin, isJoined }: GroupCardProps) {
  const categoryColors: Record<string, string> = {
    Research: Colors.primary,
    Security: Colors.error,
    Robotics: Colors.accentGold,
    Community: Colors.success,
    default: Colors.accent,
  };
  const categoryColor = categoryColors[group.category] || categoryColors.default;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.9}>
      {group.banner && (
        <Image source={{ uri: group.banner }} style={styles.cover} resizeMode="cover" />
      )}
      <LinearGradient
        colors={['transparent', 'rgba(10,15,30,0.98)']}
        style={styles.gradient}
      />

      <View style={styles.content}>
        <View style={[styles.categoryBadge, { backgroundColor: categoryColor + '33', borderColor: categoryColor }]}>
          <Text style={[styles.categoryText, { color: categoryColor }]}>{group.category}</Text>
        </View>
        <Text style={styles.name} numberOfLines={1}>{group.name}</Text>
        <Text style={styles.description} numberOfLines={2}>{group.description}</Text>

        <View style={styles.footer}>
          <View style={styles.members}>
            <Ionicons name="people" size={14} color={Colors.textSecondary} />
            <Text style={styles.memberCount}>{group.memberCount} members</Text>
            {group.visibility === 'private' && (
              <Ionicons name="lock-closed" size={12} color={Colors.textMuted} style={{ marginLeft: 6 }} />
            )}
          </View>
          <TouchableOpacity
            style={[styles.joinBtn, isJoined && styles.joinedBtn]}
            onPress={(e) => { e.stopPropagation(); onJoin(); }}
          >
            <Text style={[styles.joinText, isJoined && styles.joinedText]}>
              {isJoined ? 'Joined ✓' : 'Join'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    marginBottom: Spacing.md,
    marginHorizontal: Spacing.md,
    height: 200,
    backgroundColor: Colors.bgCard,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cover: {
    ...StyleSheet.absoluteFillObject,
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: Spacing.md,
    gap: 6,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  categoryText: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },
  name: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  description: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  members: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  memberCount: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
  },
  joinBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
  },
  joinedBtn: {
    backgroundColor: Colors.bgSurface,
    borderWidth: 1,
    borderColor: Colors.success,
  },
  joinText: {
    color: '#fff',
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semiBold,
  },
  joinedText: {
    color: Colors.success,
  },
});
