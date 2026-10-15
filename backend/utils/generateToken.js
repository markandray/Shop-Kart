const jwt = require("jsonwebtoken");

/**
 * Generates a signed JWT for a given customer id and
 * sets it inside an HttpOnly cookie on the response object.
 * @param {Object} res - Express response object
 * @param {String} customerId - MongoDB _id of the customer
 * @returns {String} the generated token (in case it's needed elsewhere)
 */
const generateToken = (res, customerId) => {
  const token = jwt.sign({ id: customerId }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });

  const isProduction = process.env.NODE_ENV === "production";

  res.cookie("token", token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return token;
};

module.exports = generateToken;
