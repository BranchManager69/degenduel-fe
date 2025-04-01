"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
exports.__esModule = true;
exports.Terminal = exports.createConfig = exports.getEnvVar = exports.DEFAULT_CONFIG = void 0;
var Terminal_1 = require("./Terminal");
// Create default configuration
exports.DEFAULT_CONFIG = {
    RELEASE_DATE: new Date('2025-04-01T15:00:00Z'),
    CONTRACT_ADDRESS: '0x1111111111111111111111111111111111111111',
    DISPLAY: {
        DATE_SHORT: 'Apr 1, 2025',
        DATE_FULL: 'April 1, 2025',
        TIME: '15:00:00'
    }
};
// Helper function to get environment variables with fallbacks
function getEnvVar(name, defaultValue) {
    if (defaultValue === void 0) { defaultValue = ''; }
    if (typeof process !== 'undefined' && process.env) {
        return process.env[name] || defaultValue;
    }
    return defaultValue;
}
exports.getEnvVar = getEnvVar;
// Function to create a configuration with overrides
function createConfig(overrides) {
    if (overrides === void 0) { overrides = {}; }
    return __assign(__assign(__assign({}, exports.DEFAULT_CONFIG), overrides), { DISPLAY: __assign(__assign({}, exports.DEFAULT_CONFIG.DISPLAY), (overrides.DISPLAY || {})) });
}
exports.createConfig = createConfig;
// Re-export the Terminal component
exports.Terminal = Terminal_1.Terminal;
