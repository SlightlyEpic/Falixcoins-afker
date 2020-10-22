const puppeteer = require("puppeteer");
const express = require("express");
const socket = require("socket.io");

const config = require("./config.json");

//const initURL = "https://reddit.com/r/dankmemes";
const initURL = "https://client.falixnodes.net/auth.php";

let pages = [];

(async () => {
    let dimensions = ['800', '600'];    

    const browser = await puppeteer.launch({
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox'
        ]
    });
    
    const app = express();
    
    let server = app.listen(config.port, () => {
        console.log(`Server listening to port ${config.port}`);
    });
    
    let io = socket(server);
    
    io.sockets.on("connection", newConnection);

    //await browser.close();
    
    app.get("/page/:dim", async (req, res) => {
        dimensions = req.params.dim.split("x");
        res.sendFile(`${__dirname}/html/page.html`, e => {console.log(e)});
    })

    app.get("/", (req, res) => {
        res.sendFile(`${__dirname}/html/redir.html`);
    })

    app.get("/frame/:d", (req, res) => {
        res.sendFile(`${__dirname}/example.png`);
    })


    async function newConnection(socket) {
        console.log(`New connection - socket id: ${socket.id}`)

        pages[0] = await browser.newPage();
        pages[0].setViewport({
            width: parseInt(dimensions[0]),
            height: parseInt(dimensions[1]),
            deviceScaleFactor: 1
        })
        await pages[0].goto(initURL, {waitUntil: 'networkidle2', timeout: 30000});

        await pages[0].screenshot({path: 'example.png'});
        socket.emit("updateImage");

        socket.on("mousemove", data => {
            let x = data.x;
            let y = data.y;
            pages[0].mouse.move(x, y);
        })

        socket.on("mousedown", async () => {
            pages[0].mouse.down({button: 'left'});
            await wait(150);
            pages[0].mouse.up({button: 'left'});
        })

        socket.on("startsession", async () => {
            pages[0].evaluate("document.querySelector('body > div.wrapper > div.main-panel > div > div.content > div > div > div > div.card-body > div > table > tbody > tr:nth-child(1) > td:nth-child(3) > a').click()");
        })

        setInterval(async () => {
            await pages[0].screenshot({path: 'example.png'});
            socket.emit("updateImage");
        }, 1000);

    }

    function wait(ms) {
        return new Promise((resolve, reject) => {
            setTimeout(() => resolve(), ms);
        })
    }

})();