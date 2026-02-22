const AppError = require("../utils/AppError");

/**
 * Zod validation middleware factory.
 * Validates request body, query, or params against a Zod schema.
 *
 * @param {import('zod').ZodSchema} schema - Zod schema to validate against
 * @param {string} [source='body'] - Request property to validate ('body', 'query', 'params')
 * @returns {Function} Express middleware
 *
 * @example
 * router.post('/login', validate(loginSchema), authController.login);
 */
const validate = (schema, source = "body") => {
  return (req, res, next) => {
    try {
      const result = schema.safeParse(req[source]);

      if (!result.success) {
        const details = result.error.errors.map((err) => ({
          field: err.path.join("."),
          message: err.message,
        }));

        throw AppError.validation("Validation failed", details);
      }

      // Replace with parsed (and potentially transformed) data
      req[source] = result.data;
      next();
    } catch (error) {
      next(error);
    }
  };
};

module.exports = validate;
