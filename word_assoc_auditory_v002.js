//testing sunc github and gitlab
// Original script created by Alon Hafri, March 2021

////////////////////////////
////////////////////////////
// redirect URL for the Prolific or SONA study
  // will be unique to each study
  // comment out either the SONA or Prolific sections below

// SONA
var experimentSystem = 'SONA';
var baseURL = 'https://jhu.sona-systems.com/webstudy_credit.aspx';
var urlParams = {
  'experiment_id': '541',                                // unique to your study; should set before running
  'credit_token':  'bce3aae6a4fa41e7ab1e012cb58f7d07'    // unique to your study; should set before running
}

// Prolific
// var experimentSystem = 'Prolific';
// var baseURL = 'https://app.prolific.co/submissions/complete';
// var urlParams = {
//   'cc': 'XXXX'                                        // unique to your study; should set before running
// }

/*************************
*      Debug Params      *
**************************/

// should condition file be created even when no Prolific ID is detected in URL?
  // will always *assign* conditions based on the condition_files directory
  // here this is just whether will *create* a condition file in that directory (i.e. add to the condition counts)
var alwaysCreateCondFile = false; // here, will only create a condition file if the URL indicates that the user is on Prolific
// var alwaysCreateCondFile = true; // here, will always create a file


/*************************
*    Exp. Parameters     *
**************************/

// experiment params
var experimentName = 'language_vision_sym_assoc_audiovisual';
var experimentVersion = 'v002'; // short version name (logged on every trial)
var experimentNotes = 'matching symmetrical predicates to audiovisual illusory bouncing: beep vs. no beep'; // details about the study (logged in experiment-level data)

// response key params
var keyCodes = [70, 74]; // f, j
var keys = ['f','j']; // should match order of keyboard keys above
responseOptions = ["bounce", "stream"];
var responseAssignments = Shuffle([0,1]);

// durations of each trial element
var durations = {};
durations['blank'] = 250;
durations['fixation'] = 350;

// screen and positioning params
// experiment canvas size
var canvasWidth = 450; //500
var canvasHeight = 450; //500
// screen params
var containerWidth = canvasWidth;
var containerHeight = canvasHeight;

// fixation params
var fixationDistFromTop = canvasHeight/2;
var fixationLength = 20;
var fixationWidth = 3;
var fixationColor = 'rgb(0, 0, 0)';

// color params
var bgColor = 'rgb(193, 193, 193)';
var fillColors = {};
fillColors['red'] = 'rgb(216, 14.5, 14.5)';
fillColors['green'] = 'rgb(0, 151, 0)';
fillColors['blue'] = 'rgb(80.5, 80.5, 253)';

// shape size and position params
var radius = 36; // for rectangle, this is half the width  //40
var xOffsetFromEdge_initial = radius;
var v_pxPerMS = 285 / 1000;  //315 / 1000;
var x_initial = [xOffsetFromEdge_initial, canvasWidth - xOffsetFromEdge_initial];

// sound params
var freq = 440;
var soundDuration = 100; // ms
var soundRampDown = 20; // ms for sound ramp down
var soundStartTimes = {};
soundStartTimes['none'] = Infinity;
soundStartTimes['simul'] = 0;

// calculation for collision timing (t = d / v)
  // v * 2 because they are both approaching at the same speed, opposite signs
var t_startSound, t_stopSound;
var t_collision = (canvasWidth - xOffsetFromEdge_initial * 2) / (v_pxPerMS * 2);
// var t_collision = (canvasWidth - xOffsetFromEdge_initial * 2 - radius * 2) / (v_pxPerMS * 2);
// calc for end of animation
var t_end = (canvasWidth - xOffsetFromEdge_initial * 2) / v_pxPerMS;

// how many times to repeat the animation
var numPlays = 2;


////////
// stimulus info

