console.log('[Moreno] Flappy Bird');

const sprites = new Image();
sprites.src = './sprites.png';

const canvas = document.querySelector('canvas');
const contexto = canvas.getContext('2d');

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

const planoDeFundo = new PlanoDeFundoElement();

const chao = new DrawableElement([buildChaoPart(0), buildChaoPart(224)]);

const flappyBird = new DrawableElement([{
    spriteX: 0,
    spriteY: 0,
    width: 33,
    height: 24,
    x: 10,
    y: 50,
}]);

const loop = () => {
    planoDeFundo.draw();
    chao.draw();
    flappyBird.draw();

    flappyBird.parts[0].y += 1;

    window.requestAnimationFrame(loop);
};

loop();