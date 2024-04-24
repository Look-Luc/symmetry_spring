import "./helper_files/jquery.min.js";
import "./helper_files/mturkfunctions.js";
var keys = ['f','j'];
var responseOptions = ["bounce", "stream"];
var responseAssignments = Shuffle([0,1]);

// run trial
function runTrial() {
    // hide
    ('#responseGroup').hide();
    // update progress bar
    ('#progressBar').css('width',((currentTrialNum/nTrials)*100) + 'px');
    // begin trial dynamics
    //changePrompts();
    // initial positions
    x = [...x_initial];
    y = [canvasHeight/2, canvasHeight/2];
    // sound start and stop
    t_startSound = soundStartTimes[trial['stimType']] + t_collision;
    t_stopSound = soundStartTimes[trial['stimType']] + t_collision + soundDuration;
    // number of plays
    curPlays = 0;
    startAnim();
  }
  
  function prepSound() {
    osc = ctxAudio.createOscillator();
    osc.frequency.value = freq;
    gain = ctxAudio.createGain();
    osc.connect(gain);
    gain.connect(ctxAudio.destination);
  }
  
  function changePrompts() {
    // decide randomly which key is which (sym or non-sym)
    //trial['wordOrder'] = Shuffle(['sym','non-sym']);
    // grab words
    //words = [];
    //words[0] = trial['wordPair'][trial['wordOrder'][0]];
    //words[1] = trial['wordPair'][trial['wordOrder'][1]];
    
    ('#responseText').html('<strong>' + keys[0].toUpperCase() + ' = </strong>' + responseOptions[responseAssignments[0]] + '<br><strong>' + keys[1].toUpperCase() + ' = </strong>' + responseOptions[responseAssignments[1]] + '');
  }
  
  
  /*************************
  *    Trial Animation     *
  **************************/
  
  // general animation function for static frame (dynamic use custom functions)
  function animate_static(t, duration, callbackFunc) {
    // wait until we reach "duration" to move on to the "callbackFunc"; otherwise, repeat this function
    if (currentTime() - t < duration) {
      requestAnimationFrame(function() {animate_static(t, duration, callbackFunc)});
    } else {
      t0_curAnim = currentTime();
      requestAnimationFrame(callbackFunc);
    }
  }
  
  function startAnim() {
    // increment how many repeats we are doing
    curPlays++;
    // initial states
    soundStarted = false;
    soundStopped = false;
    oscDisconnected = false;
    // prep trial sound stuff
    prepSound();
    if (curPlays <= numPlays) {
      requestAnimationFrame(blank);
    } else {
      presentProbeAndWaitForResponse();
    }
  }
  
  function blank() {
    clearAndDrawBackground(canvasWidth, canvasHeight);
    t0_curAnim = currentTime(); // only need this because it's the first animation
    animate_static(t0_curAnim, durations['blank'], fixation);
  }
  
  function fixation() {
    drawFixation();
    animate_static(t0_curAnim, durations['fixation'], animEvent);
  }
  
  function animEvent() {
    ctx.save(); //saves the state of canvas
    clearAndDrawBackground(canvasWidth, canvasHeight);
    ctx.translate(canvasWidth/2, canvasHeight/2);
    ctx.rotate(Math.PI / 180 * (trial['angle'])); // rotate the canvas
    if (trial['shapeType'] == 'oval') {
      // 1
      drawCircle(x[0]-canvasWidth/2, y[0]-canvasHeight/2, radius, fillColors[ trial['fillColor'] ]);
      // 2
      drawCircle(x[1]-canvasWidth/2, y[1]-canvasHeight/2, radius, fillColors[ trial['fillColor'] ]);
    } else {
      // 1
      drawRect(radius*2, radius*2, x[0]-radius-canvasWidth/2, y[0]-radius-canvasHeight/2, fillColors[ trial['fillColor'] ]);
      // 2
      drawRect(radius*2, radius*2, x[1]-radius-canvasWidth/2, y[1]-radius-canvasHeight/2, radius, fillColors[ trial['fillColor'] ]);
    }
    ctx.restore();
    // time elapsed since animation start
    var t_elapsed = currentTime() - t0_curAnim;
    // test if sound
    if (soundStarted == false & t_elapsed > t_startSound) {
      startSineTone();
      soundStarted = true;
    }
    // test if stop sound
    if (soundStopped == false & t_elapsed > t_stopSound) {
      stopSineTone();
      soundStopped = true;
    }
    // // test if disconnect sound
    // if (oscDisconnected == false & t_elapsed > t_stopSound + soundRampDown) {
    //   disconnectOscillator();
    //   oscDisconnected = true;
    // }
    // update positions
    x = [x_initial[0] + v_pxPerMS * t_elapsed, x_initial[1] - v_pxPerMS * t_elapsed];
  
    // next frame or move on
    if (t_elapsed < t_end) {
      requestAnimationFrame(animEvent);
    } else {
      startAnim();
    }
}
/*************************
*   Drawing Functions    *
**************************/