// word lists
var wordCombos = [
  {'sym':'collide','non-sym':'hit','itemGroup':'A'},
  {'sym':'separate','non-sym':'withdraw','itemGroup':'A'},
  {'sym':'correspond','non-sym':'contact','itemGroup':'A'},
  {'sym':'marry','non-sym':'adopt','itemGroup':'A'},
  {'sym':'clash','non-sym':'confront','itemGroup':'A'},
  {'sym':'equal','non-sym':'exceed','itemGroup':'A'},
  {'sym':'debate','non-sym':'lecture','itemGroup':'B'},
  {'sym':'combine','non-sym':'expand','itemGroup':'B'},
  {'sym':'chat','non-sym':'tell','itemGroup':'B'},
  {'sym':'match','non-sym':'gauge','itemGroup':'B'},
  {'sym':'unite','non-sym':'dominate','itemGroup':'B'},
  {'sym':'negotiate','non-sym':'propose','itemGroup':'B'},
  {'sym':'box','non-sym':'punch','itemGroup':'C'},
  {'sym':'date','non-sym':'befriend','itemGroup':'C'},
  {'sym':'interact','non-sym':'intervene','itemGroup':'C'},
  {'sym':'be identical','non-sym':'be inferior','itemGroup':'C'},
  {'sym':'differ','non-sym':'alter','itemGroup':'C'},
  {'sym':'be similar','non-sym':'be typical','itemGroup':'C'},
  {'sym':'tango','non-sym':'lead','itemGroup':'D'},
  {'sym':'intersect','non-sym':'interfere','itemGroup':'D'},
  {'sym':'meet','non-sym':'greet','itemGroup':'D'},
  {'sym':'disagree','non-sym':'reject','itemGroup':'D'},
  {'sym':'agree','non-sym':'consent','itemGroup':'D'},
  {'sym':'collaborate','non-sym':'contribute','itemGroup':'D'}
]

// stimulus types (simul, none)
var stimTypes = Object.keys(soundStartTimes);

// params of non-interest
var fillColorNames = Object.keys(fillColors);
var shapeTypes = ['oval', 'rect'];
// var angles = [0, 45, 90, 135, 180, 225, 270, 315];
var angles = [0, 45, 90, 135]; // nothing 180 or above since all are symmetric

////////
// prep other global vars

// list of possible condition assignments for subjects
var conditionsList = [0,1,2,3];
var experimentCondition;

// condition combinations based on user's experiment condition
var stimConditionAssignments = [
  [ ['A','B'], ['C','D'] ],
  [ ['B','C'], ['D','A'] ],
  [ ['C','D'], ['A','B'] ],
  [ ['D','A'], ['B','C'] ],
]
var currentStimCondition;

// time vars
var startStudyTimestamp_unix; // unix epoch timestamp (can be converted into date and time), from consent confirmation
var startStudyTime; // start when consent is confirmed (in browser time)
var startExperimentTime; // start when practice trials begin (in browser time)
var endExperimentTime; // when the study is complete but before post-experiment questionnaires (in browser time)

// experiment-level global vars
var trials; // stores all trial info
var subjectID; var studyID; var sessionID; // prolific info
var responses = {}; // for recording all data to submit to server

// trial global vars
var currentTrialNum; // current trial index
var trial; // current trial info/responses
var t0_curAnim; // for animating trial animations with the proper durations (reset to currentTime for each trial item)
var readyForNexTrial = false; // will be true if/when the next trial can start (i.e. at the "Continue" screen)
var responseAcceptable = false; // when true, will accept a trial response
// trial response vars
var t0_probe; // time when probe appears
var rt; // response time

// canvas vars
var canvas;
var ctx;
var scale;

// anim vars
var curPlays;
var x, y;

// prep sound context
var ctxAudio;
var osc;
var gain;
var soundStarted = false;
var soundStopped = false;

var AudioContext = window.AudioContext // Default
    || window.webkitAudioContext // Safari and old versions of Chrome
    || false;


/*************************
*   Initial Functions    *
**************************/

// when the document has loaded
function introRoutines() {
  // preload time counter
  startPreloadTime = currentTime();

  // container for canvas
  $('#container_main').css('width',containerWidth + 'px');
  $('#container_main').css('height',containerHeight + 'px');
  $('.container').css('width',containerWidth + 'px');
  $('.container').css('height',containerHeight + 'px');

  // canvas
  canvas = document.querySelector("#myCanvas");
  ctx = canvas.getContext("2d");
  initializeCanvas(canvasWidth, canvasHeight);

  // get subject info
  if ( experimentSystem == 'SONA' ) {
    subjectID = getSONAInfo();
    // add subject id as a url parameter
    urlParams['survey_code'] = subjectID;
  } else {
    [subjectID, studyID, sessionID] = getProlificInfo();
  }
  console.log('Assuming experiment system: ' + experimentSystem);
  console.log('subj: ' + subjectID);

  // set redirect url
  urlRedirect = baseURL + '?';
  for ( param in urlParams ) {
    urlRedirect = urlRedirect.concat(param + '=' + urlParams[param] + '&');
  }
  // trim off last ampersand
  urlRedirect = urlRedirect.substring(0, urlRedirect.length-1);

  // change redirect info in html
  replaceHTMLText('submitText', 'SYSTEM', experimentSystem );
  replaceHTMLText('redirect', 'SYSTEM', experimentSystem );

  //// set up keyboard monitoring
  // key down
  document.body.onkeydown = function(e){
    if ( e.keyCode == keyCodes[0] | e.keyCode == keyCodes[1] ) {
      console.log('pressed!');
      Responded(e.keyCode);
    }
  }

  // assign condition to the subject
  assignCondition();

  // now generate trials
  trials = generateTrials();
  nTrials = trials.length;
  currentTrialNum = -1;

  // establish object for recording experiment data
  responses['trialData'] = [];

  // now allow participant to proceed past the Consent screen
  $('#consentButtonText').html('Proceed');
};

