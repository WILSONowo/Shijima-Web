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
    fileDrop.ondrop = async(e)=>{
        e.preventDefault();
        for (const file of e.dataTransfer.files) {
            console.log(file);
            Shijima.FS.writeFile("/tmp/archive.bin", await file.bytes());
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
        }
        fileDrop.style.visibility = "hidden";
    };
    let acc = 0, count = 0;
    setInterval(() => {
        const date = new Date();
        shijima.tick();
        const elapsed = new Date() - date;
        acc += elapsed;
        count++;
        if (count === 20) {
            document.getElementById("output").innerText = "Tick (avg): " +
                (acc / count).toFixed(2) + " ms / 20 ms";
            acc = count = 0;
        }
    }, 20);
});
