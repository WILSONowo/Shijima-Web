ShijimaWeb.load().then(async() => {
    // initialize Shijima
    const shijima = new ShijimaWeb();
    const actions = await (await fetch("libshimejifinder/default_actions.xml")).text();
    const behaviors = await (await fetch("libshimejifinder/default_behaviors.xml")).text();
    
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
            console.log(Shijima.extractShimeji("/tmp/archive.bin"));
        }
        fileDrop.style.visibility = "hidden";
    };
    shijima.registerTemplate("default", "@", actions, behaviors);
    for (let i=0; i<10; ++i) {
        shijima.spawn("default");
    }
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
