const { PDFDocument } = require('pdf-lib');
const fs = require('fs');

class FileService {
  /**
   * Calculates the number of pages in a PDF document.
   * @param {string|Buffer} source - Path to file or Buffer
   * @returns {Promise<number>}
   */
  static async getPdfPageCount(source) {
    try {
      let buffer;
      if (Buffer.isBuffer(source)) {
        buffer = source;
      } else {
        buffer = fs.readFileSync(source);
      }
      
      const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });
      return pdfDoc.getPageCount();
    } catch (error) {
      console.error('Error counting PDF pages:', error);
      // Fallback to 1 if it fails, but ideally we'd throw or handle specifically
      return 1;
    }
  }

  /**
   * Placeholder for other formats (DOCX/Images)
   * In a real production app, this would use specialized libraries.
   */
  static async getPageCount(file, mimetype) {
    if (mimetype === 'application/pdf') {
      return await this.getPdfPageCount(file.path || file.buffer);
    }
    
    // Default to 1 for images and others for now
    return 1;
  }
}

module.exports = FileService;
