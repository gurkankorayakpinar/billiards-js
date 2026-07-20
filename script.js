const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const powerBar = document.getElementById('power-bar');
const powerValueElement = document.getElementById('power-value');
const restartBtn = document.getElementById('restartBtn');

const count0xEl = document.getElementById('count0x');
const count1xEl = document.getElementById('count1x');
const count2xEl = document.getElementById('count2x');
const count3xEl = document.getElementById('count3x');
const count4xEl = document.getElementById('count4x');
const count5xEl = document.getElementById('count5x');
const count6xEl = document.getElementById('count6x');
const count7xEl = document.getElementById('count7x');
const turnCountEl = document.getElementById('turnCount');

let displayPowerLevel = 5;
let physicsActualPower = 20;
const friction = 0.99;
const restitution = 0.96;
let mouseX = 0;
let mouseY = 0;

let currentTurn = 1;
const maxTurns = 50;

let combo0x = 0;
let combo1x = 0;
let combo2x = 0;
let combo3x = 0;
let combo4x = 0;
let combo5x = 0;
let combo6x = 0;
let combo7x = 0;

let isTurnActive = false;
let gameOverState = "PLAYING";
let hitCountThisTurn = 0;

const ballColors = ['#ffffff', '#ff3333', '#ffcc00', '#00bfff', '#00008b', '#808080', '#222222', '#ff6600', '#2e7d32'];
let balls = [];
const ballRadius = 14;

class Ball {
    constructor(id, x, y, radius, color, isWhite = false) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.radius = radius;
        this.color = color;
        this.isWhite = isWhite;
        this.mass = 1;
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();

        ctx.lineWidth = 1.5;
        ctx.strokeStyle = this.color === '#222222' ? '#444444' : 'rgba(0,0,0,0.15)';
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(this.x - this.radius * 0.35, this.y - this.radius * 0.35, this.radius * 0.25, 0, Math.PI * 2);
        ctx.fillStyle = this.color === '#ffffff' ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.3)';
        ctx.fill();
        ctx.closePath();
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;

        this.vx *= friction;
        this.vy *= friction;

        if (Math.abs(this.vx) < 0.02) this.vx = 0;
        if (Math.abs(this.vy) < 0.02) this.vy = 0;

        if (this.x - this.radius < 0) { this.x = this.radius; this.vx *= -restitution; }
        if (this.x + this.radius > canvas.width) { this.x = canvas.width - this.radius; this.vx *= -restitution; }
        if (this.y - this.radius < 0) { this.y = this.radius; this.vy *= -restitution; }
        if (this.y + this.radius > canvas.height) { this.y = canvas.height - this.radius; this.vy *= -restitution; }
    }
}

let whiteBall;

function initGame() {
    balls = [];
    currentTurn = 1;
    combo0x = 0;
    combo1x = 0;
    combo2x = 0;
    combo3x = 0;
    combo4x = 0;
    combo5x = 0;
    combo6x = 0;
    combo7x = 0;

    isTurnActive = false;
    gameOverState = "PLAYING";
    hitCountThisTurn = 0;

    updatePower(5);

    count0xEl.textContent = '0/1';
    count1xEl.textContent = '0/5';
    count2xEl.textContent = '0';
    count3xEl.textContent = '0';
    count4xEl.textContent = '0';
    count5xEl.textContent = '0';
    count6xEl.textContent = '0';
    count7xEl.textContent = '0/5';
    turnCountEl.textContent = `1/${maxTurns}`;

    restartBtn.disabled = true;

    whiteBall = new Ball(0, 150, canvas.height / 2, ballRadius, ballColors[0], true);
    balls.push(whiteBall);

    for (let i = 1; i < ballColors.length; i++) {
        let randX = 450 + Math.random() * 320;
        let randY = 100 + Math.random() * 400;

        let overlap = false;
        for (let j = 0; j < balls.length; j++) {
            if (Math.hypot(randX - balls[j].x, randY - balls[j].y) < ballRadius * 2.5) {
                overlap = true;
                break;
            }
        }
        if (overlap) { i--; continue; }

        balls.push(new Ball(i, randX, randY, ballRadius, ballColors[i]));
    }
}

