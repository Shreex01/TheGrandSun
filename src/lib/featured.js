export function selectFeaturedProducts(products, purchaseCounts, limit = 5, random = Math.random) {
  const remaining = [...products]
  const featured = []

  while (remaining.length && featured.length < limit) {
    const weights = remaining.map((product) => Math.max(1, purchaseCounts.get(product.id) ?? 0))
    const totalWeight = weights.reduce((total, weight) => total + weight, 0)
    let threshold = random() * totalWeight
    let selectedIndex = weights.findIndex((weight) => {
      threshold -= weight
      return threshold < 0
    })

    if (selectedIndex < 0) selectedIndex = remaining.length - 1
    featured.push(remaining.splice(selectedIndex, 1)[0])
  }

  return featured
}
