import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { ThemedText } from './ThemedText';
import { Avatar } from './Avatar';
import { User } from '@/core/hooks/useUser';

interface UserListItemProps {
  user: User;
  onSelect?: (user: User) => void;
  isSelected?: boolean;
}

export function UserListItem({ user, onSelect, isSelected }: UserListItemProps) {
  const handlePress = () => {
    if (onSelect) {
      onSelect(user);
    }
  };

  return (
    <Pressable
      style={[styles.container, isSelected && styles.selectedContainer]}
      onPress={handlePress}
    >
      <Avatar user={user} size={50} />
      <View style={styles.infoContainer}>
        <ThemedText type="defaultSemiBold">{user.name}</ThemedText>
        <ThemedText style={styles.statusText}>
          {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
        </ThemedText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E1E1E1',
  },
  selectedContainer: {
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
  },
  infoContainer: {
    marginLeft: 12,
    flex: 1,
  },
  statusText: {
    fontSize: 14,
    color: '#8F8F8F',
    marginTop: 4,
  },
});