//////////////////////////
// initial experiment functions

function generateTrials() {
  // first shuffle angle/color/shape combos
  vidCombos = [];
  for (a = 0; a < fillColorNames.length; a++) {
    for (b = 0; b < shapeTypes.length; b++) {
      for (c = 0; c < angles.length; c++) {
        curVidCombo = {};
        curVidCombo['fillColor'] = fillColorNames[a];
        curVidCombo['shapeType'] = shapeTypes[b];
        curVidCombo['angle'] = angles[c];
        vidCombos.push(curVidCombo);
      }
    }
  }
  Shuffle(vidCombos);
  console.log(vidCombos);

  // now create the list
    // two "blocks", each with the stimulus type combo desired
    // shuffle within block

  currentStimCondition = stimConditionAssignments[experimentCondition]; // even though this is two elements, can just test first

  trials = [];

  for (iiB = 0; iiB < currentStimCondition.length; iiB++) {
    curBlock = new Array();

    //set experimentCondition
    for (iiWP = 0; iiWP < wordCombos.length; iiWP++) {
      // if the current word itemGroup is the iiB item in the first or second stimulus condition set:
        // [ ['A','B','C'], ['D','E','F'] ],
        // [ ['B','C','D'], ['E','F','A'] ],
        // [ ['C','D','E'], ['F','A','B'] ],
        // [ ['D','E','F'], ['A','B','C'] ],
        // [ ['E','F','A'], ['B','C','D'] ],
        // [ ['F','A','B'], ['C','D','E'] ]
      if ( currentStimCondition[iiB].includes(wordCombos[iiWP]['itemGroup']) ) {
      // if ( [currentStimCondition[0][iiB], currentStimCondition[1][iiB]].includes(wordCombos[iiWP]['itemGroup']) ) {
        curTrial = {};

        curTrial['blockNum'] = iiB;
        curTrial['wordPair'] = wordCombos[iiWP];

        stimTypeForItem = currentStimCondition[iiB].indexOf( curTrial['wordPair']['itemGroup'] );
        // if ( currentStimCondition[0].includes(curTrial['wordPair']['itemGroup']) ) {
        curTrial['stimType'] = stimTypes[ stimTypeForItem ];

        // now video parameters of non-interest
        curTrial['fillColor'] = vidCombos[iiWP]['fillColor'];
        curTrial['shapeType'] = vidCombos[iiWP]['shapeType'];
        curTrial['angle'] = vidCombos[iiWP]['angle'];

        curBlock.push(curTrial);
      };
    };
    // shuffle within-block and then add to the list of trials
    Shuffle(curBlock);
    trials = trials.concat(curBlock);
  };

  return trials;
};

// set canvas params (including higher resolution if necessary)
function initializeCanvas(cW, cH) {
  // Set display size (css pixels).
  canvas.style.width = cW + "px";
  canvas.style.height = cH + "px";

  // Set actual size in memory (scaled to account for extra pixel density).
  scale = getDevicePixelRatio();
  // scale = window.devicePixelRatio; // <--- Change to 1 on retina screens to see blurry canvas.
  canvas.width = cW * scale;
  canvas.height = cH * scale;

  // Normalize coordinate system to use css pixels.
  ctx.scale(scale, scale);
}

//////////////////////////
// assign condition

