// Small Cloudinary URL + list helpers shared by Gallery and ThankYou.

export const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME

export function imgUrl(publicId, width = 800) {
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/w_${width},q_auto,f_auto/${publicId}`
}

// Cloudinary serves a still frame from a video by swapping the extension. `so_auto`
// picks a representative frame for the poster.
export function videoPoster(publicId, width = 800) {
  return `https://res.cloudinary.com/${CLOUD_NAME}/video/upload/w_${width},q_auto,f_auto,so_auto/${publicId}.jpg`
}

export function videoUrl(publicId) {
  return `https://res.cloudinary.com/${CLOUD_NAME}/video/upload/q_auto/${publicId}.mp4`
}

function imageListUrl(tag) {
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/list/${tag}.json`
}

function videoListUrl(tag) {
  return `https://res.cloudinary.com/${CLOUD_NAME}/video/list/${tag}.json`
}

const safeFetch = (url) => fetch(url).then((r) => r.json()).catch(() => ({ resources: [] }))

// Returns { images: [{public_id, created_at}], videos: [{public_id, created_at, context}] }
export async function fetchByTag(tag) {
  if (!CLOUD_NAME || !tag) return { images: [], videos: [] }
  const [imgData, vidData] = await Promise.all([
    safeFetch(imageListUrl(tag)),
    safeFetch(videoListUrl(tag)),
  ])
  return {
    images: imgData.resources ?? [],
    videos: vidData.resources ?? [],
  }
}
