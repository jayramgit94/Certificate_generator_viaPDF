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
   * @param {string} filePath - Path to the uploaded file
   * @param {string} originalName - Original file name
   * @returns {Object} { records, sourceType }
   */
  async parseFile(filePath, originalName) {
    const ext = path.extname(originalName).toLowerCase();

    let rawRecords;
    let sourceType;

    try {
      switch (ext) {
        case ".csv":
          rawRecords = this.parseCSV(filePath);
          sourceType = "csv";
          break;
        case ".xlsx":
        case ".xls":
          rawRecords = this.parseExcel(filePath);
          sourceType = "xlsx";
          break;
        case ".json":
          rawRecords = this.parseJSON(filePath);
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
    const records = this.validateRecords(rawRecords);

    return { records, sourceType };
  }

  /**
   * Parse CSV file
   */
  parseCSV(filePath) {
    const content = fs.readFileSync(filePath, "utf-8");
    const records = parse(content, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      cast: false,
    });
    return records;
  }

  /**
   * Parse Excel file (XLSX/XLS)
   */
  parseExcel(filePath) {
    const workbook = XLSX.readFile(filePath);
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const records = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
    return records;
  }

  /**
   * Parse JSON file
   */
  parseJSON(filePath) {
    const content = fs.readFileSync(filePath, "utf-8");
    const parsed = JSON.parse(content);

    // Support both array and object with data property
    if (Array.isArray(parsed)) return parsed;
    if (parsed.data && Array.isArray(parsed.data)) return parsed.data;
    if (parsed.records && Array.isArray(parsed.records)) return parsed.records;
    if (parsed.users && Array.isArray(parsed.users)) return parsed.users;

    throw new Error("JSON file must contain an array of records");
  }

  /**
   * Validate and normalize records
   */
  validateRecords(rawRecords) {
    if (!Array.isArray(rawRecords) || rawRecords.length === 0) {
      throw AppError.badRequest("File contains no records");
    }

    const emailSeen = new Set();

    const records = rawRecords.map((raw) => {
      // Normalize field names (case-insensitive lookup)
      const normalized = this.normalizeFieldNames(raw);

      const record = {
        name: (normalized.name || "").toString().trim(),
        email: normalizeEmail(normalized.email || ""),
        event: (normalized.event || "").toString().trim(),
        date: (normalized.date || "").toString().trim(),
        customFields: {},
        isValid: true,
        validationErrors: [],
        isDuplicate: false,
      };

      // Collect any extra fields as customFields
      const knownFields = ["name", "email", "event", "date"];
      for (const [key, value] of Object.entries(normalized)) {
        if (!knownFields.includes(key.toLowerCase())) {
          record.customFields[key] = (value || "").toString().trim();
        }
      }

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

    return records;
  }

  /**
   * Normalize field names to handle variations in column headers
   */
  normalizeFieldNames(record) {
    const normalized = {};
    const fieldMap = {
      name: [
        "name",
        "fullname",
        "full_name",
        "full name",
        "student",
        "participant",
        "recipient",
      ],
      email: [
        "email",
        "email_address",
        "emailaddress",
        "e-mail",
        "mail",
        "email address",
      ],
      event: [
        "event",
        "event_name",
        "eventname",
        "course",
        "workshop",
        "program",
        "event name",
      ],
      date: [
        "date",
        "issue_date",
        "issuedate",
        "completion_date",
        "completiondate",
        "issue date",
      ],
    };

    for (const [key, value] of Object.entries(record)) {
      const lowerKey = key.toLowerCase().trim();
      let mapped = false;

      for (const [normalizedName, variations] of Object.entries(fieldMap)) {
        if (variations.includes(lowerKey)) {
          normalized[normalizedName] = value;
          mapped = true;
          break;
        }
      }

      if (!mapped) {
        normalized[key] = value;
      }
    }

    return normalized;
  }
}

module.exports = new FileService();
