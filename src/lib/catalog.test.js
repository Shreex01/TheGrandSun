import test from 'node:test'
import assert from 'node:assert/strict'
import { isValidGoogleDriveUrl, isValidProductId, mapCatalogRows } from './catalog.js'

test('maps database courses and e-books into storefront products', () => {
  const products = mapCatalogRows(
    [{
      id: 'existing-course',
      title: 'Updated course',
      category: 'Design',
      instructor: 'Course author',
      price_inr: 750,
      published: true,
    }],
    [{
      id: 'new-guide',
      title: 'New guide',
      category: 'Writing',
      author: 'Book author',
      price_inr: 250,
      pages: 42,
      file_format: 'PDF',
      published: false,
    }],
    [{
      id: 'existing-course',
      type: 'course',
      image: 'course-cover',
      rating: '4.9',
      reviews: 7,
      students: '10',
      tag: 'Bestseller',
    }],
  )

  assert.equal(products.length, 2)
  assert.deepEqual(products[0], {
    id: 'new-guide',
    title: 'New guide',
    category: 'Writing',
    instructor: 'Book author',
    price: 250,
    published: false,
    rating: 'New',
    reviews: 0,
    students: 'New',
    level: 'All levels',
    image: 'photo-1544947950-fa07a98d237f',
    imageAlt: 'A digital book from Infinivium',
    tag: 'New',
    type: 'ebook',
    pages: 42,
    fileFormat: 'PDF',
  })
  assert.equal(products[1].image, 'course-cover')
  assert.equal(products[1].price, 750)
  assert.equal(products[1].instructor, 'Course author')
})

test('validates product IDs without accepting unsafe forms', () => {
  assert.equal(isValidProductId('a-10-b'), true)
  assert.equal(isValidProductId('already-owned'), true)
  assert.equal(isValidProductId('Upper-case'), false)
  assert.equal(isValidProductId('two--hyphens'), false)
  assert.equal(isValidProductId('-leading-hyphen'), false)
  assert.equal(isValidProductId('with spaces'), false)
})

test('accepts only HTTPS Drive and Docs hosts for course delivery', () => {
  assert.equal(isValidGoogleDriveUrl('https://drive.google.com/drive/folders/example'), true)
  assert.equal(isValidGoogleDriveUrl('https://docs.google.com/document/d/example'), true)
  assert.equal(isValidGoogleDriveUrl('http://drive.google.com/folder'), false)
  assert.equal(isValidGoogleDriveUrl('https://drive.google.com.attacker.example/file'), false)
  assert.equal(isValidGoogleDriveUrl('https://example.com/drive.google.com'), false)
})
