//var ipcRenderer = require('electron').ipcRenderer;
const { dialog, ipcRenderer } = require('electron')
var path = require('path')
var stringMath = require('string-math');
var url = require('url');
const fs = require('fs');



window.playlist = []
window.currentPlaylistIndex = 0
window.PlaylistLooping = true

var sidenavTransition = 0.5
var isNavOpen = false


window.videoelement = null

window.currentSpeed = 1
var currentSpeedIndex = 5
var playbackSpeeds = [0.1, 0.25, 0.5, 0.75, 1, 1.5, 2, 3, 4]

var waitToHideControls = 2500
var mosueMoveTimer = null
var isMouseMoving = false
var isMouseOverControls = false
var isShown = true

var Transition = 0.5
var currentVideoInfos = {}

window.TestEvent = async function (data) {
    const result = await ipcRenderer.invoke('TestEvent', data);
    console.log('TestEvent return ', result);
}

window.convertFile = async function (inputFile, startTime, endTime, outputFile) {
    console.log('convertFile Event');

    // var data = { inputFile: inputFile, startTime: 2, duration: 10, outputFile: outputFile, fps: 60, format: 'mov', quality: '50%' }
    var data = { inputFile: inputFile, startTime: 2, outputFile: outputFile }
    console.log('Input File = ', inputFile);
    console.log('Start Time = ', startTime);
    console.log('End Time = ', endTime);
    console.log('Output File = ', outputFile);

    const result = await ipcRenderer.invoke('convertFile', data);
    console.log('convertFile Event return ', result);
}

window.TestCalc = function (params) {
    console.log(calcVideoFileSize(calcBitRate(1920, 1080, 8, 24), 128, 10))
}


window.saveAs = async function (index) {

    window.convertFile(window.playlist[index], '00:00:03', '00:00:10', `${window.playlist[index]}-new.mp4`)
    //const result = await ipcRenderer.invoke('saveAs', window.playlist[index]);
    //console.log('saveAs return ', result);
}

ipcRenderer.on('TestEvent', function (event, data) {
    console.log('TestEvent ', data);
    document.getElementById('testFuncCall').innerText = `Button was pressed ${data} times`
});

document.addEventListener('drop', (event) => {
    event.preventDefault();
    event.stopPropagation();

    for (const f of event.dataTransfer.files) {
        // Using the path attribute to get absolute file path
        console.log('File Path of dragged files: ', f.path)

        window.playlist.push(f.path)
        render()
    }
});

document.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.stopPropagation();
});

document.addEventListener('dragenter', (event) => {
    console.log('File is in the Drop Space');
});

document.addEventListener('dragleave', (event) => {
    console.log('File has left the Drop Space');
});

window.next = function () {
    window.currentPlaylistIndex++
    if (window.currentPlaylistIndex > window.playlist.length - 1 && window.PlaylistLooping) {
        currentPlaylistIndex = 0
        window.playvideo(window.playlist[window.currentPlaylistIndex])
        console.log("Play the first Video in playlist ", window.currentPlaylistIndex);
    } else if (window.currentPlaylistIndex <= window.playlist.length - 1) {
        window.playvideo(window.playlist[window.currentPlaylistIndex])
        console.log("Play the next Video ", window.currentPlaylistIndex);
    } else if (!window.PlaylistLooping) {
        console.log("No Playlist Looping ", window.currentPlaylistIndex);
    }
}

window.previous = function () {
    window.currentPlaylistIndex--
    if (window.currentPlaylistIndex < 0 && window.PlaylistLooping) {
        currentPlaylistIndex = window.playlist.length - 1
        window.playvideo(window.playlist[window.currentPlaylistIndex])
        console.log("Play the last Video in playlist", window.currentPlaylistIndex);
    } else if (window.currentPlaylistIndex >= 0) {
        window.playvideo(window.playlist[window.currentPlaylistIndex])
        console.log("Play the Video previous ", window.currentPlaylistIndex);
    } else if (!window.PlaylistLooping) {
        console.log("No Playlist Looping ", window.currentPlaylistIndex);
    }
}

window.LowerSpeed = function () {
    console.log("The Video has ended function");
    var SpeedToSet = 1
    if (currentSpeedIndex > 0) {
        currentSpeedIndex--
        SpeedToSet = playbackSpeeds[currentSpeedIndex]
    } else {
        SpeedToSet = playbackSpeeds[currentSpeedIndex]
    }

    window.videoelement.playbackRate = SpeedToSet
    window.videoelement.defaultPlaybackRate = SpeedToSet
    document.getElementById('currentSpeed').innerText = SpeedToSet
}