function assignCondition() {
  // Condition - call the "file count" php file to get the condition with the least number of subjects assigned to it
  // set up range
  var list = [];
  for (var i = Math.min(...conditionsList); i <= Math.max(...conditionsList); i++) {
      list.push(i);
  }
  try {
      var conds = list.join(',');
      var xmlHttp = null;
      xmlHttp = new XMLHttpRequest();
      xmlHttp.open( "GET",
        "helper_files/file_count_cond_select_v02.php?" +
        "conds=" + conds +
        "&subjectID=" + subjectID,
         false );
      xmlHttp.send( null );
      initial_cond = xmlHttp.responseText;
      console.log(initial_cond)
  } catch (e) {
      // var cond = 0;
      console.log('error in php file count')
      initial_cond = 'ERROR'; // this will get parsed below as NaN and then randomized
  }

  // test if cond is valid (i.e. is a number and ranges in between the lists)
  if ( isNaN(initial_cond) ) {
    console.log('Invalid condition');
    initial_cond = getRandomInt(Math.min(...conditionsList), Math.max(...conditionsList));
  };

  experimentCondition = parseInt(initial_cond,10);
  // experimentCondition = 1;
  console.log("Exp. Condition: " + experimentCondition);

  // now add a blank condition file for keeping track of number of participants in each condition
  if ( (alwaysCreateCondFile == true) | ( (alwaysCreateCondFile == false) & (subjectID != 'NO-SUBJ-ID') ) ) {
    try {
      filename = subjectID + '_' + experimentCondition;
      var xmlHttp = null;
      xmlHttp = new XMLHttpRequest();
      xmlHttp.open('GET',
        'helper_files/add_blank_cond_file.php?filename=' +
        filename, false);
      xmlHttp.send(null);
      out_message = xmlHttp.responseText;
      console.log('php out: ' + out_message);
    } catch (e) {
      console.log('error in php writing condition file');
    }
  } else {
    console.log('Detected that user is not on Prolific or SONA. Not creating condition file.');
  }
};


/*************************
*    Instructions Flow   *
**************************/

// once Consent is clicked (and as long as images are pre-loaded), show instructions
function ClickedConsent() {
  startStudyTimestamp_unix = new Date().getTime(); // unix epoch timestamp (i.e. date/time)
  startStudyTime = currentTime(); // current time (in browser time)

  // audio context (must be created after a user interacts with the page)
  if (AudioContext) {
    ctxAudio = new AudioContext();
  } else {
    // Web Audio API is not supported
    // Alert the user
    alert("Sorry, but the Web Audio API is not supported by your browser. Please consider upgrading to the latest version or downloading Google Chrome or Mozilla Firefox.");
  }

  // now add warning if they try to close the page
  window.addEventListener('beforeunload', eventReturn);

  // hide
  $('#consent').hide();

  // headphone check
  //runHeadphoneCheck();
  passedHeadphoneCheck();
}

function runHeadphoneCheck() {
  $(document).on('hcHeadphoneCheckEnd', function(event, data) {
    var headphoneCheckDidPass = data.didPass;
    var headphoneCheckData = data.data;
    var didPassMessage = headphoneCheckDidPass ? 'passed' : 'failed';
    if (headphoneCheckDidPass == false) {
      alert( 'You ' + didPassMessage + ' the headphone screening task (you got ' + headphoneCheckData.totalCorrect + '/' + headphoneCheckData.stimIDList.length + ' trials correct). Please put headphones or earbuds in, reload this page, and try again.' );
    } else {
      passedHeadphoneCheck();
    }
  });
  // run it
  $('#hc-container').show();
  var headphoneCheckConfig = {
    // totalTrials: 1,
    jsonPath: './headphoneCheck/HeadphoneCheckDefaultStimuliLocal.json'
  };
  /* 5) Run the headphone check, with customization options defined in headphoneCheckConfig */
  HeadphoneCheck.runHeadphoneCheck(headphoneCheckConfig);
}

function passedHeadphoneCheck() {
  // hide
  $('#hc-container').hide();
  // show
  $('#title').show();
  // show instructions
  $('#Instruction').show();
  $('#startExperimentButton').show();
}

function StartExperiment() {
  startExperimentTime = currentTime();
  // hide
  $('#Instruction').hide();
  $('#startExperimentButton').hide();
  // show
  $('.progress').show();
  $('#progressContainer').show();
  $('.container').show();
  $('#container_main').show();
  //load changePrompt
  changePrompts();
  // load first trial
  loadTrial();
  //add response type
  Responded(keyCodes);
}


/*************************
*     Trial Loading      *
**************************/

