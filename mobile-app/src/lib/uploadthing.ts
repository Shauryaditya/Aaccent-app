import { generateReactNativeHelpers } from '@uploadthing/expo';
import type { FileRouter } from 'uploadthing/types';
import { getApiBaseUrl, getAuthToken } from '../services/api';

/**
 * Endpoint names mirrored from the backend router in src/app/api/uploadthing/core.ts.
 * The mobile app can't import that module across tsconfig roots, so this keeps the
 * endpoint strings type-checked without duplicating the whole router definition.
 */
export type AppFileRouter = Record<
  | 'courseImage'
  | 'courseAttachment'
  | 'chapterVideo'
  | 'testChapterAttachment'
  | 'testSubmission'
  | 'chapterSubmission',
  FileRouter[string]
>;

/**
 * UploadThing has no `headers` option, so the Clerk session token is injected via a
 * custom fetch. It is attached only for calls back to our own API — the presign step
 * — and never to UploadThing's ingest host, which must not receive our auth header.
 */
const authedFetch: typeof fetch = async (input, init) => {
  const url = typeof input === 'string' ? input : input.toString();

  if (url.startsWith(getApiBaseUrl())) {
    const token = await getAuthToken();
    if (token) {
      return fetch(input, {
        ...init,
        headers: { ...(init?.headers as Record<string, string>), Authorization: `Bearer ${token}` },
      });
    }
  }

  return fetch(input, init);
};

export const { useImageUploader, useDocumentUploader, uploadFiles } =
  generateReactNativeHelpers<AppFileRouter>({
    url: `${getApiBaseUrl()}/api/uploadthing`,
    fetch: authedFetch as any,
  });
