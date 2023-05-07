const { REGEX } = require('../configs/regex');
const ObjectId = require('mongoose').Types.ObjectId;

const isVariableBlankOrNull = (data) => {
    if (data == undefined || data == null || data == '') {
        return true;
    }
    else {
        return false;
    }
};

const isArrayHasBlankOrNullElement = (array) => {
    for (var i = 0; i < array.length; i++) {
        if (isVariableBlankOrNull(array[i])) {
            return true;
        }
    }
    return false;   
};

const isArrayAllBlankOrNullElement = (array) => {
    for (var i = 0; i < array.length; i++) {
        if (!isVariableBlankOrNull(array[i])) {
            return false;
        }
    }
    return true;   
};

const isPhoneNumber = (number) => {
    return REGEX.PHONE_REGEX.test(number);
}
const isPasswordFormat = (string) => {
    return REGEX.PASSWORD.test(string);
}
const isEmail = (string) => {
    return REGEX.EMAIL_REGEX.test(string);
}
const isMongooseObjectId = (string) => {
    return ObjectId.isValid(string);
}

module.exports = {
    isVariableBlankOrNull,
    isArrayHasBlankOrNullElement,
    isPhoneNumber,
    isPasswordFormat,
    isEmail,
    isMongooseObjectId,
    isArrayAllBlankOrNullElement
};