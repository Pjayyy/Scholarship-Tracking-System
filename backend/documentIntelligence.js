const DocumentIntelligence = require("@azure-rest/ai-document-intelligence").default;
const {
  isUnexpected,
  getLongRunningPoller,
} = require("@azure-rest/ai-document-intelligence");

function getConfig() {
  const endpoint = process.env.DOCUMENT_INTELLIGENCE_ENDPOINT?.trim();
  const key = process.env.DOCUMENT_INTELLIGENCE_API_KEY?.trim();
  const modelId =
    process.env.DOCUMENT_INTELLIGENCE_MODEL?.trim() ||
    "prebuilt-layout";

  return { endpoint, key, modelId };
}

function isDocumentIntelligenceConfigured() {
  const { endpoint, key } = getConfig();
  return Boolean(endpoint && key);
}

/**
 * @param {Buffer} buffer
 * @returns {Promise<{ fullText: string, pageCount: number, tableCount: number, tablesPreview: object[], paragraphCount: number }>}
 */
async function analyzeDocumentBuffer(buffer) {
  const { endpoint, key, modelId } = getConfig();

  if (!endpoint || !key) {
    throw new Error(
      "Document Intelligence is not configured. Set DOCUMENT_INTELLIGENCE_ENDPOINT and DOCUMENT_INTELLIGENCE_API_KEY in backend/.env"
    );
  }

  const client = DocumentIntelligence(endpoint, { key });

  const base64Source = buffer.toString("base64");

  const initialResponse = await client
    .path("/documentModels/{modelId}:analyze", modelId)
    .post({
      contentType: "application/json",
      body: { base64Source },
    });

  if (isUnexpected(initialResponse)) {
    const err = initialResponse.body?.error || initialResponse.body;
    const msg =
      err?.message ||
      err?.code ||
      (typeof err === "string" ? err : JSON.stringify(err));
    throw new Error(msg || "Document Intelligence analyze request failed");
  }

  const poller = getLongRunningPoller(client, initialResponse);
  const finalResponse = await poller.pollUntilDone();
  const body = finalResponse.body || finalResponse;

  return simplifyAnalyzeBody(body);
}

function simplifyAnalyzeBody(body) {
  const ar =
    body.analyzeResult ||
    body.result?.analyzeResult ||
    body;

  const pages = ar.pages || [];
  const paragraphs = ar.paragraphs || [];
  const tables = ar.tables || [];

  let fullText = "";

  if (paragraphs.length) {
    fullText = paragraphs
      .map((p) => (p.content || "").trim())
      .filter(Boolean)
      .join("\n\n");
  }

  if (!fullText && ar.content) {
    const blocks = Array.isArray(ar.content) ? ar.content : [];
    fullText = blocks
      .map((c) => (typeof c === "string" ? c : c?.text || c?.content || ""))
      .filter(Boolean)
      .join("\n\n");
  }

  const maxChars = 48000;
  if (fullText.length > maxChars) {
    fullText =
      fullText.slice(0, maxChars) +
      "\n\n… (text truncated for response size)";
  }

  const tablesPreview = tables.slice(0, 8).map((t, idx) => {
    const cells = (t.cells || []).map((c) => ({
      row: c.rowIndex,
      col: c.columnIndex,
      text: (c.content || "").trim(),
    }));
    return {
      index: idx,
      rowCount: t.rowCount,
      columnCount: t.columnCount,
      cells: cells.slice(0, 80),
    };
  });

  return {
    modelId: ar.modelId || null,
    pageCount: pages.length,
    paragraphCount: paragraphs.length,
    tableCount: tables.length,
    tablesPreview,
    fullText,
  };
}

module.exports = {
  analyzeDocumentBuffer,
  isDocumentIntelligenceConfigured,
  getConfig,
};
