import { spawn } from 'child_process'
import * as fs from 'fs'
import * as path from 'path'
import * as promiseProbe from 'promise-probe'
import * as rimraf from 'rimraf'

import { GetPeaks } from './getPeaks'

class AudioPeaks {
  init: boolean = false
  probe: promiseProbe.IFfprobe
  oddByte = null
  sc = 0
  opts: {
    numOfChannels: number
    sampleRate: number
    maxValue: number
    minValue: number
    width: number
    precision: number
  }
  sourceFilePath: string
  peaks: GetPeaks

  constructor(probe?: promiseProbe.IFfprobe) {
    if (probe) {
      this.initWithProbe(probe)
    }
  }

  initWithProbe(probe: promiseProbe.IFfprobe) {
    this.probe = probe
    this.opts = {
      numOfChannels: this.probe.audio.channels,
      sampleRate: parseInt(this.probe.audio.sample_rate),
      maxValue: 1.0,
      minValue: -1.0,
      width: 1640,
      precision: 1
    }
    this.init = true
  }

  async initializeByFile(sourcePath: string) {
    try {
      const probe = await promiseProbe.ffprobe(sourcePath)
      if (!probe.audio) throw new Error('no audio for this file ' + sourcePath)
      this.initWithProbe(probe)
    } catch (err) {
      throw err
    }
  }

  /*
   * Extracts peaks from an audio file.
   * Writes a JSON file if an output path was specified.
   * @param {String} sourcePath          - Source audio file path.
   * @param {String|Function} outputPath - Output audio file path or Callback fn.
   * @param {Function|Undefined} cb                - Callback fn
   */
  getPeaks(sourcePath: string, outputFile?: string): Promise<string[]> {
    return new Promise((resolve, reject) => {
      const that = this
      if (typeof sourcePath !== 'string') return reject(new Error('sourcePath param is not valid'))

      const dateNow = Date.now()
      const oggFile = '/tmp/ff_' + dateNow + '.ogg'

      fs.access(sourcePath, err => {
        if (err) return reject(new Error(`File ${sourcePath} not found`))

        if (!that.probe.audio) return resolve([])

        function extract(p: string, removeSource?: boolean) {
          that.sourceFilePath = p
          that.extractPeaks((err, peaks) => {
            if (err) return reject(err)
            if (!outputFile) {
              if (!removeSource) return resolve(peaks)
              fs.unlink(p, err2 => {
                if (err) return reject(err)
                resolve(peaks)
              })
            } else {
              let jsonPeaks
              try {
                jsonPeaks = JSON.stringify(peaks)
              } catch (err) {
                return reject(err)
              }
              fs.access(outputFile, err => {
                if (err) {
                  fs.writeFile(outputFile, jsonPeaks, err => {
                    if (err) return reject(err)
                    fs.unlink(oggFile, err2 => {
                      if (err) return reject(err)
                      resolve(peaks)
                    })
                  })
                } else {
                  fs.unlink(outputFile, err => {
                    if (err) return reject(err)
                    fs.writeFile(outputFile, jsonPeaks, err => {
                      if (err) return reject(err)
                      fs.unlink(oggFile, err2 => {
                        if (err) return reject(err)
                        resolve(peaks)
                      })
                    })
                  })
                }
              })
            }
          })
        }

        if (that.probe.format.format_name !== 'ogg') {
          const ffmpegExtractAudio = spawn(
            'ffmpeg',
            ['-i', sourcePath, '-vn', '-acodec', 'libvorbis', '-y', '-f', 'ogg', oggFile],
            {
              stdio: 'ignore',
              shell: true
            }
          )
          ffmpegExtractAudio.on('exit', (code, signal) => {
            if (code !== 0) return reject('convert to ogg failed')
            extract(oggFile, true)
          })
          ffmpegExtractAudio.on('error', (code, signal) => {
            reject(code)
          })
        } else {
          extract(sourcePath)
        }
      })
    })
  }

  /*
   * Extracts data peaks from an audio file using ffmpeg.
   * @param {Function} cb Callback fn
   */
  extractPeaks(cb: (err: Error, result?: any) => void) {
    this.convertFile((err, rawfilepath) => {
      if (err) return cb(err)

      fs.stat(rawfilepath, (err, stats) => {
        if (err) return cb(err)

        const totalSamples = ~~(stats.size / 2 / this.opts.numOfChannels)
        this.peaks = new GetPeaks(this.opts.numOfChannels >= 2, this.opts.width, this.opts.precision, totalSamples)

        const readable = fs.createReadStream(rawfilepath)
        readable.on('data', this.onChunkRead.bind(this))
        readable.on('error', cb)
        readable.on('end', () => {
          rimraf(path.dirname(rawfilepath), err => {
            if (err) return cb(err)
            cb(null, this.peaks.get())
          })
        })
      })
    })
  }

  onChunkRead(chunk) {
    let i = 0
    let value
    const samples = []

    for (let ii = 0; ii < this.opts.numOfChannels; ii++) samples[ii] = []

    if (this.oddByte !== null) {
      value = ((chunk.readInt8(i++, true) << 8) | this.oddByte) / 32768.0
      samples[this.sc].push(value)
      this.sc = (this.sc + 1) % this.opts.numOfChannels
    }

    for (; i + 1 < chunk.length; i += 2) {
      value = chunk.readInt16LE(i, true) / 32768.0
      samples[this.sc].push(value)
      this.sc = (this.sc + 1) % this.opts.numOfChannels
    }
    this.oddByte = i < chunk.length ? chunk.readUInt8(i, true) : null
    this.peaks.update(samples)
  }

  convertFile(cb) {
    fs.mkdtemp('/tmp/ffpeaks-', (err, tmpPath) => {
      if (err) return cb(err)

      const rawfilepath = path.join(tmpPath, 'audio.raw')
      const ffmpeg = spawn('ffmpeg', [
        '-v',
        'error',
        '-i',
        this.sourceFilePath,
        '-f',
        's16le',
        '-ac',
        this.opts.numOfChannels.toString(),
        '-acodec',
        'pcm_s16le',
        '-ar',
        this.opts.sampleRate.toString(),
        '-y',
        rawfilepath
      ])

      ffmpeg.stdout.on('end', () => cb(null, rawfilepath))
      ffmpeg.on('error', err => {
        console.log('ffpeakserr', err)

        cb(err)
      })
    })
  }
}

export async function getPeaks(
  sourcePath: string,
  opts?: { outputFile?: string; probe?: promiseProbe.IFfprobe }
): Promise<string[]> {
  if (!sourcePath) throw new Error('no sourcePath specified')
  let ff: AudioPeaks
  try {
    if (opts && opts.probe) {
      ff = new AudioPeaks(opts.probe)
    } else {
      ff = new AudioPeaks()
      await ff.initializeByFile(sourcePath)
    }
    const thePeaks = await ff.getPeaks(sourcePath, opts && opts.outputFile ? opts.outputFile : null)
    return thePeaks
  } catch (err) {
    throw err
  }
}
