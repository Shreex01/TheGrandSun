export function mapCatalogRows(courseRows, ebookRows, seedProducts = []) {
  const seedsById = new Map(seedProducts.map((product) => [product.id, product]))
  const withDefaults = (row, type) => {
    const seed = seedsById.get(row.id)
    const isEbook = type === 'ebook'
    return {
      ...seed,
      id: row.id,
      type,
      title: row.title,
      category: row.category,
      instructor: isEbook ? row.author : row.instructor,
      price: row.price_inr,
      published: row.published,
      rating: seed?.rating ?? 'New',
      reviews: seed?.reviews ?? 0,
      students: seed?.students ?? 'New',
      level: seed?.level ?? 'All levels',
      image: seed?.image ?? (isEbook ? 'photo-1544947950-fa07a98d237f' : 'photo-1513364776144-60967b0f800f'),
      imageAlt: seed?.imageAlt ?? (isEbook ? 'A digital book from Infinivium' : 'A course from Infinivium'),
      tag: seed?.tag ?? 'New',
      ...(isEbook
        ? { pages: row.pages, fileFormat: row.file_format }
        : { hours: seed?.hours ?? 'Self-paced', lessons: seed?.lessons ?? 0 }),
    }
  }

  return [
    ...ebookRows.map((row) => withDefaults(row, 'ebook')),
    ...courseRows.map((row) => withDefaults(row, 'course')),
  ]
}

export function isValidProductId(value) {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)
}

export function isValidGoogleDriveUrl(value) {
  try {
    const url = new URL(value)
    return url.protocol === 'https:' && ['drive.google.com', 'docs.google.com'].includes(url.hostname)
  } catch {
    return false
  }
}
