"use strict";

//
// audio.js -- Utilities for interacting with WebAudio.
//

/**
 * A WebAudioSession provides an interface to some of the commonly-used
 * WebAudio features used in the application.
 */
class WebAudioSession {
    /**
     * Initializes a WebAudio session from an HTML5 &lt;audio&gt; element.
     * @param {HtmlElement} audioElement The &lt;audio&gt; element that is the
     *                                   source of the audio stream.
     * @param {Number} fftSize The size of the Fast Fourier Transform to use.
     */
    constructor(audioElement, fftSize) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.context = new AudioContext();

        // Create our nodes and set up our processing DAG
        // We want our DAG to look like this:
        // [Audio Source] -> [AnalyserNode] -> [Audio Output]
        const audioSource = this.context.createMediaElementSource(audioElement);
        this.analyser = this.context.createAnalyser();

        audioSource.connect(this.analyser);
        this.analyser.connect(this.context.destination);

        // Finally, set up the Fast Fourier Transform Parameters
        this.analyser.fftSize = fftSize;
        this.buffer = new Uint8Array(this.analyser.frequencyBinCount);
    }

    /**
     * @returns {Uint8Array} The array that is used to store the
     *                       frequency-domain data captured from WebAudio.
     *                       The data therein is updated on every call to
     *                       update().
     */
    getFrequencyBuffer() {
        return this.buffer;
    }

    /**
     * Fetches the frequency-domain data from WebAudio and populates it into
     * the buffer.
     */
    update() {
        this.analyser.getByteFrequencyData(this.buffer);
    }

    /**
     * Get the strength of the frequency per the FFT data.
     * @param {Number} f The frequency to get the strength for.
     */
    getFrequencyStrength(f) {
        // The frequency F(n) at bin n is calculated as F(n) = n * Fs / N,
        // where Fs is the sample rate and N is the size of the FFT. Therefore,
        // going from a frequency to a bin is as simple as isolating for n:
        //     n = floor(F(n) * N / Fs)
        return this.analyser[Math.floor(f * this.analyser.fftSize / this.context.sampleRate)];
    }    

    /**
     * Get the lowest strength frequency among data
     * @returns {Double} A double representing the minimum power value in 
     *                  the scaling range of FFT data
     */
    getMinDecibalStrength(){
        return this.analyser.getMinDecibalStrength;
    }

    /**
     * Get the highest strength frequency among data
     * @returns {Double} A double representing the maximum power value in 
     *                  the scaling range of FFT data
     */
    getMaxDecibalStrength(){
        return this.analyser.getMaxDecibalStrength;
    }
}