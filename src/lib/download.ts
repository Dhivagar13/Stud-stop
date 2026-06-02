import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { supabase } from './supabase';

export async function downloadFile(url: string, filename: string, onProgress?: (progress: number) => void) {
  const fileUri = FileSystem.documentDirectory + filename;
  const downloadResumable = FileSystem.createDownloadResumable(url, fileUri, {}, (downloadProgress) => {
    const progress = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
    onProgress?.(progress);
  });
  const result = await downloadResumable.downloadAsync();
  if (result && (await Sharing.isAvailableAsync())) {
    await Sharing.shareAsync(result.uri, { mimeType: 'application/pdf' });
  }
  return result?.uri;
}

export async function incrementDownloadCount(table: 'notes' | 'question_papers', id: string) {
  const { data } = await supabase.from(table).select('downloads').eq('id', id).single();
  const current = (data as any)?.downloads || 0;
  await supabase.from(table).update({ downloads: current + 1 }).eq('id', id);
}
