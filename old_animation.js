var colors = ["blue", "red", "green", "black"]
ctx.fillStyle = colors[Math.floor(Math.random()*colors.length)];
var x = -100;
prepSound()
t_sound = 0;
function render(){
    ctx.beginPath()
    ctx.clearRect(0,0,c.width,c.height)
    ctx.strokeRect(500,500, c.width, c.height)
    ctx.moveTo(x,0)
    ctx.rect(0,0,500,500)
    rectL = 0+x
    rectR = 388-x
    ctx.fillRect(rectL,200,450/4,450/4)
    ctx.fillRect(rectR, 200, 450/4,450/4)
    ctx.stroke()
    if(rectL == c.width/2 & soundOn === false){
        startSineTone()
        soundOn = true;
        // stopSineTone()
        console.log("beep")
    }
    if (soundOn == true & rectL >= c.width/2) {
        t_sound++;
        if (t_sound > 5) { 
            stopSineTone();
            soundOn = false;
        }
    }
    x+=5
    if(x > c.width+70){
        x = -100
    }
    requestAnimationFrame(render);
}
render();