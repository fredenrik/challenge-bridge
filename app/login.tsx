import React from 'react';
import { StyleSheet, FlatList, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useAuth, useUsers } from '@/core/providers/AppContext';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { UserListItem } from '@/components/UserListItem';

export default function LoginScreen() {
  const { login } = useAuth();
  const { users } = useUsers();
  const router = useRouter();

  const handleUserSelect = async (userId: string) => {
    try {
      const success = await login(userId);
      if (success) {
        router.replace('/(tabs)');
      }
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="auto" />
      <ThemedView style={styles.container}>
        <ThemedView style={styles.header}>
          <ThemedText type="title">Welcome to Chat App</ThemedText>
          <ThemedText style={styles.subtitle}>
            Select a user to continue
          </ThemedText>
        </ThemedView>

        <FlatList
          data={users}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <UserListItem
              user={item}
              onSelect={() => handleUserSelect(item.id)}
            />
          )}
          contentContainerStyle={styles.listContainer}
        />
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingTop: 20,
  },
  header: {
    alignItems: 'center',
    padding: 20,
    marginBottom: 20,
  },
  subtitle: {
    marginTop: 10,
    fontSize: 16,
    color: '#8F8F8F',
  },
  listContainer: {
    paddingBottom: 20,
  },
});