window.HigherSpeed = function () {
    console.log("The Video has ended function");

    var SpeedToSet = 1
    if (currentSpeedIndex < playbackSpeeds.length - 1) {
        currentSpeedIndex++
        SpeedToSet = playbackSpeeds[currentSpeedIndex]
    } else {
        SpeedToSet = playbackSpeeds[currentSpeedIndex]
    }

    window.videoelement.playbackRate = SpeedToSet
    window.videoelement.defaultPlaybackRate = SpeedToSet
    document.getElementById('currentSpeed').innerText = SpeedToSet
}

window.onVideoEnded = function () {
    console.log("The Video has ended function");
    window.next()
}

window.playvideo = async function (video) {
    console.log("Play video = ", video);
    window.videoelement.src = video
    window.videoelement.play
    currentVideoInfos = await window.getFileInfos()
    render()
}

window.playvideoid = async function (videoid) {
    console.log("Play video = ", videoid);
    window.currentPlaylistIndex = videoid
    window.videoelement.src = window.playlist[videoid]
    window.videoelement.play
    currentVideoInfos = await window.getFileInfos()
    render()
}

window.removevideoid = function (videoid) {
    console.log("window.playlist = ", window.playlist);
    console.log("remove video = ", videoid);
    window.playlist.splice(videoid, 1)
    if (videoid == window.currentPlaylistIndex) {
        window.next()
    }
    render()
}

window.clearPlaylist = function () {
    window.playlist = []
    render()
}

function render() {
    document.getElementById('playlist').innerHTML = ''
    if (window.playlist.length == 0) {
        document.getElementById('video-titel-name').innerText = 'Drag and Drop Files to Play'
        return
    }
    var FileName = path.basename(window.playlist[window.currentPlaylistIndex])

    document.getElementById('video-titel-name').innerText = FileName
    var i = 0
    window.playlist.forEach(element => {
        var h = ''
        if (i == window.currentPlaylistIndex) {
            h = 'activVideo'
        }
        document.getElementById('playlist').innerHTML += `
        <div class="row sidenavItem ${h} ">
            <div class="col-11 sidenavItemItem" onclick="window.playvideoid('${i}')">${path.basename(element)} </div>

            <div class="btn-group " role="group" aria-label="Basic example">
                <button type="button" data-mdb-ripple-color="dark" class="btn btn-outline-dark" onclick="window.playvideoid('${i}')">Play</button>
                <button type="button" data-mdb-ripple-color="dark" class="btn btn-outline-dark" onclick="window.saveAs('${i}')">Save As</button>
                <button type="button" data-mdb-ripple-color="dark" class="btn btn-outline-dark" onclick="window.removevideoid('${i}')">Remove from Playlist</button>
                <button type="button" data-mdb-ripple-color="dark" class="btn btn-outline-dark">Remove From Drive</button>
            </div>
        </div>
        `
        i++
    });
}

window.init = function () {
    window.videoelement = document.getElementsByTagName('video').videoplayer
    var PlayPauseBTN = document.getElementById('PlayPauseBTN')
    var timebar = document.getElementById('time')
    var controls = document.getElementById('controls')

    console.log('uuid', UUID())
    console.log('Document loaded ', document.getElementsByTagName('video').videoplayer);


    navigator.mediaSession.setActionHandler("previoustrack", function () {
        window.previous()
    });
    navigator.mediaSession.setActionHandler("nexttrack", function () {
        window.next()
    });

    window.changeVolume = function (element) {
        console.log(element.value);
        window.videoelement.volume = element.value / 100
    }
    document.ondblclick = function (params) {
        console.log('ondblclick');
        window.toggleFullscreen()
    }

    window.videoelement.onpause = function () {
        PlayPauseBTN.classList.add("fa-play");
        PlayPauseBTN.classList.remove("fa-pause");
        console.log(window.videoelement);
        console.log(window.videoelement.currentTime);
    };
    window.videoelement.onplay = async function () {
        PlayPauseBTN.classList.remove("fa-play");
        PlayPauseBTN.classList.add("fa-pause");
        console.log(window.videoelement);
        console.log(window.videoelement.currentTime);
    };
    window.videoelement.onerror = function (err) {
        console.log(err)
        //alert("Error! Something went wrong", err);
    };
    window.videoelement.ontimeupdate = function (time) {
        document.getElementById('currentTime').innerText = window.videoelement.currentTime.toFixed(1)
        document.getElementById('duration').innerText = window.videoelement.duration
        timebar.value = window.videoelement.currentTime * (timebar.max / window.videoelement.duration)
    };

    timebar.onchange = function (params) {
        window.videoelement.currentTime = timebar.value * (window.videoelement.duration / timebar.max)
    }

    document.onmousemove = function (params) {

        isMouseMoving = true
        clearInterval(mosueMoveTimer);
        if (!isShown) {
            window.showControls()
        } else if (!isMouseOverControls) {
            mosueMoveTimer = setInterval(function () {

                window.hideControls()
                clearInterval(mosueMoveTimer)
            }, waitToHideControls);
        }
    }

    controls.onmouseover = function (params) {
        clearInterval(mosueMoveTimer);
        isMouseOverControls = true
    }

    controls.onmouseleave = function (params) {
        isMouseOverControls = false
        mosueMoveTimer = setInterval(function () {
            window.hideControls()
        }, waitToHideControls);
    }

    window.showControls()

}

