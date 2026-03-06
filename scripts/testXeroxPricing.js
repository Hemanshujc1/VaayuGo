const XeroxService = require('../server/services/XeroxService');
const assert = require('assert');

const metadata = {
  price_per_page_bw: 2,
  price_per_page_color: 10,
  binding_fee_spiral: 30,
  double_side_discount_factor: 0.8
};

// Test 1: Simple B&W, 10 pages, 1 copy
const t1 = XeroxService.calculatePrintPrice(10, { color: false, double_side: false, binding: false, copies: 1 }, metadata);
console.log('Test 1 (B&W 10p 1c):', t1);
assert.strictEqual(t1, 20);

// Test 2: Color, 10 pages, 1 copy
const t2 = XeroxService.calculatePrintPrice(10, { color: true, double_side: false, binding: false, copies: 1 }, metadata);
console.log('Test 2 (Color 10p 1c):', t2);
assert.strictEqual(t2, 100);

// Test 3: Double Sided B&W, 10 pages, 1 copy (10 * 0.8 * 2 = 16)
const t3 = XeroxService.calculatePrintPrice(10, { color: false, double_side: true, binding: false, copies: 1 }, metadata);
console.log('Test 3 (Double B&W 10p 1c):', t3);
assert.strictEqual(t3, 16);

// Test 4: Spiral Binding, 10 pages, 2 copies (10 * 2 * 2 + 30 * 2 = 100)
const t4 = XeroxService.calculatePrintPrice(10, { color: false, double_side: false, binding: true, copies: 2 }, metadata);
console.log('Test 4 (Spiral 10p 2c):', t4);
assert.strictEqual(t4, 100);

console.log('All pricing tests passed!');
