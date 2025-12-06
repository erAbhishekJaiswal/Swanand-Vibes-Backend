const jwt = require("jsonwebtoken");

// Use environment variables in production
const JWT_SECRET = process.env.JWT_SECRET || "replace_this_with_a_long_secret";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1d";
const JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET || "replace_refresh_secret";
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || "1d";

function signAccessToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

function signRefreshToken(payload) {
  return jwt.sign(payload, JWT_REFRESH_SECRET, {
    expiresIn: JWT_REFRESH_EXPIRES_IN,
  });
}

module.exports = { signAccessToken, signRefreshToken, JWT_SECRET, JWT_REFRESH_SECRET };
