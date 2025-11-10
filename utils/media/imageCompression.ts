import * as ImageManipulator from 'expo-image-manipulator';

export interface CompressedImage {
  uri: string;
  width: number;
  height: number;
  base64?: string;
}

export interface ImageCompressionResult {
  compressed: CompressedImage;
  thumbnail: CompressedImage;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
}

/**
 * Compress image for chat messages
 * - Compressed: Max 1024px width, 80% quality
 * - Thumbnail: Max 200px width, 70% quality
 */
export async function compressImageForChat(
  imageUri: string
): Promise<ImageCompressionResult> {
  try {
    // Get original image info
    const originalInfo = await ImageManipulator.manipulateAsync(
      imageUri,
      [],
      { base64: false }
    );

    // Calculate original size (estimate from dimensions)
    const originalSize = estimateImageSize(originalInfo.width, originalInfo.height);

    // 1. Create compressed version (for full view)
    const compressed = await ImageManipulator.manipulateAsync(
      imageUri,
      [{ resize: { width: 1024 } }], // Maintain aspect ratio
      {
        compress: 0.8, // 80% quality
        format: ImageManipulator.SaveFormat.JPEG,
        base64: true, // Get base64 for SQLite storage
      }
    );

    // 2. Create thumbnail (for list preview)
    const thumbnail = await ImageManipulator.manipulateAsync(
      imageUri,
      [{ resize: { width: 200 } }], // Small preview
      {
        compress: 0.7, // 70% quality
        format: ImageManipulator.SaveFormat.JPEG,
        base64: true,
      }
    );

    // Calculate compressed size from base64
    const compressedSize = compressed.base64 
      ? Math.ceil((compressed.base64.length * 3) / 4) 
      : 0;

    return {
      compressed: {
        uri: compressed.uri,
        width: compressed.width,
        height: compressed.height,
        base64: compressed.base64,
      },
      thumbnail: {
        uri: thumbnail.uri,
        width: thumbnail.width,
        height: thumbnail.height,
        base64: thumbnail.base64,
      },
      originalSize,
      compressedSize,
      compressionRatio: originalSize > 0 ? compressedSize / originalSize : 1,
    };
  } catch (error) {
    console.error('Error compressing image:', error);
    throw new Error('Failed to compress image');
  }
}

/**
 * Estimate image size in bytes based on dimensions
 * Rough estimate: width * height * 4 bytes (RGBA)
 */
function estimateImageSize(width: number, height: number): number {
  return width * height * 4; // RGBA = 4 bytes per pixel
}

/**
 * Convert base64 to data URI for Image component
 */
export function base64ToDataUri(base64: string, mimeType: string = 'image/jpeg'): string {
  return `data:${mimeType};base64,${base64}`;
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}
