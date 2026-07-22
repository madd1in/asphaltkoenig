const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { spawn } = require('node:child_process');

const browserPath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const htmlPath = path.join(__dirname, 'index.html');
const screenshotPath = path.join(__dirname, 'smoke-test.png');
const profilePath = fs.mkdtempSync(path.join(os.tmpdir(), 'asphaltkoenig-edge-'));
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function run() {
  const browser = spawn(browserPath, [
    '--headless=new',
    '--disable-gpu',
    '--hide-scrollbars',
    '--remote-debugging-pipe',
    `--user-data-dir=${profilePath}`,
    '--allow-file-access-from-files',
    '--window-size=1280,720',
    pathToFileURL(htmlPath).href,
  ], { stdio: ['ignore', 'ignore', 'ignore', 'pipe', 'pipe'], windowsHide: true });
  browser.unref();

  try {
    let id = 0;
    let sessionId = null;
    let input = Buffer.alloc(0);
    const pending = new Map();
    const errors = new Set();

    const receive = (message) => {
      if (message.id) {
        const request = pending.get(message.id);
        if (!request) return;
        pending.delete(message.id);
        if (message.error) request.reject(new Error(JSON.stringify(message.error)));
        else request.resolve(message.result);
        return;
      }
      if (message.method === 'Runtime.exceptionThrown') {
        const details = message.params.exceptionDetails;
        const exception = details.exception || {};
        const frame = details.stackTrace && details.stackTrace.callFrames && details.stackTrace.callFrames[0];
        errors.add([
          exception.description || exception.value || details.text || 'Uncaught exception',
          frame ? `${frame.url}:${frame.lineNumber + 1}:${frame.columnNumber + 1}` : '',
        ].filter(Boolean).join(' @ '));
      }
      if (message.method === 'Log.entryAdded' && message.params.entry.level === 'error') {
        errors.add(message.params.entry.text);
      }
    };

    browser.stdio[4].on('data', (chunk) => {
      input = Buffer.concat([input, chunk]);
      let separator;
      while ((separator = input.indexOf(0)) >= 0) {
        const raw = input.subarray(0, separator).toString('utf8');
        input = input.subarray(separator + 1);
        if (raw) receive(JSON.parse(raw));
      }
    });

    const send = (method, params = {}, targetSession = sessionId) => new Promise((resolve, reject) => {
      const requestId = ++id;
      const timer = setTimeout(() => {
        pending.delete(requestId);
        reject(new Error(`CDP timeout: ${method}`));
      }, 15000);
      pending.set(requestId, {
        resolve: (value) => { clearTimeout(timer); resolve(value); },
        reject: (error) => { clearTimeout(timer); reject(error); },
      });
      const message = { id: requestId, method, params };
      if (targetSession) message.sessionId = targetSession;
      browser.stdio[3].write(`${JSON.stringify(message)}\0`);
    });

    const targetInfos = (await send('Target.getTargets', {}, null)).targetInfos;
    const target = targetInfos.find((item) => item.type === 'page' && item.url.includes('index.html'))
      || targetInfos.find((item) => item.type === 'page');
    if (!target) throw new Error('No page target found');
    sessionId = (await send('Target.attachToTarget', {
      targetId: target.targetId,
      flatten: true,
    }, null)).sessionId;

    const evaluate = async (expression) => {
      const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
      if (result.exceptionDetails) throw new Error(result.exceptionDetails.text);
      return result.result.value;
    };

    await send('Runtime.enable');
    await send('Page.enable');
    await send('Log.enable');
    await send('Page.addScriptToEvaluateOnNewDocument', { source: `(() => {
      let seed = 0xA5FA17;
      Math.random = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
    })();` });
    await send('Page.reload', { ignoreCache: true });
    await delay(5000);

    const before = await evaluate(`(() => ({
      readyState: document.readyState,
      title: document.title,
      three: typeof THREE,
      player: typeof player,
      button: Boolean(document.getElementById('startBtn')),
      canvasCount: document.querySelectorAll('canvas').length
    }))()`);

    await evaluate(`document.getElementById('startBtn').click()`);
    await delay(3000);
    const performanceSample = await evaluate(`new Promise((resolve) => {
      const samples = [], callSamples = [];
      let last = performance.now();
      const startedAt = last;
      function tick(now) {
        samples.push(now - last);
        callSamples.push(renderer.info.render.calls);
        last = now;
        if (now - startedAt >= 3000) {
          samples.shift();
          samples.sort((a,b) => a-b);
          const avgMs = samples.reduce((sum,value) => sum + value, 0) / samples.length;
          callSamples.sort((a,b) => a-b);
          resolve({
            frames: samples.length,
            avgMs,
            fps: 1000 / avgMs,
            p95Ms: samples[Math.floor(samples.length * 0.95)],
            maxMs: samples[samples.length - 1],
            calls: renderer.info.render.calls,
            callsMin: callSamples[0],
            callsMedian: callSamples[Math.floor(callSamples.length * 0.5)],
            callsMax: callSamples[callSamples.length - 1],
            triangles: renderer.info.render.triangles,
            geometries: renderer.info.memory.geometries,
            textures: renderer.info.memory.textures
          });
          return;
        }
        requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    })`);
    const startPosition = await evaluate(`({ x: player.x, z: player.z })`);
    await send('Input.dispatchKeyEvent', { type: 'keyDown', code: 'KeyW', key: 'w' });
    await delay(900);
    await send('Input.dispatchKeyEvent', { type: 'keyUp', code: 'KeyW', key: 'w' });
    await delay(300);

    const assets = await evaluate(`(() => ({
      surfaceTilesReady,
      detailTilesReady,
      cityPropsReady,
      texturedRoads: Boolean(roadMatG.map && roadMatCrossG.map),
      texturedBlocks: Boolean(groundMatG.map && padMatG.map && grassMatG.map && plotMatG.map),
      detailPlots: detailPlotTargets.length,
      propSprites: cityPropSprites.length,
      mp3Failed,
      radioTracks: mp3Radios.length,
      shuffleTracks: shuffleTracks.length,
      shuffleAudios: shuffleAudios.length,
      mp3Sources: [mp3Bgm].concat(mp3Radios).map((audio) => audio && audio.src),
      mp3Durations: [mp3Bgm].concat(mp3Radios).map((audio) => audio && audio.duration),
      shuffleSources: shuffleAudios.map((audio) => audio && audio.src),
      shuffleDurations: shuffleAudios.map((audio) => audio && audio.duration),
      shuffleBagUnique: (refillShuffleBag(), new Set(shuffleBag).size === shuffleTracks.length),
      openerName: shuffleTracks[0].name,
      defaultRadio: G.radio,
      voiceFunction: typeof speak,
      voiceEnabled,
      playerParts: player.mesh.children.length,
      carParts: parkedCars[0].mesh.children.length,
      performanceMode: PERF_STATE.mode,
      shadowsEnabled: renderer.shadowMap.enabled,
      sharedGeometries: Object.keys(SHARED_GEO).length,
      buildings: buildingInfos.length,
      buildingBatches: buildingMeshes.length,
      treeBatches: treeMeshes.length,
      neonBatches: neonMats.length,
      pixelRatio: renderer.getPixelRatio()
    }))()`);

    await evaluate(`(() => {
      const car = parkedCars[0];
      G.inCar = car;
      player.mesh.visible = false;
      car.x = 0; car.z = -30; car.angle = 0; car.vx = 0; car.vz = 0;
      car.mesh.position.set(car.x, 0, car.z);
      car.mesh.rotation.y = 0;
    })()`);
    const driveKmh = await evaluate(`(() => {
      keys.KeyW = true;
      for (let frame = 0; frame < 54; frame += 1) updatePlayerCar(G.inCar, 1/60);
      keys.KeyW = false;
      return Math.abs(G.kmh);
    })()`);
    const nitro = await evaluate(`(() => {
      try {
        syncMp3Audio();
        const before = G.nitro;
        keys.KeyW = true; keys.KeyQ = true;
        for (let frame = 0; frame < 12; frame += 1) updatePlayerCar(G.inCar, 1/60);
        keys.KeyW = false; keys.KeyQ = false;
        return { before, after: G.nitro, label: radioName(G.radio), opener: shuffleNowIndex>=0 ? shuffleTracks[shuffleNowIndex].name : 'NONE', mp3Failed };
      } catch (error) { return { error: error.stack || error.message }; }
    })()`);
    const policeBalance = await evaluate(`(() => {
      const counts = [1,2,3,4,5].map((stars) => { G.stars = stars; return copCount(); });
      const heatSteps = [14,15,34,35,57,58,84,85,114,115].map(starsFromHeat);
      const car = G.inCar;
      car.hp = 100;
      const cop = spawnCop();
      cop.x = car.x; cop.z = car.z - 3; cop.angle = 0; cop.copSpeed = 20; cop.ramCool = 0;
      const hp0 = car.hp;
      updateCops(1/60);
      const firstRamDamage = hp0 - car.hp;
      const hp1 = car.hp;
      cop.x = car.x; cop.z = car.z - 3; cop.copSpeed = 20;
      updateCops(1/60);
      const repeatRamDamage = hp1 - car.hp;
      scene.remove(cop.mesh);
      cops.splice(cops.indexOf(cop),1);
      const oldTime = G.time;
      G.time = 100; G.heat = 90; G.lastCrime = 94; G.nextCopAt = 0; G.stars = 0;
      updateWanted(1);
      const decay = [G.heat], reinforcements = [cops.filter((item) => !item.leaving && !item.dead).length];
      G.time = 101; updateWanted(1); decay.push(G.heat); reinforcements.push(cops.filter((item) => !item.leaving && !item.dead).length);
      G.time = 104; updateWanted(1); decay.push(G.heat); reinforcements.push(cops.filter((item) => !item.leaving && !item.dead).length);
      while (cops.length) scene.remove(cops.pop().mesh);
      G.time = oldTime;
      G.stars = 0; G.heat = 0;
      return { counts, heatSteps, firstRamDamage, repeatRamDamage, ramCool: cop.ramCool, decay, reinforcements };
    })()`);

    const after = await evaluate(`(() => ({
      started: G.started,
      paused: G.paused,
      dead: G.dead,
      player: Boolean(player),
      playerX: player.x,
      playerZ: player.z,
      sceneChildren: scene.children.length,
      rendererCanvas: renderer.domElement.isConnected,
      startVisible: document.getElementById('startScreen').classList.contains('show'),
      money: document.getElementById('moneyEl').textContent,
      frameTime: G.time
    }))()`);

    const screenshot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(screenshotPath, Buffer.from(screenshot.data, 'base64'));
    const moved = Math.hypot(after.playerX - startPosition.x, after.playerZ - startPosition.z) > 0.1;
    const errorList = Array.from(errors);
    const result = { before, after, moved, driveKmh, nitro, policeBalance, performanceSample, assets, errors: errorList };
    console.log(JSON.stringify(result, null, 2));

    if (before.three !== 'object' || !before.button || !after.started || after.startVisible || !moved
      || driveKmh < 55 || !assets.surfaceTilesReady || !assets.detailTilesReady || !assets.cityPropsReady
      || !assets.texturedRoads || !assets.texturedBlocks || assets.detailPlots < 30 || assets.propSprites < 24
      || assets.mp3Failed || assets.radioTracks !== 4 || assets.shuffleTracks !== 8 || assets.shuffleAudios !== 8
      || assets.defaultRadio !== 1 || assets.openerName !== 'Boulevard Heat Loop'
      || nitro.label !== 'SHUFFLE RADIO' || nitro.opener !== 'Boulevard Heat Loop' || !(nitro.after < nitro.before)
      || policeBalance.counts.join(',') !== '1,2,2,3,4'
      || policeBalance.heatSteps.join(',') !== '0,1,1,2,2,3,3,4,4,5'
      || policeBalance.firstRamDamage < 2 || policeBalance.firstRamDamage > 8
      || policeBalance.repeatRamDamage !== 0 || policeBalance.ramCool <= 0
      || policeBalance.decay.join(',') !== '86,82,78'
      || policeBalance.reinforcements.join(',') !== '1,1,2'
      || assets.voiceFunction !== 'function' || !assets.voiceEnabled || !assets.shuffleBagUnique
      || assets.playerParts < 14 || assets.carParts < 25 || assets.mp3Sources.some((source) => !source.endsWith('.mp3'))
      || assets.shuffleSources.some((source) => !source.endsWith('.mp3'))
      || assets.mp3Durations.some((duration) => !Number.isFinite(duration) || duration < 5)
      || assets.shuffleDurations.some((duration) => !Number.isFinite(duration) || duration < 30)
      || performanceSample.fps < 5 || performanceSample.callsMedian > 380
      || performanceSample.geometries > 160 || after.sceneChildren > 520
      || assets.buildingBatches > 5 || assets.treeBatches > 4 || assets.neonBatches > 4
      || !assets.performanceMode || assets.shadowsEnabled
      || assets.sharedGeometries > 60 || assets.pixelRatio > 0.86 || errorList.length) {
      process.exitCode = 1;
    }

  } finally {
    if (!browser.killed) browser.kill('SIGKILL');
    await delay(1500);
    const safePrefix = path.join(os.tmpdir(), 'asphaltkoenig-edge-');
    if (profilePath.startsWith(safePrefix)) {
      try {
        fs.rmSync(profilePath, { recursive: true, force: true, maxRetries: 5, retryDelay: 250 });
      } catch {}
    }
  }
}

run().catch((error) => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});
