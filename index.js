Object.defineProperty(exports, "__esModule", { value: true });
const child_process_1 = require("child_process");
const fs = require("fs");
const path = require("path");
const rimraf = require("rimraf");
const getPeaks_1 = require("./getPeaks");
class AudioPeaks {
    constructor(opts) {
        this.oddByte = null;
        this.sc = 0;
        this.opts = Object.assign({
            numOfChannels: 2,
            sampleRate: 44100,
            maxValue: 1.0,
            minValue: -1.0,
            width: 1640,
            precision: 1
        }, opts || {});
    }
    getPeaks(sourcePath, outputPath) {
        return new Promise((resolve, reject) => {
            if (typeof sourcePath !== 'string')
                return reject(new Error('sourcePath param is not valid'));
            fs.access(sourcePath, (err) => {
                if (err)
                    return reject(new Error(`File ${sourcePath} not found`));
                this.sourceFilePath = sourcePath;
                this.extractPeaks((err, peaks) => {
                    if (err)
                        return reject(err);
                    if (!outputPath)
                        return resolve(peaks);
                    let jsonPeaks;
                    try {
                        jsonPeaks = JSON.stringify(peaks);
                    }
                    catch (err) {
                        return reject(err);
                    }
                    fs.writeFile(outputPath, jsonPeaks, (err) => {
                        if (err)
                            return reject(err);
                        resolve(peaks);
                    });
                });
            });
        });
    }
    extractPeaks(cb) {
        this.convertFile((err, rawfilepath) => {
            if (err)
                return cb(err);
            fs.stat(rawfilepath, (err, stats) => {
                if (err)
                    return cb(err);
                const totalSamples = ~~((stats.size / 2) / this.opts.numOfChannels);
                this.peaks = new getPeaks_1.GetPeaks(this.opts.numOfChannels >= 2, this.opts.width, this.opts.precision, totalSamples);
                const readable = fs.createReadStream(rawfilepath);
                readable.on('data', this.onChunkRead.bind(this));
                readable.on('error', cb);
                readable.on('end', () => {
                    rimraf(path.dirname(rawfilepath), (err) => {
                        if (err)
                            return cb(err);
                        cb(null, this.peaks.get());
                    });
                });
            });
        });
    }
    onChunkRead(chunk) {
        let i = 0;
        let value;
        const samples = [];
        for (let ii = 0; ii < this.opts.numOfChannels; ii++)
            samples[ii] = [];
        if (this.oddByte !== null) {
            value = ((chunk.readInt8(i++, true) << 8) | this.oddByte) / 32768.0;
            samples[this.sc].push(value);
            this.sc = (this.sc + 1) % this.opts.numOfChannels;
        }
        for (; i + 1 < chunk.length; i += 2) {
            value = chunk.readInt16LE(i, true) / 32768.0;
            samples[this.sc].push(value);
            this.sc = (this.sc + 1) % this.opts.numOfChannels;
        }
        this.oddByte = (i < chunk.length ? chunk.readUInt8(i, true) : null);
        this.peaks.update(samples);
    }
    convertFile(cb) {
        fs.mkdtemp('/tmp/ffpeaks-', (err, tmpPath) => {
            if (err)
                return cb(err);
            let errorMsg = '';
            const rawfilepath = path.join(tmpPath, 'audio.raw');
            const ffmpeg = child_process_1.spawn('ffmpeg', [
                '-v', 'error',
                '-i', this.sourceFilePath,
                '-f', 's16le',
                '-ac', this.opts.numOfChannels.toString(),
                '-acodec', 'pcm_s16le',
                '-ar', this.opts.sampleRate.toString(),
                '-y', rawfilepath
            ]);
            ffmpeg.stdout.on('end', () => cb(null, rawfilepath));
            ffmpeg.stderr.on('data', (err) => errorMsg += err.toString());
            ffmpeg.stderr.on('end', () => {
                if (errorMsg)
                    cb(new Error(errorMsg));
            });
        });
    }
}
exports.AudioPeaks = AudioPeaks;
//# sourceMappingURL=index.js.map