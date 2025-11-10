import React, { useState } from 'react';
import { View, StyleSheet, Image, Pressable, Modal } from 'react-native';
import { ThemedText } from './ThemedText';
import { Message } from '@/types/entities';
import { useColorScheme } from '@/hooks/useColorScheme';

interface MessageBubbleProps {
  message: Message;
  isCurrentUser: boolean;
}

export function MessageBubble({ message, isCurrentUser }: MessageBubbleProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [showFullImage, setShowFullImage] = useState(false);

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const isImageMessage = message.type === 'image' && message.thumbnailUri;

  return (
    <View style={[
      styles.container,
      isCurrentUser ? styles.selfContainer : styles.otherContainer
    ]}>
      <View style={[
        styles.bubble,
        isCurrentUser 
          ? [styles.selfBubble, { backgroundColor: isDark ? '#235A4A' : '#DCF8C6' }]
          : [styles.otherBubble, { backgroundColor: isDark ? '#2A2C33' : '#FFFFFF' }],
        isImageMessage && styles.imageBubble
      ]}>
        {isImageMessage && (
          <Pressable onPress={() => setShowFullImage(true)}>
            <Image 
              source={{ uri: message.thumbnailUri }} 
              style={styles.thumbnail}
              resizeMode="cover"
            />
          </Pressable>
        )}
        {message.text && (
          <ThemedText style={[
            styles.messageText,
            isCurrentUser && !isDark && styles.selfMessageText
          ]}>
            {message.text}
          </ThemedText>
        )}
        <View style={styles.timeContainer}>
          <ThemedText style={styles.timeText}>
            {formatTime(message.timestamp)}
          </ThemedText>
        </View>
      </View>
      
      {/* Full-screen image modal */}
      {isImageMessage && message.mediaUri && (
        <Modal
          visible={showFullImage}
          transparent={true}
          onRequestClose={() => setShowFullImage(false)}
        >
          <Pressable 
            style={styles.modalContainer}
            onPress={() => setShowFullImage(false)}
          >
            <Image 
              source={{ uri: message.mediaUri }} 
              style={styles.fullImage}
              resizeMode="contain"
            />
          </Pressable>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
    maxWidth: '80%',
  },
  selfContainer: {
    alignSelf: 'flex-end',
  },
  otherContainer: {
    alignSelf: 'flex-start',
  },
  bubble: {
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    elevation: 1,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  selfBubble: {
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
  },
  selfMessageText: {
    color: '#000000',
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 2,
  },
  timeText: {
    fontSize: 11,
    opacity: 0.7,
  },
  imageBubble: {
    padding: 4,
  },
  thumbnail: {
    width: 200,
    height: 150,
    borderRadius: 12,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullImage: {
    width: '90%',
    height: '80%',
  },
});
