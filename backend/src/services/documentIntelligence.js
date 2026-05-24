const Tesseract = require("tesseract.js");
const { PdfReader } = require("pdfreader");

/**
 * Tesseract OCR - FREE, no API keys needed!
 * Supports images (PNG, JPG, TIFF, BMP, HEIC) via OCR
 *
 * PDF parsing is handled by pdfreader for text-based PDFs.
 * For scanned/image PDFs, convert to PNG first.
 */
function getConfig() {
  const lang = process.env.TESSERACT_LANG?.trim() || "eng";
  return { lang };
}

// Always available - no API keys needed
function isDocumentIntelligenceConfigured() {
  return true;
}

async function analyzeDocumentBuffer(buffer, mimeType) {
  // Auto-detect if mimetype not provided - check PDF magic bytes
  const isPdf = mimeType === "application/pdf" || buffer.toString("ascii", 0, 4) === "%PDF";

  if (isPdf) {
    // Use pdfreader for PDFs
    return await analyzePdf(buffer);
  } else {
    // Use Tesseract for images
    return await analyzeImage(buffer);
  }
}

async function analyzePdf(buffer) {
  return new Promise((resolve, reject) => {
    const textLines = [];
    let pageCount = 0;

    const reader = new PdfReader();
    reader.parseBuffer(buffer, (err, item) => {
      if (err) {
        reject(err);
        return;
      }

      if (!item) {
        // Done parsing
        let fullText = textLines.join("\n").replace(/\s+/g, " ").trim();

        // Truncate if too long
        const maxChars = 48000;
        if (fullText.length > maxChars) {
          fullText = fullText.slice(0, maxChars) + "\n\n… (text truncated for response size)";
        }

        const lines = textLines.filter(Boolean);
        resolve({
          modelId: "pdfreader",
          pageCount,
          paragraphCount: lines.length,
          tableCount: 0,
          tablesPreview: [],
          fullText,
          words: [],
          lines,
          confidence: 100,
        });
        return;
      }

      if (item.pages) {
        pageCount = item.pages.length;
      }

      if (item.text) {
        textLines.push(item.text);
      }
    });
  });
}

async function analyzeImage(buffer) {
  const { lang } = getConfig();

  const result = await Tesseract.recognize(buffer, lang, {
    logger: (m) => {
      if (m.status === "recognizing text") {
        console.log(`[OCR] Progress: ${Math.round(m.progress * 100)}%`);
      }
    },
  });

  return simplifyOcrResult(result);
}

function simplifyOcrResult(result) {
  const { data } = result;

  let fullText = "";
  if (data.text) {
    fullText = data.text;
  }

  // Truncate if too long
  const maxChars = 48000;
  if (fullText.length > maxChars) {
    fullText = fullText.slice(0, maxChars) + "\n\n… (text truncated for response size)";
  }

  // Extract words with confidence
  const words = (data.words || [])
    .slice(0, 2000)
    .map((w) => ({
      text: w.text || "",
      confidence: w.confidence,
    }));

  // Lines for table-like detection
  const lines = (data.lines || []).slice(0, 500).map((l) => l.text || "");

  return {
    modelId: "tesseract-" + (data.language || "eng"),
    pageCount: 1,
    paragraphCount: lines.length,
    tableCount: 0,
    tablesPreview: [],
    fullText,
    words,
    lines,
    confidence: data.confidence || 0,
  };
}

module.exports = {
  analyzeDocumentBuffer,
  isDocumentIntelligenceConfigured,
  getConfig,
};