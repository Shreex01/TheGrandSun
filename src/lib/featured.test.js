import test from 'node:test'
import assert from 'node:assert/strict'
import { selectFeaturedProducts } from './featured.js'

test('selects up to five unique products with popular products weighted higher', () => {
  const products = Array.from({ length: 8 }, (_, index) => ({ id: `product-${index}` }))
  const purchaseCounts = new Map([['product-7', 100]])
  const featured = selectFeaturedProducts(products, purchaseCounts, 5, () => 0.5)

  assert.equal(featured.length, 5)
  assert.equal(new Set(featured.map((product) => product.id)).size, 5)
  assert.equal(featured[0].id, 'product-7')
})

test('returns every available product when fewer than the carousel limit exist', () => {
  const products = [{ id: 'one' }, { id: 'two' }]
  const featured = selectFeaturedProducts(products, new Map(), 5, () => 0.5)

  assert.deepEqual(featured.map((product) => product.id).sort(), ['one', 'two'])
})
