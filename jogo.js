console.log('[Moreno] Flappy Bird');

const sprites = new Image();
sprites.src = './sprites.png';

let frames = 0;

class SquarePosition {
    constructor({width, height, x, y}){
        this.width = width;
        this.height = height;
        this.x = x;
        this.y = y;
    }
    corners(){
        return {
            topLeft: { x: this.x, y: this.y },
            topRight: { x: this.x + this.width, y: this.y },
            bottomLeft: { x: this.x, y: this.y + this.height },
            bottomRight: { x: this.x + this.width, y: this.y + this.height },
        }
    }
    isPointInCorners(point, corners){
        return (
            point.x >= corners.topLeft.x
            && point.x <= corners.bottomRight.x
            && point.y >= corners.topLeft.y
            && point.y <= corners.bottomRight.y
        );
    }
    intersect(otherSquare){
        const selfCorners = this.corners();
        const otherCorners = otherSquare.corners();
        return (
            this.isPointInCorners(selfCorners.topLeft, otherCorners)
            || this.isPointInCorners(selfCorners.topRight, otherCorners)
            || this.isPointInCorners(selfCorners.bottomLeft, otherCorners)
            || this.isPointInCorners(selfCorners.bottomRight, otherCorners)
        );
    }
}


let timeoutAudio;
class AudioPlay{
    constructor(src){
        this.audio = new Audio(src);
    }
    play(){
        if(timeoutAudio){
            clearTimeout(timeoutAudio);
        }
        timeoutAudio = setTimeout(()=>{
            this.audio.currentTime = 0;
            this.audio.play();
        }, 50);
    }
}

const sounds = {
    hit: new AudioPlay('./efeitos/hit.wav'),
    fall: new AudioPlay('./efeitos/fall.wav'),
    scored: new AudioPlay('./efeitos/scored.wav'),
    jump: new AudioPlay('./efeitos/jump.wav'),
};

const canvas = document.querySelector('canvas');
const contexto = canvas.getContext('2d');

const drawImageRotated = (ctx, image, spriteX, spriteY, spriteWidth, spriteHeight, x, y, w, h, degrees) => {
    ctx.save();
    ctx.translate(x+w/2, y+h/2);
    ctx.rotate(degrees*Math.PI/180.0);
    ctx.translate(-x-w/2, -y-h/2);
    ctx.drawImage(image, spriteX, spriteY, spriteWidth, spriteHeight, x, y, w, h);
    ctx.restore();
};

const globais = {};


const drawElement = (ctx, element) => {
    ctx.drawImage(
        sprites, 
        element.spriteX, element.spriteY, 
        element.width, element.height, 
        element.x, element.y, 
        element.width, element.height, 
    );
}

const draw = function () {
    drawElement(contexto, this)
};

