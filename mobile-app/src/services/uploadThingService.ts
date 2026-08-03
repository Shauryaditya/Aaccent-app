import { uploadFiles } from '../lib/uploadthing';

type UploadThingEndpoint =
  | 'courseAttachment'
  | 'testChapterAttachment'
  | 'testSubmission'
  | 'chapterSubmission';

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

/**
 * Thin wrapper over UploadThing's official Expo client.
 *
 * This previously hand-implemented the v6 presign/POST/poll protocol, which broke when
 * UploadThing stopped serving those endpoints. The signature is unchanged so existing
 * call sites keep working, but the wire protocol is now the library's problem, and
 * large files no longer need special multipart handling.
 */
export const uploadThingService = {
  uploadFile: async (
    endpoint: UploadThingEndpoint,
    file: UploadableFile
  ): Promise<UploadThingFile> => {
    // React Native can read a local file:// URI through fetch and hand back a Blob.
    const blob = await fetch(file.uri).then((response) => response.blob());

    // React Native's FormData only accepts a file-like object that carries a `uri`;
    // without it the upload fails. This mirrors what @uploadthing/expo's own pickers do.
    const nativeFile = Object.assign(new File([blob], file.name, { type: file.type }), {
      uri: file.uri,
    });

    const [uploaded] = await uploadFiles(endpoint, { files: [nativeFile] });

    if (!uploaded) {
      throw new Error('Upload completed but UploadThing returned no file');
    }

    return {
      name: uploaded.name,
      size: uploaded.size,
      type: file.type,
      key: uploaded.key,
      url: uploaded.ufsUrl,
    };
  },
};
