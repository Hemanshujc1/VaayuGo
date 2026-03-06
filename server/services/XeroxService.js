const Decimal = require('decimal.js');

class XeroxService {
  /**
   * Calculates the total cost for a printing job.
   * @param {number} pageCount - Total number of individual pages in the document.
   * @param {object} options - User selections (color, double_side, binding, copies).
   * @param {object} metadata - Shop pricing rules from Product.xerox_metadata.
   * @returns {number}
   */
  static calculatePrintPrice(pageCount, options, metadata) {
    if (!metadata) return 0;

    const { 
      color = false, 
      double_side = false, 
      binding = false, 
      copies = 1 
    } = options;

    const pricePerPage = new Decimal(color ? 
      metadata.price_per_page_color : 
      metadata.price_per_page_bw);

    let totalPagesToPay = new Decimal(pageCount);

    // Apply double-side discount if provided
    if (double_side && metadata.double_side_discount_factor) {
      // Logic: 2 sides cost less than 2 single pages.
      // We multiply total pages by the factor.
      totalPagesToPay = totalPagesToPay.times(metadata.double_side_discount_factor);
    }

    let subtotal = totalPagesToPay.times(pricePerPage).times(copies);

    // Add binding fee once (not per copy, usually per document)
    if (binding && metadata.binding_fee_spiral) {
      subtotal = subtotal.plus(new Decimal(metadata.binding_fee_spiral).times(copies));
    }

    return subtotal.toDecimalPlaces(2).toNumber();
  }
}

module.exports = XeroxService;