class DrawableElement{
    constructor(parts){
        this.parts = parts;
    }
    draw(){
        this.parts.forEach(part => {
            drawElement(contexto, part);
        });
    }
}
class PlanoDeFundoElement extends DrawableElement{
    constructor(){
        const part1 = {
            spriteX: 390,
            spriteY: 0,
            width: 275,
            height: 204,
            x: 0,
            y: canvas.height - 204,
        };
        const part2 = { ...part1, x: part1.width };
        super([part1, part2]);
    }
    draw(){
        contexto.fillStyle = '#70c5ce';
        contexto.fillRect(0, 0, canvas.width, canvas.height);
        super.draw();
    }
};
class FlappyBirdElement{
    constructor(){
        this.moviments = [
            { spriteX: 0, spriteY: 0, },
            { spriteX: 0, spriteY: 26, },
            { spriteX: 0, spriteY: 52, },
            { spriteX: 0, spriteY: 26, },
        ]
        this.currentMoviment = 0;
        this.player = {
            ...this.moviments[this.currentMoviment],
            width: 33,
            height: 24,
            x: 10,
            y: 50,
            jump: null,
        };
        this.proportionJump = 19;
        this.gravidade = 0.25;
        this.velocidade = 0;
        this.player.jump = this.gravidade * this.proportionJump;
    }
    increaseDifficulty(){
        this.gravidade += 0.001;
        this.player.jump = this.gravidade * this.proportionJump;
    }
    draw(degrees = 0){
        drawImageRotated(
            contexto, 
            sprites, 
            this.player.spriteX, this.player.spriteY, 
            this.player.width, this.player.height, 
            this.player.x, this.player.y, 
            this.player.width, this.player.height, 
            degrees
        );
    }
    jump() {
        this.velocidade = -this.player.jump;
        sounds.jump.play()
    }
    updateMoviment(){
        const framesInterval = 10;
        const intervalDone = frames%framesInterval===0;
        if(intervalDone){
            const repeatAt = this.moviments.length;
            this.currentMoviment = (this.currentMoviment+1) % repeatAt;
            this.player = { ...this.player, ...this.moviments[this.currentMoviment] };
        }
    }
    canMove(){
        if(this.player.y + this.velocidade < 0){
            return false;
        }
        const playerSquareBefore = new SquarePosition({
            width: this.player.width,
            height: this.player.height,
            x: this.player.x,
            y: this.player.y,
        });
        const playerSquareAfter = new SquarePosition({
            width: this.player.width,
            height: this.player.height,
            x: this.player.x,
            y: this.player.y + this.velocidade,
        });
        const parCollided = globais.canos.pares.find(par => {
            const parSquareSky = new SquarePosition({
                width: globais.canos.width,
                height: globais.canos.height,
                x: par.x,
                y: par.y,
            });
            const collidedBefore = (
                playerSquareBefore.intersect(parSquareSky)
                || parSquareSky.intersect(playerSquareBefore)
            );
            const collidedAfter = (
                playerSquareAfter.intersect(parSquareSky)
                || parSquareSky.intersect(playerSquareAfter)
            );
            return collidedAfter && !collidedBefore;
        });
        return !parCollided;
    }
    update(){
        this.updateMoviment();
        const oldVelocidade = this.velocidade;
        this.velocidade += this.gravidade;
        if(oldVelocidade <= 0 && this.velocidade > 0){
            sounds.fall.play();
        }
        if(this.canMove()){
            this.player.y += this.velocidade;
        }
    }
};

const planoDeFundo = new PlanoDeFundoElement();

class ChaoElement extends DrawableElement{
    constructor(){
        const part1 = {
            spriteX: 0,
            spriteY: 610,
            width: 224,
            height: 112,
            x: 0,
            y: canvas.height - 112,
        };
        const part2 = {
            ...part1,
            x: part1.width,
        };
        super([part1, part2]);
    }
    update(){
        const moviment = 1;
        const repeatAt = this.parts[0].width/2;
        this.parts[0].x = (this.parts[0].x -moviment)%repeatAt;
        this.parts[1].x = this.parts[0].x+this.parts[0].width;
    }
}

class CanosElement{
    constructor(){
        this.width = 52;
        this.height = 400;
        this.floor = {
            spriteX: 0,
            spriteY: 169,
        };
        this.sky = {
            spriteX: 52,
            spriteY: 169,
        };
        this.space = 250;
        this.pares = [];
    }
    draw(){
        this.pares.forEach(par => {
            const yRandom = par.y;
            const canoSkyX = par.x;
            const canoSkyY = yRandom;
            const canoSky = {
                ...this.sky,
                x: canoSkyX,
                y: canoSkyY,
                width: this.width,
                height: this.height,
            };

            const canoFloorX = par.x;
            const canoFloorY = canoSky.y + canoSky.height + par.space;
            const canoFloor = {
                ...this.floor,
                x: canoFloorX,
                y: canoFloorY,
                width: this.width,
                height: this.height,
            };
            drawElement(contexto, canoSky);
            drawElement(contexto, canoFloor);
        });
    }
    increaseDifficulty(){
        this.space -= 5;
    }
    generateCanos(){
        const framesInterval = 100;
        const intervalDone = frames%framesInterval===0;
        if(intervalDone){
            this.pares.push({ x: canvas.width, y: -this.space * (Math.random()+1), space: this.space });
        }
    }
    movimentCanos(){
        this.pares.forEach((par)=>{
            par.x -= 2;
        });
    }
    isVisible(x){
        return x >= -this.width;
    }
    recycleCanos(){
        this.pares = this.pares.filter(par => this.isVisible(par.x));
    }
    update(){
        this.generateCanos();
        this.movimentCanos();
        this.recycleCanos();
    }
}

