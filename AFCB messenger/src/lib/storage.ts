import { ref, uploadString, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from './firebase';

type MediaType = 'image' | 'video' | 'audio';

const MIME_EXT: Record<string, string> = {
  image: 'jpg',
  video: 'webm',
  audio: 'webm',
};

/**
 * Upload base64 media to Firebase Storage and return download URL.
 * Falls back to returning the base64 string on error (legacy behavior).
 */
export async function uploadMedia(
  base64Data: string,
  chatId: string,
  msgId: string,
  type: MediaType
): Promise<string> {
  try {
    const ext = MIME_EXT[type] || 'bin';
    const fileRef = ref(storage, `messages/${chatId}/${msgId}/${type}.${ext}`);
    await uploadString(fileRef, base64Data, 'data_url');
    return await getDownloadURL(fileRef);
  } catch (err) {
    console.warn('Storage upload failed, falling back to base64:', err);
    return base64Data;
  }
}

/**
 * Upload profile photo to Firebase Storage and return download URL.
 */
export async function uploadProfilePhoto(
  base64Data: string,
  userId: string
): Promise<string> {
  try {
    const fileRef = ref(storage, `profiles/${userId}/photo.jpg`);
    await uploadString(fileRef, base64Data, 'data_url');
    return await getDownloadURL(fileRef);
  } catch (err) {
    console.warn('Profile photo upload failed, falling back to base64:', err);
    return base64Data;
  }
}

/**
 * Delete a media file from Storage.
 */
export async function deleteMedia(storageUrl: string): Promise<void> {
  if (!storageUrl.startsWith('https://')) return; // skip base64
  try {
    const fileRef = ref(storage, storageUrl);
    await deleteObject(fileRef);
  } catch (err) {
    console.warn('Storage delete failed:', err);
  }
}
