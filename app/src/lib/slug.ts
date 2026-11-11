// Turn a business name into a safe URL slug.
// "M.M. Enterprises" -> "mm-enterprises", "Raja's Café!" -> "rajas-cafe"
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "") // strip accents
    .replace(/&/g, " and ")
    .replace(/['’.]/g, "") // drop apostrophes/dots: "M.M." -> "mm", "Raja's" -> "Rajas"
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;