window.showControls = function (params) {
    console.log('Show controls');
    var controls = document.getElementById('controls')
    var videotitel = document.getElementById('video-titel')

    //Controls Style
    controls.style.display = "block";
    controls.style.transition = `all ${Transition}s`;
    controls.style.height = "100px";


    //Titel Style
    videotitel.style.transition = `all ${Transition}s`;
    videotitel.style.top = "0px";

    setTimeout(function () {
        isShown = true
        videotitel.style.transition = `all 0s`;
        controls.style.transition = "all 0s";


    }, Transition * 1000);
}

window.hideControls = function (params) {
    console.log('hide controls');
    var controls = document.getElementById('controls')
    var videotitel = document.getElementById('video-titel')

    //Controls Style
    controls.style.transition = `all ${Transition}s`;
    controls.style.height = "0";

    //Titel Style
    videotitel.style.transition = `all ${Transition}s`;
    videotitel.style.top = "-50px";

    setTimeout(function () {
        isShown = false
        videotitel.style.transition = `all 0s`;
        controls.style.transition = "all 0s";
        controls.style.display = "none";
    }, Transition * 1000);


}

window.clickOverlay = function (params) {

    console.log('Click Overlay')
    if (isNavOpen) {
        window.closeNav()
    } else {
        window.togglePlay()
    }
}

/* Function to open fullscreen mode */
var isFullscreen = false
window.toggleFullscreen = function () {
    const body = document.getElementById('body')
    //var body = document.getElementsByTagName('body').body

    if (isFullscreen) {
        isFullscreen = false
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        }
    } else {
        isFullscreen = true
        if (body.requestFullscreen) {
            body.requestFullscreen();
        } else if (body.webkitRequestFullscreen) { /* Safari */
            body.webkitRequestFullscreen();
        } else if (body.msRequestFullscreen) { /* IE11 */
            body.msRequestFullscreen();
        }
    }



}

window.startPIP = function (params) {
    window.videoelement.requestPictureInPicture()
        .catch(error => {
            // Error handling
            console.log(error);
        });
}

window.openNav = function () {
    isNavOpen = true
    document.getElementById("mySidenav").style.transition = `all ${sidenavTransition}s`;
    document.getElementById("mySidenav").style.width = "460px";
    setTimeout(function () {
        document.getElementById("mySidenav").style.transition = "all 0s";
    }, sidenavTransition * 1000);
    //
}

window.closeNav = function () {
    isNavOpen = false
    document.getElementById("mySidenav").style.transition = `all ${sidenavTransition}s`;
    document.getElementById("mySidenav").style.width = "0";
    setTimeout(function () {
        document.getElementById("mySidenav").style.transition = "all 0s";
    }, sidenavTransition * 1000);

}

window.togglePlay = function () {
    if (window.videoelement.paused) {
        window.videoelement.play();
    } else {
        window.videoelement.pause();
    }
}

window.getFileInfos = async function (params) {
    const result = await ipcRenderer.invoke('getFileInfos', window.playlist[window.currentPlaylistIndex]);
    console.log(result);
    return result
}

window.nextFrame = function (params) {
    window.videoelement.currentTime = window.videoelement.currentTime + calcSekPerFrame()
}

window.previousFrame = function (params) {
    window.videoelement.currentTime = window.videoelement.currentTime - calcSekPerFrame()
}

