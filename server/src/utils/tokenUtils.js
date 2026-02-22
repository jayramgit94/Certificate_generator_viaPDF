const jwt = require("jsonwebtoken");
const config = require("../config");

/**
 * Generate JWT access token
 * @param {Object} payload - Token payload { id, email, role }
 * @returns {string} JWT token
 */
const generateAccessToken = (payload) => {
  return jwt.sign(payload, config.jwt.accessSecret, {
    expiresIn: config.jwt.accessExpiresIn,
  });
};

/**
 * Generate JWT refresh token
 * @param {Object} payload - Token payload { id }
 * @returns {string} JWT token
 */
const generateRefreshToken = (payload) => {
  return jwt.sign(payload, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiresIn,
  });
};

/**
 * Verify JWT access token
 * @param {string} token - JWT token
 * @returns {Object} Decoded payload
 * @throws {JsonWebTokenError} If token is invalid
 */
const verifyAccessToken = (token) => {
  return jwt.verify(token, config.jwt.accessSecret);
};

/**
 * Verify JWT refresh token
 * @param {string} token - JWT token
 * @returns {Object} Decoded payload
 * @throws {JsonWebTokenError} If token is invalid
 */
const verifyRefreshToken = (token) => {
  return jwt.verify(token, config.jwt.refreshSecret);
};

/**
 * Generate both access and refresh tokens
 * @param {Object} user - User document { _id, email, role }
 * @returns {Object} { accessToken, refreshToken }
 */
const generateTokenPair = (user) => {
  const accessToken = generateAccessToken({
    id: user._id,
    email: user.email,
    role: user.role,
  });

  const refreshToken = generateRefreshToken({
    id: user._id,
  });

  return { accessToken, refreshToken };
};

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  generateTokenPair,
};
