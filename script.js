const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const powerValueElement = document.getElementById('power-value');
const powerSegments = document.querySelectorAll('.segment');
const powerSegmentsContainer = document.getElementById('power-segments');
const restartBtn = document.getElementById('restartBtn');
const turnCountEl = document.getElementById('turnCount');
const reflectionBtn = document.getElementById('reflectionBtn');

let displayPowerLevel = 5;
let physicsActualPower = 20;
const friction = 0.985;
const restitution = 0.94;

let mouseX = 900;
let mouseY = 300;

let currentTurn = 1;
const maxTurns = 50;

let isTurnActive = false;
let gameOverState = "PLAYING";
let isReflectionEnabled = false;

function toggleReflection() {
    isReflectionEnabled = !isReflectionEnabled;
    if (reflectionBtn) {
        reflectionBtn.classList.toggle('active', isReflectionEnabled);
    }
}

if (reflectionBtn) {
    reflectionBtn.addEventListener('click', toggleReflection);
}

const ballColors = [
    '#ffffff', // 0: Beyaz
    '#ffcc00', // 1: Sarı
    '#0055ff', // 2: Mavi
    '#ff3333', // 3: Kırmızı
    '#9c27b0', // 4: Mor
    '#ff6600', // 5: Turuncu
    '#2e7d32', // 6: Koyu Yeşil
    '#8b4513', // 7: Kahverengi
    '#222222', // 8: Siyah
    '#e91e63', // 9: Pembe
    '#00bcd4', // 10: Turkuaz
    '#40E0D0', // 11: Turkuaz
    '#afb42b', // 12: Lime
    '#5d4037', // 13: Mat Kahve
    '#3949ab', // 14: İndigo
    '#004d40'  // 15: Petrol Yeşili
];

const pockets = [
    { x: 0, y: 0 }, { x: 450, y: 0 }, { x: 900, y: 0 },
    { x: 0, y: 600 }, { x: 450, y: 600 }, { x: 900, y: 600 }
];
const pocketRadius = 32;

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
        this.isBlack = (color === '#222222');
        this.mass = 1;
        this.inPocket = false;

        const v = 0.577;
        this.points = isWhite ? [] : [
            { x: v, y: v, z: v }, { x: v, y: v, z: -v },
            { x: v, y: -v, z: v }, { x: v, y: -v, z: -v },
            { x: -v, y: v, z: v }, { x: -v, y: v, z: -v },
            { x: -v, y: -v, z: v }, { x: -v, y: -v, z: -v }
        ];

        if (!this.isWhite) {
            this.randomizeOrientation();
        }
    }

    randomizeOrientation() {
        const angleX = Math.random() * Math.PI * 2;
        const angleY = Math.random() * Math.PI * 2;
        const angleZ = Math.random() * Math.PI * 2;

        const rotate = (p, ax, ay, az) => {
            let cosX = Math.cos(ax), sinX = Math.sin(ax);
            let y1 = p.y * cosX - p.z * sinX;
            let z1 = p.y * sinX + p.z * cosX;
            p.y = y1; p.z = z1;
            let cosY = Math.cos(ay), sinY = Math.sin(ay);
            let x2 = p.x * cosY + p.z * sinY;
            let z2 = -p.x * sinY + p.z * cosY;
            p.x = x2; p.z = z2;
            let cosZ = Math.cos(az), sinZ = Math.sin(az);
            let x3 = p.x * cosZ - p.y * sinZ;
            let y3 = p.x * sinZ + p.y * cosZ;
            p.x = x3; p.y = y3;
        };

        this.points.forEach(p => rotate(p, angleX, angleY, angleZ));
    }

    draw() {
        if (this.inPocket) return;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();

        ctx.lineWidth = 1.5;
        ctx.strokeStyle = this.color === '#222222' ? '#444444' : 'rgba(0,0,0,0.15)';
        ctx.stroke();

        this.points.forEach(p => {
            if (p.z > 0) {
                ctx.beginPath();
                let spotX = this.x + p.x * this.radius * 0.8;
                let spotY = this.y + p.y * this.radius * 0.8;
                let spotSize = this.radius * 0.12 * p.z;
                ctx.arc(spotX, spotY, spotSize, 0, Math.PI * 2);
                if (this.color === '#222222' || this.color === '#8b4513' || this.color === '#004d40' || this.id === 2) {
                    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
                } else {
                    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
                }
                ctx.fill();
                ctx.closePath();
            }
        });
    }

    updateSubStep(dt) {
        if (this.inPocket) return;
        this.x += this.vx * dt;
        this.y += this.vy * dt;

        const speed = Math.hypot(this.vx, this.vy);
        if (speed > 0.02 && this.points.length > 0) {
            const rotSpeed = (speed / this.radius) * dt;
            const ax = -this.vy / speed;
            const ay = this.vx / speed;
            const cosA = Math.cos(rotSpeed);
            const sinA = Math.sin(rotSpeed);

            this.points.forEach(p => {
                const nx = (cosA + ax * ax * (1 - cosA)) * p.x + (ax * ay * (1 - cosA)) * p.y + (ay * sinA) * p.z;
                const ny = (ax * ay * (1 - cosA)) * p.x + (cosA + ay * ay * (1 - cosA)) * p.y + (-ax * sinA) * p.z;
                const nz = (-ay * sinA) * p.x + (ax * sinA) * p.y + cosA * p.z;
                p.x = nx; p.y = ny; p.z = nz;
                const len = Math.hypot(p.x, p.y, p.z);
                p.x /= len; p.y /= len; p.z /= len;
            });
        }

        const frictionSub = Math.pow(friction, dt);
        this.vx *= frictionSub;
        this.vy *= frictionSub;

        if (Math.abs(this.vx) < 0.02) this.vx = 0;
        if (Math.abs(this.vy) < 0.02) this.vy = 0;

        if (this.x - this.radius < 0) { this.x = this.radius; this.vx *= -restitution; }
        if (this.x + this.radius > canvas.width) { this.x = canvas.width - this.radius; this.vx *= -restitution; }
        if (this.y - this.radius < 0) { this.y = this.radius; this.vy *= -restitution; }
        if (this.y + this.radius > canvas.height) { this.y = canvas.height - this.radius; this.vy *= -restitution; }

        pockets.forEach(pocket => {
            if (Math.hypot(this.x - pocket.x, this.y - pocket.y) < pocketRadius) {
                this.inPocket = true;
                this.vx = 0;
                this.vy = 0;
            }
        });
    }
}