var canvas = document.createElement('canvas');
function getFrameImg(params) {
    canvas.width = currentVideoInfos.streams[0].width;
    canvas.height = currentVideoInfos.streams[0].height;
    var ctx = canvas.getContext('2d');
    ctx.drawImage(window.videoelement, 0, 0, canvas.width, canvas.height);
    const url = canvas.toDataURL('image/png', 1);
    const base64Data = url.replace(/^data:image\/png;base64,/, "");
    return base64Data

}

function calcSekPerFrame() {
    var fps = stringMath(currentVideoInfos.streams[0].r_frame_rate)
    var currentFrame = Math.round(fps * window.videoelement.currentTime);
    var frames = Math.round(fps * window.videoelement.duration);
    var sekPerFrame = window.videoelement.duration / frames
    console.log('FPS = ', fps);
    console.log('current Frame = ', currentFrame);
    console.log('frames = ', frames);
    console.log('sekPerFrame = ', sekPerFrame);
    console.log('sekPerFrame*fps = ', sekPerFrame * fps);
    return sekPerFrame
}

function getCurrentFrameIndex() {
    var fps = stringMath(currentVideoInfos.streams[0].r_frame_rate)
    var currentFrame = Math.round(fps * window.videoelement.currentTime);
    return currentFrame
}


window.skipTime = function (time, forward) {
    var currentTimeLocal = window.videoelement.currentTime
    console.log(time)
    console.log(currentTimeLocal)
    console.log(currentTimeLocal + time)
    if (forward) {
        window.videoelement.currentTime = currentTimeLocal + time
    } else {
        window.videoelement.currentTime = currentTimeLocal - time
    }
}

window.IncDecVolume = function (step, Incerase) {
    step = step / 100
    if (Incerase) {
        window.videoelement.volume = clamp(window.videoelement.volume + step, 0, 1)
        console.log(window.videoelement.volume);
    } else {
        window.videoelement.volume = clamp(window.videoelement.volume - step, 0, 1)
        console.log(window.videoelement.volume);
    }
    document.getElementById('volume').value = window.videoelement.volume * 100
}


window.exportVideo = async function () {
    const result = await ipcRenderer.invoke('OpenExportVideoWindow', window.playlist[window.currentPlaylistIndex]);
}

document.onkeydown = handle;
//document.onkeyup = document.onkeypress = handle;



function handle(e) {
    console.log(e.key);
    console.log(e.ctrlKey);
    console.log(e);

    switch (e.code) {
        case 'ArrowUp':
            if (e.ctrlKey) {
                window.HigherSpeed()
                //window.IncDecVolume(1, true)
            } else {
                window.IncDecVolume(10, true)
            }

            break;
        case 'ArrowDown':
            if (e.ctrlKey) {
                window.LowerSpeed()
                //window.IncDecVolume(1, false)
            } else {
                window.IncDecVolume(10, false)
            }
            break;
        case 'ArrowRight':
            if (e.ctrlKey || window.videoelement.paused) {
                window.nextFrame()
                console.log('Arrow Right Key Pressed');
            } else {
                window.skipTime(3, true)
            }
            break;
        case 'ArrowLeft':
            if (e.ctrlKey || window.videoelement.paused) {
                window.previousFrame()
                console.log('Arrow Right Key Pressed');
            } else {
                window.skipTime(3, false)
            }
            break;
        case 'Space':
            if (e.ctrlKey) {
                //window.previousFrame()
                window.toggleFullscreen()
                console.log('Arrow Right Key Pressed');
            } else {
                window.togglePlay()
                //window.skipTime(3, false)
                console.log('Arrow Right Key Pressed');
            }
            break;
        case 'KeyS':
            if (e.ctrlKey) {

                console.log('Arrow Right Key Pressed');
            } else {
                window.showControls()
                console.log('Arrow Right Key Pressed');
            }
            break;
        case 'KeyH':
            if (e.ctrlKey) {

                console.log('Arrow Right Key Pressed');
            } else {
                window.hideControls()
                console.log('Arrow Right Key Pressed');
            }
            break;
        default:
            break;
    }
}


window.saveFrame = async function () {
    var parsedPath = path.parse(window.playlist[window.currentPlaylistIndex]);
    // var framePath = `${parsedPath.dir}/${parsedPath.name}-Frame_${getCurrentFrameIndex()}.png`
    var framePath = path.join(parsedPath.dir, `${parsedPath.name}-Frame_${getCurrentFrameIndex()}.png`);
    console.log(framePath);
    const result = await ipcRenderer.invoke('saveDialog', framePath);

    if (!result.canceled) {
        fs.writeFile(result.filePath, getFrameImg(), 'base64', function (err) {
            console.log(err);
        });
    }
}


                     