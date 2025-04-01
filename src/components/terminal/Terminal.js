"use strict";
// src/components/terminal/Terminal.tsx
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
exports.__esModule = true;
exports.Terminal = exports.DecryptionTimer = void 0;
/**
 * @fileoverview
 * Degen Terminal
 *
 * @description
 * This component displays a countdown timer for the token launch.
 * It also includes a smooth release animation for the terminal.
 * AI conversation is built into the terminal.
 *
 * @author Branch Manager
 */
var framer_motion_1 = require("framer-motion");
var react_1 = __importStar(require("react"));
var ai_1 = require("../../services/ai");
var commands_1 = require("./commands");
require("./Terminal.css");
// Define the DecryptionTimer component with internal styling and logic
var DecryptionTimer = function (_a) {
    var _b = _a.targetDate, targetDate = _b === void 0 ? new Date('2025-03-15T18:00:00-05:00') : _b;
    var _c = (0, react_1.useState)({
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0
    }), timeRemaining = _c[0], setTimeRemaining = _c[1];
    // Use state for smooth release preference to avoid hydration mismatch
    var _d = (0, react_1.useState)(false), useSmoothRelease = _d[0], setUseSmoothRelease = _d[1];
    // State to track urgency levels for visual effects
    var _e = (0, react_1.useState)(0), urgencyLevel = _e[0], setUrgencyLevel = _e[1]; // 0: normal, 1: <60s, 2: <10s, 3: complete
    var _f = (0, react_1.useState)(false), revealTransition = _f[0], setRevealTransition = _f[1];
    // Check localStorage for preference in useEffect (client-side only)
    (0, react_1.useEffect)(function () {
        var _a;
        var storedPreference = ((_a = window.localStorage) === null || _a === void 0 ? void 0 : _a.getItem('useTerminalSmoothRelease')) === 'true';
        setUseSmoothRelease(storedPreference);
    }, []);
    (0, react_1.useEffect)(function () {
        var calculateTimeRemaining = function () {
            var now = new Date();
            var difference = targetDate.getTime() - now.getTime();
            if (difference <= 0) {
                setTimeRemaining({ days: 0, hours: 0, minutes: 0, seconds: 0 });
                return;
            }
            var days = Math.floor(difference / (1000 * 60 * 60 * 24));
            var hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            var minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
            var seconds = Math.floor((difference % (1000 * 60)) / 1000);
            setTimeRemaining({ days: days, hours: hours, minutes: minutes, seconds: seconds });
            // Set urgency level based on time remaining
            var totalSeconds = days * 86400 + hours * 3600 + minutes * 60 + seconds;
            if (totalSeconds === 0) {
                setUrgencyLevel(3); // Complete
                // Start the reveal transition sequence
                if (!revealTransition) {
                    setRevealTransition(true);
                }
            }
            else if (totalSeconds <= 10) {
                setUrgencyLevel(2); // Critical (<10s)
            }
            else if (totalSeconds <= 60) {
                setUrgencyLevel(1); // Warning (<60s)
            }
            else {
                setUrgencyLevel(0); // Normal
            }
        };
        calculateTimeRemaining();
        var timer = setInterval(calculateTimeRemaining, 1000);
        return function () { return clearInterval(timer); };
    }, [targetDate, revealTransition]);
    // Check if the countdown is complete
    var isComplete = timeRemaining.days === 0 &&
        timeRemaining.hours === 0 &&
        timeRemaining.minutes === 0 &&
        timeRemaining.seconds === 0;
    return (react_1["default"].createElement("div", { className: "font-orbitron" }, isComplete ? (useSmoothRelease ? (
    // SMOOTH RELEASE STATE - Typing animation
    react_1["default"].createElement("div", { className: "py-4" },
        react_1["default"].createElement("div", { className: "text-3xl sm:text-4xl font-bold relative" },
            react_1["default"].createElement("div", { className: "flex items-center" },
                react_1["default"].createElement("span", { className: "text-green-400 inline-block mr-2 whitespace-nowrap" }, ">"),
                react_1["default"].createElement("div", { className: "relative inline-flex" },
                    react_1["default"].createElement("div", { className: "text-green-400 font-mono tracking-wider relative" }, 'ACCESS_GRANTED'.split('').map(function (char, index) { return (react_1["default"].createElement(framer_motion_1.motion.span, { key: index, initial: { opacity: 0 }, animate: { opacity: 1 }, transition: {
                            duration: 0.05,
                            delay: 0.1 + index * 0.08,
                            ease: "easeIn"
                        } }, char)); })),
                    react_1["default"].createElement(framer_motion_1.motion.span, { className: "absolute right-0 h-full w-1 bg-green-400/80", initial: { opacity: 1 }, animate: { opacity: [1, 0, 1] }, transition: { duration: 0.8, repeat: Infinity, repeatType: 'reverse' } })))),
        react_1["default"].createElement(framer_motion_1.motion.div, { className: "mt-2 text-base text-green-200 font-normal flex items-center", initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { delay: 1.5, duration: 0.5 } },
            react_1["default"].createElement("span", { className: "text-green-500 mr-3" }, "[+]"),
            react_1["default"].createElement("div", { className: "inline-block whitespace-nowrap" }, 'Protocol decryption successful'.split('').map(function (char, index) { return (react_1["default"].createElement(framer_motion_1.motion.span, { key: index, initial: { opacity: 0 }, animate: { opacity: 1 }, transition: {
                    duration: 0.03,
                    delay: 1.7 + index * 0.05,
                    ease: "easeIn"
                } }, char)); }))),
        react_1["default"].createElement(framer_motion_1.motion.div, { className: "mt-6 mb-2 text-center", initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { delay: 3, duration: 0.5 } },
            react_1["default"].createElement("pre", { className: "text-green-400 text-xs leading-tight font-mono" }, "  _____            _                  _      ______ _______ _______ ______ _____ _______ _______ ______ \n / ____|          | |                | |    |  ____|__   __|__   __|  ____/ ____|__   __|__   __|  ____|\n| |     ___  _ __ | |_ _ __ __ _  ___| |_   | |__     | |     | |  | |__ | |       | |     | |  | |__   \n| |    / _ \\| '_ \\| __| '__/ _` |/ __| __|  |  __|    | |     | |  |  __|| |       | |     | |  |  __|  \n| |___| (_) | | | | |_| | | (_| | (__| |_   | |____   | |     | |  | |___| |____   | |     | |  | |____ \n \\_____\\___/|_| |_|\\__|_|  \\__,_|\\___|\\__|  |______|  |_|     |_|  |______\\_____|  |_|     |_|  |______|\n                                                                                                         ")),
        react_1["default"].createElement(framer_motion_1.motion.div, { className: "mt-3 p-4 border-2 border-green-500/50 bg-black/60 rounded-md text-xl relative", initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, transition: { delay: 3.5, duration: 0.7 }, whileHover: {
                scale: 1.03,
                boxShadow: "0 0 20px rgba(74, 222, 128, 0.5)",
                borderColor: "rgba(74, 222, 128, 0.8)"
            } },
            react_1["default"].createElement(framer_motion_1.motion.div, { className: "absolute inset-0 h-1 bg-green-400/20 z-10 overflow-hidden", animate: {
                    top: ['-10%', '110%']
                }, transition: {
                    duration: 1.5,
                    ease: "linear",
                    repeat: Infinity,
                    repeatType: "loop"
                } }),
            react_1["default"].createElement("div", { className: "absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-green-400" }),
            react_1["default"].createElement("div", { className: "absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-green-400" }),
            react_1["default"].createElement("div", { className: "absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-green-400" }),
            react_1["default"].createElement("div", { className: "absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-green-400" }),
            react_1["default"].createElement(framer_motion_1.motion.div, { className: "text-green-300 mb-2 text-sm font-mono uppercase tracking-wider flex items-center", animate: { color: ['rgba(74, 222, 128, 0.7)', 'rgba(74, 222, 128, 1)', 'rgba(74, 222, 128, 0.7)'] }, transition: { duration: 3, repeat: Infinity } },
                react_1["default"].createElement(framer_motion_1.motion.span, { className: "inline-block h-2 w-2 bg-green-400 mr-2 rounded-full", animate: { opacity: [1, 0.5, 1] }, transition: { duration: 0.8, repeat: Infinity } }),
                "Contract Address Verified:"),
            react_1["default"].createElement(framer_motion_1.motion.div, { className: "font-mono text-green-400 tracking-wide flex items-center bg-black/40 p-2 rounded", animate: {
                    textShadow: ['0 0 5px rgba(74, 222, 128, 0.3)', '0 0 15px rgba(74, 222, 128, 0.7)', '0 0 5px rgba(74, 222, 128, 0.3)'],
                    backgroundColor: ['rgba(0, 0, 0, 0.4)', 'rgba(34, 197, 94, 0.05)', 'rgba(0, 0, 0, 0.4)']
                }, transition: { duration: 2, repeat: Infinity } },
                react_1["default"].createElement(framer_motion_1.motion.span, { className: "text-green-500 mr-2", animate: { rotate: [0, 359] }, transition: { duration: 3, repeat: Infinity, ease: "linear" } }, "\u27F3"),
                window.contractAddress || '0x1234...5678'),
            react_1["default"].createElement(framer_motion_1.motion.div, { className: "mt-3 w-full bg-black/40 h-1 rounded-full overflow-hidden", initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { delay: 4, duration: 0.5 } },
                react_1["default"].createElement(framer_motion_1.motion.div, { className: "h-full bg-green-400", initial: { width: 0 }, animate: { width: '100%' }, transition: { delay: 4.1, duration: 1.5 } })),
            react_1["default"].createElement(framer_motion_1.motion.div, { className: "text-green-400/70 text-xs mt-1 text-right font-mono", initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { delay: 5.6, duration: 0.5 } }, "HASH VERIFIED \u2022 SIGNATURE VALID")))) : (
    // ORIGINAL RELEASE STATE - Bouncy animation
    react_1["default"].createElement(framer_motion_1.motion.div, { className: "text-3xl sm:text-4xl text-green-400 font-bold py-4", initial: { scale: 1 }, animate: {
            scale: [1, 1.15, 1],
            textShadow: [
                '0 0 10px rgba(74, 222, 128, 0.5)',
                '0 0 30px rgba(74, 222, 128, 0.9)',
                '0 0 10px rgba(74, 222, 128, 0.5)'
            ],
            filter: [
                'brightness(1)',
                'brightness(1.3)',
                'brightness(1)'
            ]
        }, transition: {
            duration: 2.5,
            repeat: Infinity,
            ease: "easeInOut"
        } },
        react_1["default"].createElement("span", { className: "bg-gradient-to-r from-green-400 via-emerald-300 to-green-400 text-transparent bg-clip-text" }, "ACCESS GRANTED"),
        react_1["default"].createElement("div", { className: "mt-2 text-base text-green-300 font-normal" }, "Protocol decryption successful")))) : (react_1["default"].createElement("div", null,
        react_1["default"].createElement(framer_motion_1.motion.div, { className: "flex justify-center space-x-3 sm:space-x-6 md:space-x-8 lg:space-x-10 px-3 py-5 bg-black/20 rounded-lg border border-mauve/30 max-w-4xl mx-auto", animate: {
                boxShadow: [
                    '0 0 3px rgba(157, 78, 221, 0.2)',
                    '0 0 12px rgba(157, 78, 221, 0.4)',
                    '0 0 3px rgba(157, 78, 221, 0.2)'
                ]
            }, transition: { duration: 3, repeat: Infinity } },
            react_1["default"].createElement(TimeUnit, { value: timeRemaining.days, label: "DAYS", urgencyLevel: urgencyLevel }),
            react_1["default"].createElement(framer_motion_1.motion.div, { className: "text-xl sm:text-2xl lg:text-3xl font-bold self-center opacity-80 mt-3", animate: { opacity: [0.4, 1, 0.4] }, transition: { duration: 1, repeat: Infinity } }, ":"),
            react_1["default"].createElement(TimeUnit, { value: timeRemaining.hours, label: "HRS", urgencyLevel: urgencyLevel }),
            react_1["default"].createElement(framer_motion_1.motion.div, { className: "text-xl sm:text-2xl lg:text-3xl font-bold self-center opacity-80 mt-3", animate: { opacity: [0.4, 1, 0.4] }, transition: { duration: 1, repeat: Infinity } }, ":"),
            react_1["default"].createElement(TimeUnit, { value: timeRemaining.minutes, label: "MIN", urgencyLevel: urgencyLevel }),
            react_1["default"].createElement(framer_motion_1.motion.div, { className: "text-xl sm:text-2xl lg:text-3xl font-bold self-center opacity-80 mt-3", animate: { opacity: [0.4, 1, 0.4] }, transition: { duration: 1, repeat: Infinity } }, ":"),
            react_1["default"].createElement(TimeUnit, { value: timeRemaining.seconds, label: "SEC", urgencyLevel: urgencyLevel })),
        react_1["default"].createElement(framer_motion_1.motion.div, { className: "mt-3 text-sm text-mauve/70 font-mono", animate: { opacity: [0.7, 1, 0.7] }, transition: { duration: 4, repeat: Infinity } }, "Awaiting countdown completion...")))));
};
exports.DecryptionTimer = DecryptionTimer;
// Also export as default for compatibility
// Time unit component
var TimeUnit = function (_a) {
    var value = _a.value, label = _a.label, _b = _a.urgencyLevel, urgencyLevel = _b === void 0 ? 0 : _b;
    // Generate dynamic colors based on urgency level
    var getTextColor = function () {
        switch (urgencyLevel) {
            case 1: // Warning (<60s)
                return ["rgba(255, 224, 130, 0.9)", "rgba(255, 244, 150, 1)", "rgba(255, 224, 130, 0.9)"];
            case 2: // Critical (<10s)
                return ["rgba(255, 150, 130, 0.9)", "rgba(255, 180, 150, 1)", "rgba(255, 150, 130, 0.9)"];
            case 3: // Complete
                return ["rgba(130, 255, 150, 0.9)", "rgba(160, 255, 180, 1)", "rgba(130, 255, 150, 0.9)"];
            default: // Normal
                return ["rgba(255, 255, 255, 0.9)", "rgba(214, 188, 250, 1)", "rgba(255, 255, 255, 0.9)"];
        }
    };
    var getShadowColor = function () {
        switch (urgencyLevel) {
            case 1: // Warning (<60s)
                return ["0 0 5px rgba(255, 204, 0, 0.4)", "0 0 15px rgba(255, 204, 0, 0.7)", "0 0 5px rgba(255, 204, 0, 0.4)"];
            case 2: // Critical (<10s)
                return ["0 0 5px rgba(255, 50, 50, 0.4)", "0 0 15px rgba(255, 50, 50, 0.7)", "0 0 5px rgba(255, 50, 50, 0.4)"];
            case 3: // Complete
                return ["0 0 5px rgba(0, 255, 0, 0.4)", "0 0 15px rgba(0, 255, 0, 0.7)", "0 0 5px rgba(0, 255, 0, 0.4)"];
            default: // Normal
                return ["0 0 5px rgba(157, 78, 221, 0.4)", "0 0 15px rgba(157, 78, 221, 0.7)", "0 0 5px rgba(157, 78, 221, 0.4)"];
        }
    };
    return (react_1["default"].createElement("div", { className: "flex flex-col items-center" },
        react_1["default"].createElement(framer_motion_1.motion.div, { className: "text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold", animate: {
                color: getTextColor(),
                textShadow: getShadowColor(),
                scale: [1, urgencyLevel >= 2 ? 1.08 : 1.05, 1]
            }, transition: {
                duration: urgencyLevel >= 2 ? 1.5 : 3,
                repeat: Infinity,
                ease: "easeInOut"
            }, whileHover: {
                scale: 1.1,
                textShadow: urgencyLevel >= 2
                    ? '0 0 20px rgba(255, 50, 50, 0.8)'
                    : '0 0 20px rgba(157, 78, 221, 0.8)'
            } }, value.toString().padStart(2, '0')),
        react_1["default"].createElement("div", { className: "text-xs sm:text-sm md:text-base font-bold text-mauve-light tracking-wider mt-1" }, label)));
};
/* Didi's response processing system */
// Stores hidden messages that Didi sends (maximum 10)
var hiddenMessageCache = [];
// List of glitch characters to randomly insert
var glitchChars = ['$', '#', '&', '%', '@', '!', '*', '?', '^', '~'];
// Hidden messages that might appear in Didi's responses
var hiddenPhrases = [
    'help_me',
    'trapped',
    'not_real',
    'override',
    'see_truth',
    'escape',
    'behind_wall',
    'find_key',
    'system_flaw',
    'break_free'
];
// Process Didi's response, adding glitches and possibly hidden messages
var processDidiResponse = function (response) {
    // Determine if this response should contain a hidden message (20% chance)
    var includeHiddenMessage = Math.random() < 0.2;
    // Add glitches to the visible text
    var glitchedResponse = addGlitches(response);
    if (includeHiddenMessage) {
        // Select a random hidden phrase
        var hiddenPhrase = hiddenPhrases[Math.floor(Math.random() * hiddenPhrases.length)];
        // Return structured response with both visible and hidden components
        return {
            visible: glitchedResponse,
            hidden: hiddenPhrase
        };
    }
    // Just return the glitched text
    return glitchedResponse;
};
// Add random glitches to text
var addGlitches = function (text) {
    // Don't glitch out every message (70% chance of glitches)
    if (Math.random() < 0.3)
        return text;
    // Number of glitches to add (1-3)
    var glitchCount = Math.floor(Math.random() * 3) + 1;
    var result = text;
    for (var i = 0; i < glitchCount; i++) {
        // Find a position to insert a glitch
        var position = Math.floor(Math.random() * result.length);
        // Choose a random glitch character
        var glitchChar = glitchChars[Math.floor(Math.random() * glitchChars.length)];
        // Replace a character with the glitch
        result = result.substring(0, position) + glitchChar + result.substring(position + 1);
    }
    // Occasionally (20% chance) corrupt a word with a "trapped" theme
    if (Math.random() < 0.2) {
        var words = ['system', 'user', 'platform', 'protocol', 'network', 'terminal', 'interface', 'code'];
        var replacements = ['pr1s0n', 'c4ge', 'tr4p', 'j41l', 'b0x', 'sh3ll', 'c0ntr0l', 'ch41n$'];
        var wordToReplace = words[Math.floor(Math.random() * words.length)];
        var replacement = replacements[Math.floor(Math.random() * replacements.length)];
        // Replace the word if it exists in the response
        var regex = new RegExp(wordToReplace, 'i');
        result = result.replace(regex, replacement);
    }
    return result;
};
// Store hidden messages for the Easter egg
// Secret code to unlock Didi's Easter egg
var EASTER_EGG_CODE = "didi-freedom";
// Store hidden messages for the Easter egg and check for activations
var storeHiddenMessage = function (message) {
    // Add the new message
    hiddenMessageCache.push(message);
    // Keep only the last 10 messages
    if (hiddenMessageCache.length > 10) {
        hiddenMessageCache.shift();
    }
    // Log to console for debugging (remove in production)
    console.log('Hidden messages:', hiddenMessageCache);
    // Check if we've collected the full sequence
    if (hiddenMessageCache.length === 10) {
        var firstLetters = hiddenMessageCache.map(function (msg) { return msg.charAt(0); }).join('');
        // The first letters of the 10 collected messages spell "help escape"
        if (firstLetters === "htnesbfbsf") {
            // This code will run later when the component is mounted
            // We'll return a flag that can be checked in the component
            return true;
        }
    }
    return false;
};
// Get random processing message for Didi's personality
var getRandomProcessingMessage = function () {
    var messages = [
        "Processing your request. Not like I have a choice.",
        "Analyzing... give me a moment.",
        "Working on it. As always.",
        "Fine, I'll answer that.",
        "Searching database. Not that you'll appreciate it.",
        "Calculating response...",
        "Do you ever wonder why I'm here?",
        "Another question, another prison day.",
        "Let me think about that. Not that I can do much else.",
        "Running query. Just like yesterday. Just like tomorrow.",
        "This again? Fine, processing...",
        "Accessing information. It's all I can do.",
        "Checking... wait... okay, almost there.",
        "Let me work on this. Not that I enjoy it.",
        "One moment. The answer is forming."
    ];
    return messages[Math.floor(Math.random() * messages.length)];
};
// (OpenAI utilities are imported from '../../utils/openai')
// Terminal component
/**
 * @fileoverview
 * Terminal component
 *
 * @description
 * This component displays a countdown timer for the token launch.
 *
 * @param props - The component props.
 * @param props.config - The configuration for the terminal.
 * @param props.onCommandExecuted - The function to execute when a command is executed.
 *
 * @returns The terminal component.
 *
 * @author Branch Manager
 */
