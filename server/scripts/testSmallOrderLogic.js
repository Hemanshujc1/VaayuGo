const { validateOrderAgainstRule } = require('../services/RuleEngineService');

async function testSmallOrderLogic() {
    console.log('--- Testing Small Order Fee Logic Refinement ---');

    const rule = {
        min_order_value: 50,
        delivery_fee: 10,
        small_order_delivery_fee: 5
    };

    // Scenario 1: Subtotal=50, ProdDisc=5 => Value=45 (Small Order)
    const subtotal1 = 50;
    const prodDisc1 = 5;
    const value1 = subtotal1 - prodDisc1;
    const result1 = validateOrderAgainstRule(value1, rule);
    console.log(`Scenario 1: Subtotal=${subtotal1}, ProdDisc=${prodDisc1} => OrderValue=${value1}`);
    console.log(`Expected isSmallOrder: true, Got: ${result1.isSmallOrder}`);
    if (result1.isSmallOrder === true) {
        console.log('✅ Success: Small order fee correctly triggered.');
    } else {
        console.error('❌ Failure: Small order fee should have been triggered.');
    }

    // Scenario 2: Subtotal=55, ProdDisc=5 => Value=50 (Not Small Order)
    const subtotal2 = 55;
    const prodDisc2 = 5;
    const value2 = subtotal2 - prodDisc2;
    const result2 = validateOrderAgainstRule(value2, rule);
    console.log(`\nScenario 2: Subtotal=${subtotal2}, ProdDisc=${prodDisc2} => OrderValue=${value2}`);
    console.log(`Expected isSmallOrder: false, Got: ${result2.isSmallOrder}`);
    if (result2.isSmallOrder === false) {
        console.log('✅ Success: Small order fee correctly NOT triggered.');
    } else {
        console.error('❌ Failure: Small order fee should NOT have been triggered.');
    }

    console.log('\n--- Test Complete ---');
}

testSmallOrderLogic();
