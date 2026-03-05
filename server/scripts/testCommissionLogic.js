const Decimal = require('decimal.js');

async function testCommissionLogic() {
    console.log('--- Testing Commission Calculation Logic Refinement ---');

    const subtotal_amount = new Decimal(100);
    const product_discount_amount = new Decimal(10);
    const shop_discount_amount = new Decimal(10);
    const commission_rate = new Decimal(10).dividedBy(100); // 10%

    // Logic: (Subtotal - Product Discount - Shop Discount) * commission_rate
    const total_commission = subtotal_amount
        .minus(product_discount_amount)
        .minus(shop_discount_amount)
        .times(commission_rate);

    console.log(`Subtotal: ${subtotal_amount.toNumber()}`);
    console.log(`Product Discount: ${product_discount_amount.toNumber()}`);
    console.log(`Shop Discount: ${shop_discount_amount.toNumber()}`);
    console.log(`Commission Rate: ${commission_rate.toNumber() * 100}%`);
    console.log(`Calculated Commission: ${total_commission.toNumber()}`);

    const expectedCommission = (100 - 10 - 10) * 0.1;
    console.log(`Expected Commission: ${expectedCommission}`);

    if (total_commission.toNumber() === expectedCommission) {
        console.log('✅ Success: Commission correctly calculated after both product and shop discounts.');
    } else {
        console.error(`❌ Failure: Commission calculation is incorrect. Got ${total_commission.toNumber()}, expected ${expectedCommission}`);
    }

    console.log('\n--- Test Complete ---');
}

testCommissionLogic();
