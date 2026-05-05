/**
 * Extract Supabase Storage object paths for the `posts` bucket from public URLs.
 * Uploads use getPublicUrl — paths look like …/object/public/posts/{userId}/file…
 */
export function pathsFromPostMediaUrls(urls: string[] | null | undefined): string[] {
  if (!urls?.length) return [];
  const marker = "/object/public/posts/";
  const paths: string[] = [];
  for (const raw of urls) {
    try {
      const u = new URL(raw);
      const i = u.pathname.indexOf(marker);
      if (i === -1) continue;
      const path = decodeURIComponent(u.pathname.slice(i + marker.length));
      if (path.length > 0) paths.push(path);
    } catch {
      /* ignore invalid URL */
    }
  }
  return paths;
}
