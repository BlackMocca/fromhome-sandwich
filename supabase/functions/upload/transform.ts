// supabase/functions/uploads/transform.ts
import {
  EXTENSION_TO_CONTENT_TYPE,
  IMAGE_CONTENT_TYPES,
  ImageContentType,
  ImageTransformOptions,
  ImageTransformer,
} from "./types.ts";
import { ImageMagick, initializeImageMagick, MagickFormat, Percentage, MagickColor } from "@imagemagick/magick-wasm"

const wasmBytes = await Deno.readFile(
  new URL("magick.wasm", import.meta.resolve("npm:@imagemagick/magick-wasm@0.0.41")),
);
await initializeImageMagick(wasmBytes);

/**
 * Check whether the given content type is a supported image type
 * that should trigger image transformation.
 */
export function isImageContentType(
  contentType: string | null | undefined,
): contentType is ImageContentType {
  if (!contentType) return false;
  return (IMAGE_CONTENT_TYPES as readonly string[]).includes(contentType);
}

/**
 * Apply defaults to image transform options.
 * - `resize.ratio` defaults to true
 * - `transparent` defaults to false
 */
export function normalizeTransformOptions(
  options: ImageTransformOptions,
): ImageTransformOptions {
  return {
    resize: options.resize
      ? { ratio: true, ...options.resize }
      : undefined,
    transparent: options.transparent ?? false,
    format: options.format,
    quality: options.quality,
  };
}

/**
 * Resolve the final content type based on transform options / extension.
 */
export function resolveContentType(
  _sourceType: string,
  options: ImageTransformOptions,
): string {
  const ext = options.format;
  if (ext && EXTENSION_TO_CONTENT_TYPE[ext]) {
    return EXTENSION_TO_CONTENT_TYPE[ext];
  }
  return _sourceType || "application/octet-stream";
}

/**
 * Default implementation that uses `@imagemagick/magick-wasm`.
 *
 * The library is dynamically imported so unit tests don't load it.
 * WASM bytes are read via Deno.readFile (avoids fetch protocol issues).
 */
export async function createMagickTransformer(): Promise<ImageTransformer> {

  return {
    async transform(
      bytes: Uint8Array,
      options: ImageTransformOptions,
      sourceType: string,
    ): Promise<{ contentType: string; bytes: Uint8Array; size: number }> {
      const normalized = normalizeTransformOptions(options);

      const outBytes = await ImageMagick.read(bytes, async (img: any) => {
        // Resize
        if (normalized.resize) {
          const { width, height, ratio } = normalized.resize;
          if (width && height) {
            img.resize(width, height);
          } else if (width) {
            img.resize(width, 0);
          } else if (height) {
            img.resize(0, height);
          }
          void ratio;
        }

        // Transparent
        if (normalized.transparent) {
          img.colorFuzz = new Percentage(10);
          img.transparent(new MagickColor("white"));
        }

        // Select output format
        const formatMap: Record<string, MagickFormat | undefined> = {
          jpg: MagickFormat.Jpg,
          webp: MagickFormat.WebP,
          png: MagickFormat.Png,
        };
        const outFormat = normalized.format ? formatMap[normalized.format] : undefined;

        if (normalized.quality) {
          img.settings.quality = normalized.quality;
        }

        // Encode bytes back
        return img.write(outFormat, (data: Uint8Array) => data.slice());
      });

      const contentType = resolveContentType(sourceType, options);
      return { contentType, bytes: outBytes, size: outBytes.length };
    },
  };
}