class MensagemGetReady extends DrawableElement{
    constructor(){
        super([{
            spriteX: 134,
            spriteY: 0,
            width: 174,
            height: 152,
            x: (canvas.width / 2) - 174 / 2,
            y: 50,
        }]);
    }
    drawText(text, x, y){
        contexto.textAlign = "center";
        contexto.font = "bold 17px Arial";
        contexto.strokeStyle = 'white';
        contexto.lineWidth = 3;
        contexto.strokeText(text, x, y);
        contexto.fillStyle = 'red';
        contexto.fillText(text, x, y);
    }
    draw(){
        super.draw();
        const xCenter = canvas.width / 2;
        this.drawText('SPACE', xCenter, 230);
        this.drawText('ARROW UP', xCenter, 260);
    }
}

const mensagemGetReady = new MensagemGetReady();
const gameOverPosition = {
    x: (canvas.width / 2) - 226 / 2,
    y: 50,
}
const mensagemGameOver = new DrawableElement([{
    spriteX: 134,
    spriteY: 153,
    width: 226,
    height: 200,
    x: gameOverPosition.x,
    y: gameOverPosition.y,
}]);
const medalSizePosition = {
    width: 44,
    height: 44,
    x: gameOverPosition.x + 26,
    y: gameOverPosition.y + 86,
}
const medal = {
    current: null,
    easy: new DrawableElement([{
        ...medalSizePosition,
        spriteX: 0,
        spriteY: 78,
    }]),
    medium: new DrawableElement([{
        ...medalSizePosition,
        spriteX: 48,
        spriteY: 78,
    }]),
    hard: new DrawableElement([{
        ...medalSizePosition,
        spriteX: 0,
        spriteY: 124,
    }]),
    best: new DrawableElement([{
        ...medalSizePosition,
        spriteX: 48,
        spriteY: 124,
    }]),
};

let telaAtiva = {};

class ScoreElement {
    constructor({initialValue, x, y, color}){
        this.value = initialValue;
        this.x = x;
        this.y = y;
        this.color = color;
    }
    draw() {
        contexto.textAlign = "right";
        contexto.font = "bold 17px Arial";
        contexto.fillStyle = this.color;
        contexto.fillText(this.value.toString(), this.x, this.y);
    }
}
class CurrentScoreElement extends ScoreElement {
    constructor(){
        super({
            initialValue: 0,
            x: 252,
            y: 145,
            color: '#ec5140',
        });
    }
    draw() {
        contexto.textAlign = "right";
        contexto.font = "bold 17px Arial";
        contexto.fillStyle = this.color;
        contexto.fillText(this.value.toString(), this.x, this.y);
    }
    drawPlaying() {
        const centerX = canvas.width / 2;
        const topY = canvas.height / 6;
        contexto.textAlign = "center";
        contexto.font = "bold 45px Arial";
        contexto.strokeStyle = 'black';
        contexto.lineWidth = 4;
        contexto.strokeText(this.value.toString(), centerX, topY);
        contexto.fillStyle = 'white';
        contexto.fillText(this.value.toString(), centerX, topY);
    }
}

const currentScore = new CurrentScoreElement();
const bestScore = new ScoreElement({
    initialValue: 40,
    x: 252,
    y: 185,
    color: '#ec5140',
});

