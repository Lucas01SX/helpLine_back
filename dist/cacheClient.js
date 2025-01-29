"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cache_manager_1 = __importDefault(require("cache-manager"));
const cache_manager_memory_store_1 = __importDefault(require("cache-manager-memory-store"));
const cache = cache_manager_1.default.caching({
    store: cache_manager_memory_store_1.default,
    max: 100,
    ttl: 3600
});
exports.default = cache;
