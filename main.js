ShijimaWeb.load().then(async() => {
    const shijima = new ShijimaWeb();
    const actions = await (await fetch("libshimejifinder/default_actions.xml")).text();
    const behaviors = await (await fetch("libshimejifinder/default_behaviors.xml")).text();
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
