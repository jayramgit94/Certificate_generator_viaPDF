const fs = require("fs");
const path = require("path");
const { parse } = require("csv-parse/sync");
const XLSX = require("xlsx");
const { isValidEmail, normalizeEmail } = require("../utils/emailValidator");
const logger = require("../utils/logger");
const AppError = require("../utils/AppError");

class FileService {
  /**
   * Parse uploaded file based on type
   * @param {Object} uploadedFile - Multer file object
   * @returns {Object} { records, sourceType }
   */
  async parseFile(uploadedFile) {
    if (!uploadedFile) {
      throw AppError.badRequest("File is required");
    }

    const ext = path.extname(uploadedFile.originalname || "").toLowerCase();
    const fileBuffer = this.extractBuffer(uploadedFile);

    let rawRecords;
    let sourceType;

    try {
      switch (ext) {
        case ".csv":
          rawRecords = this.parseCSVBuffer(fileBuffer);
          sourceType = "csv";
          break;
        case ".xlsx":
        case ".xls":
          rawRecords = this.parseExcelBuffer(fileBuffer);
          sourceType = "xlsx";
          break;
        case ".json":
          rawRecords = this.parseJSONBuffer(fileBuffer);
          sourceType = "json";
          break;
        default:
          throw AppError.badRequest(`Unsupported file format: ${ext}`);
      }
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error("File parsing error:", error);
      throw AppError.badRequest(`Failed to parse file: ${error.message}`);
    }

    // Validate and normalize records
    const { records, mappingInsights } = this.validateRecords(rawRecords);

    return { records, sourceType, mappingInsights };
  }

