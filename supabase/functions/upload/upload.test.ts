// supabase/functions/uploads/upload.test.ts
import { assertEquals, assertExists, assert } from "https://deno.land/std/testing/asserts.ts";
import {
  uploadFile,
  parseFormData,
  maybeTransformImage,
  generateFilename,
  SupabaseClient,
  StorageBucket,
  ImageTransformer,
  ImageTransformOptions,
} from "./upload.ts";
import {
  isImageContentType,
  resolveContentType,
  normalizeTransformOptions,
} from "./transform.ts";

// ============================================================
// Test helpers
// ============================================================

/**
 * A mock image transformer that records the bytes & options it received
 * so we can assert on them in tests. It does NOT actually transform the
 * image — it just echoes the input bytes with the desired output
 * content type.
 */
function makeMockTransformer(opts?: {
  outContentType?: string;
  outBytes?: Uint8Array;
}): ImageTransformer & {
  calls: Array<{ bytes: Uint8Array; options: ImageTransformOptions; sourceType: string }>;
} {
  const calls: Array<
    { bytes: Uint8Array; options: ImageTransformOptions; sourceType: string }
  > = [];
  return {
    calls,
    async transform(bytes, options, sourceType) {
      calls.push({ bytes, options, sourceType });
      const outBytes = opts?.outBytes ?? bytes;
      return {
        contentType: opts?.outContentType ?? sourceType,
        bytes: outBytes,
        size: outBytes.length,
      };
    },
  };
}

function makeSupabaseMock(
  uploadFn?: (
    path: string,
    file: File | Blob,
    options: any,
  ) => Promise<{ data: any; error: any }>,
): SupabaseClient {
  return {
    storage: {
      from: (_bucket: string) => ({
        upload: uploadFn ??
          (async (path, file, _options) => {
            return { data: { path, bucket: _bucket }, error: null };
          }),
        getPublicUrl(path: string) {
          return { data: { publicUrl: `https://xxx.supabase.co/${_bucket}/${path}` } };
        },
      }),
    },
  };
}

// ============================================================
// parseFormData
// ============================================================

Deno.test("parseFormData returns correct values with custom bucket and inferred content-type from file", async () => {
  const fileContent = new Blob(
    ["Hello Supabase Edge Function Uploads!"],
    { type: "text/plain" },
  );
  const form = new FormData();
  form.append("bucket", "uploads");
  form.append("path", "uploads/");
  form.append("file", fileContent, "sample.txt");

  const request = new Request("http://localhost/functions/v1/uploads?bucket=uploads", {
    method: "POST",
    body: form,
  });

  const result = await parseFormData(request);
  assertEquals(result.bucket, "uploads");
  assertEquals(result.path, "uploads/");
  assertEquals(result.contentType, "text/plain");
  assertExists(result.file);
  assertEquals(result.transformOptions, null);
});

Deno.test("parseFormData extracts transform options from JSON-encoded field", async () => {
  const fileContent = new Blob(["fake-image-bytes"], { type: "image/png" });
  const form = new FormData();
  form.append("bucket", "images");
  form.append("path", "uploads/");
  form.append("file", fileContent, "sample.png");
  form.append("options", JSON.stringify({
    resize: { width: 200, height: 100, ratio: true },
    transparent: true,
    format: "webp",
  }));

  const request = new Request("http://localhost/functions/v1/uploads", {
    method: "POST",
    body: form,
  });

  const result = await parseFormData(request);
  assertEquals(result.transformOptions?.resize?.width, 200);
  assertEquals(result.transformOptions?.resize?.height, 100);
  assertEquals(result.transformOptions?.resize?.ratio, true);
  assertEquals(result.transformOptions?.transparent, true);
  assertEquals(result.transformOptions?.format, "webp");
});

// ============================================================
// isImageContentType
// ============================================================

Deno.test("isImageContentType returns true for image mime types", () => {
  assertEquals(isImageContentType("image/jpeg"), true);
  assertEquals(isImageContentType("image/jpg"), true);
  assertEquals(isImageContentType("image/png"), true);
  assertEquals(isImageContentType("image/webp"), true);
});

Deno.test("isImageContentType returns false for non-image mime types", () => {
  assertEquals(isImageContentType("text/plain"), false);
  assertEquals(isImageContentType("application/pdf"), false);
  assertEquals(isImageContentType(""), false);
  assertEquals(isImageContentType(null), false);
  assertEquals(isImageContentType(undefined), false);
});

