const CONFIG_STATUS = require("../config/status.json");

const tryCatch = (f) => async (req, res, next) => {
    try {
        await f(req, res, next);
    } catch (error) {
        next(error);
    }
};

const errorHandle = (err, req, res, next) => {
    res.status(err.status || 500);
    res.send({
        status: CONFIG_STATUS.SERVER_ERROR,
        message: err.message,
    });
    console.log(err);
};

module.exports = {
    errorHandle,
    tryCatch
};