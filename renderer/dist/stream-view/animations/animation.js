
export default class StreamAnimation {
    constructor({ src, w, h, size }, animes) {
        this.element = document.createElement('div');
        this.animes = animes;
        this.currentAnime = 0;
        this.currentFrame = 0;
        this.setImage(src, { w, h }, size);
    }

    setImage(url, { w, h }, size) {
        this.sprite = { src: url, w: w, h: h };
        this.img = new Image();
        this.img.src = url;
        this.defaultSize = size;
        this.img.onload = () => {
            this.element.style.backgroundImage = `url(${url})`;
            this.setElementSize(size);
        };
    }

    setElementSize(size) {
        this.element.style.width = `${size.x}px`;
        this.element.style.height = `${size.y}px`;
        this.element.style.backgroundRepeat = 'no-repeat';
    }

    appendTo(element) {
        if (typeof element != 'óbject') element = document.querySelector(element);
        this.mainElement = element;
        this.mainElement.append(this.element);
    }

    show() {

    }

    hide() {

    }

    getCurrentAnime() {
        let anime = this.animes[this.currentAnime];
        if (!anime) anime = this.animes[0];
        return anime;
    }

    getCurrentFrame(anime) {
        if (this.currentFrame > anime.frames.length)
            return anime.frames[0];
        return anime.frames[this.currentFrame];
    }

    fixBackgroundSize(anime, frame) {
        if (!anime) anime = this.getCurrentAnime();
        if (!frame) frame = this.getCurrentFrame(anime);

        const currentSizing = { w: this.img.width, h: this.img.height };
        currentSizing.w = currentSizing.w * (anime.w / this.defaultSize.x);
        currentSizing.h = currentSizing.h * (anime.h / this.defaultSize.y);
        this.element.style.backgroundSize = `${currentSizing.w}px ${currentSizing.h}px`;
    }

    updateLogic() {
        // Should do:
        // Moving
        // Set Next Sprite Coordinates
    }

    updateAnimation() {
        const currentAnime = this.getCurrentAnime();
        const currentFrame = this.getCurrentFrame(currentAnime);
        if (!currentFrame) {
            console.log(currentFrame);
        }
        this.fixBackgroundSize(currentAnime);
        this.element.style.backgroundPosition = `-${currentFrame.x}px -${currentFrame.y}px`;
    }
}
