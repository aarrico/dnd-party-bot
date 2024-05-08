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
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
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
var _this = this;
var PrismaClient = require("@prisma/client").PrismaClient;
var prisma = new PrismaClient();
// const createdSessions = [];
// const createdUsers = [];
//can store this as enum in DB if needed.***
var roles = {
    TANK: "tank",
    SUPPORT: "support",
    RANGEDPS: "range dps",
    MELEEDPS: "melee dps",
    FACE: "face",
    CONTROL: "control",
    DM: "dungeon master",
};
var sessions = [
    {
        sessionMessageId: "1",
        sessionName: "Session 1",
        sessionDate: new Date(),
    },
    {
        sessionMessageId: "2",
        sessionName: "Session 2",
        sessionDate: new Date(),
    },
    {
        sessionMessageId: "3",
        sessionName: "Session 3",
        sessionDate: new Date(),
    },
    {
        sessionMessageId: "4",
        sessionName: "Session 4",
        sessionDate: new Date(),
    },
];
var users = [
    {
        username: "user 1",
        userChannelId: "12313213",
    },
    {
        username: "user 2",
        userChannelId: "234234234",
    },
    {
        username: "user 3",
        userChannelId: "345345345",
    },
    {
        username: "user 4",
        userChannelId: "456456456",
    },
    {
        username: "user 5",
        userChannelId: "567567567",
    },
    {
        username: "user 6",
        userChannelId: "678678678",
    },
    {
        username: "user 7",
        userChannelId: "789789789",
    },
    {
        username: "user 8",
        userChannelId: "890890890",
    },
    {
        username: "user 9",
        userChannelId: "901901901",
    },
    {
        username: "user 10",
        userChannelId: "012012012",
    },
    {
        username: "DM 1",
        userChannelId: "000000001",
    },
    {
        username: "DM 2",
        userChannelId: "000000002",
    },
    {
        username: "DM 3",
        userChannelId: "000000003",
    },
];
function createSessions() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, prisma.session.createMany({
                        data: sessions,
                    })];
                case 1:
                    _a.sent();
                    //returns all record on that table.
                    return [2 /*return*/, prisma.session.findMany()];
            }
        });
    });
}
function createUsers() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, prisma.user.createMany({
                        data: users,
                    })];
                case 1:
                    _a.sent();
                    //returns all record on that table.
                    return [2 /*return*/, prisma.user.findMany()];
            }
        });
    });
}
function createSessionUsers() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/];
        });
    });
}
function createSessionUser(sessionID, userID, role) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, prisma.sessionUser.create({
                        data: {
                            sessionId: sessionID,
                            userId: userID,
                            role: role,
                        },
                    })];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var sessionData, userData;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, createSessions()];
                case 1:
                    sessionData = _a.sent();
                    console.log(sessionData);
                    return [4 /*yield*/, createUsers()];
                case 2:
                    userData = _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
main()
    .then(function () { return __awaiter(_this, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, prisma.$disconnect()];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); })
    .catch(function (e) { return __awaiter(_this, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                console.error(e);
                return [4 /*yield*/, prisma.$disconnect()];
            case 1:
                _a.sent();
                process.exit(1);
                return [2 /*return*/];
        }
    });
}); });
