ShijimaWeb.load().then(async() => {
    // initialize Shijima
    const shijima = new ShijimaWeb();
    
    // initialize drag-and-drop
    const fileDrop = document.getElementById("file-drop");
    window.ondragenter = window.ondragover = fileDrop.ondragenter =
        fileDrop.ondragover = (e)=>
    {
        fileDrop.style.visibility = "visible";
        e.dataTransfer.dropEffect = "copy";
        e.preventDefault();
    };
    fileDrop.ondragleave = (e)=>{
        fileDrop.style.visibility = "hidden";
    };
    const importBytes = (bytes)=>{
        const fd = Shijima.FS.open("/tmp/archive.bin", "w");
        for (let i=0, chunk=1024*1024; i<bytes.length; i += chunk) {
            const subBytes = bytes.subarray(i, Math.min(i+chunk, bytes.length));
            Shijima.FS.write(fd, subBytes, 0, subBytes.length);
        }
        Shijima.FS.close(fd);
        bytes = null;
        const imported = Shijima.extractShimeji("/tmp/archive.bin");
        Shijima.FS.unlink("/tmp/archive.bin");
        if (Array.isArray(imported)) {
            for (const name of imported) {
                const actions = Shijima.FS.readFile(`/tmp/shimeji/${name}.mascot/actions.xml`);
                const behaviors = Shijima.FS.readFile(`/tmp/shimeji/${name}.mascot/behaviors.xml`);
                shijima.registerTemplate(name, "", actions, behaviors);
                shijima.spawn(name);
            }
        }
        else {
            console.error("Import failed:", imported);
        }
    };
    fileDrop.ondrop = async(e)=>{
        e.preventDefault();
        for (const file of e.dataTransfer.files) {
            let bytes = await file.bytes();
            importBytes(bytes);
        }
        fileDrop.style.visibility = "hidden";
    };
    (async()=>{
        const res = await fetch("shimejiee.zip");
        if (res.ok) {
            const bytes = await res.bytes();
            importBytes(bytes);
        }
    })().catch((err) => console.error(err));

    //FIXME: this feels wrong
    let last = performance.now();
    let remaining = 0;
    const tick = () => {
        const start = performance.now();
        const offset = start - last;
        remaining += offset;
        while (remaining > 20) {
            remaining -= 20;
            shijima.tick();
        }
        last = performance.now();
    };
    setInterval(tick, 20);
});