// ============================================================
// normalizeTransformOptions
// ============================================================

Deno.test("normalizeTransformOptions applies default ratio=true when not provided", () => {
  const normalized = normalizeTransformOptions({
    resize: { width: 100, height: 100 },
  });
  assertEquals(normalized.resize?.ratio, true);
  assertEquals(normalized.resize?.width, 100);
  assertEquals(normalized.resize?.height, 100);
});

Deno.test("normalizeTransformOptions does not set default format", () => {
  const normalized = normalizeTransformOptions({});
  assertEquals(normalized.format, undefined);
});

Deno.test("normalizeTransformOptions defaults transparent to false", () => {
  const normalized = normalizeTransformOptions({});
  assertEquals(normalized.transparent, false);
});

// ============================================================
// resolveContentType
// ============================================================

Deno.test("resolveContentType uses format when provided", () => {
  assertEquals(resolveContentType("image/png", { format: "webp" }), "image/webp");
  assertEquals(resolveContentType("image/png", { format: "jpg" }), "image/jpeg");
  assertEquals(resolveContentType("image/png", { format: "png" }), "image/png");
});

Deno.test("resolveContentType falls back to source type", () => {
  assertEquals(resolveContentType("image/jpeg", {}), "image/jpeg");
  assertEquals(resolveContentType("image/png", {}), "image/png");
});

// ============================================================
// maybeTransformImage
// ============================================================

Deno.test("maybeTransformImage returns original file when options is null", async () => {
  const file = new File(["fake"], "test.png", { type: "image/png" });
  const result = await maybeTransformImage(file, "image/png", null, makeMockTransformer());

  assertEquals(result.transformed, false);
  assertEquals(result.contentType, "image/png");
  assertEquals(result.file, file);
});

Deno.test("maybeTransformImage skips transformation for non-image content type", async () => {
  const file = new File(["text"], "test.txt", { type: "text/plain" });
  const transformer = makeMockTransformer();
  const result = await maybeTransformImage(file, "text/plain", { format: "png" }, transformer);
  assertEquals(result.transformed, false);
  assertEquals(transformer.calls.length, 0);
});

Deno.test("maybeTransformImage calls transformer for image with options", async () => {
  const file = new File(["image-bytes"], "test.png", { type: "image/png" });
  const transformer = makeMockTransformer({
    outContentType: "image/webp",
    outBytes: new Uint8Array([1, 2, 3]),
  });

  const options: ImageTransformOptions = {
    resize: { width: 200, height: 100 },
    format: "webp",
  };

  const result = await maybeTransformImage(file, "image/png", options, transformer);

  assertEquals(result.transformed, true);
  assertEquals(result.contentType, "image/webp");
  assertEquals(transformer.calls.length, 1);
  assertEquals(transformer.calls[0].options.format, "webp");
  assertEquals(transformer.calls[0].sourceType, "image/png");
});

// ============================================================
// uploadFile (with image transformation)
// ============================================================

Deno.test("uploadFile returns success response with custom bucket and inferred content-type from file", async () => {
  const fileContent = new Blob(["Hello"], { type: "text/plain" });
  const form = new FormData();
  form.append("bucket", "uploads");
  form.append("path", "uploads/");
  form.append("file", fileContent, "sample.txt");

  const request = new Request("http://localhost/functions/v1/uploads?bucket=uploads", {
    method: "POST",
    body: form,
  });

  const supabaseMock = makeSupabaseMock();
  const response = await uploadFile(request, supabaseMock, {});

  const json = await response.json();
  assertEquals(response.status, 200);
  assertExists(json.success);
  assertEquals(json.bucket, "uploads");
  assert(json.path.startsWith("uploads/"));
  const genFilename = json.path.split("/").pop();
  assert(/^\d{8}_[0-9a-f-]{36}\.\w+$/.test(genFilename));
  assertEquals(json.contentType, "text/plain");
});

Deno.test("uploadFile returns upload error handling response", async () => {
  const fileContent = new Blob(["Hello"], { type: "text/plain" });
  const form = new FormData();
  form.append("bucket", "uploads");
  form.append("path", "uploads/");
  form.append("file", fileContent, "sample.txt");

  const request = new Request("http://localhost/functions/v1/uploads", {
    method: "POST",
    body: form,
  });

  const supabaseMock = makeSupabaseMock(async () => ({
    data: null,
    error: {
      message: "SUPABASE_URL is required but not set",
      code: "MISSING_SUPABASE_URL",
    },
  }));
  const response = await uploadFile(request, supabaseMock, {});

  const json = await response.json();
  assertEquals(response.status, 500);
  assertEquals(json.error, "SUPABASE_URL is required but not set");
});

