import React, { useState } from 'react';
import { Pressable, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { IconSymbol } from './ui/IconSymbol';
import { compressImageForChat } from '@/utils/media/imageCompression';

interface ImagePickerButtonProps {
  onImageSelected: (compressedUri: string, thumbnailUri: string, size: number) => void;
  disabled?: boolean;
}

export function ImagePickerButton({ onImageSelected, disabled }: ImagePickerButtonProps) {
  const [loading, setLoading] = useState(false);

  const pickImage = async () => {
    try {
      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant camera roll permissions');
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
        await processImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const processImage = async (uri: string) => {
    try {
      setLoading(true);
      
      // Compress image
      const compressed = await compressImageForChat(uri);
      
      // Pass base64 data URIs to parent
      const compressedDataUri = compressed.compressed.base64 
        ? `data:image/jpeg;base64,${compressed.compressed.base64}`
        : compressed.compressed.uri;
        
      const thumbnailDataUri = compressed.thumbnail.base64
        ? `data:image/jpeg;base64,${compressed.thumbnail.base64}`
        : compressed.thumbnail.uri;

      onImageSelected(compressedDataUri, thumbnailDataUri, compressed.compressedSize);
    } catch (error) {
      console.error('Error processing image:', error);
      Alert.alert('Error', 'Failed to process image');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Pressable
      style={[styles.button, disabled && styles.disabled]}
      onPress={pickImage}
      disabled={disabled || loading}
    >
      {loading ? (
        <ActivityIndicator size="small" color="#007AFF" />
      ) : (
        <IconSymbol name="photo" size={24} color="#007AFF" />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 5,
  },
  disabled: {
    opacity: 0.5,
  },
});
