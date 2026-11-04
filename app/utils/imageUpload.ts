// Checks and names for images people upload (dog photos, store banners and logos).
// The buckets accept the same types and size; these give a friendly message before trying.
export const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
export const IMAGE_MAX_MB = 5
export const imageAccept = IMAGE_TYPES.join(',')

// An error message, or null when the file can be uploaded
export function checkImage(file: File): string | null {
  if (!IMAGE_TYPES.includes(file.type)) return 'Use a JPG, PNG or WebP image.'
  if (file.size > IMAGE_MAX_MB * 1024 * 1024) return `That image is over ${IMAGE_MAX_MB} MB. Try a smaller one.`
  return null
}

// A fresh storage path in a store's folder: "<store uuid>/<prefix><random>.jpg"
export const imagePath = (folder: string, file: File, prefix = '') =>
  `${folder}/${prefix}${crypto.randomUUID()}.${file.type.split('/')[1]!.replace('jpeg', 'jpg')}`
