import * as FileSystem from 'expo-file-system';
import { supabase } from './supabase';

export async function uploadAvatar(userId: string, uri: string): Promise<string | null> {
  const ext = uri.split('.').pop() || 'jpg';
  const filePath = `${userId}/avatar.${ext}`;
  const fileInfo = await FileSystem.getInfoAsync(uri);
  if (!fileInfo.exists) return null;
  const fileContent = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
  const { data, error } = await supabase.storage
    .from('avatars')
    .upload(filePath, decodeBase64(fileContent), {
      contentType: `image/${ext}`,
      upsert: true,
    });
  if (error) throw error;
  const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
  return urlData.publicUrl;
}

export async function uploadFile(
  bucket: string,
  path: string,
  uri: string
): Promise<string | null> {
  const fileInfo = await FileSystem.getInfoAsync(uri);
  if (!fileInfo.exists) return null;
  const fileContent = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, decodeBase64(fileContent), { upsert: true });
  if (error) throw error;
  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path);
  return urlData.publicUrl;
}

function decodeBase64(base64: string): Uint8Array {
  const binaryStr = atob(base64);
  const bytes = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) {
    bytes[i] = binaryStr.charCodeAt(i);
  }
  return bytes;
}
