import StreamAnimation from '/dist/stream-view/animations/animation.js';

const imageUrl = '/dist/stream-view/animations/sprites/Kvothe.jpeg';

const animes = [
    { w: 100, h: 100, frames: [{ x: 0, y: 0, w: 120, h: 120 }, { x: 100, y: 0, w: 120, h: 120 }, { x: 200, y: 0, w: 120, h: 120 }, { x: 300, y: 0, w: 120, h: 120 }] },
    { w: 50, h: 100, frames: [{ x: 0, y: 0, w: 120, h: 120 }, { x: 100, y: 0, w: 120, h: 120 }] },
]

const animation = new StreamAnimation({ src: imageUrl, w: 100, h: 100, size: { x: 100, y: 100 } }, animes);
animation.appendTo('#div-canvas');

let timer = 0;
animation.currentAnime = 1;
animation.currentFrame = 0;

animation.updateLogic = () => {
    console.log('update');
    //if (timer >= 20) {
    //    animation.currentFrame++;
    //    timer = 0;
    //    if (animation.currentFrame >= animes[0].frames.length)
    //        animation.currentFrame = 0;
    //}
    //timer++;
}

export function then(resolve) {
    resolve(animation);
}