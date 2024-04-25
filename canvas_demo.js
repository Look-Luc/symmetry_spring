var trial_anim = {
    type: jsPsychCanvasKeyboardResponse,
    stimulus: function dummy_function(c) {
        ctx = canvas.getContext("2d");        
        // try to make a shape show up on screen
        ctx.drawRect('Luc put stuff in here');
        // next try to *animate* a rectangle moving
    },
    canvas_size: [450, 450],
    prompt: 'test',
    choices: 'NO_KEYS',
    trial_duration: 2000
};
timeline.push(trial_anim);
