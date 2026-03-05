const { resolveDiscounts } = require('../services/DiscountService');

async function testPerItemCommission() {
    console.log('--- Testing Per-Item Commission Logic ---');
    const items = [
        { id: 1, price: 30, quantity: 1 } // Total 30
    ];

    // Scenario: 30 Rs product, 10% Shop discount (3 Rs), 10% Commission
    // Expected Commission: (30 - 3) * 10% = 2.7 Rs

    const subtotal = 30;
    const res = await resolveDiscounts(1, 1, null, subtotal, items);
    
    // Simulating OrderService Commission Calc
    const commission_rate = 0.10;
    let commission_amount = 0;
    if (res.itemBreakdown) {
      commission_amount = res.itemBreakdown.reduce((sum, item) => {
          const base = item.gross - item.product_discount - item.shop_discount;
          return sum + (base * commission_rate);
      }, 0);
    }
    
    console.log(`Subtotal: ${subtotal}`);
    console.log(`Shop Discount: ${res.shop_discount_amount}`);
    console.log(`Commission Amount: ${commission_amount.toFixed(2)}`);

    if (commission_amount.toFixed(2) === "2.70") {
        console.log("✅ Success: Commission calculated correctly per item.");
    } else {
        console.error(`❌ Failure: Commission expected 2.70, got ${commission_amount}`);
    }

    process.exit(0);
}

testPerItemCommission();
