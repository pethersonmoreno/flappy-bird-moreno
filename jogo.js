console.log('[Moreno] Flappy Bird');

const sprites = new Image();
sprites.src = './sprites.png';

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

const buildChaoPart = (x) => ({
    spriteX: 0,
    spriteY: 610,
    width: 224,
    height: 112,
    x,
    y: canvas.height - 112,
})

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
class FlappyBirdElement extends DrawableElement{
    constructor(){
        const player = {
            spriteX: 0,
            spriteY: 0,
            width: 33,
            height: 24,
            x: 10,
            y: 50,
            jump: 4.6,
        };
        super([player]);
        this.player = player;
        this.gravidade = 0.25;
        this.velocidade = 0;
    }
    jump() {
        this.velocidade = -this.player.jump;
        sounds.jump.play()
    }
    update(){
        const oldVelocidade = this.velocidade;
        this.velocidade += this.gravidade;
        if(oldVelocidade <= 0 && this.velocidade > 0){
            sounds.fall.play();
        }
        this.parts[0].y += this.velocidade;
    }
};

const planoDeFundo = new PlanoDeFundoElement();

const chao = new DrawableElement([buildChaoPart(0), buildChaoPart(224)]);

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
            chao.draw();
            globais.flappyBird.draw();
            mensagemGetReady.draw();
        },
        click() {
            mudaTela(Telas.JOGO);
        },
        update() {

        },
    },
    JOGO: {
        start() {
            globais.flappyBird = new FlappyBirdElement();
        },
        draw() {
            planoDeFundo.draw();
            chao.draw();
            globais.flappyBird.draw();
        },
        click() {
            globais.flappyBird.jump();
        },
        update() {
            if (hasCollision(globais.flappyBird, chao)){
                sounds.hit.play();
                mudaTela(Telas.INICIO);
                return;
            }
            globais.flappyBird.update();
        },
    }
}

const loop = () => {
    telaAtiva.draw();
    telaAtiva.update();

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

globais.flappyBird = new FlappyBirdElement();
mudaTela(Telas.INICIO);
loop();