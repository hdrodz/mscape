"use strict";

//
// ui.js -- handle UI events
//

/**
 * @type {HTMLInputElement}
 */
var fileInput = undefined;
/**
 * @type {HTMLAudioElement}
 */
var player = undefined;
/**
 * @type {HTMLAudioElement}
 */
var seekbar = undefined;
/**
 * @type {HTMLAudioElement}
 */
var currentTimeLabel = undefined;
/**
 * @type {HTMLAudioElement}
 */
var totalTimeLabel = undefined;

var updatePlayerPosInterval = undefined;

var fileLoaded = false;

function time_string(time) {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    // grumble
    if (seconds < 10) {
        return `${minutes}:0${seconds}`;
    } else {
        return `${minutes}:${seconds}`;
    }
}

window.addEventListener('load', () => {
    fileInput = document.getElementById("file-input");
    player = document.getElementById("player");
    seekbar = document.getElementById("player-seekbar");
    currentTimeLabel = document.getElementById("current-time-label");
    totalTimeLabel = document.getElementById("total-time-label");
    
    player.oncanplay = () => {
        seekbar.max = player.duration;
        totalTimeLabel.innerText = time_string(player.duration);
        update_player_pos();
    }
    seekbar.min = 0;
});

function load_audio(file) {
    // Prevent polluting the URL namespace
    if (player.currentSrc) {
        window.URL.revokeObjectURL(player.src);
    }
    // Load the file
    let srcurl = window.URL.createObjectURL(file);
    player.src = srcurl;
    player.load();
    fileLoaded = true;
    // Load ID3 tags
    jsmediatags.read(file, {
        onSuccess: (result) => {
            document.getElementById("artist-label").innerText = result.tags.artist;
            document.getElementById("song-label").innerText = result.tags.title;
            document.getElementById("album-label").innerText = result.tags.album;
        }
    });
    // Update the UI
    document.getElementById("play-button").removeAttribute("disabled");
    seekbar.max = player.duration;
    seekbar.value = 0;
    // Setup UI update callbacks
    if (updatePlayerPosInterval) {
        window.clearInterval(updatePlayerPosInterval);
    }
    updatePlayerPosInterval = window.setInterval(update_player_pos, 1000);
}

function play_pause() {
    if(!player || !fileLoaded) return;
    const icon = document.getElementById("play-pause-icon");
    if (player.paused) {
        player.play();
        icon.classList.remove("fa-play");
        icon.classList.add("fa-pause");
    } else {
        player.pause();
        icon.classList.remove("fa-pause");
        icon.classList.add("fa-play");
    }
}

function pick_audio() {
    if (!fileInput) return;
    fileInput.click();
}

function update_player_pos() {
    seekbar.value = player.currentTime;
    currentTimeLabel.innerText = time_string(player.currentTime);
}
