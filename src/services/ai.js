"use strict";
/**
 * Comprehensive AI service client for DegenDuel
 * Handles interactions with backend AI services
 */
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
exports.aiService = exports.AIServiceError = exports.AIErrorType = void 0;
// AI service error types
var AIErrorType;
(function (AIErrorType) {
    AIErrorType["NETWORK"] = "network";
    AIErrorType["AUTHENTICATION"] = "authentication";
    AIErrorType["RATE_LIMIT"] = "rate_limit";
    AIErrorType["SERVER"] = "server";
    AIErrorType["INVALID_REQUEST"] = "invalid_request";
    AIErrorType["UNKNOWN"] = "unknown";
})(AIErrorType = exports.AIErrorType || (exports.AIErrorType = {}));
// Error class for AI service errors
var AIServiceError = /** @class */ (function (_super) {
    __extends(AIServiceError, _super);
    function AIServiceError(message, type, statusCode) {
        if (type === void 0) { type = AIErrorType.UNKNOWN; }
        var _this = _super.call(this, message) || this;
        _this.name = 'AIServiceError';
        _this.type = type;
        _this.statusCode = statusCode;
        return _this;
    }
    return AIServiceError;
}(Error));
exports.AIServiceError = AIServiceError;
/**
 * AI Service implementation
 */
var AIService = /** @class */ (function () {
    function AIService() {
        this.API_BASE = '/api/ai';
    }
    /**
     * Get a chat completion from the AI
     * @param messages Array of messages in the conversation
     * @param options Configuration options
     * @returns Promise with the AI response
     */
    AIService.prototype.chat = function (messages, options) {
        if (options === void 0) { options = {}; }
        return __awaiter(this, void 0, void 0, function () {
            var filteredMessages, response, data, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        if (options.debug) {
                            console.log('AI Chat Request:', { messages: messages, options: options });
                        }
                        filteredMessages = messages.filter(function (msg) { return msg.role !== 'system'; });
                        return [4 /*yield*/, fetch("".concat(this.API_BASE, "/chat"), {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify({
                                    messages: filteredMessages,
                                    context: options.context || 'default',
                                    conversationId: options.conversationId
                                })
                            })];
                    case 1:
                        response = _a.sent();
                        if (!response.ok) {
                            throw this.handleErrorResponse(response);
                        }
                        return [4 /*yield*/, response.json()];
                    case 2:
                        data = _a.sent();
                        if (options.debug) {
                            console.log('AI Chat Response:', data);
                        }
                        return [2 /*return*/, {
                                content: data.content || data.response || data.message || '',
                                usage: data.usage || undefined,
                                conversationId: data.conversationId || options.conversationId
                            }];
                    case 3:
                        error_1 = _a.sent();
                        if (error_1 instanceof AIServiceError) {
                            throw error_1;
                        }
                        console.error('AI Chat Error:', error_1);
                        throw new AIServiceError('Failed to get AI response. Please try again later.', AIErrorType.UNKNOWN);
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /* Removed fallback response mechanism as no longer needed */
    /**
     * Process API error responses
     * @param response The fetch response object
     * @returns A properly typed AIServiceError
     */
    AIService.prototype.handleErrorResponse = function (response) {
        var statusCode = response.status;
        switch (statusCode) {
            case 401:
            case 403:
                return new AIServiceError('Authentication error with AI service.', AIErrorType.AUTHENTICATION, statusCode);
            case 429:
                return new AIServiceError('Rate limit exceeded for AI service.', AIErrorType.RATE_LIMIT, statusCode);
            case 400:
                return new AIServiceError('Invalid request to AI service.', AIErrorType.INVALID_REQUEST, statusCode);
            case 500:
            case 502:
            case 503:
            case 504:
                return new AIServiceError('AI service is currently unavailable.', AIErrorType.SERVER, statusCode);
            default:
                return new AIServiceError("AI service error (".concat(statusCode, ")."), AIErrorType.UNKNOWN, statusCode);
        }
    };
    // Image generation - future implementation
    AIService.prototype.generateImage = function (_prompt, _options) {
        if (_options === void 0) { _options = {}; }
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                throw new AIServiceError('Image generation not yet implemented', AIErrorType.INVALID_REQUEST);
            });
        });
    };
    // Voice synthesis - future implementation
    AIService.prototype.synthesizeSpeech = function (_text, _options) {
        if (_options === void 0) { _options = {}; }
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                throw new AIServiceError('Voice synthesis not yet implemented', AIErrorType.INVALID_REQUEST);
            });
        });
    };
    return AIService;
}());
// Create and export a singleton instance
exports.aiService = new AIService();
// Export default for convenience
exports["default"] = exports.aiService;
