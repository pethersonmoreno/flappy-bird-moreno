console.log('[Moreno] Flappy Bird');

const sprites = new Image();
sprites.src = './sprites.png';

let frames = 0;

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
const hasCollision = (flappyBird, chao)=>{
    const flappyBirdY = flappyBird.player.y + flappyBird.player.height;
    const chaoY = chao.parts[0].y;
    if( flappyBirdY >= chaoY){
        return true;
    }
    return false;
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
        },
        draw() {
            planoDeFundo.draw();
            globais.chao.draw();
            globais.flappyBird.draw();
        },
        click() {
            globais.flappyBird.jump();
        },
        update() {
            if (hasCollision(globais.flappyBird, globais.chao)){
                sounds.hit.play();
                mudaTela(Telas.INICIO);
                return;
            }
            globais.flappyBird.update();
            globais.chao.update();
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
globais.flappyBird = new FlappyBirdElement();
mudaTela(Telas.INICIO);
loop();