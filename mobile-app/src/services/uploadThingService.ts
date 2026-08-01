import Constants from 'expo-constants';
import { getAuthToken } from './api';

const API_BASE_URL = Constants.expoConfig?.extra?.apiBaseUrl || 'http://localhost:3000';
const UPLOADTHING_VERSION = '6.7.0';

type UploadThingEndpoint = 'courseAttachment' | 'testChapterAttachment' | 'testSubmission' | 'chapterSubmission';

type UploadableFile = {
  uri: string;
  name: string;
  type: string;
  size: number;
};

type UploadThingFile = {
  name: string;
  size: number;
  type: string;
  key: string;
  url: string;
};

type PresignedPost = {
  url: string;
  fields: Record<string, string>;
  key: string;
  fileName: string;
  pollingUrl?: string;
  pollingJwt?: string;
};

type MultipartPresigned = {
  urls: string[];
  chunkSize: number;
  key: string;
  fileName: string;
  uploadId: string;
  contentDisposition: string;
  pollingUrl?: string;
  pollingJwt?: string;
};

const getUploadHeaders = async () => {
  const token = await getAuthToken();

  return {
    'Content-Type': 'application/json',
    'x-uploadthing-package': 'uploadthing/client',
    'x-uploadthing-version': UPLOADTHING_VERSION,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const reportUploadEvent = async <T>(
  endpoint: UploadThingEndpoint,
  actionType: string,
  payload: unknown
): Promise<T> => {
  const url = `${API_BASE_URL}/api/uploadthing?actionType=${actionType}&slug=${endpoint}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: await getUploadHeaders(),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `UploadThing ${actionType} failed`);
  }

  return response.json();
};

const uploadPresignedPost = (file: UploadableFile, presigned: PresignedPost) => {
  const formData = new FormData();
  Object.entries(presigned.fields).forEach(([key, value]) => {
    formData.append(key, value);
  });
  formData.append('file', {
    uri: file.uri,
    name: file.name,
    type: file.type,
  } as any);

  return fetch(presigned.url, {
    method: 'POST',
    body: formData,
  }).then(async (response) => {
    if (!response.ok) {
      throw new Error(await response.text() || 'Storage upload failed');
    }
  });
};

const pollUploadComplete = async (presigned: PresignedPost | MultipartPresigned) => {
  if (!presigned.pollingUrl || !presigned.pollingJwt) {
    return null;
  }

  for (let attempt = 0; attempt < 10; attempt += 1) {
    const response = await fetch(presigned.pollingUrl, {
      headers: {
        authorization: presigned.pollingJwt,
      },
    });
    const data = await response.json();
    if (data.status === 'done') {
      return data.callbackData || null;
    }
    await new Promise((resolve) => setTimeout(resolve, 500 + attempt * 250));
  }

  return null;
};

export const uploadThingService = {
  uploadFile: async (
    endpoint: UploadThingEndpoint,
    file: UploadableFile
  ): Promise<UploadThingFile> => {
    const presignedList = await reportUploadEvent<Array<PresignedPost | MultipartPresigned>>(
      endpoint,
      'upload',
      {
        input: null,
        files: [
          {
            name: file.name,
            size: file.size,
            type: file.type,
          },
        ],
      }
    );

    const presigned = presignedList[0];
    if (!presigned) {
      throw new Error('UploadThing did not return an upload URL');
    }

    if ('urls' in presigned) {
      throw new Error('Large multipart mobile uploads are not wired yet. Use a file under 16MB for attachments.');
    }

    await uploadPresignedPost(file, presigned);
    await pollUploadComplete(presigned);

    return {
      name: file.name,
      size: file.size,
      type: file.type,
      key: presigned.key,
      url: `https://utfs.io/f/${presigned.key}`,
    };
  },
};