const Telas = {
    helpers: {
        hasCollisionFloor(){
            const flappyBirdY = globais.flappyBird.player.y + globais.flappyBird.player.height;
            const chaoY = globais.chao.parts[0].y;
            return flappyBirdY >= chaoY;
        },
        hasCollisionCanos(){
            const playerSquare = new SquarePosition({
                width: globais.flappyBird.player.width,
                height: globais.flappyBird.player.height,
                x: globais.flappyBird.player.x,
                y: globais.flappyBird.player.y,
            });
            const parCollided = globais.canos.pares.find(par => {
                const parSquareSky = new SquarePosition({
                    width: globais.canos.width,
                    height: globais.canos.height,
                    x: par.x,
                    y: par.y,
                });
                if(playerSquare.intersect(parSquareSky)){
                    return true;
                }
                const parSquareFloor = new SquarePosition({
                    width: globais.canos.width,
                    height: globais.canos.height,
                    x: par.x,
                    y: par.y + globais.canos.height + par.space,
                });
                return playerSquare.intersect(parSquareFloor);
            });
            return !!parCollided;
        },
        hasCollisionOnCanos(){
            const playerSquare = new SquarePosition({
                width: globais.flappyBird.player.width,
                height: globais.flappyBird.player.height,
                x: globais.flappyBird.player.x,
                y: globais.flappyBird.player.y,
            });
            const parCollided = globais.canos.pares.find(par => {
                const spaceIgnore = globais.canos.width*0.2;
                const parSquareFloor = new SquarePosition({
                    width: globais.canos.width-spaceIgnore,
                    height: globais.flappyBird.player.height,
                    x: par.x+(spaceIgnore/2),
                    y: par.y + globais.canos.height + par.space,
                });
                const result = (
                    parSquareFloor.intersect(playerSquare)
                    || playerSquare.intersect(parSquareFloor)
                );
                return result;
            });
            return !!parCollided;
        }
    },
    INICIO: {
        draw() {
            planoDeFundo.draw();
            globais.chao.draw();
            globais.flappyBird.draw();
            mensagemGetReady.draw();
        },
        click() {
            mudaTela(Telas.JOGO);
        },
        update() {
            globais.chao.update();
        },
    },
    GAME_OVER: {
        start() {
            this.degreesDying = 0;
            this.waitingViewGameOver = true;
            setTimeout(()=>{
                this.waitingViewGameOver = false;
            }, 1000);
        },
        draw() {
            planoDeFundo.draw();
            globais.canos.draw();
            globais.chao.draw();
            globais.flappyBird.draw(this.degreesDying);
            mensagemGameOver.draw();
            medal.current.draw();
            currentScore.draw();
            bestScore.draw();
        },
        hasCollisionOnFloorOrCanos(){
            return Telas.helpers.hasCollisionFloor() || Telas.helpers.hasCollisionOnCanos();
        },
        click() {
            if(this.waitingViewGameOver || !this.hasCollisionOnFloorOrCanos()){
                return;
            }
            mudaTela(Telas.JOGO);
        },
        update() {
            if(!this.hasCollisionOnFloorOrCanos()){
                globais.flappyBird.update();
                this.degreesDying += 1;
            }
        },
    },
    JOGO: {
        start() {
            globais.flappyBird = new FlappyBirdElement();
            globais.canos = new CanosElement();
            currentScore.value = 0;
            this.intervalScore = setInterval(()=>{
                currentScore.value += 1;
                sounds.scored.play();
                globais.flappyBird.increaseDifficulty();
                globais.canos.increaseDifficulty();
            }, 1000);
        },
        end() {
            clearInterval(this.intervalScore);
            if(currentScore.value >= bestScore.value){
                bestScore.value = currentScore.value;
                medal.current = medal.best;
            } else if(currentScore.value >= 25){
                medal.current = medal.hard;
            } else if(currentScore.value >= 12){
                medal.current = medal.medium;
            } else {
                medal.current = medal.easy;
            }
        },
        draw() {
            planoDeFundo.draw();
            globais.canos.draw();
            globais.chao.draw();
            currentScore.drawPlaying();
            globais.flappyBird.draw();
        },
        click() {
            globais.flappyBird.jump();
        },
        hasCollision(){
            return Telas.helpers.hasCollisionFloor() || Telas.helpers.hasCollisionCanos();
        },
        update() {
            if (this.hasCollision()){
                sounds.hit.play();
                mudaTela(Telas.GAME_OVER);
                return;
            }
            globais.flappyBird.update();
            globais.chao.update();
            globais.canos.update();
        },
    }
}

const loop = () => {
    telaAtiva.draw();
    telaAtiva.update();

    frames += 1;

    window.requestAnimationFrame(loop);
};

window.addEventListener('click', ()=>{
    if(telaAtiva.click){
        telaAtiva.click();
    }
});
window.addEventListener ('keydown', (event) => {
    const isSpace = event.code === 'Space';
    const isArrowUp = event.code === 'ArrowUp';
    const fireJump = isSpace || isArrowUp;
    if(fireJump){
        event.preventDefault();
        event.stopPropagation();
        telaAtiva.click();
    }
});

const mudaTela = (novaTela)=>{
    if(telaAtiva.end) {
        telaAtiva.end();
    }
    if(novaTela.start) {
        novaTela.start();
    }
    telaAtiva = novaTela;
};

globais.chao = new ChaoElement();
globais.canos = new CanosElement();
globais.flappyBird = new FlappyBirdElement();
mudaTela(Telas.INICIO);
loop();