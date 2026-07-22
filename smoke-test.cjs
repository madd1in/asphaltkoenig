const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const { spawn } = require('node:child_process');

const browserPath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const htmlPath = path.join(__dirname, 'index.html');
const screenshotPath = path.join(__dirname, 'smoke-test.png');
const footScreenshotPath = path.join(__dirname, 'smoke-test-foot.png');
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
    const mobileControls = await evaluate(`(() => {
      const x0=player.x, z0=player.z, a0=player.angle;
      let inputLatencyMs=Infinity;
      for(let sample=0;sample<3;sample+=1){
        const inputStarted=performance.now();
        setTouchAxis(0.55,-0.85,true);
        inputLatencyMs=Math.min(inputLatencyMs,performance.now()-inputStarted);
      }
      for(let frame=0;frame<12;frame+=1) updatePlayerFoot(1/60);
      const analogMoved=Math.hypot(player.x-x0,player.z-z0)>0.1;
      const analogAxis={x:TOUCH_AXIS.x,y:TOUCH_AXIS.y,rawX:TOUCH_AXIS.rawX,rawY:TOUCH_AXIS.rawY,active:TOUCH_AXIS.active};
      const throttleBoost=Math.abs(TOUCH_AXIS.y)>Math.abs(TOUCH_AXIS.rawY);
      const steeringPrecision=Math.abs(TOUCH_AXIS.x)<Math.abs(TOUCH_AXIS.rawX);
      releaseTouchStick();
      player.x=x0; player.z=z0; player.angle=a0; player.mesh.position.set(x0,0,z0); player.mesh.rotation.y=a0;
      document.body.classList.add('touch-device','game-started');
      updateTouchLabels();
      const footEnter=document.getElementById('touchFootEnter'), footActions=document.getElementById('touchFootActions');
      const footEnterRect=footEnter.getBoundingClientRect();
      const footControlsVisible=getComputedStyle(footActions).display==='grid'&&getComputedStyle(document.getElementById('touchDriveActions')).display==='none'&&footEnterRect.width>0&&footEnterRect.height>0;
      const sprintButton=document.getElementById('touchSprint');
      sprintButton.dispatchEvent(new PointerEvent('pointerdown',{pointerId:90,bubbles:true}));
      const sprintStarted=keys.ShiftLeft===true;
      sprintButton.dispatchEvent(new PointerEvent('pointerup',{pointerId:90,bubbles:true}));
      const sprintReleased=keys.ShiftLeft===false;
      const nitroButton=document.getElementById('touchNitro');
      nitroButton.dispatchEvent(new PointerEvent('pointerdown',{pointerId:91,bubbles:true}));
      const holdStarted=keys.KeyQ===true;
      nitroButton.dispatchEvent(new PointerEvent('pointerup',{pointerId:91,bubbles:true}));
      const holdReleased=keys.KeyQ===false;
      const pausedBefore=G.paused;
      fireMobileTap('KeyP'); const pausedByTouch=G.paused;
      fireMobileTap('KeyP'); const resumedByTouch=!G.paused;
      return {
        controls:Boolean(document.getElementById('touchControls')),
        buttons:document.querySelectorAll('#touchControls button').length,
        driveButtons:['touchLeft','touchRight','touchBrake','touchGas'].every(id=>Boolean(document.getElementById(id))),
        footButtons:['touchSprint','touchContext','touchFootEnter'].every(id=>Boolean(document.getElementById(id))),
        setupType:typeof setupTouchControls,
        analogMoved,analogAxis,throttleBoost,steeringPrecision,inputLatencyMs,released:!TOUCH_AXIS.active,
        footControlsVisible,sprintStarted,sprintReleased,holdStarted,holdReleased,pausedBefore,pausedByTouch,resumedByTouch
      };
    })()`);
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
      touchControls: Boolean(document.getElementById('touchControls')),
      touchButtons: document.querySelectorAll('#touchControls button').length,
      inactiveSkidsHidden: skidPool.every((skid) => skid.life > 0 || !skid.mesh.visible),
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
    const touchDrive = await evaluate(`(() => {
      const car=G.inCar;
      document.body.classList.add('touch-device','game-started');
      updateTouchLabels();
      const gas=document.getElementById('touchGas'), brake=document.getElementById('touchBrake'), dash=document.getElementById('touchNitro'), drift=document.getElementById('touchDrift'), left=document.getElementById('touchLeft'), right=document.getElementById('touchRight');
      const driveControlsVisible=getComputedStyle(document.getElementById('touchDriveActions')).display==='grid'&&getComputedStyle(document.getElementById('touchFootActions')).display==='none';
      const gasRect=gas.getBoundingClientRect();
      const brakeRect=brake.getBoundingClientRect(), dashRect=dash.getBoundingClientRect(), driftRect=drift.getBoundingClientRect(), leftRect=left.getBoundingClientRect(), rightRect=right.getBoundingClientRect();
      const gasBottomRight=gasRect.left>innerWidth*0.5&&gasRect.bottom>innerHeight*0.8&&getComputedStyle(gas).pointerEvents==='auto';
      const brakeLeftOfGas=brakeRect.right<=gasRect.left+1&&Math.abs(brakeRect.bottom-gasRect.bottom)<2;
      const dashAboveGas=Math.abs((dashRect.left+dashRect.right)-(gasRect.left+gasRect.right))<2&&dashRect.bottom<=gasRect.top+1&&dash.textContent==='DASH';
      const driftAboveBrake=Math.abs((driftRect.left+driftRect.right)-(brakeRect.left+brakeRect.right))<2&&driftRect.bottom<=brakeRect.top+1;
      const largeSteerButtons=leftRect.height>=74&&rightRect.height>=74;
      const inputStarted=performance.now();
      gas.dispatchEvent(new PointerEvent('pointerdown',{pointerId:101,bubbles:true}));
      left.dispatchEvent(new PointerEvent('pointerdown',{pointerId:102,bubbles:true}));
      const buttonInputLatencyMs=performance.now()-inputStarted;
      const buttonsHeld=keys.KeyW===true&&keys.KeyA===true;
      for(let frame=0;frame<30;frame+=1) updatePlayerCar(car,1/60);
      const angleDelta=Math.abs(car.angle), kmh=Math.abs(G.kmh);
      left.dispatchEvent(new PointerEvent('pointerup',{pointerId:102,bubbles:true}));
      gas.dispatchEvent(new PointerEvent('pointerup',{pointerId:101,bubbles:true}));
      const buttonsReleased=!keys.KeyW&&!keys.KeyA;
      const coastStart=Math.abs(G.kmh);
      for(let frame=0;frame<60;frame+=1) updatePlayerCar(car,1/60);
      const coastEnd=Math.abs(G.kmh), coastRatio=coastEnd/Math.max(0.01,coastStart);
      car.x=0; car.z=-30; car.angle=0; car.vx=0; car.vz=0; car.y=0; car.vy=0;
      gas.dispatchEvent(new PointerEvent('pointerdown',{pointerId:103,bubbles:true}));
      for(let frame=0;frame<75;frame+=1) updatePlayerCar(car,1/60);
      const highSpeedKmh=Math.abs(G.kmh), highSpeedStartAngle=car.angle;
      left.dispatchEvent(new PointerEvent('pointerdown',{pointerId:104,bubbles:true}));
      for(let frame=0;frame<15;frame+=1) updatePlayerCar(car,1/60);
      const highSpeedTurn=Math.abs(wrapAng(car.angle-highSpeedStartAngle));
      left.dispatchEvent(new PointerEvent('pointerup',{pointerId:104,bubbles:true}));
      gas.dispatchEvent(new PointerEvent('pointerup',{pointerId:103,bubbles:true}));
      car.x=0; car.z=-30; car.angle=0; car.vx=0; car.vz=0; car.y=0; car.vy=0;
      gas.dispatchEvent(new PointerEvent('pointerdown',{pointerId:105,bubbles:true}));
      for(let frame=0;frame<75;frame+=1) updatePlayerCar(car,1/60);
      gas.dispatchEvent(new PointerEvent('pointerup',{pointerId:105,bubbles:true}));
      const brakeAssistStartAngle=car.angle;
      brake.dispatchEvent(new PointerEvent('pointerdown',{pointerId:106,bubbles:true}));
      left.dispatchEvent(new PointerEvent('pointerdown',{pointerId:107,bubbles:true}));
      for(let frame=0;frame<15;frame+=1) updatePlayerCar(car,1/60);
      const brakeAssistTurn=Math.abs(wrapAng(car.angle-brakeAssistStartAngle));
      left.dispatchEvent(new PointerEvent('pointerup',{pointerId:107,bubbles:true}));
      brake.dispatchEvent(new PointerEvent('pointerup',{pointerId:106,bubbles:true}));
      const result={angleDelta,kmh,coastStart,coastEnd,coastRatio,highSpeedKmh,highSpeedTurn,brakeAssistTurn,buttonInputLatencyMs,buttonsHeld,buttonsReleased,driveControlsVisible,gasBottomRight,brakeLeftOfGas,dashAboveGas,driftAboveBrake,largeSteerButtons,gasRect:{left:gasRect.left,top:gasRect.top,right:gasRect.right,bottom:gasRect.bottom},brakeRect:{left:brakeRect.left,top:brakeRect.top,right:brakeRect.right,bottom:brakeRect.bottom},steerButtonHeight:leftRect.height};
      car.x=0; car.z=-30; car.angle=0; car.vx=0; car.vz=0; car.y=0; car.vy=0;
      car.mesh.position.set(0,0,-30); car.mesh.rotation.y=0; G.kmh=0; G.nitro=100;
      return result;
    })()`);
    const desktopDrive = await evaluate(`(() => {
      const car=G.inCar;
      car.x=0; car.z=-30; car.angle=0; car.vx=0; car.vz=0; car.y=0; car.vy=0;
      car.mesh.position.set(0,0,-30); car.mesh.rotation.y=0; G.kmh=0;
      TOUCH_AXIS.used=false; releaseTouchStick(); TOUCH_HELD={}; DESKTOP_STEER=0;
      keys.KeyW=true; keys.KeyA=true;
      updatePlayerCar(car,1/60);
      const firstSteerStep=Math.abs(DESKTOP_STEER);
      for(let frame=1;frame<30;frame+=1) updatePlayerCar(car,1/60);
      const angleDelta=Math.abs(car.angle), kmh=Math.abs(G.kmh), heldSteer=Math.abs(DESKTOP_STEER);
      keys.KeyA=false;
      const releaseAngle=car.angle;
      for(let frame=0;frame<10;frame+=1) updatePlayerCar(car,1/60);
      const releaseDrift=Math.abs(wrapAng(car.angle-releaseAngle)), settledSteer=Math.abs(DESKTOP_STEER);
      keys.KeyW=false;
      car.hp=car.maxHp;
      const heavyHit=damageVehicle(car,30,12);
      for(let hit=1;hit<5;hit+=1) damageVehicle(car,30,12);
      const survivesFiveHeavyHits=car.hp>0, remainingHp=car.hp, maxHp=car.maxHp;
      car.hp=car.maxHp; car.x=0; car.z=-30; car.angle=0; car.vx=0; car.vz=0; DESKTOP_STEER=0; G.kmh=0;
      car.mesh.position.set(0,0,-30); car.mesh.rotation.y=0;
      return {firstSteerStep,angleDelta,kmh,heldSteer,releaseDrift,settledSteer,heavyHit,survivesFiveHeavyHits,remainingHp,maxHp};
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

    await send('Emulation.setDeviceMetricsOverride', {
      width: 390, height: 844, deviceScaleFactor: 3, mobile: true,
      screenWidth: 390, screenHeight: 844
    });
    await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
    await evaluate(`window.__smokeCar=G.inCar; G.inCar=null; player.mesh.visible=true; document.body.classList.add('touch-device','game-started'); updateTouchLabels()`);
    await delay(350);
    const footScreenshot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(footScreenshotPath, Buffer.from(footScreenshot.data, 'base64'));
    await evaluate(`G.inCar=window.__smokeCar; player.mesh.visible=false; updateTouchLabels()`);
    await delay(350);
    const screenshot = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(screenshotPath, Buffer.from(screenshot.data, 'base64'));
    const moved = Math.hypot(after.playerX - startPosition.x, after.playerZ - startPosition.z) > 0.1;
    const errorList = Array.from(errors);
    const result = { before, after, moved, driveKmh, nitro, policeBalance, performanceSample, mobileControls, touchDrive, desktopDrive, assets, errors: errorList };
    console.log(`SMOKE_METRICS fps=${performanceSample.fps.toFixed(2)} calls=${performanceSample.callsMedian} geometries=${performanceSample.geometries} touchInputMs=${mobileControls.inputLatencyMs.toFixed(3)} driveButtonMs=${touchDrive.buttonInputLatencyMs.toFixed(3)} touchTurn=${touchDrive.angleDelta.toFixed(3)} highSpeedTurn=${touchDrive.highSpeedTurn.toFixed(3)} desktopTurn=${desktopDrive.angleDelta.toFixed(3)} crashDamage=${desktopDrive.heavyHit} coastRatio=${touchDrive.coastRatio.toFixed(3)} errors=${errorList.length}`);
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
      || performanceSample.fps < 5 || performanceSample.callsMedian > 260
      || performanceSample.geometries > 160 || after.sceneChildren > 520
      || assets.buildingBatches > 5 || assets.treeBatches > 4 || assets.neonBatches > 4
      || !assets.touchControls || assets.touchButtons !== 15 || !assets.inactiveSkidsHidden
      || mobileControls.setupType !== 'function' || !mobileControls.driveButtons || !mobileControls.footButtons || !mobileControls.footControlsVisible
      || !mobileControls.sprintStarted || !mobileControls.sprintReleased || !mobileControls.analogMoved || !mobileControls.analogAxis.active
      || !mobileControls.throttleBoost || !mobileControls.steeringPrecision || mobileControls.inputLatencyMs > 5
      || !mobileControls.released || !mobileControls.holdStarted || !mobileControls.holdReleased
      || mobileControls.pausedBefore || !mobileControls.pausedByTouch || !mobileControls.resumedByTouch
      || !touchDrive.buttonsHeld || !touchDrive.buttonsReleased || !touchDrive.driveControlsVisible || !touchDrive.gasBottomRight
      || !touchDrive.brakeLeftOfGas || !touchDrive.dashAboveGas || !touchDrive.driftAboveBrake || !touchDrive.largeSteerButtons || touchDrive.buttonInputLatencyMs > 5
      || touchDrive.angleDelta < 1.18 || touchDrive.angleDelta > 1.60 || touchDrive.kmh < 12
      || touchDrive.highSpeedKmh < 55 || touchDrive.highSpeedTurn < 0.30 || touchDrive.highSpeedTurn > 0.48
      || touchDrive.brakeAssistTurn < touchDrive.highSpeedTurn * 1.08
      || touchDrive.coastRatio > 0.58
      || desktopDrive.firstSteerStep < 0.08 || desktopDrive.firstSteerStep > 0.16
      || desktopDrive.angleDelta < 0.42 || desktopDrive.angleDelta > 0.86 || desktopDrive.kmh < 25
      || desktopDrive.heldSteer < 0.6 || desktopDrive.heldSteer > 0.86
      || desktopDrive.releaseDrift > 0.18 || desktopDrive.settledSteer > 0.02
      || desktopDrive.maxHp < 48 || desktopDrive.heavyHit > 9 || !desktopDrive.survivesFiveHeavyHits
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