//////////
// general browser, display, and canvas scale functions

function getDevicePixelRatio() {
    var curRatio = window.devicePixelRatio;
    if ( detectSafariBrowser() ) {
      // console.log('is safari');
      curRatio = window.devicePixelRatio * window.outerWidth / window.innerWidth;
    };
    return curRatio;
  }
  
  function detectSafariBrowser() {
    return !!navigator.userAgent.match(/Version\/[\d\.]+.*Safari/);
  }
  
  function checkDisplayScale() {
    testScale = getDevicePixelRatio();
    if (testScale != scale) {
      scale = testScale;
      // debug
      console.log('browser scale changed; scale == ' + scale);
    }
  }
  
  function adjustDisplayScale() {
    canvas.width = canvasWidth * scale;
    canvas.height = canvasHeight * scale;
    ctx.scale(scale, scale);
    console.log('canvas scale adjusted');
  }
  
  //////////
  // general drawing functions
  
  function clearAndDrawBackground(cW, cH) {
    // clear canvas
    ctx.clearRect(0, 0, cW, cH);
    // color in the background
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, cW, cH);
  }
  
  function linewidthPixelAdjust(inPixelCoord, inLinewidth) {
    // to adjust linewidths depending on widths of line to be drawn, to prevent bleedover into other pixels and blurred lines
    outPixelCoord = inPixelCoord;
    if (inLinewidth % 2 == 1) {
      outPixelCoord = outPixelCoord + 0.5;
    }
    return outPixelCoord;
  }
  
  function measureTextWidth(txtToMeasure, txtFont) {
    ctx.font = txtFont;
    return ctx.measureText(txtToMeasure).width;
  }
  
  function drawText(txtToDraw, x, y, txtFont, txtColor, txtLineWidth) {
    ctx.font = txtFont;
    ctx.fillStyle = txtColor;
    ctx.fillText(txtToDraw, x, y);
    if ( txtLineWidth !== 'undefined' && txtLineWidth > 0 ) {
      ctx.lineWidth = txtLineWidth;
      ctx.strokeText(txtToDraw, x, y);
    }
  }
  
  function drawFixation() {
    // background
    clearAndDrawBackground(canvasWidth, canvasHeight);
    // draw crosshair
    // fixation params
    ctx.strokeStyle = fixationColor;
    ctx.lineWidth = fixationWidth;
    // horizontal line
    ctx.beginPath();
    ctx.moveTo((canvasWidth-fixationLength)/2, linewidthPixelAdjust(fixationDistFromTop, fixationWidth));
    ctx.lineTo((canvasWidth+fixationLength)/2, linewidthPixelAdjust(fixationDistFromTop, fixationWidth));
    ctx.stroke();
    // vertical line
    ctx.beginPath();
    ctx.moveTo(linewidthPixelAdjust(canvasWidth/2, fixationWidth), fixationDistFromTop-fixationLength/2);
    ctx.lineTo(linewidthPixelAdjust(canvasWidth/2, fixationWidth), fixationDistFromTop+fixationLength/2);
    ctx.stroke();
  }
  
  function drawCircle(centerX, centerY, radius, fillColor, borderWidth, borderColor) {
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI, false);
    ctx.fillStyle = fillColor;
    ctx.fill();
    if (borderWidth !== undefined && borderColor !== undefined) {
      ctx.lineWidth = borderWidth;
      ctx.strokeStyle = borderColor;
      ctx.stroke();
    }
  }
  
  function drawRect(width, height, left, top, fillColor, borderWidth, borderColor) {
    ctx.fillStyle = fillColor;
    ctx.fillRect(left, top, width, height);
    if (borderWidth !== undefined && borderColor !== undefined) {
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = borderWidth;
      ctx.strokeRect(left, top, width, height);
    }
  }
  
  
  /*************************
  *     Sound Functions    *
  **************************/
  
  function startSineTone() {
    osc.start(0);
    // osc.stop(ctxAudio.currentTime + duration);
  }
  
  function stopSineTone() {
    gain.gain.setValueAtTime(gain.gain.value, ctxAudio.currentTime);
    gain.gain.exponentialRampToValueAtTime(
      0.0000001, ctxAudio.currentTime + soundRampDown/1000
    );
    osc.stop(ctxAudio.currentTime + soundRampDown/1000);
  }
  
  // function disconnectOscillator() {
  //   // osc.disconnect(ctxAudio.destination);
  //   // osc = null;
  // }
  
  
  
  /*******************************
  * General List/Array Functions *
  ********************************/
  
  // make array of enough shuffled items as specified
  function sufficientShuffledItems(curNumNeeded, itemsToShuffle) {
    numItems = itemsToShuffle.length;
    numShuffles = Math.ceil(curNumNeeded / numItems);
    items_full = [];
    for (var i = 0; i < numShuffles; i++) {
      items_full = items_full.concat(Shuffle(itemsToShuffle));
    };
    items_full = items_full.slice(0,curNumNeeded);
    return items_full;
  }
  
  // unique values in array
  function onlyUnique(value, index, self) {
    return self.indexOf(value) === index;
  }
  
  // get random integer
  function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
  
  // find indices of element in array
  function getIndicesInArray(elem, arr) {
    var indices = [];
    var idx = arr.indexOf(elem);
    while (idx != -1) {
      indices.push(idx);
      idx = arr.indexOf(elem, idx + 1);
    }
    return indices;
  }
  
  // get difference of two sets in array form
  function getSetDiff(b, a) {
    a = new Set(a);
    b = new Set(b);
    a_minus_b = new Set([...a].filter(x => !b.has(x)));
    return [...a_minus_b];
  }
  
  // pad integer string with zeros
  function intFormat(int, nDigits) {
    return ('00000000' + int).slice(-nDigits);
  }
  
  // define modulo function
  Number.prototype.mod = function(b) {
      // Calculate actual modulo (so also works for negative numbers)
      return ((this % b) + b) % b;
  }
  
  
  /*******************************
  * General Timing Functions *
  ********************************/
  
  // for animating at the browser refresh
  var requestAnimationFrame = window.requestAnimationFrame ||
                              window.mozRequestAnimationFrame ||
                              window.webkitRequestAnimationFrame ||
                              window.msRequestAnimationFrame;
  
  // high precision browser-based timestamp
  function currentTime() {
    return performance.now();
  }
  
  function calcFPS() {
    now = currentTime();
    if ( now > prevTime ) { // so we don't duplicate the values in t, if we have not yet received a new frame
        times.unshift(now);
      prevTime = now;
      if (times.length > filterForFPS) {
        var t0 = times.pop(); // remove the oldest timestamp
      } else {
        var t0 = times[times.length-1];
      };
      if ( times.length > 1 ) { // get an estimate to use throughout, even if [t] is not filled yet
        // fps = Math.floor(1000 * t.length / (now - t0));
        fps = 1000 * times.length / (now - t0);
      } else {
        fps = lastFPS; // if only one estimate so far, use the last fps (or in the case of the first trial, whatever the default refresh rate)
      };
    };
  }
  
  
  /*******************************
  *   General Window Functions   *
  ********************************/
  
  // warning before closing page (to prevent a participant from inadvertently exiting the experiment)
    // will remove this function before redirecting back to Prolific
  function eventReturn(e) {
    e.returnValue = `Are you sure you want to leave?`;
  }
  
  function checkRadioVal(val) {
    var returnval = val;
    if (typeof val === 'undefined') {
      returnval = '';
      console.log('changed!')
    }
    return returnval;
  }