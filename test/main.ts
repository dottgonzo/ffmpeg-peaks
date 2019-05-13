import { expect } from 'chai'
import * as fs from 'fs-extra'

import { getPeaks } from '../index'

const audioFile = __dirname + '/audio.ogg'
const videoFile = __dirname + '/video.mp4'

const dateRef = Date.now()
const outputOfPeaks1 = '/tmp/testpeaks1_' + dateRef + '.json'
const outputOfPeaks2 = '/tmp/testpeaks2_' + dateRef + '.json'

describe('testing peaks', () => {

  it('testing peaks on audio file', async () => {
    try {
      const peaks = await getPeaks(audioFile)
      expect(peaks).to.be.an('Array')
    } catch (err) {
      throw err
    }

  })
  it('testing peaks on audio file and save it as json', async () => {
    try {
      const peaks = await getPeaks(audioFile, {outputFile: outputOfPeaks1})
      const existsJsonFile = await fs.pathExists(outputOfPeaks1)
      expect(peaks).to.be.an('Array')
      expect(existsJsonFile).to.be.eq(true)
    } catch (err) {
      throw err
    }

  })

  it('testing peaks on video file', async () => {
    try {
      const peaks = await getPeaks(videoFile)
      expect(peaks).to.be.an('Array')
    } catch (err) {
      throw err
    }

  })
  it('testing peaks on video file and save it as json', async () => {
    try {
      const peaks = await getPeaks(videoFile, {outputFile: outputOfPeaks2})
      const existsJsonFile = await fs.pathExists(outputOfPeaks2)
      expect(peaks).to.be.an('Array')
      expect(existsJsonFile).to.be.eq(true)
    } catch (err) {
      throw err
    }

  })
})