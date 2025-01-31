"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const UserController_1 = require("../controllers/UserController");
const userController = new UserController_1.UserController();
const router = express_1.default.Router();
// router.get('/gerais', (req, res) => userController.consultaDash(req, res));
exports.default = router;
