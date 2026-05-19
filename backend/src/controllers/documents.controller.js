function analyze(req, res) {
  return res.status(501).json({ status: "error", message: "Not implemented (documents.analyze)" });
}

module.exports = { analyze };