function resolveCollision(b1, b2) {
    const xDist = b2.x - b1.x;
    const yDist = b2.y - b1.y;
    const dist = Math.hypot(xDist, yDist);

    if (dist < b1.radius + b2.radius) {
        if (isTurnActive) {
            if (!b1.isWhite || !b2.isWhite) {
                hitCountThisTurn++;
            }
        }

        const overlap = (b1.radius + b2.radius) - dist;
        const nx = xDist / dist;
        const ny = yDist / dist;

        b1.x -= nx * overlap * 0.5;
        b1.y -= ny * overlap * 0.5;
        b2.x += nx * overlap * 0.5;
        b2.y += ny * overlap * 0.5;

        const kx = b1.vx - b2.vx;
        const ky = b1.vy - b2.vy;
        const impulse = (2 * (nx * kx + ny * ky)) / (b1.mass + b2.mass) * restitution;

        b1.vx -= impulse * b2.mass * nx;
        b1.vy -= impulse * b2.mass * ny;
        b2.vx += impulse * b1.mass * nx;
        b2.vy += impulse * b1.mass * ny;
    }
}

function updatePower(level) {
    displayPowerLevel = level;
    physicsActualPower = level * 4;

    powerValueElement.textContent = displayPowerLevel;
    powerBar.style.width = `${(level / 5) * 100}%`;
}

window.addEventListener('keydown', (e) => {
    if (gameOverState !== "PLAYING") return;
    if (['1', '2', '3', '4', '5'].includes(e.key)) {
        updatePower(parseInt(e.key));
    }
});

canvas.addEventListener('mousemove', (e) => {
    if (gameOverState !== "PLAYING") return;
    const rect = canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
});

canvas.addEventListener('mousedown', () => {
    if (gameOverState !== "PLAYING") return;
    const allStopped = balls.every(ball => ball.vx === 0 && ball.vy === 0);

    if (allStopped) {
        isTurnActive = true;
        hitCountThisTurn = 0;

        const dx = mouseX - whiteBall.x;
        const dy = mouseY - whiteBall.y;
        const distance = Math.hypot(dx, dy);

        if (distance > 0) {
            const dirX = dx / distance;
            const dirY = dy / distance;
            const speedMultiplier = physicsActualPower * 1.6;

            whiteBall.vx = dirX * speedMultiplier;
            whiteBall.vy = dirY * speedMultiplier;
        }
    }
});

restartBtn.addEventListener('click', () => {
    initGame();
});

function drawEndScreen() {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.font = 'bold 56px Segoe UI';
    ctx.textAlign = 'center';

    if (gameOverState === "WON") {
        ctx.fillStyle = '#ffcc00';
        ctx.fillText('KAZANDINIZ', canvas.width / 2, canvas.height / 2 + 15);
    } else if (gameOverState === "LOST") {
        ctx.fillStyle = '#f44336';
        ctx.fillText('KAYBETTİNİZ', canvas.width / 2, canvas.height / 2 + 15);
    }
}

function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (gameOverState === "PLAYING") {
        for (let i = 0; i < balls.length; i++) {
            for (let j = i + 1; j < balls.length; j++) {
                resolveCollision(balls[i], balls[j]);
            }
        }
        balls.forEach(ball => ball.update());
    }

    balls.forEach(ball => ball.draw());

    const allStopped = balls.every(ball => ball.vx === 0 && ball.vy === 0);

    if (isTurnActive && allStopped) {
        isTurnActive = false;

        if (hitCountThisTurn === 0) {
            combo0x++;
            count0xEl.textContent = `${combo0x}/1`;
            gameOverState = "LOST";
        }
        else if (hitCountThisTurn === 1) {
            combo1x++;
            count1xEl.textContent = `${combo1x}/5`;
            if (combo1x >= 5) {
                gameOverState = "LOST";
            }
        }
        else if (hitCountThisTurn === 2) { combo2x++; count2xEl.textContent = combo2x; }
        else if (hitCountThisTurn === 3) { combo3x++; count3xEl.textContent = combo3x; }
        else if (hitCountThisTurn === 4) { combo4x++; count4xEl.textContent = combo4x; }
        else if (hitCountThisTurn === 5) { combo5x++; count5xEl.textContent = combo5x; }
        else if (hitCountThisTurn === 6) { combo6x++; count6xEl.textContent = combo6x; }
        else if (hitCountThisTurn >= 7) {
            combo7x++;
            count7xEl.textContent = `${combo7x}/5`;
            if (combo7x >= 5) {
                gameOverState = "WON";
            }
        }

        if (gameOverState === "PLAYING") {
            if (currentTurn >= maxTurns) {
                gameOverState = "LOST";
            } else {
                currentTurn++;
                turnCountEl.textContent = `${currentTurn}/${maxTurns}`;
            }
        }
    }

    if (allStopped && gameOverState === "PLAYING") {
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([5, 5]);
        ctx.moveTo(whiteBall.x, whiteBall.y);
        ctx.lineTo(mouseX, mouseY);
        ctx.stroke();
        ctx.setLineDash([]);
    }

    if (gameOverState !== "PLAYING") {
        drawEndScreen();
        restartBtn.disabled = false;
    }

    requestAnimationFrame(animate);
}

initGame();
animate();