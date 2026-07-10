// supabase/functions/uploads/types.ts

export interface StorageBucket {
  upload(
    path: string,
    file: File | Blob,
    options?: { contentType?: string; upsert?: boolean }
  ): Promise<{ data: any; error: any }>;
  getPublicUrl(
    path: string,
    options?: { download?: boolean | string },
  ): { data: { publicUrl: string } };
}

export interface StorageClient {
  from(bucketName: string): StorageBucket;
}

export interface SupabaseClient {
  storage: StorageClient;
}

export interface UploadResponse {
  success?: boolean;
  bucket: string;
  path: string;
  contentType: string;
  data: any;
  error?: string;
  transformed?: boolean;
}

export interface UploadOptions {
  bucketQueryParam?: string | null;
  defaultBucket?: string;
  defaultPath?: string;
}

/**
 * Image transformation options (all fields are optional)
 */
export interface ImageResizeOptions {
  width?: number;
  height?: number;
  /** Preserve aspect ratio when resizing (default true) */
  ratio?: boolean;
}

export type ImageExtension = "jpg" | "jpeg" | "png" | "webp";

export interface ImageTransformOptions {
  resize?: ImageResizeOptions;
  /** Preserve transparency / use transparent background */
  transparent?: boolean;
  /** Output format */
  format?: ImageExtension;

}

/**
 * Minimal interface for an image transformer — kept narrow so it can be
 * implemented either by `@imagemagick/magick-wasm` (production) or a mock
 * in tests.
 */
export interface ImageTransformer {
  transform(
    bytes: Uint8Array,
    options: ImageTransformOptions,
    sourceType: string,
  ): Promise<{ contentType: string; bytes: Uint8Array }>;
}

/**
 * Allowed content types that trigger image transformation
 */
export const IMAGE_CONTENT_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
] as const;

export type ImageContentType = typeof IMAGE_CONTENT_TYPES[number];

/**
 * Mapping from image extension → mime type
 */
export const EXTENSION_TO_CONTENT_TYPE: Record<ImageExtension, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};