  /**
   * Parse CSV file buffer
   */
  parseCSVBuffer(buffer) {
    const content = buffer.toString("utf-8");
    const records = parse(content, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      cast: false,
    });
    return records;
  }

  /**
   * Parse Excel file (XLSX/XLS) buffer
   */
  parseExcelBuffer(buffer) {
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const records = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
    return records;
  }

  /**
   * Parse JSON file buffer
   */
  parseJSONBuffer(buffer) {
    const content = buffer.toString("utf-8");
    const parsed = JSON.parse(content);

    // Support both array and object with data property
    if (Array.isArray(parsed)) return parsed;
    if (parsed.data && Array.isArray(parsed.data)) return parsed.data;
    if (parsed.records && Array.isArray(parsed.records)) return parsed.records;
    if (parsed.users && Array.isArray(parsed.users)) return parsed.users;

    throw new Error("JSON file must contain an array of records");
  }

  extractBuffer(uploadedFile) {
    if (uploadedFile.buffer && Buffer.isBuffer(uploadedFile.buffer)) {
      return uploadedFile.buffer;
    }

    if (uploadedFile.path && fs.existsSync(uploadedFile.path)) {
      return fs.readFileSync(uploadedFile.path);
    }

    throw AppError.badRequest("Uploaded file content is missing");
  }

  /**
   * Validate and normalize records
   */
  validateRecords(rawRecords) {
    if (!Array.isArray(rawRecords) || rawRecords.length === 0) {
      throw AppError.badRequest("File contains no records");
    }

    const headerSet = new Set();
    rawRecords.forEach((record) => {
      if (!record || typeof record !== "object") return;
      Object.keys(record).forEach((key) => headerSet.add(key));
    });

    const mappingContext = this.buildHeaderMappingContext(Array.from(headerSet));
    const emailSeen = new Set();

    const records = rawRecords.map((raw) => {
      const normalized = {
        event: "",
        date: "",
      };
      const customFields = {};

      for (const [key, value] of Object.entries(raw || {})) {
        const mapping =
          mappingContext.byRawKey.get(key) ||
          {
            rawKey: key,
            mappedTo: null,
            confidence: 0,
            method: "custom",
            status: "custom",
          };

        const fieldValue = (value || "").toString().trim();

        if (mapping.mappedTo && !normalized[mapping.mappedTo]) {
          normalized[mapping.mappedTo] = fieldValue;
        } else {
          customFields[key] = fieldValue;
        }
      }

      const record = {
        name: (normalized.name || "").toString().trim(),
        email: normalizeEmail(normalized.email || ""),
        event: (normalized.event || "").toString().trim(),
        date: (normalized.date || "").toString().trim(),
        customFields,
        isValid: true,
        validationErrors: [],
        isDuplicate: false,
      };

      // Validate name
      if (!record.name) {
        record.isValid = false;
        record.validationErrors.push("Name is required");
      }

      // Validate email
      if (!record.email) {
        record.isValid = false;
        record.validationErrors.push("Email is required");
      } else if (!isValidEmail(record.email)) {
        record.isValid = false;
        record.validationErrors.push("Invalid email format");
      }

      // Check duplicates
      if (record.email) {
        if (emailSeen.has(record.email)) {
          record.isDuplicate = true;
        } else {
          emailSeen.add(record.email);
        }
      }

      return record;
    });

    return {
      records,
      mappingInsights: {
        headers: mappingContext.headers,
        warnings: mappingContext.warnings,
        warningCount: mappingContext.warnings.length,
      },
    };
  }

  /**
   * Build field mapping context with confidence scoring and fuzzy fallback
   */
  buildHeaderMappingContext(headers) {
    const aliases = this.getFieldAliases();
    const aliasCandidates = [];
    const aliasLookup = new Map();
    const compactAliasLookup = new Map();
    const warnings = [];
    const usedCoreFields = new Map();
    const byRawKey = new Map();
    const mappedHeaders = [];

    Object.entries(aliases).forEach(([field, keys]) => {
      keys.forEach((alias) => {
        const normalizedAlias = this.normalizeHeaderKey(alias);
        const compactAlias = this.compactKey(normalizedAlias);

        aliasCandidates.push({
          field,
          alias,
          normalizedAlias,
          compactAlias,
        });

        aliasLookup.set(normalizedAlias, field);
        compactAliasLookup.set(compactAlias, field);
      });
    });

    headers.forEach((rawKey) => {
      const normalizedKey = this.normalizeHeaderKey(rawKey);
      const compactKey = this.compactKey(normalizedKey);
      const mappedFromExact =
        aliasLookup.get(normalizedKey) || compactAliasLookup.get(compactKey);

      let mappedTo = null;
      let confidence = 0;
      let method = "custom";
      let status = "custom";
      let suggestion = null;

      if (mappedFromExact) {
        if (!usedCoreFields.has(mappedFromExact)) {
          mappedTo = mappedFromExact;
          confidence = 1;
          method = "exact";
          status = "mapped";
          usedCoreFields.set(mappedFromExact, rawKey);
        } else {
          status = "duplicate-core";
          warnings.push(
            `Header "${rawKey}" also matches ${mappedFromExact}, but "${usedCoreFields.get(
              mappedFromExact,
            )}" is already used.`,
          );
        }
      } else {
        const best = this.findBestAliasMatch(compactKey, aliasCandidates);

        if (best && best.score >= 0.92 && !usedCoreFields.has(best.field)) {
          mappedTo = best.field;
          confidence = Number(best.score.toFixed(2));
          method = "fuzzy-high";
          status = "mapped";
          usedCoreFields.set(best.field, rawKey);
        } else if (best && best.score >= 0.8 && !usedCoreFields.has(best.field)) {
          mappedTo = best.field;
          confidence = Number(best.score.toFixed(2));
          method = "fuzzy-medium";
          status = "mapped";
          usedCoreFields.set(best.field, rawKey);
          warnings.push(
            `Header "${rawKey}" mapped to ${best.field} with medium confidence (${confidence}).`,
          );
        } else if (best && best.score >= 0.72) {
          suggestion = {
            field: best.field,
            confidence: Number(best.score.toFixed(2)),
          };
          status = "suggestion";
          warnings.push(
            `Header "${rawKey}" not auto-mapped. Suggested field: ${best.field} (${suggestion.confidence}).`,
          );
        }
      }

      const mapping = {
        rawKey,
        normalizedKey,
        mappedTo,
        confidence,
        method,
        status,
        suggestion,
      };

      mappedHeaders.push(mapping);
      byRawKey.set(rawKey, mapping);
    });

    return {
      headers: mappedHeaders,
      byRawKey,
      warnings,
    };
  }

  getFieldAliases() {
    return {
      name: [
        "name",
        "full name",
        "fullname",
        "full_name",
        "student",
        "student name",
        "participant",
        "participant name",
        "recipient",
        "recipient name",
      ],
      email: [
        "email",
        "email address",
        "email_address",
        "emailaddress",
        "e-mail",
        "mail",
      ],
      event: [
        "event",
        "event name",
        "event_name",
        "eventname",
        "course",
        "course name",
        "workshop",
        "program",
      ],
      date: [
        "date",
        "issue date",
        "issue_date",
        "issuedate",
        "completion date",
        "completion_date",
        "completiondate",
      ],
    };
  }

  normalizeHeaderKey(input) {
    return (input || "")
      .toString()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[_-]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  compactKey(input) {
    return this.normalizeHeaderKey(input).replace(/\s+/g, "");
  }

  findBestAliasMatch(compactHeaderKey, aliasCandidates) {
    if (!compactHeaderKey) return null;

    let best = null;

    aliasCandidates.forEach((candidate) => {
      const score = this.stringSimilarity(compactHeaderKey, candidate.compactAlias);
      if (!best || score > best.score) {
        best = {
          field: candidate.field,
          alias: candidate.alias,
          score,
        };
      }
    });

    return best;
  }

  stringSimilarity(a, b) {
    if (!a && !b) return 1;
    if (!a || !b) return 0;
    if (a === b) return 1;

    const distance = this.levenshteinDistance(a, b);
    const maxLen = Math.max(a.length, b.length);
    return maxLen === 0 ? 1 : 1 - distance / maxLen;
  }

  levenshteinDistance(a, b) {
    const rows = a.length + 1;
    const cols = b.length + 1;
    const matrix = Array.from({ length: rows }, () => Array(cols).fill(0));

    for (let i = 0; i < rows; i += 1) matrix[i][0] = i;
    for (let j = 0; j < cols; j += 1) matrix[0][j] = j;

    for (let i = 1; i < rows; i += 1) {
      for (let j = 1; j < cols; j += 1) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + cost,
        );
      }
    }

    return matrix[rows - 1][cols - 1];
  }
}

module.exports = new FileService();
