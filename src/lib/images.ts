const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function hasValidSignature(bytes: Uint8Array, type: string): boolean {
  if (type === "image/jpeg") return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (type === "image/png") {
    return bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
  }
  return (
    type === "image/webp" &&
    String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
    String.fromCharCode(...bytes.slice(8, 12)) === "WEBP"
  );
}

export async function readValidatedImage(
  value: FormDataEntryValue | null,
  maxBytes: number,
): Promise<{ file: File; bytes: Uint8Array; extension: string } | null> {
  if (!(value instanceof File) || !IMAGE_TYPES.has(value.type) || value.size > maxBytes)
    return null;
  const bytes = new Uint8Array(await value.arrayBuffer());
  if (!hasValidSignature(bytes, value.type)) return null;
  return {
    file: value,
    bytes,
    extension: value.type === "image/jpeg" ? "jpg" : value.type.split("/")[1],
  };
}