let whiteBall;

function initGame() {
    balls = [];
    currentTurn = 1;
    isTurnActive = false;
    gameOverState = "PLAYING";

    powerSegmentsContainer.classList.add('first-hit');
    updatePower(7);

    turnCountEl.textContent = `1/${maxTurns}`;
    restartBtn.disabled = true;

    whiteBall = new Ball(0, 200, canvas.height / 2, ballRadius, ballColors[0], true);
    balls.push(whiteBall);

    const startX = 600;
    const startY = canvas.height / 2;
    const spacing = 1.05;

    let ballIndices = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
    for (let i = ballIndices.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [ballIndices[i], ballIndices[j]] = [ballIndices[j], ballIndices[i]];
    }

    let listIdx = 0;
    for (let row = 0; row < 5; row++) {
        for (let col = 0; col <= row; col++) {
            let x = startX + row * (ballRadius * 2 * 0.9) + (Math.random() - 0.5) * 0.5;
            let y = startY + (col - row / 2) * (ballRadius * 2 * spacing) + (Math.random() - 0.5) * 0.5;

            let color = ballColors[ballIndices[listIdx]];
            balls.push(new Ball(balls.length, x, y, ballRadius, color));
            listIdx++;
        }
    }

    mouseX = 900;
    mouseY = 300;
}

