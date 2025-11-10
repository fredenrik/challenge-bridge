import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator
} from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useAuth, useUsers, useChatsContext } from '@/hooks/AppContext';
import { useChatMessages } from '@/hooks/useChatMessages';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { MessageBubble } from '@/components/MessageBubble';
import { Avatar } from '@/components/Avatar';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { ImagePickerButton } from '@/components/ImagePickerButton';

export default function ChatRoomScreen() {
  const { chatId } = useLocalSearchParams<{ chatId: string }>();
  const { currentUser } = useAuth();
  const { users } = useUsers();
  const { chats, sendMessage } = useChatsContext();
  const { messages, loading, loadingMore, hasMore, loadOlderMessages, addNewMessage } = useChatMessages(chatId || null);
  const [messageText, setMessageText] = useState('');
  const flatListRef = useRef<FlatList>(null);
  const router = useRouter();

  const chat = chats.find(c => c.id === chatId);

  const chatParticipants = chat?.participants
    .filter(id => id !== currentUser?.id)
    .map(id => users.find(user => user.id === id))
    .filter(Boolean) || [];

  const chatName = chatParticipants.length === 1
    ? chatParticipants[0]?.name
    : `${chatParticipants[0]?.name || 'Unknown'} & ${chatParticipants.length - 1} other${chatParticipants.length > 1 ? 's' : ''}`;

  const handleSendMessage = async () => {
    if (messageText.trim() && currentUser && chatId) {
      const text = messageText.trim();
      setMessageText('');
      
      const success = await sendMessage(chatId, text, currentUser.id);
      if (success) {
        // Optimistically add the message to the local state
        const optimisticMessage = {
          id: `temp-${Date.now()}`,
          chatId,
          senderId: currentUser.id,
          text,
          timestamp: Date.now(),
          type: 'text' as const,
        };
        addNewMessage(optimisticMessage);
      }
    }
  };

  const handleImageSelected = async (compressedUri: string, thumbnailUri: string, size: number) => {
    try {
      if (currentUser && chatId) {
        const success = await sendMessage(chatId, 'Image', currentUser.id, {
          type: 'image',
          mediaUri: compressedUri,
          thumbnailUri: thumbnailUri,
          mediaSize: size,
        });
        
        if (success) {
          // Optimistically add the image message to local state
          const optimisticMessage = {
            id: `temp-${Date.now()}`,
            chatId,
            senderId: currentUser.id,
            text: 'Image',
            timestamp: Date.now(),
            type: 'image' as const,
            mediaUri: compressedUri,
            thumbnailUri: thumbnailUri,
            mediaSize: size,
          };
          addNewMessage(optimisticMessage);
        }
      }
    } catch (error) {
      console.error('Error sending image:', error);
    }
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length && flatListRef.current && !loading) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length, loading]);

  if (!currentUser) {
    return (
      <ThemedView style={styles.centerContainer}>
        <ThemedText>Please log in</ThemedText>
      </ThemedView>
    );
  }

  if (loading && messages.length === 0) {
    return (
      <ThemedView style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <ThemedText style={{ marginTop: 10 }}>Loading messages...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <StatusBar style="auto" />
      <Stack.Screen
        options={{
          headerTitle: () => (
            <View style={styles.headerContainer}>
              <Avatar
                user={chatParticipants[0]}
                size={32}
                showStatus={false}
              />
              <ThemedText type="defaultSemiBold" numberOfLines={1}>
                {chatName}
              </ThemedText>
            </View>
          ),
          headerLeft: () => (
            <Pressable onPress={() => router.back()}>
              <IconSymbol name="chevron.left" size={24} color="#007AFF" />
            </Pressable>
          ),
        }}
      />

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <MessageBubble
            message={item}
            isCurrentUser={item.senderId === currentUser.id}
          />
        )}
        contentContainerStyle={styles.messagesContainer}
        onEndReached={() => {
          if (hasMore && !loadingMore) {
            loadOlderMessages();
          }
        }}
        onEndReachedThreshold={0.5}
        inverted={false}
        ListHeaderComponent={
          loadingMore ? (
            <View style={styles.loadingMore}>
              <ActivityIndicator size="small" color="#007AFF" />
              <ThemedText style={styles.loadingText}>Loading older messages...</ThemedText>
            </View>
          ) : hasMore ? (
            <Pressable onPress={loadOlderMessages} style={styles.loadMoreButton}>
              <ThemedText style={styles.loadMoreText}>Load older messages</ThemedText>
            </Pressable>
          ) : null
        }
        ListEmptyComponent={() => (
          <ThemedView style={styles.emptyContainer}>
            <ThemedText>No messages yet. Say hello!</ThemedText>
          </ThemedView>
        )}
      />

      <ThemedView style={styles.inputContainer}>
        <ImagePickerButton onImageSelected={handleImageSelected} />
        <TextInput
          style={styles.input}
          value={messageText}
          onChangeText={setMessageText}
          placeholder="Type a message..."
          multiline
        />
        <Pressable
          style={[styles.sendButton, !messageText.trim() && styles.disabledButton]}
          onPress={handleSendMessage}
          disabled={!messageText.trim()}
        >
          <IconSymbol name="arrow.up.circle.fill" size={32} color="#007AFF" />
        </Pressable>
      </ThemedView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  messagesContainer: {
    padding: 10,
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 10,
    alignItems: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: '#E1E1E1',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E1E1E1',
    borderRadius: 20,
    padding: 10,
    maxHeight: 100,
    backgroundColor: '#F9F9F9',
  },
  sendButton: {
    marginLeft: 8,
    marginBottom: 5,
  },
  disabledButton: {
    opacity: 0.5,
  },
  loadingMore: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
    gap: 10,
  },
  loadingText: {
    fontSize: 14,
    opacity: 0.6,
  },
  loadMoreButton: {
    padding: 12,
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
    marginHorizontal: 10,
    marginBottom: 10,
  },
  loadMoreText: {
    color: '#007AFF',
    fontWeight: '600',
  },
});
