const canvas = document.getElementById("canvas1");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const collisionCanvas = document.getElementById("collisionCanvas");
const collisionCtx = collisionCanvas.getContext("2d");
collisionCanvas.width = window.innerWidth;
collisionCanvas.height = window.innerHeight;
let score = 0;
let gameOver = false;
ctx.font = '50px Impact';
let timeToNextRaven = 0;
// accumulate millisecond value between frames until it reaches interval and trigger next frame
let ravenInterval = 500;
// ravenInterval is a value in milliseconds everytime time
// to next raven accumulates enough to reach 500 millisecond, will trigger next raven
// then reset back to 0
let lastTime = 0; // hold value of timestamp from the previous loop

let ravens = [];
class Raven
{
    constructor()
    {
        this.spriteWidth = 1626 / 6;
        this.spriteHeight = 194;
        this.sizeModifier = Math.random() * 0.6 + 0.4;

        // the size of raven
        this.width = this.spriteWidth * this.sizeModifier;
        this.height = this.spriteHeight * this.sizeModifier;

        // the location of raven
        this.x = canvas.width;      // all starting from the right
        this.y = Math.random() * (canvas.height - this.height); // height is random

        // speed
        this.directionX = Math.random() * 5 + 3;    // horizontal speed
        this.directionY = Math.random() * 5 - 2.5;  // vertical speed, some up, some down(-2.5, 2.5)
        this.markedForDeletion = false;
        this.image = new Image();
        this.image.src = "raven.png";
        this.frame = 0;
        this.maxFrame = 4;
        this.timeSinceFlap = 0;
        this.flapInterval = Math.random() * 50 + 50;
        // making sure having the same performance on slow or fast computer
        // each raven object will have a random rgb(red, green, blue) to form a color
        this.randomColors = [Math.floor(Math.random() * 255),
                            Math.floor(Math.random() * 255),
                            Math.floor(Math.random() * 255)];
        this.color = "rgb(" + this.randomColors[0] + ","
                            + this.randomColors[1] + ","
                            + this.randomColors[2] + ")";
        this.hasTrail = Math.random() > 0.5;
        this.angle = Math.random() * 2;
        this.angleSpeed = Math.random() * 0.2;
        this.curve = Math.random() * 7;

    }
    update(deltatime) // deltatime: difference in milliseconds between last frame and current frame
    {
        if (this.y < 0 || this.y > canvas.height - this.height)
        {
            this.directionY = this.directionY * -1;
        }
        this.x -= this.directionX;
        this.y += this.curve * Math.sin(this.angle);
        this.angle += this.angleSpeed;
        if (this.x < 0 - this.width) // when a raven flies out of the screen
        {
            this.markedForDeletion = true;
        }
        this.timeSinceFlap += deltatime;
        if (this.timeSinceFlap > this.flapInterval) // timeSinceFlap accumulate, flapInterval is random
        {
            if (this.frame > this.maxFrame) this.frame = 0;
            else this.frame++;
            this.timeSinceFlap = 0;
            if (this.hasTrail)
            {
                for (let i = 0; i < 5; i++)
                {
                    particles.push(new Particle(this.x, this.y, this.width, this.color));
                }

            }

        }
        if (this.x < 0 - this.width) gameOver = true;
    }
    draw()
    {
        // such fillStyle = "white", it takes a string, we built the string with rgb(red, green, blue)
        collisionCtx.fillStyle = this.color; // drawing colored rectangle on collisionCtx
        collisionCtx.fillRect(this.x, this.y, this.width, this.height);
        ctx.drawImage(this.image, this.frame * this.spriteWidth, 0, this.spriteWidth, this.spriteHeight,
            this.x, this.y, this.width, this.height);
    }
}
let particles = [];
class Particle
{
    constructor(x, y, size, color)
    {
        this.size = size;
        this.x = x + this.size / 2 + Math.random() * 50 - 25;
        this.y = y + this.size / 3 + Math.random() * 50 - 25;
        this.radius = Math.random() * this.size / 10;
        this.maxRadius = Math.random() * 20 + 35;
        this.markedForDeletion = false;
        this.speedX = Math.random() + 0.5;
        this.color = color;

    }
    update()
    {
        this.x += this.speedX;
        this.radius += 0.3;
        if (this.radius > this.maxRadius - 5)
        {
            this.markedForDeletion = true;
        }
    }
    draw()
    {
        ctx.save();
        ctx.globalAlpha = 1 - this.radius / this.maxRadius;
        ctx.beginPath();
        ctx.fillStyle = this.color;
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

let explosions = [];
class Explosion
{
    constructor(x, y, size)
    {
        this.image = new Image();
        this.image.src = "boom.png";
        this.spriteWidth = 1000 / 5;
        this.spriteHeight = 179;
        this.size = size;
        this.x = x;
        this.y = y;
        this.frame = 0;
        this.sound = new Audio();
        this.sound.src = "boom.wav";
        this.timeSinceLastFrame = 0;
        this.frameInterval = 80;
        this.markedForDeletion = false;

    }
    update(deltatime)
    {
        if (this.frame === 0) this.sound.play();
        this.timeSinceLastFrame += deltatime;
        if (this.timeSinceLastFrame > this.frameInterval)
        {
            this.frame++;
            this.timeSinceLastFrame = 0;
            if (this.frame > 5) this.markedForDeletion = true;
        }
    }
    draw()
    {
        ctx.drawImage(this.image, this.frame * this.spriteWidth, 0,
            this.spriteWidth, this.spriteHeight, this.x, this.y - this.size / 4, this.size, this.size);
    }
}

function drawScore()
{
    ctx.fillStyle = "black";
    ctx.fillText('Score ' + score, 50, 75);
    ctx.fillStyle = "white";
    ctx.fillText('Score ' + score, 55, 80);
}

function drawGameOver()
{
    ctx.textAlign = "center";
    ctx.fillStyle = "black";
    ctx.fillText("Game Over, Your Score is " + score, canvas.width / 2, canvas.height / 2);
    ctx.fillStyle = "white";
    ctx.fillText("Game Over, Your Score is " + score, canvas.width / 2 + 5,
        canvas.height / 2 + 5);

}


window.addEventListener("click", function(e)
{
    // scan collision canvas instead
    const detectPixelColor = collisionCtx.getImageData(e.x, e.y, 1, 1);// scan 1 pixel
    // getImageData(sx, sy, sw, sh), at coordinate x and y with the width and height we want to scan
    /**
     * data :Uint8ClampedArray(4) [0, 0, 0, 57] // data array represent 1 pixel, red, green, blue, alpha
     * in CSS, any color can be created by combining a certain amount of red, green, and blue,
     * alpha is 0-255, 0 is transparent and 255 is full visible
     * // it's 0, 0, 0 because it's transparent, ctx only has ravens and scores.
     * the rainbow is on the background and applied to body element
     * we are calling ctx.getImageData, so it is scanning that particular canvas element,
     * it doesn't see anything else
     * colorSpace: "srgb"
     * height: 1
     * width: 1
     * */
    // when click, it will ignore the black raven and only scan that color box
    const pc = detectPixelColor.data; // the data returns (red, green, blue, and alpha value)
    // pc is used to compare with (red, green, blue) value inside random colors property
    // on each raven, to know which raven was clicked on and then set markedToDeletion = true
    ravens.forEach(object =>
    {
        // check if matching pixel color at position 0, 1, 2, which red, green, blue
        if (object.randomColors[0] === pc[0] &&
            object.randomColors[1] === pc[1] &&
            object.randomColors[2] === pc[2])
        {
            // if detects collision by color, take explosions array push new explosion
            object.markedForDeletion = true;
            score++;
            // passing in new Explosion(raven's x and y, with raven's size)
            // explosion happens at raven, which is collision detected
            explosions.push(new Explosion(object.x, object.y, object.width));

        }
    });
});

// timestamp, a millisecond, 1/1000, automatically passed timestamp
// generated by default by JavaScript
function animate(timestamp)
{
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    collisionCtx.clearRect(0, 0, canvas.width, canvas.height);
    let deltatime = timestamp - lastTime; // 每一次loop电脑所花的时间
    /*
    * delta time is a value in millisecond between timestamp from this loop and saved
    * timestamp value from previous loop
    * */
    lastTime = timestamp; // ready to compare in the next loop
    timeToNextRaven += deltatime;  // serve a new frame in every 16 millisecond in my computer
    if (timeToNextRaven > ravenInterval)
    {
        /** adding new raven object every 500 millisecond */
        ravens.push(new Raven());
        timeToNextRaven = 0;
        ravens.sort(function(a, b)
        {
            // raven in the back will have smaller width, sorting by width
            return a.width - b.width;
        });
    }
    drawScore(); // score behind ravens, draw score first, then draw raven on top of score
    // call all ravens and all explosions at the same time
    // draw particles first
    [...particles, ...ravens, ...explosions].forEach(object => object.update(deltatime));
    [...particles, ...ravens, ...explosions].forEach(object => object.draw());
    // array literal spread operator, spreading ravens array inside this new quick array
    ravens = ravens.filter(object => !object.markedForDeletion);
    explosions = explosions.filter(object => !object.markedForDeletion);
    particles = particles.filter(object => !object.markedForDeletion);
    // filter leaves any object that condition is true, markedForDeletion is false.
    // when markedForDeletion is false meaning the raven flies out of screen.
    // leave leftover ravens that is still in the screen.
    if (!gameOver)  requestAnimationFrame(animate);
    else drawGameOver();
}
animate(0);