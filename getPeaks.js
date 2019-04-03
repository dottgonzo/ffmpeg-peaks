Object.defineProperty(exports, "__esModule", { value: true });
class GetPeaks {
    constructor(splitChannels, length, step, totalSamples) {
        this.length = length;
        this.totalSamples = totalSamples;
        this.splitChannels = splitChannels;
        this.sampleStep = step;
        this.mergedPeaks = [];
    }
    update(buffers) {
        const sampleSize = this.totalSamples / this.length;
        const channels = buffers.length;
        if (this.lastMax === undefined) {
            this.lastMax = Array(channels).fill(0);
            this.lastMin = Array(channels).fill(0);
            this.indexI = Array(channels).fill(0);
            this.indexJ = Array(channels).fill(0);
            this.indexJJOverflow = Array(channels).fill(0);
            this.splitPeaks = [];
            for (let i = 0; i < channels; i++)
                this.splitPeaks[i] = [];
        }
        for (let c = 0; c < channels; c++) {
            const peaks = this.splitPeaks[c];
            const chan = buffers[c];
            let i;
            for (i = this.indexI[c]; i < this.length; i++) {
                const start = Math.max(~~(i * sampleSize), this.indexJ[c]);
                const end = ~~((i + 1) * sampleSize);
                let min = this.lastMin[c];
                let max = this.lastMax[c];
                let broken = false;
                let jj;
                for (let j = start; j < end; j += this.sampleStep) {
                    jj = j - this.indexJ[c] + this.indexJJOverflow[c];
                    if (jj > chan.length - 1) {
                        this.indexI[c] = i;
                        this.indexJJOverflow[c] = jj - (chan.length - 1) - 1;
                        this.indexJ[c] = j;
                        this.lastMax[c] = max;
                        this.lastMin[c] = min;
                        broken = true;
                        break;
                    }
                    const value = chan[jj];
                    if (value > max) {
                        max = value;
                    }
                    if (value < min) {
                        min = value;
                    }
                }
                if (broken)
                    break;
                else {
                    this.lastMax[c] = 0;
                    this.lastMin[c] = 0;
                }
                peaks[2 * i] = max;
                peaks[2 * i + 1] = min;
                if (c === 0 || max > this.mergedPeaks[2 * i]) {
                    this.mergedPeaks[2 * i] = max;
                }
                if (c === 0 || min < this.mergedPeaks[2 * i + 1]) {
                    this.mergedPeaks[2 * i + 1] = min;
                }
            }
            this.indexI[c] = i;
        }
    }
    get() {
        return this.splitChannels ? this.splitPeaks : this.mergedPeaks;
    }
}
exports.GetPeaks = GetPeaks;
//# sourceMappingURL=getPeaks.js.map