// load trial
function loadTrial() {
  currentTrialNum++;
  if (currentTrialNum < nTrials) {
  // if (currentTrialNum < 3) {
    trial = trials[currentTrialNum];
    trial['trialNum'] = currentTrialNum;
    // run trial
    runTrial();
  } else {
    // finish experiment
    FinishUp();
  }
}

// run trial
function runTrial() {
  // hide
  $('#responseGroup').hide();
  // update progress bar
  $('#progressBar').css('width',((currentTrialNum/nTrials)*100) + 'px');
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
  
  $('#responseText').html('<strong>' + keys[0].toUpperCase() + ' = </strong>' + responseOptions[responseAssignments[0]] + '<br><strong>' + keys[1].toUpperCase() + ' = </strong>' + responseOptions[responseAssignments[1]] + '');
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

// present probe and wait for response
function presentProbeAndWaitForResponse() {
  clearAndDrawBackground(canvasWidth, canvasHeight);
  $('#responseGroup').show();
  // accept response
  responseAcceptable = true;
  t0_probe = currentTime();
}


/*************************
*    Record Responses    *
**************************/

// record their response
function Responded(keyCode) {
  if (responseAcceptable == true) {
    // reset response collection
    responseAcceptable = false;

    // key index
    keyIndex = keyCodes.indexOf(keyCode);

    // log data
    trial['rt'] = currentTime() - t0_probe;
    trial['respKey'] = keys[keyIndex];
    //change next two lines
    trial['response'] = responseOptions[responseAssignments[ keyIndex ]];
    trial['respBounce'] = 1*(trial['response'] == 'bounce');
    trial['respStream'] = 1*(trial['response'] == 'stream');

    // experiment-level
    trial['subjectID'] = subjectID;
    trial['experimentName'] = experimentName;
    trial['experimentVersion'] = experimentVersion;
    trial['experimentCondition'] = experimentCondition;

    // code reponses
    /*
    if ( (trial['respType'] == 'sym' & trial['stimType'] == 'sym') | (trial['respType'] == 'non-sym' & trial['stimType'] == 'non-sym') ) {
      trial['respMatch'] = 1;
    } else {
      trial['respMatch'] = 0;
    };
    if (trial['respType'] == 'sym' ) {
      trial['respSym'] = 1;
    } else {
      trial['respSym'] = 0;
    };

    // remove/modify data and replace with data better for analysis
    trial['sym'] = trial['wordPair']['sym'];
    trial['non-sym'] = trial['wordPair']['non-sym'];
    trial['itemGroup'] = trial['wordPair']['itemGroup'];
    trial['wordOrder'] = trial['wordOrder'].toString();
    */
    delete trial['wordPair'];
    // push trial info and recorded data to responses object
    responses['trialData'].push(trial);

    // show trial data for debugging
    console.log(trial);
    console.log(trial['rt']);

    // load next trial
    setTimeout(loadTrial, 250);
  }
}


/*************************
*    Finish Up/Submit    *
**************************/

function FinishUp() {
  endExperimentTime = currentTime();
  assignExperimentInfo();
  assignExpParamsInfo();
  // hide
  $('#experiment').hide();
  $('.progress').hide();
  $('.container').hide();
  $('#container_main').hide();
  // show language questionnaire
  $('#lang-q').show();
}

function showPostQ() {
  // hide
  $('#lang-q').hide();
  // show
  $('#post-q').show();
}

function showSubmitInstructions() {
  // hide
  $('#post-q').hide();
  // show
  $('#commentBox').show();
  $('#submitText').show();
  // once they click, the 'clickSubmitRedirect' function will be called (below)
}

function clickSubmitRedirect() {
  // lang data
  responses['langEng_native'] = checkRadioVal( $("input:radio[name='langEng_native']:checked").val() );
  responses['langOther_native'] = checkRadioVal( $("input:radio[name='langOther_native']:checked").val() );
  responses['langPrimary'] = checkRadioVal( $("input:radio[name='langPrimary']:checked").val() );
  // post q data
  responses['postQ_strategy'] = document.getElementById('postQ_strategy').value;
  responses['postQ_stimTypes'] = document.getElementById('postQ_stimTypes').value;
  responses['postQ_phraseTypes'] = document.getElementById('postQ_phraseTypes').value;
  // duration data
  responses['instructionsDuration'] = startExperimentTime - startStudyTime;
  responses['experimentDuration'] = endExperimentTime - startExperimentTime;
  responses['postExperimentDuration'] = currentTime() - endExperimentTime;
  responses['totalDuration_study'] = currentTime() - startStudyTime;
  responses['totalDuration_fromPreload'] = currentTime() - startPreloadTime;
  // submit data to server
  //submitData();
   submitData('../data');
  // redirect back to experiment system
  redirect();
}

function submitData(outDir) {
  // get data string from response array
  var dataString = JSON.stringify(responses);
  // post response to server
  $.post("helper_files/logTrial.py", {
    subjectID: subjectID,
    dataString: dataString,
    outDir: outDir
  });
}

function assignExperimentInfo() {
  // record things like the name of the experiment, the browser information, etc.
  // experiment info
  responses['experimentName'] = experimentName;
  responses['experimentVersion'] = experimentVersion;
  responses['experimentNotes'] = experimentNotes;
  responses['experimentCondition'] = experimentCondition;
  // subject info
  responses['subjectID'] = subjectID;
  responses['studyID'] = studyID;
  responses['sessionID'] = sessionID;
  // browserInfo
  var browserInfo = getBrowser();
  responses['browserName'] = browserInfo[0];
  responses['browserVersion'] = browserInfo[1];
  // displayInfo
  responses['displayWindowHeight'] = $(window).height();
  responses['displayWindowWidth'] = $(window).width();
  responses['displayScreenHeight'] = screen.height;
  responses['displayScreenWidth'] = screen.width;
  // timestamp
  responses['startStudyTimestamp_unix'] = startStudyTimestamp_unix;
}

function assignExpParamsInfo() {
  responses['experimentParams'] = {};
  responses['experimentParams']['durations'] = durations;
  responses['experimentParams']['canvasWidth'] = canvasWidth;
  responses['experimentParams']['canvasHeight'] = canvasHeight;
  responses['experimentParams']['fixationLength'] = fixationLength;
  responses['experimentParams']['fixationWidth'] = fixationWidth;
  responses['experimentParams']['fixationColor'] = fixationColor;
  responses['experimentParams']['bgColor'] = bgColor;
  responses['experimentParams']['fillColors'] = fillColors;
  responses['experimentParams']['containerWidth'] = containerWidth;
  responses['experimentParams']['containerHeight'] = containerHeight;
  responses['experimentParams']['radius'] = radius;
  responses['experimentParams']['xOffsetFromEdge_initial'] = xOffsetFromEdge_initial;
  responses['experimentParams']['v_pxPerMS'] = v_pxPerMS;
  responses['experimentParams']['freq'] = freq;
  responses['experimentParams']['soundDuration'] = soundDuration;
  responses['experimentParams']['soundRampDown'] = soundRampDown;
  responses['experimentParams']['soundStartTimes'] = soundStartTimes;
  responses['experimentParams']['numPlays'] = numPlays;
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


/*******************************
*   Miscellaneous Functions    *
********************************/

function replaceHTMLText(idToReplace, txtIn, txtOut) {
  $('#' + idToReplace).html( $('#' + idToReplace).html().replace( txtIn, txtOut ) );
}


/*******************************
*  General External Functions  *
********************************/

var finalCountDownClock = 3;

// get prolific info
function getProlificInfo() {
  let urlParams = new URLSearchParams(window.location.search);
  prolificPID = urlParams.get("PROLIFIC_PID");
  studyID = urlParams.get("STUDY_ID");
  sessionID = urlParams.get("SESSION_ID");
  if (prolificPID == null) {
    prolificPID = 'NO-SUBJ-ID';
  }
  return [prolificPID, studyID, sessionID];
}

// get SONA info
function getSONAInfo() {
  let urlParams = new URLSearchParams(window.location.search);
  SONAID = urlParams.get("survey_code");
  if (SONAID == null) {
    SONAID = 'NO-SUBJ-ID';
  }
  return SONAID;
}

function redirect() {
  // set url
  $('#urlRedirect').text(urlRedirect);
  $('#urlRedirect').attr("href", urlRedirect);
  // hide
  $('#submitText').hide();
  // show
  $('#redirect').show();
  // countdown
  $('#countDown').text((finalCountDownClock).toString());
  redirectTimer = setInterval(countDown, 1000);
}

// redirect countdown
function countDown () {
  finalCountDownClock--;
  if (finalCountDownClock == 0) {
    // clear countdown
    clearInterval(redirectTimer);
    // remove event listener (to allow for redirect)
    window.removeEventListener('beforeunload', eventReturn);
    // redirect
    window.location = urlRedirect;
  } else {
    $('#countDown').text((finalCountDownClock).toString());
  }
}