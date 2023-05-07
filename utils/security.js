require("dotenv").config();
const bcrypt = require('bcrypt');
const CONFIG_STATUS = require('../configs/status.json');
const jwt = require('jsonwebtoken');

const { JWT_SECRET_KEY_AT, JWT_SECRET_KEY_RT, TOKEN_EXPIRE_AT, TOKEN_EXPIRE_RT } = process.env;

const SALT_ROUND = 10;

const encryptPassword = async (password) => {
    const hashedPassword = await bcrypt.hash(password, SALT_ROUND);
    return hashedPassword;
};

const generateAccessToken = ({ name, _id, status }) => {
    const token = jwt.sign(
        { name, _id, status },
        JWT_SECRET_KEY_AT,
        { expiresIn: TOKEN_EXPIRE_AT }
    );
    return token;
};
const generateRefreshToken = ({ name, _id, status }) => {
    const token = jwt.sign(
        { name, _id, status },
        JWT_SECRET_KEY_RT,
        { expiresIn: TOKEN_EXPIRE_RT }
    );
    return token;
};

const verifyPassword = async (password, hashedPassword) => {
    const result = await bcrypt.compare(password, hashedPassword);
    return result;
};

const verifyAccessToken = (token) => {
    try {
        const data = jwt.verify(token, JWT_SECRET_KEY_AT);
        return { status: 200, data};
    } catch (error) {
        return {
            status: CONFIG_STATUS.TOKEN_EXPIRED,
            message: `Access token expired at ${error.expiredAt}`
        };
    }
};
const verifyRefreshToken = (token) => {
    try {
        const data = jwt.verify(token, JWT_SECRET_KEY_RT);
        return { status: 200, data};
    } catch (error) {
        return {
            status: CONFIG_STATUS.TOKEN_EXPIRED,
            message: `Refresh token expired at ${error.expiredAt}`
        };
    }
};

module.exports = {
    encryptPassword,
    generateAccessToken,
    generateRefreshToken,
    verifyPassword,
    verifyAccessToken,
    verifyRefreshToken
};