Deno.test("uploadFile applies image transformation when image + options provided", async () => {
  const fileContent = new Blob(["fake-png"], { type: "image/png" });
  const form = new FormData();
  form.append("bucket", "images");
  form.append("path", "uploads/");
  form.append("file", fileContent, "sample.png");
  form.append("options", JSON.stringify({
    resize: { width: 200, height: 100 },
    transparent: true,
    format: "webp",
  }));

  const request = new Request("http://localhost/functions/v1/uploads", {
    method: "POST",
    body: form,
  });

  let uploadedFile: File | Blob | null = null;
  let uploadedContentType: string | null = null;

  const supabaseMock = makeSupabaseMock(async (path, file, options) => {
    uploadedFile = file;
    uploadedContentType = options?.contentType;
    return { data: { path, bucket: "images" }, error: null };
  });

  const transformer = makeMockTransformer({
    outContentType: "image/webp",
    outBytes: new Uint8Array([9, 8, 7]),
  });

  const response = await uploadFile(
    request,
    supabaseMock,
    {},
    transformer,
  );

  const json = await response.json();
  assertEquals(response.status, 200);
  assertExists(json.transformed);
  assertEquals(json.contentType, "image/webp");
  assertEquals(uploadedContentType, "image/webp");
  assertEquals(transformer.calls.length, 1);
});

Deno.test("uploadFile does not transform image when no options provided", async () => {
  const fileContent = new Blob(["fake-png"], { type: "image/png" });
  const form = new FormData();
  form.append("bucket", "images");
  form.append("path", "uploads/");
  form.append("file", fileContent, "sample.png");

  const request = new Request("http://localhost/functions/v1/uploads", {
    method: "POST",
    body: form,
  });

  const transformer = makeMockTransformer();
  const supabaseMock = makeSupabaseMock();
  const response = await uploadFile(request, supabaseMock, {}, transformer);

  const json = await response.json();
  assertEquals(response.status, 200);
  assertEquals(json.contentType, "image/png");
  assertEquals(transformer.calls.length, 0);
});

Deno.test("uploadFile does not transform non-image file even when options provided", async () => {
  const fileContent = new Blob(["text"], { type: "text/plain" });
  const form = new FormData();
  form.append("bucket", "files");
  form.append("path", "uploads/");
  form.append("file", fileContent, "sample.txt");
  form.append("options", JSON.stringify({
    resize: { width: 200, height: 100 },
    format: "png",
  }));

  const request = new Request("http://localhost/functions/v1/uploads", {
    method: "POST",
    body: form,
  });

  const transformer = makeMockTransformer();
  const supabaseMock = makeSupabaseMock();
  const response = await uploadFile(request, supabaseMock, {}, transformer);

  const json = await response.json();
  assertEquals(response.status, 200);
  assertEquals(json.contentType, "text/plain");
  assertEquals(transformer.calls.length, 0);
});

// ============================================================
// generateFilename
// ============================================================

Deno.test("generateFilename returns YYYYMMDD_uuid.ext format for File with extension", () => {
  const file = new File(["content"], "photo.png", { type: "image/png" });
  const name = generateFilename(file);
  assert(/^\d{8}_[0-9a-f-]{36}\.png$/.test(name));
});

Deno.test("generateFilename returns YYYYMMDD_uuid format (no ext) for File without extension", () => {
  const file = new File(["content"], "photo", { type: "image/png" });
  const name = generateFilename(file);
  assert(/^\d{8}_[0-9a-f-]{36}$/.test(name));
});

Deno.test("generateFilename returns YYYYMMDD_uuid format (no ext) for Blob without contentType", () => {
  const blob = new Blob(["content"], { type: "application/octet-stream" });
  const name = generateFilename(blob);
  assert(/^\d{8}_[0-9a-f-]{36}$/.test(name));
});

Deno.test("generateFilename uses contentType fallback for Blob", () => {
  const blob = new Blob(["content"], { type: "image/png" });
  const name = generateFilename(blob, "image/png");
  assert(/^\d{8}_[0-9a-f-]{36}\.png$/.test(name));
});

Deno.test("generateFilename preserves file extension correctly", () => {
  const file = new File(["data"], "document.txt", { type: "text/plain" });
  const name = generateFilename(file);
  assert(name.endsWith(".txt"));
});
