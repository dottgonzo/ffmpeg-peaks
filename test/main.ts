import { expect } from 'chai'

import { getPeaks } from '../index'

const audioFile = __dirname + '/audio.ogg'
const videoFile = __dirname + '/video.mp4'

const dateRef = Date.now()
const outputOfPeaks1 = '/tmp/testpeaks1_' + dateRef
const outputOfPeaks2 = '/tmp/testpeaks2_' + dateRef

describe('testing peaks', () => {

  it('testing peaks on audio file', async () => {
    try {
      const peaks = await getPeaks(audioFile, outputOfPeaks1)
      expect(peaks).to.be.an('Array')
    } catch (err) {
      throw err
    }

  })

  it('testing peaks on video file', async () => {
    try {
      const peaks = await getPeaks(videoFile, outputOfPeaks2)
      expect(peaks).to.be.an('Array')
    } catch (err) {
      throw err
    }

  })

})