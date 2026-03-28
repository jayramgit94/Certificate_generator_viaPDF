const gridfsService = require("../services/gridfs.service");

const serveFile = async (req, res, next) => {
  try {
    const { file, stream } = await gridfsService.openDownloadStream(req.params.id);
    const shouldDownload = req.query.download === "1";
    const safeName = file.filename || "file";

    res.setHeader(
      "Content-Type",
      file.contentType || "application/octet-stream",
    );
    // Allow cross-origin embedding for image/pdf assets used by frontend previews.
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    res.setHeader(
      "Content-Disposition",
      `${shouldDownload ? "attachment" : "inline"}; filename="${safeName}"`,
    );
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");

    stream.on("error", (error) => next(error));
    stream.pipe(res);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  serveFile,
};