function resolveCollision(b1, b2) {
    if (b1.inPocket || b2.inPocket) return;
    const xDist = b2.x - b1.x;
    const yDist = b2.y - b1.y;
    const dist = Math.hypot(xDist, yDist);

    if (dist < b1.radius + b2.radius) {
        const overlap = (b1.radius + b2.radius) - dist;
        const nx = dist > 0 ? xDist / dist : 1;
        const ny = dist > 0 ? yDist / dist : 0;
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

    powerSegments.forEach((seg, idx) => {
        if (idx < level) {
            seg.classList.add('active');
        } else {
            seg.classList.remove('active');
        }
    });
}

window.addEventListener('keydown', (e) => {
    if (e.key === 'x' || e.key === 'X') {
        toggleReflection();
    }
    if (gameOverState !== "PLAYING" || currentTurn === 1) return;
    if (['1', '2', '3', '4', '5'].includes(e.key)) {
        updatePower(parseInt(e.key));
    }
});

window.addEventListener('mousemove', (e) => {
    if (gameOverState !== "PLAYING") return;
    const rect = canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
});

window.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return;
    if (gameOverState !== "PLAYING") return;
    const allStopped = balls.every(ball => ball.vx === 0 && ball.vy === 0);

    if (allStopped) {
        isTurnActive = true;
        const dx = mouseX - whiteBall.x;
        const dy = mouseY - whiteBall.y;
        const distance = Math.hypot(dx, dy);

        if (distance > 0) {
            const dirX = dx / distance;
            const dirY = dy / distance;
            whiteBall.vx = dirX * physicsActualPower;
            whiteBall.vy = dirY * physicsActualPower;
        }
    }
});

// "Sağ tık ile menü açma" özelliği devre dışı
document.addEventListener('contextmenu', (event) => {
    event.preventDefault();
});

