// supabase/functions/uploads/upload.ts
import {
  SupabaseClient,
  StorageBucket,
  UploadOptions,
  ImageTransformOptions,
  ImageTransformer,
} from "./types.ts";
import {
  isImageContentType,
} from "./transform.ts";

export type {
  SupabaseClient,
  StorageBucket,
  UploadOptions,
  ImageTransformOptions,
  ImageTransformer,
};

// ── ImageMagick initialisation ─────────────────────
let _globalTransformer: ImageTransformer | undefined;
const _initTransformer: Promise<void> = (async () => {
  try {
    const { createMagickTransformer } = await import("./transform.ts");
    _globalTransformer = await createMagickTransformer();
  } catch (err) {
    console.error("ImageMagick WASM init failed:", err);
  }
})();

export async function getGlobalTransformer(): Promise<ImageTransformer | undefined> {
  await _initTransformer;
  return _globalTransformer;
}

const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/svg+xml": "svg",
  "text/plain": "txt",
  "text/html": "html",
  "text/css": "css",
  "text/javascript": "js",
  "text/csv": "csv",
  "application/json": "json",
  "application/pdf": "pdf",
  "application/zip": "zip",
  "application/gzip": "gz",
};

export function generateFilename(file: File | Blob, contentType?: string): string {
  const now = new Date();
  const yyyymmdd = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  const uuid = crypto.randomUUID();

  let ext = "";

  if (contentType) {
    ext = MIME_TO_EXT[contentType] ?? "";
  }

  if (!ext && file instanceof File) {
    const dotIdx = file.name.lastIndexOf(".");
    if (dotIdx > 0) {
      ext = file.name.slice(dotIdx + 1);
    }
  }

  return ext ? `${yyyymmdd}_${uuid}.${ext}` : `${yyyymmdd}_${uuid}`;
}

export interface ParsedUpload {
  bucket: string;
  path: string;
  file: File | Blob;
  contentType: string;
  transformOptions: ImageTransformOptions | null;
}

/**
 * Parse multipart/form-data and extract bucket, path, file, contentType,
 * and an optional image transformOptions (a JSON string in the
 * "options" / "transform" field).
 *
 * The options field is parsed as JSON if present.
 */
export async function parseFormData(
  req: Request,
): Promise<ParsedUpload> {
  const formData = await req.formData();
  const url = new URL(req.url);
  const bucketQueryParam = url.searchParams.get("bucket");

  const bucket = (formData.get("bucket") as string) || bucketQueryParam ||
    "uploads";
  const path = (formData.get("path") as string) || "uploads";

  const fileField = formData.get("file") as Blob | string | null | undefined;
  const file = fileField instanceof File
    ? fileField
    : new File(
      [fileField as Blob | string],
      "file",
      { type: (fileField as any)?.type || "application/octet-stream" },
    );

  // contentType comes from the file in the multipart form data
  const contentType = file.type || "application/octet-stream";

  // Optional transform options — can be a JSON string or a Blob
  let transformOptions: ImageTransformOptions | null = null;
  const rawOptions = formData.get("options") ?? formData.get("transform");
  if (rawOptions) {
    try {
      const text = typeof rawOptions === "string"
        ? rawOptions
        : await (rawOptions as Blob).text();
      if (text && text.trim().length > 0) {
        const parsed = JSON.parse(text);
        if (parsed && typeof parsed === "object") {
          transformOptions = parsed as ImageTransformOptions;
        }
      }
    } catch (_err) {
      // ignore invalid JSON; leave transformOptions as null
      transformOptions = null;
    }
  }

  return { bucket, path, file, contentType, transformOptions };
}

/**
 * Apply image transformation when applicable.
 *
 * Returns the (possibly transformed) file and final contentType together
 * with a flag indicating whether transformation happened.
 */
export async function maybeTransformImage(
  file: File | Blob,
  contentType: string,
  options: ImageTransformOptions | null,
  transformer: ImageTransformer,
): Promise<{ file: File | Blob; contentType: string; transformed: boolean; size?: number }> {
  if (!options) {
    return { file, contentType, transformed: false, size: file.size };
  }
  if (!isImageContentType(contentType)) {
    return { file, contentType, transformed: false, size: file.size };
  }

  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);

  const { contentType: outType, bytes: outBytes, size } = await transformer.transform(
    bytes,
    options,
    contentType,
  );

  const outFile = new File(
    [outBytes as unknown as BlobPart],
    file instanceof File ? file.name : "file",
    { type: outType },
  );

  return { file: outFile, contentType: outType, transformed: true, size };
}

/**
 * Main upload handler — pure business logic.
 *
 * The Supabase client and image transformer are injected so that the
 * function can be unit-tested without any runtime / environment
 * dependencies.
 */
export async function uploadFile(
  req: Request,
  supabase: SupabaseClient,
  options: UploadOptions = {},
  transformer?: ImageTransformer,
): Promise<Response> {
  const parsed = await parseFormData(req);
  let { bucket, path, file, contentType } = parsed;
  let fileSize: number = file.size;

  // Image transformation
  if (parsed.transformOptions) {
    const tx = transformer ?? await getGlobalTransformer();
    if (!tx) {
      return Response.json(
        { error: "Image transformation unavailable" },
        { status: 500 },
      );
    }
    const result = await maybeTransformImage(
      file,
      contentType,
      parsed.transformOptions,
      tx,
    );
    file = result.file;
    contentType = result.contentType;
    fileSize = result.size || 0;
  }

  const filename = generateFilename(file, contentType);
  const fullPath = path.endsWith("/") ? `${path}${filename}` : `${path}/${filename}`;

  const bucketClient = supabase.storage.from(bucket) as StorageBucket;

  const { data, error } = await bucketClient.upload(
    fullPath,
    file,
    { contentType, upsert: true },
  );

  const errorObj = error as any;
  if (errorObj != null && "message" in errorObj) {
    return Response.json(
      { error: errorObj.message || "Upload failed" },
      { status: 500 },
    );
  }

  const { data: publicUrlData } = bucketClient.getPublicUrl(fullPath);

  return new Response(
    JSON.stringify({
      success: true,
      bucket,
      path: fullPath,
      contentType,
      size: fileSize,
      data,
      url: publicUrlData.publicUrl,
      transformed: parsed.transformOptions != null &&
        isImageContentType(contentType),
    }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
}
