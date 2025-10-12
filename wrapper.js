class Shimeji {
    #img; #parent; #manager;

    constructor(parent, name, manager) {
        this.name = name;
        this.#parent = parent;
        this.#img = document.createElement("img");
        this.#img.style.position = "fixed";
        for (const attr of ["-webkit-touch-callout", "-webkit-user-select", "-khtml-user-select",
            "-moz-user-select", "-ms-user-select", "user-select"])
        {
            this.#img.style.setProperty(attr, "none");
        }
        this.#manager = manager;
        document.body.appendChild(this.#img);

        this.#img.onmousedown = () => {
            this.#parent.setDraggedShimeji(this);
            this.#manager.setDragging(true);
            return false;
        };
        this.#img.onmouseup = () => {
            this.#parent.releaseDraggedShimeji();
            return false;
        };
    }

    stopDragging() {
        this.#manager.setDragging(false);
    }

    tick() {
        this.#manager.tick();

        const imageName = this.#manager.getImageName();
        if (imageName === "") {
            this.#img.src = "";
            return;
        }
        this.#parent.loadImage(this.name, imageName, (image)=>{
            const drawInfo = this.#manager.getDrawInfo(image.width, image.height);
            const x = drawInfo.getX(), y = drawInfo.getY(), width = drawInfo.getWidth(),
                height = drawInfo.getHeight();
            this.#img.src = image.src;
            this.#img.style.left = `${x}px`;
            this.#img.style.top = `${y}px`;
            this.#img.style.width = `${width}px`;
            this.#img.style.height = `${height}px`;
            if (drawInfo.getMirrored()) {
                this.#img.style.setProperty("transform", "scaleX(-1)");
                this.#img.style.setProperty("-webkit-transform", "scaleX(-1)");
            }
            else {
                this.#img.style.setProperty("transform", "none");
                this.#img.style.setProperty("-webkit-transform", "none");
            }
        });
    }

    delete() {
        this.#img.remove();
        this.#manager.delete();
    }
}

class ShijimaWeb {
    #ctx; #env; #factory; #images;
    #onmouseup; #onmousemove; #draggedShimeji;

    static async load() {
        globalThis.Shijima = await createShijima();
    }

    loadImage(shimejiName, path, cb) {
        let image = this.#images.get(shimejiName)?.get(path);
        if (image != null) {
            if (image.complete) {
                cb(image);
            }
            else {
                image.addEventListener("load", ()=>{
                    cb(image);
                });
            }
            return;
        }
        if (!this.#images.has(shimejiName)) {
            this.#images.set(shimejiName, new Map());
        }
        image = new Image();
        this.#images.get(shimejiName).set(path, image);
        image.addEventListener("load", ()=>{
            cb(image);
        });
        try {
            const normalized = Shijima.normalizeFilename(path);
            const buf = Shijima.FS.readFile(`/tmp/shimeji/${shimejiName}.mascot/img/${normalized}`);
            const blob = new Blob([buf]);
            image.src = URL.createObjectURL(blob);
        }
        catch (err) {
            console.error(err);
            image.src = "data:image/png;base64,";
        }
    }

    constructor() {
        this.#ctx = new Shijima.ScriptContext();
        this.#env = new Shijima.MascotEnvironment();
        this.#env.setSubticks(2);
        this.#env.setAllowsBreeding(false);
        this.#factory = new Shijima.MascotFactory(this.#ctx, this.#env);
        this.#images = new Map();
        this.#draggedShimeji = null;
        this.mascots = [];
        
        this.#onmousemove = (ev) => {
            this.#env.moveMouse(ev.clientX, ev.clientY);
        }
        this.#onmouseup = (ev) => {
            this.releaseDraggedShimeji();
        };
        document.addEventListener("mousemove", this.#onmousemove);
        document.addEventListener("mouseup", this.#onmouseup);
        this.#updateEnvironment();
    }

    #updateEnvironment() {
        const width = document.documentElement.clientWidth;
        const height = document.documentElement.clientHeight;
        this.#env.setViewport(this.width = width, this.height = height);
        return { width, height };
    }
    
    spawn(name) {
        const { width, height } = this.#updateEnvironment();
        const x = (width > 100) ? (50 + Math.random() * (width - 100)) : 50;
        const y = (height > 100) ? (50 + Math.random() * (height - 100)) : 50;
        const adam = this.#factory.spawnAdam(name, x, y, "Fall", Math.random() > 0.5);
        const shimeji = new Shimeji(this, name, adam);
        this.mascots.push(shimeji);
        return shimeji;
    }

    tick() {
        this.#updateEnvironment();
        this.#env.startTick();
        for (const shimeji of this.mascots) {
            shimeji.tick();
        }
        this.#env.endTick();
    }

    releaseDraggedShimeji() {
        if (this.#draggedShimeji != null) {
            this.#draggedShimeji.stopDragging();
        }
        this.#draggedShimeji = null;
    }

    setDraggedShimeji(shimeji) {
        this.releaseDraggedShimeji();
        this.#draggedShimeji = shimeji;
    }

    registerTemplate(name, path, actions, behaviors) {
        if (this.#factory.hasTemplate(name)) {
            this.dismissAll(name);
            this.#factory.deregisterTemplate(name);
        }
        this.#factory.registerTemplate(name, path, actions, behaviors);
    }

    dismissAll(name) {
        for (let i=this.mascots.length-1; i>=0; --i) {
            if (this.mascots[i].name === name) {
                this.mascots[i].delete();
                this.mascots.splice(i, 1);
            }
        }
        this.#images.delete(name);
    }

    delete() {
        for (const shimeji of this.mascots) {
            shimeji.delete();
        }
        this.mascots = null;
        this.#factory.delete();
        this.#factory = null;
        this.#env.delete();
        this.#env = null;
        this.#ctx.delete();
        this.#ctx = null;
        document.removeEventListener("mousemove", this.#onmousemove);
        this.#onmousemove = null;
        document.removeEventListener("mouseup", this.#onmouseup);
        this.#onmouseup = null;
    }
}