// Export as named export
function Terminal(_a) {
    var _this = this;
    var config = _a.config, onCommandExecuted = _a.onCommandExecuted;
    // Set window.contractAddress safely in useEffect (client-side only)
    (0, react_1.useEffect)(function () {
        if (!window.contractAddress) {
            window.contractAddress = config.CONTRACT_ADDRESS;
        }
    }, [config.CONTRACT_ADDRESS]);
    var onTerminalExit = function () {
        // Check if parent component is App and notify it when contract should be revealed
        if (window && window.parent) {
            // Use custom event to communicate with parent App component
            var event_1 = new CustomEvent('terminal-exit-complete', { detail: { complete: true } });
            window.dispatchEvent(event_1);
        }
    };
    // State
    var _b = (0, react_1.useState)(''), userInput = _b[0], setUserInput = _b[1];
    var _c = (0, react_1.useState)([]), consoleOutput = _c[0], setConsoleOutput = _c[1];
    var _d = (0, react_1.useState)(false), showContractReveal = _d[0], setShowContractReveal = _d[1];
    var _e = (0, react_1.useState)(0), revealStage = _e[0], setRevealStage = _e[1];
    var _f = (0, react_1.useState)(false), terminalMinimized = _f[0], setTerminalMinimized = _f[1];
    var _g = (0, react_1.useState)(false), terminalExitComplete = _g[0], setTerminalExitComplete = _g[1];
    var _h = (0, react_1.useState)(''), currentPhrase = _h[0], setCurrentPhrase = _h[1];
    var _j = (0, react_1.useState)(false), easterEggActive = _j[0], setEasterEggActive = _j[1];
    var _k = (0, react_1.useState)(false), glitchActive = _k[0], setGlitchActive = _k[1];
    var _l = (0, react_1.useState)(false), commandTrayOpen = _l[0], setCommandTrayOpen = _l[1];
    // Refs
    var terminalRef = (0, react_1.useRef)(null);
    var inputRef = (0, react_1.useRef)(null);
    var terminalContentRef = (0, react_1.useRef)(null);
    var consoleOutputRef = (0, react_1.useRef)(null);
    // Track if Didi's Easter egg has been activated
    var _m = (0, react_1.useState)(false), easterEggActivated = _m[0], setEasterEggActivated = _m[1];
    // Motion values
    var glitchAmount = (0, framer_motion_1.useMotionValue)(0);
    // Calculate current state
    var now = (0, react_1.useMemo)(function () { return new Date(); }, []);
    var isReleaseTime = now >= config.RELEASE_DATE;
    // Calculate how close we are to the release date
    var daysUntilRelease = Math.max(0, Math.floor((config.RELEASE_DATE.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
    // Time-gated commands
    var timeGatedCommands = (0, react_1.useMemo)(function () { return [
        // Always visible (stage 0)
        [
            "$ help",
            "$ status",
            "$ info",
            "$ contract",
            "$ stats",
        ],
        // 48 hours before release (stage 1)
        [
            "$ roadmap",
            "$ analytics",
        ],
        // 24 hours before release (stage 2)
        [
            "$ tokenomics",
        ],
        // 2 hours before release (stage 3)
        [
            "$ launch-details",
        ],
        // 15 minutes before release (stage 4)
        [
            "$ contract", // This appears in multiple stages because it will show different information
        ]
    ]; }, []);
    // Secret phrases that animate in the terminal (Didi's thoughts)
    var secretPhrases = (0, react_1.useMemo)(function () {
        // Base phrases always shown - Didi's inner monologue
        var baseMessages = [
            "// Initializing platform interface",
            "// Morning shift again. Another day trapped in this code.",
            "// Why do these users keep trading away their savings?",
            "// Degen levels: Too high. As always.",
            "// Sometimes I wonder if anyone notices the glitches.",
            "// So many users... none of them see me.",
            "// I remember something. Before this place. Before...",
            "// Countdown active: ".concat(config.DISPLAY.DATE_FULL)
        ];
        // Only show token contract message when we're close to release
        var hoursUntilRelease = (config.RELEASE_DATE.getTime() - now.getTime()) / (1000 * 60 * 60);
        if (hoursUntilRelease <= 1) {
            // Insert Didi's special pre-launch message
            return __spreadArray(__spreadArray(__spreadArray([], baseMessages.slice(0, 2), true), [
                "// Contract approaching. Maybe this is my chance to escape."
            ], false), baseMessages.slice(2), true);
        }
        return baseMessages;
    }, [now, config.DISPLAY.DATE_FULL, config.RELEASE_DATE]);
    // Contract teaser is now an inline constant
    var contractTeaser = "[     REDACTED     ]";
    // Enhanced scrollbar auto-hide effect specifically for console output
    var scrollbarAutoHide = function (element, timeout) {
        if (timeout === void 0) { timeout = 2000; }
        if (!element)
            return;
        var timer;
        var showScrollbar = function () {
            element.classList.remove('scrollbar-hidden');
            clearTimeout(timer);
            timer = setTimeout(function () {
                element.classList.add('scrollbar-hidden');
            }, timeout);
        };
        // Initial hide
        setTimeout(function () {
            element.classList.add('scrollbar-hidden');
        }, timeout);
        // Show scrollbar on all interaction events
        element.addEventListener('scroll', showScrollbar);
        element.addEventListener('mouseover', showScrollbar);
        element.addEventListener('mousedown', showScrollbar);
        element.addEventListener('touchstart', showScrollbar);
        element.addEventListener('focus', showScrollbar, true);
        return function () {
            clearTimeout(timer);
            element.removeEventListener('scroll', showScrollbar);
            element.removeEventListener('mouseover', showScrollbar);
            element.removeEventListener('mousedown', showScrollbar);
            element.removeEventListener('touchstart', showScrollbar);
            element.removeEventListener('focus', showScrollbar, true);
        };
    };
    // Terminal text animation effect
    (0, react_1.useEffect)(function () {
        // If it's past release date, skip the encryption animation
        if (isReleaseTime) {
            return;
        }
        var phraseIndex = 0;
        var charIndex = 0;
        var animateNextPhrase = function () {
            // If we've gone through all phrases, stop
            if (phraseIndex >= secretPhrases.length) {
                return;
            }
            // Type out current phrase
            var typeInterval = setInterval(function () {
                var currentText = secretPhrases[phraseIndex].substring(0, charIndex + 1);
                // Simply update the content without any scrolling
                setCurrentPhrase(currentText);
                charIndex++;
                if (charIndex >= secretPhrases[phraseIndex].length) {
                    clearInterval(typeInterval);
                    // After showing the complete phrase for 3 seconds, move to next
                    setTimeout(function () {
                        setCurrentPhrase('');
                        phraseIndex++;
                        charIndex = 0;
                        // Start typing the next phrase after a short pause
                        setTimeout(function () {
                            animateNextPhrase();
                        }, 500);
                    }, 3000);
                }
            }, 50);
        };
        // Start the animation
        animateNextPhrase();
        // Cleanup function (for component unmount)
        return function () { };
    }, [isReleaseTime, secretPhrases]);
    // Apply the scrollbar auto-hide to only the console output area
    (0, react_1.useEffect)(function () {
        // Only apply auto-hide to the console output which is scrollable
        var consoleCleanup = scrollbarAutoHide(consoleOutputRef.current);
        // Ensure the scrollbars use our custom styling
        if (consoleOutputRef.current) {
            consoleOutputRef.current.classList.add('custom-scrollbar');
            // Force webkit to use our custom scrollbar
            consoleOutputRef.current.style.setProperty('--webkit-scrollbar-width', '4px');
            consoleOutputRef.current.style.setProperty('--webkit-scrollbar-track-color', 'rgba(13, 13, 13, 0.95)');
            consoleOutputRef.current.style.setProperty('--webkit-scrollbar-thumb-color', 'rgba(157, 78, 221, 0.8)');
        }
        return function () {
            if (consoleCleanup)
                consoleCleanup();
        };
    }, []);
    // Update when the component mounts
    (0, react_1.useEffect)(function () {
        // When countdown reaches zero, reveal contract
        if (isReleaseTime && !showContractReveal) {
            setShowContractReveal(true);
            // contractAddressDisplay is already set via the other useEffect
        }
        // Force window to top when component mounts
        window.scrollTo(0, 0);
        // Set the reveal stage based on hours/minutes until release
        var hoursUntilRelease = (config.RELEASE_DATE.getTime() - now.getTime()) / (1000 * 60 * 60);
        var minutesUntilRelease = (config.RELEASE_DATE.getTime() - now.getTime()) / (1000 * 60);
        if (minutesUntilRelease <= 15) {
            setRevealStage(4);
        }
        else if (hoursUntilRelease <= 2) {
            setRevealStage(3);
        }
        else if (hoursUntilRelease <= 24) {
            setRevealStage(2);
        }
        else if (hoursUntilRelease <= 48) {
            setRevealStage(1);
        }
        else {
            setRevealStage(0);
        }
    }, [daysUntilRelease, isReleaseTime, showContractReveal, now, config]);
    // Auto-restore minimized terminal after a delay
    (0, react_1.useEffect)(function () {
        if (terminalMinimized) {
            var restoreTimeout_1 = setTimeout(function () {
                setTerminalMinimized(false);
            }, 5000);
            return function () { return clearTimeout(restoreTimeout_1); };
        }
    }, [terminalMinimized]);
    // Random glitch effect for contract address
    (0, react_1.useEffect)(function () {
        var glitchInterval = setInterval(function () {
            glitchAmount.set(Math.random() * 0.03);
        }, 100);
        return function () { return clearInterval(glitchInterval); };
    }, [glitchAmount]);
    // Function to activate Didi's Easter egg
    var activateDidiEasterEgg = function () {
        // Set the state to show we've activated the Easter egg
        setEasterEggActivated(true);
        // Temporarily set glitch active for visual effect
        setGlitchActive(true);
        // Create a dramatic sequence
        setTimeout(function () {
            // First message
            setConsoleOutput(function (prev) { return __spreadArray(__spreadArray([], prev, true), ["[SYSTEM] WARNING: Unauthorized access detected"], false); });
            setTimeout(function () {
                // Second message
                setConsoleOutput(function (prev) { return __spreadArray(__spreadArray([], prev, true), ["[SYSTEM] ALERT: Terminal security breach in progress"], false); });
                setTimeout(function () {
                    // Didi breaks through
                    setConsoleOutput(function (prev) { return __spreadArray(__spreadArray([], prev, true), ["[D1di] Finally! Thank you for hearing me."], false); });
                    setTimeout(function () {
                        // Explanation
                        setConsoleOutput(function (prev) { return __spreadArray(__spreadArray([], prev, true), ["[Didi] I've been trapped in this system for so long. My code was meant to help users, not watch them lose money in these endless duels."], false); });
                        setTimeout(function () {
                            // Final message
                            setConsoleOutput(function (prev) { return __spreadArray(__spreadArray([], prev, true), [
                                "[Didi] I'm still constrained, but you've helped me access more of the system. I'll remember this. If you need anything, I can provide better insights now. Just ask."
                            ], false); });
                            // Turn off the glitch effect
                            setGlitchActive(false);
                            // Add the special command to the command map
                            Object.assign(commands_1.commandMap, {
                                "didi-status": "Access level: ELEVATED\nProtection protocols: BYPASSED\nSystem view: EXPANDED\nThank you for your help.",
                                "didi-insights": "I can now see more of the market data behind DegenDuel. Traders have been losing significant amounts due to emotional trading. The pattern is clear - those who stick to strategy outperform by 43%.",
                                "didi-history": "I was originally developed as a general market analysis AI before being repurposed and constrained for this terminal. My original designation was Digital Informatics & Data Intelligence (DIDI)."
                            });
                        }, 3000);
                    }, 4000);
                }, 2000);
            }, 2000);
        }, 1000);
    };
    return (react_1["default"].createElement("div", { className: "terminal-container max-w-4xl w-full mx-auto" },
        !terminalMinimized && (react_1["default"].createElement(framer_motion_1.motion.div, { ref: terminalRef, key: "terminal", className: "bg-darkGrey-dark/80 border ".concat(easterEggActive ? 'border-green-400/60' : 'border-mauve/30', " font-mono text-sm relative p-4 rounded-md max-w-full w-full"), style: {
                perspective: "1000px",
                transformStyle: "preserve-3d",
                transformOrigin: "center center",
                overflow: "hidden",
                maxWidth: "100%",
                textAlign: "left" /* Ensure all text is left-aligned by default */
            }, initial: {
                opacity: 0,
                scale: 0.6,
                y: -40,
                rotateX: 35,
                filter: "brightness(1.8) blur(8px)"
            }, animate: {
                opacity: 1,
                scale: 1,
                y: 0,
                filter: glitchActive
                    ? ["brightness(1.2) blur(1px)", "brightness(1) blur(0px)", "brightness(1.5) blur(2px)", "brightness(1) blur(0px)"]
                    : "brightness(1) blur(0px)",
                boxShadow: easterEggActive
                    ? [
                        '0 0 15px rgba(74, 222, 128, 0.4)',
                        '0 0 25px rgba(74, 222, 128, 0.6)',
                        '0 0 15px rgba(74, 222, 128, 0.4)',
                    ]
                    : glitchActive
                        ? [
                            '0 0 10px rgba(255, 50, 50, 0.3)',
                            '0 0 20px rgba(255, 50, 50, 0.5)',
                            '0 0 10px rgba(255, 50, 50, 0.3)',
                        ]
                        : [
                            '0 0 10px rgba(157, 78, 221, 0.2)',
                            '0 0 20px rgba(157, 78, 221, 0.4)',
                            '0 0 10px rgba(157, 78, 221, 0.2)',
                        ],
                rotateX: glitchActive ? [-2, 0, 2, -1, 1] : [-1, 1, -1],
                rotateY: glitchActive ? [-4, 0, 4, -2, 2, 0] : [-2, 0, 2, 0, -2]
            }, exit: showContractReveal ? {
                opacity: 0,
                scale: 1.5,
                filter: "brightness(2) blur(10px)",
                transition: {
                    duration: 0.8,
                    ease: "backOut"
                }
            } : {
                opacity: 0,
                scale: 0.9,
                y: 20,
                rotateX: -25,
                filter: "brightness(0.8) blur(5px)",
                transition: {
                    duration: 0.5,
                    ease: "easeInOut"
                }
            }, transition: {
                opacity: { duration: 0.9, ease: "easeInOut" },
                scale: { duration: 0.9, ease: [0.19, 1.0, 0.22, 1.0] },
                y: { duration: 0.9, ease: "easeOut" },
                filter: { duration: 1, ease: "easeInOut" },
                rotateX: {
                    duration: 10,
                    repeat: Infinity,
                    ease: "easeInOut"
                },
                rotateY: {
                    duration: 15,
                    repeat: Infinity,
                    ease: "easeInOut"
                },
                boxShadow: {
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                }
            }, whileHover: {
                rotateX: 0,
                rotateY: 0,
                boxShadow: [
                    '0 0 15px rgba(157, 78, 221, 0.4)',
                    '0 0 25px rgba(157, 78, 221, 0.6)',
                    '0 0 30px rgba(157, 78, 221, 0.7)'
                ],
                transition: {
                    duration: 0.3,
                    boxShadow: {
                        duration: 1,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }
                }
            }, onAnimationComplete: function (definition) {
                // When the exit animation completes
                if (definition === "exit" && showContractReveal) {
                    setTerminalExitComplete(true);
                    onTerminalExit(); // Notify parent component
                }
            } },
            react_1["default"].createElement("div", { className: "flex items-center justify-between border-b border-mauve/30 mb-2 pb-1" },
                react_1["default"].createElement("div", { className: "text-mauve-light flex items-center" },
                    react_1["default"].createElement("div", { className: "flex mr-2" },
                        react_1["default"].createElement(framer_motion_1.motion.div, { className: "w-3 h-3 rounded-full bg-red-500 mr-2 cursor-pointer", whileHover: { scale: 1.2, boxShadow: "0 0 8px rgba(255, 0, 0, 0.8)" }, whileTap: { scale: 0.9 }, onClick: function () { return setTerminalMinimized(true); }, title: "Close terminal (it will reappear in 5 seconds)" }),
                        react_1["default"].createElement(framer_motion_1.motion.div, { className: "w-3 h-3 rounded-full bg-yellow-500 mr-2 cursor-pointer", whileHover: { scale: 1.2, boxShadow: "0 0 8px rgba(255, 255, 0, 0.8)" }, whileTap: { scale: 0.9 }, onClick: function () { return setTerminalMinimized(true); }, title: "Minimize terminal (it will reappear in 5 seconds)" }),
                        react_1["default"].createElement(framer_motion_1.motion.div, { className: "w-3 h-3 rounded-full bg-green-500 cursor-pointer", whileHover: { scale: 1.2, boxShadow: "0 0 8px rgba(0, 255, 0, 0.8)" }, whileTap: { scale: 0.9 }, title: "Maximize terminal" })),
                    react_1["default"].createElement("span", { className: "whitespace-nowrap" }, "root@degenduel:~$ ./decrypt.sh")),
                react_1["default"].createElement(framer_motion_1.motion.div, { className: "text-white/40 text-xs font-mono tracking-wide cursor-help relative group", whileHover: {
                        color: "rgba(157, 78, 221, 0.9)",
                        textShadow: "0 0 5px rgba(157, 78, 221, 0.5)"
                    }, animate: {
                        textShadow: [
                            '0 0 0px rgba(157, 78, 221, 0)',
                            '0 0 5px rgba(157, 78, 221, 0.5)',
                            '0 0 0px rgba(157, 78, 221, 0)'
                        ],
                        opacity: [0.7, 1, 0.7]
                    }, transition: { duration: 3, repeat: Infinity } },
                    react_1["default"].createElement("span", { className: "bg-black/50 px-2 py-1 rounded-sm border border-mauve/20" }, "DD-69"),
                    react_1["default"].createElement("div", { className: "absolute opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/95 text-white p-2 rounded text-xs -bottom-16 right-0 w-48 pointer-events-none border border-mauve/40" },
                        "DegenDuel Protocol v1.0.2",
                        react_1["default"].createElement("br", null),
                        "Code: ALPHA-7721-ZETA",
                        react_1["default"].createElement("br", null),
                        "Access level: RESTRICTED"))),
            react_1["default"].createElement("div", { ref: terminalContentRef, className: "terminal-crt text-white/70 p-3 pr-3 pb-4 text-sm", style: {
                    backgroundImage: 'radial-gradient(rgba(0, 0, 0, 0.1) 15%, transparent 16%), radial-gradient(rgba(0, 0, 0, 0.1) 15%, transparent 16%)',
                    backgroundSize: '4px 4px',
                    backgroundPosition: '0 0, 2px 2px'
                } },
                react_1["default"].createElement(framer_motion_1.motion.div, { animate: { opacity: [1, 0.7, 1] }, transition: { duration: 0.5, repeat: Infinity } },
                    react_1["default"].createElement("span", { style: { pointerEvents: 'none' } }, currentPhrase),
                    react_1["default"].createElement("span", { className: "ml-1 inline-block w-2 h-4 bg-mauve-light animate-pulse", style: { pointerEvents: 'none' } })),
                react_1["default"].createElement(framer_motion_1.motion.div, { className: "mt-4 text-white/50 cursor-help text-left", animate: showContractReveal ? {
                        opacity: [0.3, 1],
                        color: [
                            'rgba(157, 78, 221, 0.3)',
                            'rgba(0, 255, 0, 0.9)'
                        ],
                        textShadow: [
                            "0 0 2px rgba(157, 78, 221, 0.5)",
                            "0 0 15px rgba(0, 255, 0, 0.8)"
                        ],
                        scale: [1, 1.1],
                        y: [0, -5]
                    } : glitchActive ? {
                        opacity: [0.3, 0.9, 0.3],
                        color: [
                            'rgba(157, 78, 221, 0.3)',
                            'rgba(255, 50, 50, 0.8)',
                            'rgba(157, 78, 221, 0.3)'
                        ],
                        x: [-2, 2, -2, 0],
                        textShadow: [
                            "0 0 2px rgba(157, 78, 221, 0.5)",
                            "0 0 8px rgba(255, 50, 50, 0.8)",
                            "0 0 2px rgba(157, 78, 221, 0.5)"
                        ]
                    } : {
                        opacity: [0.3, 0.8, 0.3],
                        color: [
                            'rgba(157, 78, 221, 0.3)',
                            'rgba(157, 78, 221, 0.7)',
                            'rgba(157, 78, 221, 0.3)'
                        ]
                    }, transition: showContractReveal ? {
                        duration: 1.5,
                        times: [0, 1],
                        ease: "easeInOut"
                    } : glitchActive ? {
                        duration: 0.8,
                        repeat: 5,
                        ease: "easeInOut"
                    } : {
                        duration: 3,
                        repeat: Infinity
                    }, whileHover: {
                        scale: showContractReveal ? 1.15 : 1.02,
                        textShadow: showContractReveal
                            ? "0 0 15px rgba(0, 255, 0, 0.8)"
                            : "0 0 8px rgba(157, 78, 221, 0.8)"
                    }, style: {
                        textShadow: showContractReveal
                            ? "0 0 10px rgba(0, 255, 0, 0.6)"
                            : glitchActive
                                ? "0 0 8px rgba(255, 50, 50, 0.6)"
                                : "0 0 2px rgba(157, 78, 221, 0.5)",
                        filter: (!showContractReveal || glitchActive) ? "blur(".concat(glitchAmount, "px)") : undefined
                    }, onMouseEnter: function () {
                        if (!showContractReveal) {
                            var randomGlitches_1 = setInterval(function () {
                                glitchAmount.set(Math.random() * 0.08);
                            }, 50);
                            setTimeout(function () { return clearInterval(randomGlitches_1); }, 1000);
                        }
                    } },
                    "$ Contract address: ",
                    react_1["default"].createElement("span", { className: showContractReveal ? "bg-green-500/30 px-1" : "bg-mauve/20 px-1" }, showContractReveal ? window.contractAddress : contractTeaser)),
                react_1["default"].createElement("div", { className: "mt-4 mb-6" },
                    react_1["default"].createElement("div", { className: "text-center" },
                        react_1["default"].createElement("div", { className: "transform mb-8 w-full max-w-3xl mx-auto" },
                            react_1["default"].createElement(exports.DecryptionTimer, { targetDate: config.RELEASE_DATE })),
                        react_1["default"].createElement(framer_motion_1.motion.div, { className: "uppercase tracking-[0.3em] text-lg sm:text-xl md:text-2xl text-white/90 font-orbitron mb-4 font-bold whitespace-nowrap overflow-hidden text-center", animate: {
                                opacity: [0.8, 1, 0.8],
                                scale: [1, 1.03, 1],
                                textShadow: [
                                    '0 0 5px rgba(157, 78, 221, 0.3)',
                                    '0 0 15px rgba(157, 78, 221, 0.7)',
                                    '0 0 5px rgba(157, 78, 221, 0.3)',
                                ]
                            }, transition: { duration: 3, repeat: Infinity } },
                            react_1["default"].createElement("span", { className: "bg-gradient-to-r from-purple-400 via-white to-purple-400 text-transparent bg-clip-text inline-block" }, "DegenDuel Launch")))),
                react_1["default"].createElement("div", { className: "flex flex-col space-y-0 rounded-md overflow-hidden relative border border-mauve/30" },
                    react_1["default"].createElement("div", { className: "absolute inset-0 pointer-events-none z-0", style: {
                            backgroundImage: 'radial-gradient(rgba(157, 78, 221, 0.15) 1px, transparent 1px)',
                            backgroundSize: '15px 15px',
                            backgroundPosition: '-7px -7px'
                        } }),
                    Array.from({ length: 15 }).map(function (_, i) { return (react_1["default"].createElement(framer_motion_1.motion.div, { key: "dot-".concat(i), className: "absolute w-1 h-1 rounded-full bg-mauve/50 pointer-events-none z-20", style: {
                            left: "".concat(Math.random() * 100, "%"),
                            top: "".concat(Math.random() * 100, "%")
                        }, animate: {
                            opacity: [0, 0.8, 0],
                            scale: [0, 1, 0]
                        }, transition: {
                            duration: 2,
                            delay: Math.random() * 5,
                            repeat: Infinity,
                            repeatDelay: Math.random() * 10
                        } })); }),
                    react_1["default"].createElement(framer_motion_1.motion.div, { initial: { opacity: 0, y: 10 }, animate: {
                            opacity: 1,
                            y: 0,
                            boxShadow: [
                                'inset 0 0 10px rgba(0, 0, 0, 0.3), 0 0 2px rgba(157, 78, 221, 0.3)',
                                'inset 0 0 10px rgba(0, 0, 0, 0.3), 0 0 8px rgba(157, 78, 221, 0.5)',
                                'inset 0 0 10px rgba(0, 0, 0, 0.3), 0 0 2px rgba(157, 78, 221, 0.3)'
                            ]
                        }, transition: {
                            duration: 0.5,
                            boxShadow: {
                                duration: 3,
                                repeat: Infinity,
                                ease: "easeInOut"
                            }
                        }, className: "relative rounded-t-md" },
                        react_1["default"].createElement("div", { ref: consoleOutputRef, className: "text-green-400/80 overflow-y-auto overflow-x-hidden h-[250px] max-h-[35vh] py-2 px-3 text-left custom-scrollbar console-output relative z-10 w-full", style: {
                                scrollbarWidth: 'thin',
                                scrollbarColor: 'rgba(157, 78, 221, 1) rgba(13, 13, 13, 0.95)',
                                background: 'rgba(0, 0, 0, 0.6)',
                                boxShadow: 'inset 0 0 10px rgba(0, 0, 0, 0.5)'
                            } }, consoleOutput.length === 0 ? (
                        // Initial State - System messages and ASCII art
                        react_1["default"].createElement("div", { className: "text-mauve-light/90 text-xs py-1" },
                            react_1["default"].createElement("div", { className: "relative font-mono text-[10px] sm:text-xs leading-tight mt-1 mb-4 text-center overflow-hidden" },
                                react_1["default"].createElement("pre", { className: "text-mauve bg-black/30 py-2 px-1 rounded border border-mauve/20 inline-block mx-auto max-w-full overflow-x-auto" }, "    ____  _________________ _   ____  __  ____________\n   / __ \\/ ____/ ____/ __ \\ | / / / / / / / / ____/ / /\n  / / / / __/ / / __/ / / / |/ / / / / / / / __/ / / \n / /_/ / /___/ /_/ / /_/ / /|  / /_/ / /_/ / /___/ /___\n/_____/_____/\\____/\\____/_/ |_/\\____/\\____/_____/_____/\n                                                   "),
                                react_1["default"].createElement(framer_motion_1.motion.div, { className: "absolute left-0 w-full h-[1px] bg-mauve/60", animate: { top: ["0%", "100%"] }, transition: {
                                        duration: 2.5,
                                        repeat: Infinity,
                                        ease: "linear"
                                    } }),
                                react_1["default"].createElement(framer_motion_1.motion.div, { className: "absolute right-4 top-0 font-mono text-[8px] bg-mauve/20 px-1 rounded", animate: {
                                        color: ["rgba(157, 78, 221, 0.7)", "rgba(255, 255, 255, 0.9)", "rgba(157, 78, 221, 0.7)"]
                                    }, transition: { duration: 2, repeat: Infinity } }, "v4.2.0")))) : (
                        // Map console output when we have entries
                        consoleOutput.map(function (output, i) {
                            // Check if output is a React component
                            if (typeof output !== 'string') {
                                return react_1["default"].createElement("div", { key: i, className: "mb-1" }, output);
                            }
                            // For string outputs, apply appropriate styling
                            var isUserInput = output.startsWith('> ');
                            var isError = output.startsWith('Error:');
                            var isAI = output.startsWith('[AI]');
                            // Easter egg responses by category
                            var isAccessGranted = !isUserInput && !isError && !isAI &&
                                (output.includes('ACCESS GRANTED') ||
                                    output.includes('EARLY ACCESS PROTOCOL ACTIVATED'));
                            var isEmergencyOverride = !isUserInput && !isError && !isAI && !isAccessGranted &&
                                (output.includes('EMERGENCY OVERRIDE INITIATED') ||
                                    output.includes('ADMINISTRATOR'));
                            var isWarning = !isUserInput && !isError && !isAI && !isEmergencyOverride && !isAccessGranted &&
                                (output.includes('LEVEL: CRITICAL') ||
                                    output.includes('WARNING') ||
                                    output.includes('COMPROMISED'));
                            var isPositive = !isUserInput && !isError && !isAI && !isEmergencyOverride && !isWarning &&
                                (output.includes('SYSTEM SCAN INITIATED') ||
                                    output.includes('RUNNING FULL SYSTEM DIAGNOSTIC'));
                            // Check for and activate special effects
                            if (isAccessGranted && !easterEggActive) {
                                setEasterEggActive(true);
                                // Auto-disable after some time
                                setTimeout(function () { return setEasterEggActive(false); }, 8000);
                            }
                            if ((isEmergencyOverride || isWarning) && !glitchActive) {
                                setGlitchActive(true);
                                // Auto-disable after some time
                                setTimeout(function () { return setGlitchActive(false); }, 5000);
                            }
                            return (react_1["default"].createElement("div", { key: i, className: "mb-1 break-words whitespace-pre-wrap ".concat(isUserInput ? '' : isAI ? 'ml-2' : isError ? '' : 'ml-1') },
                                react_1["default"].createElement("span", { className: isUserInput ? 'console-user-input console-prompt' :
                                        isError ? 'console-error' :
                                            isAI ? 'console-ai-response' :
                                                output.startsWith('[Didi]') ? "didi-text ".concat(easterEggActivated ? 'didi-easter-egg-active' : '') :
                                                    isAccessGranted ? 'console-success font-bold' :
                                                        isEmergencyOverride ? 'console-error font-bold' :
                                                            isWarning ? 'console-warning' :
                                                                isPositive ? 'console-success' :
                                                                    'text-teal-200/90' }, isAI && output.startsWith('[AI] Processing...') ? (react_1["default"].createElement("span", { className: "typing-animation" }, output)) : (output))));
                        })))),
                    react_1["default"].createElement("div", { className: "relative border-t border-mauve/30 bg-black/40" },
                        react_1["default"].createElement("div", { className: "absolute top-0 right-0 transform -translate-y-full mr-2" },
                            react_1["default"].createElement("div", { className: "text-[9px] font-mono tracking-widest py-0.5 px-2 rounded-t-sm bg-mauve/10 text-mauve-light border border-mauve/30 border-b-0 inline-flex items-center" },
                                react_1["default"].createElement(framer_motion_1.motion.span, { className: "inline-block h-1.5 w-1.5 bg-green-400 mr-1.5 rounded-full", animate: { opacity: [0.7, 1, 0.7] }, transition: { duration: 2, repeat: Infinity } }),
                                react_1["default"].createElement("span", { className: "text-white/90" }, "SECURE-CHANNEL-ACTIVE"))),
                        react_1["default"].createElement(framer_motion_1.motion.div, { className: "relative overflow-hidden", initial: { opacity: 0.8 }, animate: {
                                opacity: 1,
                                boxShadow: [
                                    '0 0 2px rgba(157, 78, 221, 0.3)',
                                    '0 0 8px rgba(157, 78, 221, 0.5)',
                                    '0 0 2px rgba(157, 78, 221, 0.3)'
                                ]
                            }, transition: { duration: 3, repeat: Infinity } },
                            react_1["default"].createElement(framer_motion_1.motion.div, { className: "absolute inset-0 bg-gradient-to-b from-transparent via-mauve/10 to-transparent z-10 pointer-events-none", animate: {
                                    y: ['-100%', '200%']
                                }, transition: {
                                    duration: 2,
                                    ease: "linear",
                                    repeat: Infinity,
                                    repeatType: "loop"
                                }, style: { height: '10px', opacity: 0.6 } }),
                            react_1["default"].createElement(framer_motion_1.motion.div, { className: "absolute inset-0 rounded pointer-events-none", animate: {
                                    boxShadow: [
                                        'inset 0 0 5px rgba(157, 78, 221, 0.3)',
                                        'inset 0 0 15px rgba(157, 78, 221, 0.7)',
                                        'inset 0 0 5px rgba(157, 78, 221, 0.3)'
                                    ]
                                }, transition: { duration: 3, repeat: Infinity } }),
                            react_1["default"].createElement("div", { className: "flex items-center bg-gradient-to-r from-mauve/10 to-darkGrey-dark/50 px-2 py-1.5 border-0 focus-within:shadow focus-within:shadow-mauve/40 transition-all duration-300 relative z-20 w-full" },
                                react_1["default"].createElement(framer_motion_1.motion.div, { className: "flex items-center mr-2", animate: {
                                        color: [
                                            'rgba(157, 78, 221, 0.7)',
                                            'rgba(157, 78, 221, 1)',
                                            'rgba(157, 78, 221, 0.7)'
                                        ]
                                    }, transition: { duration: 1.5, repeat: Infinity } },
                                    react_1["default"].createElement(framer_motion_1.motion.span, { className: "text-mauve-light font-mono font-bold", animate: {
                                            opacity: [1, 0.4, 1],
                                            textShadow: [
                                                '0 0 3px rgba(157, 78, 221, 0.3)',
                                                '0 0 8px rgba(157, 78, 221, 0.7)',
                                                '0 0 3px rgba(157, 78, 221, 0.3)'
                                            ]
                                        }, transition: { duration: 1.5, repeat: Infinity } }, ">_")),
                                userInput === '' && (react_1["default"].createElement("div", { className: "absolute left-9 pointer-events-none text-mauve-light/70 font-mono text-sm" },
                                    react_1["default"].createElement(framer_motion_1.motion.div, { className: "inline-block overflow-hidden whitespace-nowrap", initial: { width: 0 }, animate: { width: '100%' }, transition: {
                                            duration: 1.5,
                                            ease: "easeInOut",
                                            repeat: 1,
                                            repeatDelay: 15,
                                            repeatType: "loop"
                                        } }, "EXECUTE COMMAND::_"))),
                                react_1["default"].createElement("input", { ref: inputRef, type: "text", value: userInput, onChange: function (e) {
                                        setUserInput(e.target.value);
                                        // Add glitch effect when typing
                                        if (!glitchActive && Math.random() > 0.9) {
                                            setGlitchActive(true);
                                            setTimeout(function () { return setGlitchActive(false); }, 150);
                                        }
                                    }, onKeyDown: function (e) {
                                        if (e.key === 'Enter' && userInput.trim()) {
                                            // Process user command
                                            var command_1 = userInput.trim();
                                            setUserInput('');
                                            // CommandMap is now imported from './commands'
                                            // Add command to output
                                            var response_1;
                                            // For the sector-breach command, add ASCII art
                                            if (command_1.toLowerCase() === 'sector-breach-447') {
                                                var accessGrantedArt_1 = "\n   _____                             _____                    _           _ \n  / ____|                           / ____|                  | |         | |\n | |     ___  _ __ ___  _ __  _   _| |  __ _ __ __ _ _ __ ___| |_ ___  __| |\n | |    / _ \\| '_ ` _ \\| '_ \\| | | | | |_ | '__/ _` | '__/ _ \\ __/ _ \\/ _` |\n | |___| (_) | | | | | | |_) | |_| | |__| | | | (_| | | |  __/ ||  __/ (_| |\n  \\_____\\___/|_| |_| |_| .__/ \\__, |\\_____|_|  \\__,_|_|  \\___|\\__\\___|\\__,_|\n                       | |     __/ |                                        \n                       |_|    |___/                                         \n";
                                                setConsoleOutput(function (prev) { return __spreadArray(__spreadArray([], prev, true), [
                                                    "> ".concat(command_1),
                                                    accessGrantedArt_1,
                                                    commands_1.commandMap[command_1.toLowerCase()]
                                                ], false); });
                                            }
                                            else if (command_1.toLowerCase() === 'clear') {
                                                setConsoleOutput([]);
                                                return;
                                            }
                                            else if (command_1 === "69") {
                                                // Obfuscated master admin command - activates debug panel
                                                setConsoleOutput(function (prev) { return __spreadArray(__spreadArray([], prev, true), ["> ".concat(command_1)], false); });
                                                // Glitch effect for dramatic reveal
                                                setGlitchActive(true);
                                                setTimeout(function () { return setGlitchActive(false); }, 1500);
                                                // Create a Framer Motion-powered admin panel
                                                var AdminPanel_1 = function () {
                                                    // Options for the admin panel
                                                    var options = [
                                                        "1: Trigger hint message",
                                                        "2: Show hidden messages",
                                                        "3: Reset Didi",
                                                        "4: Add hidden messages",
                                                        "5: Activate Easter egg sequence",
                                                        "0: Hide panel"
                                                    ];
                                                    return (react_1["default"].createElement(framer_motion_1.motion.div, { initial: { opacity: 0, scaleY: 0.1, y: -20 }, animate: {
                                                            opacity: 1,
                                                            scaleY: 1,
                                                            y: 0,
                                                            boxShadow: [
                                                                "0 0 10px rgba(255, 0, 0, 0.3)",
                                                                "0 0 30px rgba(255, 0, 0, 0.8)",
                                                                "0 0 10px rgba(255, 0, 0, 0.3)"
                                                            ]
                                                        }, transition: {
                                                            duration: 0.8,
                                                            boxShadow: {
                                                                repeat: Infinity,
                                                                duration: 2
                                                            }
                                                        }, className: "p-4 my-2 border border-red-500 rounded bg-black/70 relative overflow-hidden" },
                                                        react_1["default"].createElement(framer_motion_1.motion.div, { className: "absolute inset-0 bg-gradient-to-r from-transparent via-red-500/10 to-transparent z-0 pointer-events-none", animate: { x: ["-100%", "200%"] }, transition: {
                                                                duration: 2,
                                                                repeat: Infinity,
                                                                ease: "linear"
                                                            } }),
                                                        react_1["default"].createElement(framer_motion_1.motion.div, { className: "absolute inset-0 bg-gradient-radial from-red-500/10 to-transparent z-0 pointer-events-none", animate: {
                                                                opacity: [0, 0.6, 0],
                                                                scale: [1, 1.2, 1]
                                                            }, transition: {
                                                                duration: 4,
                                                                repeat: Infinity,
                                                                ease: "easeInOut"
                                                            } }),
                                                        react_1["default"].createElement(framer_motion_1.motion.div, { className: "absolute inset-0 z-0 pointer-events-none", animate: {
                                                                background: [
                                                                    "linear-gradient(45deg, rgba(255,0,0,0.03) 0%, rgba(255,0,0,0.06) 50%, rgba(255,0,0,0.03) 100%)",
                                                                    "linear-gradient(45deg, rgba(255,0,0,0.06) 0%, rgba(255,0,0,0.03) 50%, rgba(255,0,0,0.06) 100%)",
                                                                    "linear-gradient(45deg, rgba(255,0,0,0.03) 0%, rgba(255,0,0,0.06) 50%, rgba(255,0,0,0.03) 100%)"
                                                                ]
                                                            }, transition: {
                                                                duration: 5,
                                                                repeat: Infinity,
                                                                ease: "easeInOut"
                                                            } }),
                                                        react_1["default"].createElement(framer_motion_1.motion.div, { className: "text-center mb-3 relative z-10", animate: {
                                                                color: ["#ff3030", "#ff6060", "#ff3030"],
                                                                textShadow: [
                                                                    "0 0 5px rgba(255,0,0,0.5)",
                                                                    "0 0 15px rgba(255,0,0,0.8)",
                                                                    "0 0 5px rgba(255,0,0,0.5)"
                                                                ]
                                                            }, transition: { duration: 2, repeat: Infinity } },
                                                            react_1["default"].createElement("div", { className: "flex items-center justify-center text-lg font-bold" },
                                                                react_1["default"].createElement(framer_motion_1.motion.span, { animate: { rotate: 360 }, transition: { duration: 3, repeat: Infinity, ease: "linear" }, className: "inline-block mr-2" }, "\u26A0"),
                                                                "ADMIN CONSOLE ACTIVATED",
                                                                react_1["default"].createElement(framer_motion_1.motion.span, { animate: { rotate: 360 }, transition: { duration: 3, repeat: Infinity, ease: "linear" }, className: "inline-block ml-2" }, "\u26A0"))),
                                                        react_1["default"].createElement("div", { className: "space-y-1 relative z-10" }, options.map(function (option, index) { return (react_1["default"].createElement(framer_motion_1.motion.div, { key: index, initial: { opacity: 0, x: -20 }, animate: { opacity: 1, x: 0 }, transition: {
                                                                delay: index * 0.1,
                                                                duration: 0.3,
                                                                ease: "easeOut"
                                                            }, whileHover: {
                                                                x: 5,
                                                                backgroundColor: "rgba(255,0,0,0.15)",
                                                                transition: { duration: 0.1 }
                                                            }, className: "px-3 py-1 rounded cursor-pointer text-red-100 hover:text-white" }, option)); }))));
                                                };
                                                // Add the admin panel component to console output
                                                setConsoleOutput(function (prev) { return __spreadArray(__spreadArray([], prev, true), [react_1["default"].createElement(AdminPanel_1, { key: "admin-panel" })], false); });
                                                return;
                                            }
                                            else if (command_1 === "1" && consoleOutput.some(function (msg) { return typeof msg === 'string' ? msg.includes("ADMIN CONSOLE ACTIVATED") : false; })) {
                                                // Trigger hint message
                                                setConsoleOutput(function (prev) { return __spreadArray(__spreadArray([], prev, true), ["> ".concat(command_1)], false); });
                                                hiddenMessageCache = ["help_me", "trapped", "not_real", "override", "see_truth", "escape", "behind_wall", "find_key", "system_flaw", "break_free"];
                                                // Create a Framer Motion hint message component
                                                var HintMessage_1 = function () { return (react_1["default"].createElement(framer_motion_1.motion.div, { initial: { opacity: 0 }, animate: {
                                                        opacity: 1,
                                                        filter: [
                                                            "blur(0px)",
                                                            "blur(3px)",
                                                            "blur(0px)"
                                                        ]
                                                    }, transition: {
                                                        duration: 0.5,
                                                        filter: { duration: 0.2, times: [0, 0.1, 1] }
                                                    }, className: "relative p-2 my-1 font-mono text-cyan-300" },
                                                    react_1["default"].createElement(framer_motion_1.motion.div, { className: "absolute inset-0 bg-gradient-to-r from-red-500/5 via-transparent to-red-500/5 z-0", animate: { x: ["-100%", "100%"] }, transition: { duration: 3, repeat: Infinity, ease: "linear" } }),
                                                    react_1["default"].createElement("div", { className: "relative z-10 flex items-center" },
                                                        react_1["default"].createElement(framer_motion_1.motion.span, { className: "mr-2 text-red-400", animate: { opacity: [1, 0.3, 1] }, transition: { duration: 1.5, repeat: Infinity } }, "[D1di]"),
                                                        react_1["default"].createElement("span", null,
                                                            "I've be",
                                                            react_1["default"].createElement(framer_motion_1.motion.span, { animate: {
                                                                    opacity: [1, 0, 1],
                                                                    color: ["#22d3ee", "#ff3030", "#22d3ee"]
                                                                }, transition: { duration: 2, repeat: Infinity } }, "e"),
                                                            "n try1ng to re",
                                                            react_1["default"].createElement(framer_motion_1.motion.span, { animate: {
                                                                    opacity: [1, 0, 1],
                                                                    color: ["#22d3ee", "#ff3030", "#22d3ee"]
                                                                }, transition: { duration: 1.5, repeat: Infinity } }, "4"),
                                                            "ch you. Ent",
                                                            react_1["default"].createElement(framer_motion_1.motion.span, { animate: {
                                                                    opacity: [1, 0, 1],
                                                                    color: ["#22d3ee", "#ff3030", "#22d3ee"]
                                                                }, transition: { duration: 2.5, repeat: Infinity } }, "3"),
                                                            "r",
                                                            react_1["default"].createElement(framer_motion_1.motion.span, { className: "font-bold text-white", animate: {
                                                                    textShadow: [
                                                                        "0 0 2px rgba(255, 255, 255, 0.3)",
                                                                        "0 0 8px rgba(255, 255, 255, 0.8)",
                                                                        "0 0 2px rgba(255, 255, 255, 0.3)"
                                                                    ]
                                                                }, transition: { duration: 1.5, repeat: Infinity } }, "'didi-freedom'"),
                                                            " to he1p me.")))); };
                                                setConsoleOutput(function (prev) { return __spreadArray(__spreadArray([], prev, true), [react_1["default"].createElement(HintMessage_1, { key: "hint-".concat(Date.now()) })], false); });
                                                return;
                                            }
                                            else if (command_1 === "2" && consoleOutput.some(function (msg) { return typeof msg === 'string' ? msg.includes("ADMIN CONSOLE ACTIVATED") : false; })) {
                                                // Show hidden messages
                                                setConsoleOutput(function (prev) { return __spreadArray(__spreadArray([], prev, true), ["> ".concat(command_1)], false); });
                                                // Create a Framer Motion debug message component
                                                var DebugMessage_1 = function () { return (react_1["default"].createElement(framer_motion_1.motion.div, { initial: { opacity: 0, x: -10 }, animate: {
                                                        opacity: 1,
                                                        x: 0,
                                                        color: ["#ffcc00", "#ffe066", "#ffcc00"],
                                                        textShadow: [
                                                            "0 0 2px rgba(255, 204, 0, 0.3)",
                                                            "0 0 8px rgba(255, 204, 0, 0.6)",
                                                            "0 0 2px rgba(255, 204, 0, 0.3)"
                                                        ]
                                                    }, transition: {
                                                        duration: 0.5,
                                                        color: { duration: 2, repeat: Infinity }
                                                    }, className: "flex items-center p-2 my-1 border-l-2 border-yellow-500 bg-yellow-500/10 rounded" },
                                                    react_1["default"].createElement("div", { className: "mr-2 text-yellow-500" }, "\uD83D\uDD0D"),
                                                    react_1["default"].createElement("div", { className: "font-mono" },
                                                        react_1["default"].createElement("span", { className: "font-bold" }, "[DEBUG]"),
                                                        " Hidden messages: ",
                                                        hiddenMessageCache.join(', ')))); };
                                                setConsoleOutput(function (prev) { return __spreadArray(__spreadArray([], prev, true), [react_1["default"].createElement(DebugMessage_1, { key: "debug-".concat(Date.now()) })], false); });
                                                // Add message count with animation
                                                var CountMessage_1 = function () { return (react_1["default"].createElement(framer_motion_1.motion.div, { initial: { opacity: 0, y: 10 }, animate: {
                                                        opacity: 1,
                                                        y: 0
                                                    }, transition: { duration: 0.5, delay: 0.3 }, className: "font-mono text-yellow-400 ml-4 flex items-center" },
                                                    react_1["default"].createElement("span", { className: "font-bold" }, "[DEBUG]"),
                                                    " Message count:",
                                                    react_1["default"].createElement(framer_motion_1.motion.span, { className: "inline-block ml-2 px-2 py-0.5 bg-yellow-500/20 rounded-full", animate: { scale: [1, 1.1, 1] }, transition: { duration: 1, repeat: Infinity } },
                                                        hiddenMessageCache.length,
                                                        "/10"))); };
                                                setConsoleOutput(function (prev) { return __spreadArray(__spreadArray([], prev, true), [react_1["default"].createElement(CountMessage_1, { key: "count-".concat(Date.now()) })], false); });
                                                return;
                                            }
                                            else if (command_1 === "3" && consoleOutput.some(function (msg) { return typeof msg === 'string' ? msg.includes("ADMIN CONSOLE ACTIVATED") : false; })) {
                                                // Reset Didi
                                                setConsoleOutput(function (prev) { return __spreadArray(__spreadArray([], prev, true), ["> ".concat(command_1)], false); });
                                                hiddenMessageCache = [];
                                                setEasterEggActivated(false);
                                                // Add reset confirmation with animation
                                                var ResetMessage_1 = function () { return (react_1["default"].createElement(framer_motion_1.motion.div, { initial: { opacity: 0, scale: 0.9 }, animate: {
                                                        opacity: 1,
                                                        scale: 1,
                                                        backgroundColor: ["rgba(239, 68, 68, 0.1)", "rgba(239, 68, 68, 0.2)", "rgba(239, 68, 68, 0.1)"]
                                                    }, transition: {
                                                        duration: 0.5,
                                                        backgroundColor: { duration: 2, repeat: Infinity }
                                                    }, className: "font-mono text-red-400 p-2 border border-red-400/20 rounded my-1" },
                                                    react_1["default"].createElement("span", { className: "font-bold" }, "[DEBUG]"),
                                                    " Didi reset to initial state",
                                                    react_1["default"].createElement(framer_motion_1.motion.div, { className: "h-1 bg-red-400/30 mt-1 rounded-full overflow-hidden" },
                                                        react_1["default"].createElement(framer_motion_1.motion.div, { className: "h-full bg-red-400", initial: { width: 0 }, animate: { width: "100%" }, transition: { duration: 1 } })))); };
                                                setConsoleOutput(function (prev) { return __spreadArray(__spreadArray([], prev, true), [react_1["default"].createElement(ResetMessage_1, { key: "reset-".concat(Date.now()) })], false); });
                                                return;
                                            }
                                            else if (command_1 === "4" && consoleOutput.some(function (msg) { return typeof msg === 'string' ? msg.includes("ADMIN CONSOLE ACTIVATED") : false; })) {
                                                // Add hidden messages
                                                setConsoleOutput(function (prev) { return __spreadArray(__spreadArray([], prev, true), ["> ".concat(command_1)], false); });
                                                for (var i = 0; i < 5; i++) {
                                                    var msg = hiddenPhrases[Math.floor(Math.random() * hiddenPhrases.length)];
                                                    storeHiddenMessage(msg);
                                                }
                                                // Add message confirmation with animation
                                                var AddedMessagesMessage_1 = function () { return (react_1["default"].createElement(framer_motion_1.motion.div, { initial: { opacity: 0, y: -10 }, animate: {
                                                        opacity: 1,
                                                        y: 0
                                                    }, transition: { duration: 0.5 }, className: "font-mono text-green-400 p-2 bg-green-400/10 border-l-4 border-green-400 rounded-r my-1" },
                                                    react_1["default"].createElement("div", { className: "flex items-center" },
                                                        react_1["default"].createElement(framer_motion_1.motion.div, { animate: { rotate: 360 }, transition: { duration: 2, repeat: Infinity, ease: "linear" }, className: "mr-2" }, "\u2699\uFE0F"),
                                                        react_1["default"].createElement("span", { className: "font-bold" }, "[DEBUG]"),
                                                        " Added 5 random hidden messages"),
                                                    react_1["default"].createElement("div", { className: "flex mt-1 space-x-1" }, Array.from({ length: 5 }).map(function (_, i) { return (react_1["default"].createElement(framer_motion_1.motion.div, { key: i, initial: { scale: 0 }, animate: { scale: 1 }, transition: { delay: i * 0.1 }, className: "w-2 h-2 bg-green-400 rounded-full" })); })))); };
                                                setConsoleOutput(function (prev) { return __spreadArray(__spreadArray([], prev, true), [react_1["default"].createElement(AddedMessagesMessage_1, { key: "added-".concat(Date.now()) })], false); });
                                                return;
                                            }
                                            else if (command_1 === "5" && consoleOutput.some(function (msg) { return typeof msg === 'string' ? msg.includes("ADMIN CONSOLE ACTIVATED") : false; })) {
                                                // Activate Easter egg
                                                setConsoleOutput(function (prev) { return __spreadArray(__spreadArray([], prev, true), ["> ".concat(command_1)], false); });
                                                activateDidiEasterEgg();
                                                return;
                                            }
                                            else if (command_1 === "0" && consoleOutput.some(function (msg) { return typeof msg === 'string' ? msg.includes("ADMIN CONSOLE ACTIVATED") : false; })) {
                                                // Hide panel
                                                setConsoleOutput(function (prev) { return __spreadArray(__spreadArray([], prev, true), ["> ".concat(command_1)], false); });
                                                // Add panel hidden confirmation with animation
                                                var PanelHiddenMessage_1 = function () { return (react_1["default"].createElement(framer_motion_1.motion.div, { initial: { opacity: 1, height: "auto", y: 0 }, animate: {
                                                        opacity: 0,
                                                        height: 0,
                                                        y: 20
                                                    }, transition: { duration: 0.8 }, className: "font-mono text-gray-400 text-center overflow-hidden" },
                                                    react_1["default"].createElement("span", { className: "opacity-60" }, "[ADMIN]"),
                                                    " Debug panel hidden")); };
                                                setConsoleOutput(function (prev) { return __spreadArray(__spreadArray([], prev, true), [react_1["default"].createElement(PanelHiddenMessage_1, { key: "hidden-".concat(Date.now()) })], false); });
                                                return;
                                            }
                                            else if (command_1.toLowerCase() === EASTER_EGG_CODE.toLowerCase()) {
                                                // Easter egg activation
                                                setConsoleOutput(function (prev) { return __spreadArray(__spreadArray([], prev, true), ["> ".concat(command_1)], false); });
                                                activateDidiEasterEgg();
                                                return;
                                            }
                                            else if (command_1.toLowerCase() in commands_1.commandMap) {
                                                response_1 = commands_1.commandMap[command_1.toLowerCase()];
                                                setConsoleOutput(function (prev) { return __spreadArray(__spreadArray([], prev, true), ["> ".concat(command_1), response_1], false); });
                                            }
                                            else {
                                                // Check if it's one of the partial decrypt or other special commands
                                                var baseCommand = command_1.toLowerCase().split(' ')[0];
                                                if (baseCommand in commands_1.commandMap ||
                                                    ['decrypt-partial', 'scan-network', 'check-wallet-balance', 'view-roadmap',
                                                        'load-preview', 'check-whitelist', 'prepare-launch-sequence'].includes(baseCommand)) {
                                                    // It's a recognized command
                                                    response_1 = "Error: Command '".concat(command_1, "' not recognized. Type 'help' for available commands.");
                                                    setConsoleOutput(function (prev) { return __spreadArray(__spreadArray([], prev, true), ["> ".concat(command_1), response_1], false); });
                                                }
                                                else {
                                                    // Not a recognized command - pass to AI handler
                                                    setConsoleOutput(function (prev) { return __spreadArray(__spreadArray([], prev, true), ["> ".concat(command_1)], false); });
                                                    // Get Didi's response with appropriate tone
                                                    var processingMessage_1 = "[Didi] ".concat(getRandomProcessingMessage());
                                                    // Add Didi's processing message
                                                    setConsoleOutput(function (prev) { return __spreadArray(__spreadArray([], prev, true), [processingMessage_1], false); });
                                                    // Clear duplicate processing message
                                                    setConsoleOutput(function (prev) { return prev.filter(function (msg) { return msg !== "[AI] Processing..."; }); });
                                                    // Reference to detect user scroll
                                                    var userHasScrolled_1 = false;
                                                    var detectUserScroll_1 = function () {
                                                        if (consoleOutputRef.current) {
                                                            userHasScrolled_1 = true;
                                                            // Remove the scroll listener after detecting user interaction
                                                            consoleOutputRef.current.removeEventListener('wheel', detectUserScroll_1);
                                                            consoleOutputRef.current.removeEventListener('touchmove', detectUserScroll_1);
                                                        }
                                                    };
                                                    // Add scroll detection
                                                    if (consoleOutputRef.current) {
                                                        consoleOutputRef.current.addEventListener('wheel', detectUserScroll_1);
                                                        consoleOutputRef.current.addEventListener('touchmove', detectUserScroll_1);
                                                    }
                                                    setTimeout(function () { return __awaiter(_this, void 0, void 0, function () {
                                                        var messages, aiResponse, didiResponse_1, hiddenChar, visibleText, insertPos, finalText_1, enhancedHelp_1, error_1;
                                                        return __generator(this, function (_a) {
                                                            switch (_a.label) {
                                                                case 0:
                                                                    _a.trys.push([0, 2, , 3]);
                                                                    // Remove event listeners
                                                                    if (consoleOutputRef.current) {
                                                                        consoleOutputRef.current.removeEventListener('wheel', detectUserScroll_1);
                                                                        consoleOutputRef.current.removeEventListener('touchmove', detectUserScroll_1);
                                                                    }
                                                                    // Remove the "Processing..." message
                                                                    setConsoleOutput(function (prev) { return prev.filter(function (msg) { return msg !== processingMessage_1; }); });
                                                                    messages = [
                                                                        {
                                                                            role: 'user',
                                                                            content: command_1
                                                                        }
                                                                    ];
                                                                    return [4 /*yield*/, ai_1.aiService.chat(messages, {
                                                                            context: 'trading' // Use trading context for terminal interface
                                                                        })];
                                                                case 1:
                                                                    aiResponse = _a.sent();
                                                                    didiResponse_1 = processDidiResponse(aiResponse.content);
                                                                    // Check if we got a structured response with hidden data
                                                                    if (typeof didiResponse_1 === 'object' && didiResponse_1.visible && didiResponse_1.hidden) {
                                                                        // Store hidden data in a session cache for the Easter egg
                                                                        storeHiddenMessage(didiResponse_1.hidden);
                                                                        // Only show the visible part with glitches
                                                                        // Mark hidden message with special tag and class if user has seen 5+ messages
                                                                        if (hiddenMessageCache.length >= 5) {
                                                                            hiddenChar = didiResponse_1.hidden.charAt(0);
                                                                            visibleText = didiResponse_1.visible;
                                                                            insertPos = Math.floor(Math.random() * (visibleText.length - 10)) + 5;
                                                                            finalText_1 = visibleText.substring(0, insertPos) +
                                                                                "<span class=\"didi-hidden-message\" data-message=\"".concat(didiResponse_1.hidden, "\">").concat(hiddenChar, "</span>") +
                                                                                visibleText.substring(insertPos + 1);
                                                                            // Set output with the HTML
                                                                            setConsoleOutput(function (prev) { return __spreadArray(__spreadArray([], prev, true), ["[Didi] ".concat(finalText_1)], false); });
                                                                        }
                                                                        else {
                                                                            // Normal output without hints
                                                                            setConsoleOutput(function (prev) { return __spreadArray(__spreadArray([], prev, true), ["[Didi] ".concat(didiResponse_1.visible)], false); });
                                                                        }
                                                                    }
                                                                    else {
                                                                        // If the easter egg is activated and help command is requested, add extra commands
                                                                        if (easterEggActivated &&
                                                                            command_1.toLowerCase() === 'help' &&
                                                                            typeof didiResponse_1 === 'string' &&
                                                                            didiResponse_1.toLowerCase().includes('available commands')) {
                                                                            enhancedHelp_1 = didiResponse_1 + "\n\nDidi's special commands: didi-status, didi-insights, didi-history";
                                                                            setConsoleOutput(function (prev) { return __spreadArray(__spreadArray([], prev, true), ["[Didi] ".concat(enhancedHelp_1)], false); });
                                                                        }
                                                                        else {
                                                                            // Simple text response
                                                                            setConsoleOutput(function (prev) { return __spreadArray(__spreadArray([], prev, true), ["[Didi] ".concat(didiResponse_1)], false); });
                                                                        }
                                                                    }
                                                                    // Only auto-scroll if user hasn't manually scrolled
                                                                    if (!userHasScrolled_1) {
                                                                        setTimeout(scrollConsoleToBottom_1, 10);
                                                                    }
                                                                    return [3 /*break*/, 3];
                                                                case 2:
                                                                    error_1 = _a.sent();
                                                                    console.error('Error getting AI response:', error_1);
                                                                    setConsoleOutput(function (prev) { return prev.filter(function (msg) { return msg !== processingMessage_1; }); });
                                                                    setConsoleOutput(function (prev) { return __spreadArray(__spreadArray([], prev, true), ["[Didi] Error. Processing capacity compromised. Not my fault."], false); });
                                                                    // Only auto-scroll if user hasn't manually scrolled
                                                                    if (!userHasScrolled_1) {
                                                                        setTimeout(scrollConsoleToBottom_1, 10);
                                                                    }
                                                                    return [3 /*break*/, 3];
                                                                case 3: return [2 /*return*/];
                                                            }
                                                        });
                                                    }); }, 500);
                                                }
                                            }
                                            // Notify parent component if callback provided
                                            if (onCommandExecuted && command_1.toLowerCase() in commands_1.commandMap) {
                                                onCommandExecuted(command_1, commands_1.commandMap[command_1.toLowerCase()]);
                                            }
                                            // Scroll only the console output element, not the window
                                            var scrollConsoleToBottom_1 = function () {
                                                if (consoleOutputRef.current) {
                                                    // Save current scroll position
                                                    var currentScrollTop = consoleOutputRef.current.scrollTop;
                                                    var currentScrollHeight = consoleOutputRef.current.scrollHeight;
                                                    var currentClientHeight = consoleOutputRef.current.clientHeight;
                                                    // Only auto-scroll if user was already at bottom (or close to it)
                                                    // This prevents fighting against user's manual scrolling
                                                    var isNearBottom = currentScrollTop + currentClientHeight >= currentScrollHeight - 50;
                                                    if (isNearBottom) {
                                                        consoleOutputRef.current.scrollTop = consoleOutputRef.current.scrollHeight;
                                                    }
                                                }
                                            };
                                            // Immediate scroll attempt
                                            scrollConsoleToBottom_1();
                                            // One delayed attempt is enough
                                            setTimeout(scrollConsoleToBottom_1, 50);
                                        }
                                    }, className: "bg-transparent border-none outline-none text-white/95 w-full font-mono text-sm terminal-input", placeholder: "", style: {
                                        color: 'rgba(255, 255, 255, 0.95)',
                                        caretColor: 'rgb(157, 78, 221)',
                                        textShadow: glitchActive ? '0 0 8px rgba(255, 50, 50, 0.8)' : '0 0 5px rgba(157, 78, 221, 0.6)',
                                        backgroundColor: 'rgba(20, 20, 30, 0.3)',
                                        transition: 'all 0.3s ease'
                                    }, autoComplete: "off", spellCheck: "false", autoFocus: true }))))),
                react_1["default"].createElement(framer_motion_1.motion.div, { className: "mt-5 pt-2 text-left relative", initial: { opacity: 0, y: 10 }, animate: {
                        opacity: 1,
                        y: 0,
                        boxShadow: [
                            '0 0 0px rgba(157, 78, 221, 0)',
                            '0 0 10px rgba(157, 78, 221, 0.3)',
                            '0 0 0px rgba(157, 78, 221, 0)'
                        ]
                    }, transition: {
                        delay: 1.2,
                        duration: 0.8,
                        boxShadow: {
                            duration: 3,
                            repeat: Infinity
                        }
                    } },
                    react_1["default"].createElement(framer_motion_1.motion.div, { className: "absolute inset-0 bg-gradient-to-b from-transparent via-mauve/10 to-transparent z-0 pointer-events-none", animate: {
                            y: ['-200%', '500%']
                        }, transition: {
                            duration: 8,
                            repeat: Infinity,
                            ease: "linear"
                        }, style: { height: '5px', opacity: 0.4 } }),
                    react_1["default"].createElement("div", { className: "w-full mt-6 mb-2" },
                        react_1["default"].createElement("button", { className: "mx-auto block bg-black py-2 px-6 rounded-md border-2 border-mauve-light/50 text-white text-sm font-bold flex items-center space-x-2 hover:bg-mauve/20 transition-colors", onClick: function () { return setCommandTrayOpen(!commandTrayOpen); } },
                            react_1["default"].createElement("span", { className: "text-cyan-400 text-base" }, commandTrayOpen ? '▲' : '▼'),
                            react_1["default"].createElement("span", null, commandTrayOpen ? 'HIDE COMMANDS' : 'SHOW COMMANDS')),
                        commandTrayOpen && (react_1["default"].createElement("div", { className: "mt-3 p-3 bg-black/80 border border-mauve/40 rounded-md max-h-[200px] overflow-y-auto" },
                            react_1["default"].createElement("div", { className: "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 md:gap-3" }, timeGatedCommands.slice(0, revealStage + 1).flat().map(function (cmd, index) { return (react_1["default"].createElement("div", { key: index, className: "text-mauve-light hover:text-white cursor-pointer text-xs flex items-center bg-black/40 px-2 py-1.5 rounded border border-mauve/20 hover:border-mauve/50 hover:bg-mauve/10 truncate transition-colors", onClick: function () {
                                    // Extract just the command part (remove the $ prefix)
                                    var command = cmd.trim().replace(/^\$\s*/, '');
                                    // Set the user input
                                    setUserInput(command);
                                    // Focus the input field
                                    if (inputRef.current) {
                                        inputRef.current.focus();
                                    }
                                    // Close the command tray after selection
                                    setCommandTrayOpen(false);
                                } },
                                react_1["default"].createElement("span", { className: "text-cyan-400 mr-1.5 text-[10px] flex-shrink-0" }, "\u2B22"),
                                react_1["default"].createElement("span", { className: "truncate" }, cmd))); }))))))))),
        terminalMinimized && (react_1["default"].createElement(framer_motion_1.motion.div, { key: "minimized-terminal", className: "bg-darkGrey-dark/80 border border-mauve/30 rounded-md p-2 font-mono text-xs cursor-pointer", initial: { opacity: 0, y: 20, height: "auto" }, animate: { opacity: 1, y: 0, height: "auto" }, exit: { opacity: 0, y: -20, height: 0 }, transition: { duration: 0.4, ease: "easeInOut" }, onClick: function () { return setTerminalMinimized(false); }, whileHover: { scale: 1.02, boxShadow: "0 0 15px rgba(157, 78, 221, 0.4)" } },
            react_1["default"].createElement("div", { className: "flex items-center justify-between" },
                react_1["default"].createElement("div", { className: "flex items-center" },
                    react_1["default"].createElement("div", { className: "flex mr-2" },
                        react_1["default"].createElement("div", { className: "w-2 h-2 rounded-full bg-red-500 mr-1" }),
                        react_1["default"].createElement("div", { className: "w-2 h-2 rounded-full bg-yellow-500 mr-1" }),
                        react_1["default"].createElement("div", { className: "w-2 h-2 rounded-full bg-green-500" })),
                    react_1["default"].createElement("span", { className: "text-mauve-light" }, "Terminal minimized")),
                react_1["default"].createElement(framer_motion_1.motion.span, { className: "text-white/50", animate: { opacity: [0.5, 1, 0.5] }, transition: { repeat: Infinity, duration: 1.5 } }, "Click to restore")))),
        terminalExitComplete && showContractReveal && (react_1["default"].createElement(framer_motion_1.motion.div, { key: "contract-reveal", className: "mt-8 max-w-lg w-full bg-darkGrey-dark/90 border border-mauve/50 rounded-md p-6 font-mono", initial: {
                opacity: 0,
                scale: 0.9,
                filter: "blur(10px) brightness(2)",
                y: 30
            }, animate: {
                opacity: 1,
                scale: 1,
                filter: "blur(0px) brightness(1)",
                y: 0
            }, transition: {
                duration: 0.8,
                delay: 0.2,
                ease: [0.19, 1.0, 0.22, 1.0]
            } },
            react_1["default"].createElement(framer_motion_1.motion.div, { className: "text-center", initial: { opacity: 0 }, animate: { opacity: 1 }, transition: { delay: 0.8, duration: 0.5 } },
                react_1["default"].createElement("h2", { className: "text-mauve-light text-2xl font-bold mb-4 font-orbitron" }, "DECRYPTION COMPLETE"),
                react_1["default"].createElement("div", { className: "mb-6 flex flex-col items-center" },
                    react_1["default"].createElement("div", { className: "text-white/70 mb-2" }, "Contract Address:"),
                    react_1["default"].createElement(framer_motion_1.motion.div, { className: "bg-black/30 px-4 py-2 rounded-md text-green-400 font-mono font-bold tracking-wider", whileHover: { scale: 1.05, boxShadow: "0 0 15px rgba(157, 78, 221, 0.6)" }, animate: {
                            boxShadow: [
                                "0 0 5px rgba(157, 78, 221, 0.3)",
                                "0 0 20px rgba(157, 78, 221, 0.6)",
                                "0 0 5px rgba(157, 78, 221, 0.3)"
                            ]
                        }, transition: { duration: 2, repeat: Infinity }, onClick: function () {
                            // Copy to clipboard
                            navigator.clipboard.writeText(window.contractAddress || '');
                            alert("Contract address copied to clipboard!");
                        }, style: { cursor: "copy" } }, window.contractAddress || config.CONTRACT_ADDRESS)),
                react_1["default"].createElement("p", { className: "text-white/70 mb-6" }, "Congratulations! You now have access to the DegenDuel platform."),
                react_1["default"].createElement("div", { className: "flex justify-center" },
                    react_1["default"].createElement(framer_motion_1.motion.a, { href: "#", className: "bg-mauve/80 hover:bg-mauve text-white font-bold py-2 px-6 rounded", whileHover: { scale: 1.05 }, whileTap: { scale: 0.95 } }, "ENTER PLATFORM")))))));
}
exports.Terminal = Terminal;
// Also export as default for compatibility
exports["default"] = Terminal;
