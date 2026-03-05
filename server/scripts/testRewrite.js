const { resolveDiscounts } = require('../services/DiscountService');

async function testRewrite() {
    console.log('--- Testing Discount Logic ---');
    const items = [
        { id: 1, price: 50, quantity: 2 }, // 100
        { id: 2, price: 100, quantity: 1 } // 100
    ];
    // Subtotal 200

    // Assume we have a 10% shop discount and a 10 product discount flat on item 1
    // We will test the actual service
    const res = await resolveDiscounts(1, 1, null, 200, items);
    console.log(JSON.stringify(res, null, 2));

    process.exit(0);
}

testRewrite();
