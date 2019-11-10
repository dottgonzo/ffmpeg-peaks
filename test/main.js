var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const fs = require("fs-extra");
const index_1 = require("../index");
const audioFile = __dirname + '/audio.ogg';
const videoFile = __dirname + '/video.mp4';
const dateRef = Date.now();
const outputOfPeaks1 = '/tmp/testpeaks1_' + dateRef + '.json';
const outputOfPeaks2 = '/tmp/testpeaks2_' + dateRef + '.json';
describe('testing peaks', () => {
    it('testing peaks on audio file', () => __awaiter(this, void 0, void 0, function* () {
        try {
            const peaks = yield index_1.getPeaks(audioFile);
            chai_1.expect(peaks).to.be.an('Array');
        }
        catch (err) {
            throw err;
        }
    }));
    it('testing peaks on audio file and save it as json', () => __awaiter(this, void 0, void 0, function* () {
        try {
            const peaks = yield index_1.getPeaks(audioFile, { outputFile: outputOfPeaks1 });
            const existsJsonFile = yield fs.pathExists(outputOfPeaks1);
            chai_1.expect(peaks).to.be.an('Array');
            chai_1.expect(existsJsonFile).to.be.eq(true);
        }
        catch (err) {
            throw err;
        }
    }));
    it('testing peaks on video file', () => __awaiter(this, void 0, void 0, function* () {
        try {
            const peaks = yield index_1.getPeaks(videoFile);
            chai_1.expect(peaks).to.be.an('Array');
        }
        catch (err) {
            throw err;
        }
    }));
    it('testing peaks on video file and save it as json', () => __awaiter(this, void 0, void 0, function* () {
        try {
            const peaks = yield index_1.getPeaks(videoFile, { outputFile: outputOfPeaks2 });
            const existsJsonFile = yield fs.pathExists(outputOfPeaks2);
            chai_1.expect(peaks).to.be.an('Array');
            chai_1.expect(existsJsonFile).to.be.eq(true);
        }
        catch (err) {
            throw err;
        }
    }));
});
//# sourceMappingURL=main.js.map