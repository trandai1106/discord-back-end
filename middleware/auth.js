// const { errorHandle } = require('./errorHandle')
const User = require('../models/user');
const CONFIG_STATUS = require('../config/status.json');
const { verifyAccessToken } = require('../utils/security');
const dataValidation = require('../utils/dataValidation');

const requireLogin = async (req, res, next) => {
    if (dataValidation.isVariableBlankOrNull(req.headers.authorization)) {
        res.status(401).send({
            status: CONFIG_STATUS.TOKEN_EMPTY,
            message: 'Authorization is not exist.'
        });
    } else {
        const token = req.headers.authorization.split(' ')[1];
        var decodedToken = verifyAccessToken(token);

        if (decodedToken.status == 403) {
            res.status(decodedToken.status);
            res.send(decodedToken);
        }
        else if (decodedToken.status == 200) {
            const userExist = await User.exists({ phone: decodedToken.data.phone });
            if (userExist) {
                const user = await User.findOne({ phone: decodedToken.data.phone });
                req.user = user;
                next();
            } else {
                res.status(402).send({
                    status: CONFIG_STATUS.TOKEN_ERROR,
                    message: 'Unauthorized!'
                });
            }
        }
        else {
            res.status(402).send({
                status: CONFIG_STATUS.TOKEN_ERROR,
                message: 'Unauthorized!'
            });
        }
    }
};
const requireRole = (roles) => async (req, res, next) => {
    const token = req.headers.authorization.split(' ')[1];
    var decodedToken = verifyAccessToken(token);
    if (decodedToken.data.role == null) {
        res.status(403).send({
            status: CONFIG_STATUS.TOKEN_ERROR,
            message: 'Token is missing role. Please try again.'
        });
    } else {
        if (roles.includes(decodedToken.data.role)) {
            next();
        } else {
            res.status(403).send({
                status: CONFIG_STATUS.TOKEN_ERROR,
                message: 'Forbidden, your account is not granted.'
            });
        }
    }
};
module.exports = {
    requireLogin,
    requireRole
};