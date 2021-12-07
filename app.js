/*
Streams the first webcam in the system to the specified Jitsi Meet room. 
Audio is currently not sent.

TODO
- Detect if we are kicked from the room
- Support authenticated deployments
*/

const puppeteer = require("puppeteer");
const express = require('express');
const app = express();
const http = require("http");

const port=8001;
app.listen(port,()=>{
	    console.log('live on port '+port);
});

app.get('/reload', async (req,res)=>{
	console.log('reload page')
	await page.reload();
	res.send('jo, seite wurde neu geladen');
});

app.get('/shutdown', async (req,res)=>{
	console.log('shutdown browser')
	process.kill(process.pid, "SIGINT");
	res.send('jo, browser wurde heruntergefahren');
});

browser = null;
page = null;

async function main() {
  // Chromium browser options
  // https://peter.sh/experiments/chromium-command-line-switches/
  const chromeArgs = [
    // Automatically give permission to use media devices
    "--use-fake-ui-for-media-stream",

    // Silence all output, just in case
    "--alsa-output-device=plug:null",
    "--remote-debugging-port=9222", 

    // Point chromium to xvfb display
    "--display=:1",
    "--no-sandbox",
    "--disable-extensions",
  ];

  // Jitsi Meet options
  // https://github.com/jitsi/lib-jitsi-meet/blob/master/doc/API.md
  const meetArgs = [
    // Disable receiving of video
    "config.channelLastN=0",
    // Mute our audio
    "config.startWithAudioMuted=true",
    // Don't use simulcast to save resources on the sender (our) side
    "config.disableSimulcast=true",
    // No need to process audio levels
    "config.disableAudioLevels=true",
    // Disable P2P mode due to a bug in Jitsi Meet
    "config.p2p.enabled=false",
    "config.prejoinPageEnabled=false"
  ];

  const url = 'http://localhost:8000/static/jitsi/main.html';
  console.log(`Loading local jitsi client`);

  // Puppeteer launch options
  // https://github.com/puppeteer/puppeteer/blob/v3.0.1/docs/api.md#puppeteerlaunchoptions
  // https://github.com/puppeteer/puppeteer/issues/550#issuecomment-551991273
  browser = await puppeteer.launch({
    headless: true,
    args: chromeArgs,
    executablePath: "/usr/bin/chromium-browser",
    handleSIGINT: false,
  });
  page = await browser.newPage();

  // Manual handling on SIGINT to gracefully hangup and exit
  process.on("SIGINT", async () => {
    console.log("Exiting...");
    await page.close();
    browser.close();
    console.log("Done!");
    process.exit();
  });

  // Start Jitsi Meet
  await page.goto(url);

  console.log("Running...");
}

main(process.argv[2] || "test-0123456789");
