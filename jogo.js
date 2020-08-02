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
            jump: 4.6,
        };
        this.gravidade = 0.25;
        this.velocidade = 0;
    }
    draw(){
        drawElement(contexto, this.player);
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
    update(){
        this.updateMoviment();
        const oldVelocidade = this.velocidade;
        this.velocidade += this.gravidade;
        if(oldVelocidade <= 0 && this.velocidade > 0){
            sounds.fall.play();
        }
        this.player.y += this.velocidade;
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
        this.space = 90;
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
            const canoFloorY = canoSky.y + canoSky.height + this.space;
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
    generateCanos(){
        const framesInterval = 100;
        const intervalDone = frames%framesInterval===0;
        if(intervalDone){
            this.pares.push({ x: canvas.width, y: -150 * (Math.random()+1) });
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

const mensagemGetReady = new DrawableElement([{
    spriteX: 134,
    spriteY: 0,
    width: 174,
    height: 152,
    x: (canvas.width / 2) - 174 / 2,
    y: 50,
}]);

let telaAtiva = {};

const Telas = {
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
    JOGO: {
        start() {
            globais.flappyBird = new FlappyBirdElement();
            globais.canos = new CanosElement();
        },
        draw() {
            planoDeFundo.draw();
            globais.canos.draw();
            globais.chao.draw();
            globais.flappyBird.draw();
        },
        click() {
            globais.flappyBird.jump();
        },
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
                    y: par.y + globais.canos.height + globais.canos.space,
                });
                return playerSquare.intersect(parSquareFloor);
            });
            return !!parCollided;
        },
        hasCollision(){
            return this.hasCollisionFloor() || this.hasCollisionCanos();
        },
        update() {
            if (this.hasCollision()){
                sounds.hit.play();
                mudaTela(Telas.INICIO);
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

const mudaTela = (novaTela)=>{
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