restartBtn.addEventListener('click', () => initGame());

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

    pockets.forEach(pocket => {
        ctx.beginPath();
        ctx.arc(pocket.x, pocket.y, pocketRadius, 0, Math.PI * 2);
        ctx.fillStyle = '#111';
        ctx.fill();
    });

    if (gameOverState === "PLAYING") {
        const subSteps = 8;
        const dt = 1 / subSteps;
        for (let step = 0; step < subSteps; step++) {
            balls.forEach(ball => ball.updateSubStep(dt));
            for (let i = 0; i < balls.length; i++) {
                for (let j = i + 1; j < balls.length; j++) {
                    resolveCollision(balls[i], balls[j]);
                }
            }
        }
    }

    balls.forEach(ball => ball.draw());

    const allStopped = balls.every(ball => ball.vx === 0 && ball.vy === 0);

    if (allStopped && gameOverState === "PLAYING") {
        const dx = mouseX - whiteBall.x;
        const dy = mouseY - whiteBall.y;
        const distance = Math.hypot(dx, dy);

        if (distance > 0) {
            const dirX = dx / distance;
            const dirY = dy / distance;

            let closestBall = null;
            let minDist = Infinity;

            balls.forEach(ball => {
                if (ball === whiteBall || ball.inPocket) return;
                const ballToWhiteX = ball.x - whiteBall.x;
                const ballToWhiteY = ball.y - whiteBall.y;
                const proj = ballToWhiteX * dirX + ballToWhiteY * dirY;
                if (proj > 0) {
                    const offX = ballToWhiteX - proj * dirX;
                    const offY = ballToWhiteY - proj * dirY;
                    const offDist = Math.hypot(offX, offY);
                    if (offDist < ballRadius * 2) {
                        const distToCollision = proj - Math.sqrt(Math.pow(ballRadius * 2, 2) - Math.pow(offDist, 2));
                        if (distToCollision < minDist) {
                            minDist = distToCollision;
                            closestBall = ball;
                        }
                    }
                }
            });

            ctx.beginPath();
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
            ctx.lineWidth = 1.5;
            ctx.setLineDash([5, 5]);

            if (closestBall) {
                const collisionX = whiteBall.x + dirX * minDist;
                const collisionY = whiteBall.y + dirY * minDist;

                ctx.moveTo(whiteBall.x, whiteBall.y);
                ctx.lineTo(collisionX, collisionY);
                ctx.stroke();

                const targetAngle = Math.atan2(closestBall.y - collisionY, closestBall.x - collisionX);

                ctx.beginPath();
                ctx.strokeStyle = 'rgba(255, 235, 59, 0.55)';
                ctx.lineWidth = 1.5;
                ctx.setLineDash([5, 5]);
                ctx.moveTo(closestBall.x, closestBall.y);
                ctx.lineTo(closestBall.x + Math.cos(targetAngle) * 1500, closestBall.y + Math.sin(targetAngle) * 1500);
                ctx.stroke();
            } else {
                let tX = Infinity;
                let tY = Infinity;

                if (dirX > 0) tX = (canvas.width - whiteBall.x) / dirX;
                else if (dirX < 0) tX = (0 - whiteBall.x) / dirX;

                if (dirY > 0) tY = (canvas.height - whiteBall.y) / dirY;
                else if (dirY < 0) tY = (0 - whiteBall.y) / dirY;

                let tHit = Math.min(tX, tY);
                let hitX = whiteBall.x + dirX * tHit;
                let hitY = whiteBall.y + dirY * tHit;

                ctx.moveTo(whiteBall.x, whiteBall.y);
                ctx.lineTo(hitX, hitY);

                if (isReflectionEnabled) {
                    let reflectedDirX = dirX;
                    let reflectedDirY = dirY;

                    if (tX < tY) {
                        reflectedDirX = -dirX;
                    } else if (tY < tX) {
                        reflectedDirY = -dirY;
                    } else {
                        reflectedDirX = -dirX;
                        reflectedDirY = -dirY;
                    }

                    let closestBallRefl = null;
                    let minDistRefl = Infinity;

                    balls.forEach(ball => {
                        if (ball === whiteBall || ball.inPocket) return;
                        const ballToHitX = ball.x - hitX;
                        const ballToHitY = ball.y - hitY;
                        const proj = ballToHitX * reflectedDirX + ballToHitY * reflectedDirY;
                        if (proj > 0) {
                            const offX = ballToHitX - proj * reflectedDirX;
                            const offY = ballToHitY - proj * reflectedDirY;
                            const offDist = Math.hypot(offX, offY);
                            if (offDist < ballRadius * 2) {
                                const distToCollision = proj - Math.sqrt(Math.pow(ballRadius * 2, 2) - Math.pow(offDist, 2));
                                if (distToCollision > 0 && distToCollision < minDistRefl) {
                                    minDistRefl = distToCollision;
                                    closestBallRefl = ball;
                                }
                            }
                        }
                    });

                    if (closestBallRefl) {
                        const reflCollisionX = hitX + reflectedDirX * minDistRefl;
                        const reflCollisionY = hitY + reflectedDirY * minDistRefl;

                        ctx.lineTo(reflCollisionX, reflCollisionY);
                        ctx.stroke();

                        const targetAngle = Math.atan2(closestBallRefl.y - reflCollisionY, closestBallRefl.x - reflCollisionX);

                        ctx.beginPath();
                        ctx.strokeStyle = 'rgba(255, 235, 59, 0.55)';
                        ctx.lineWidth = 1.5;
                        ctx.setLineDash([5, 5]);
                        ctx.moveTo(closestBallRefl.x, closestBallRefl.y);
                        ctx.lineTo(closestBallRefl.x + Math.cos(targetAngle) * 1500, closestBallRefl.y + Math.sin(targetAngle) * 1500);
                        ctx.stroke();
                    } else {
                        ctx.lineTo(hitX + reflectedDirX * 1500, hitY + reflectedDirY * 1500);
                        ctx.stroke();
                    }
                } else {
                    ctx.stroke();
                }
            }
            ctx.setLineDash([]);
        }
    }

    if (isTurnActive && allStopped) {
        isTurnActive = false;

        if (gameOverState === "PLAYING") {
            if (whiteBall.inPocket) {
                gameOverState = "LOST";
            } else {
                const blackBall = balls.find(b => b.isBlack);
                if (blackBall.inPocket) {
                    const othersLeft = balls.some(b => !b.isWhite && !b.isBlack && !b.inPocket);
                    if (othersLeft) {
                        gameOverState = "LOST";
                    } else {
                        gameOverState = "WON";
                    }
                }
            }

            if (gameOverState === "PLAYING") {
                if (currentTurn === 1) {
                    powerSegmentsContainer.classList.remove('first-hit');
                    updatePower(3);
                }

                if (currentTurn >= maxTurns) {
                    gameOverState = "LOST";
                } else {
                    currentTurn++;
                    turnCountEl.textContent = `${currentTurn}/${maxTurns}`;
                }
            }
        }
    }

    if (gameOverState !== "PLAYING") {
        drawEndScreen();
        restartBtn.disabled = false;
    }

    requestAnimationFrame(animate);
}

initGame();
animate();