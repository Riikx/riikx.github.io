/* Visualizador Three.js: modelo reduzido e preparação incremental da GPU. */
(() => {
  const host = document.getElementById('tractorViewer');
  const status = document.getElementById('tractorStatus');
  const picker = document.getElementById('tractorFile');
  const fileLabel = document.getElementById('tractorFileLabel');
  const reset = document.getElementById('tractorReset');
  const navFocusButton = document.getElementById('nav900Focus');
  const navMarker = document.getElementById('nav900Marker');
  const navAssetURL = new URL('training/models/nav900_optimized.glb', document.baseURI);
  let usesNav900 = false;
  let pendingNavFocus = false;
  let pendingDisplayFocus = false;

  let syncSystem = () => { };

  let focusNav = () => {
    pendingNavFocus = true;
  };

  let focusDisplay = () => {
    pendingDisplayFocus = true;
  };
  document.addEventListener('training:system', event => {
    usesNav900 = event.detail.hasNav900;
    pendingNavFocus = false;
    pendingDisplayFocus = false;
    syncSystem();
  });
  document.addEventListener('training:focus-component', event => {

    const component = event.detail.component;

    if (component === "nav900") {

      if (!usesNav900) return;

      host.scrollIntoView({
        behavior: "smooth",
        block: "center"
      });

      focusNav();
    }

    if (component === "display") {

      host.scrollIntoView({
        behavior: "smooth",
        block: "center"
      });

      focusDisplay();
    }

  });
  const assetURL = new URL('training/models/lamborghini_r6_optimized.glb', document.baseURI);
  const nextTask = () => new Promise(resolve => setTimeout(resolve, 0));
  let setupPromise, loadStarted = false, inViewport = false;
  let requestRender = () => { };
  function showStatus(message) { status.hidden = false; status.textContent = message; }
  function showError(error) {
    console.error('Visualizador do trator:', error);
    showStatus('Não foi possível carregar o trator. Verifique a conexão ou selecione models/lamborghini_r6_optimized.glb.');
    fileLabel.hidden = false;
    loadStarted = false;
    window.dispatchEvent(new CustomEvent('portfolio:tractor-error'));
  }

  // O script de dados permite abrir o HTML direto, sem fetch de um arquivo file://.
  // Só é solicitado quando o visualizador entra em cena.
  async function localModelBuffer(eventName = 'tractor-model-data', scriptPath = 'training/js/tractor-model-data.js') {
    const base64 = await new Promise((resolve, reject) => {
      const script = document.createElement('script');
      const onData = event => { cleanup(); resolve(event.detail); };
      const cleanup = () => {
        window.removeEventListener(eventName, onData);
        script.remove();
      };
      window.addEventListener(eventName, onData);
      script.src = new URL(scriptPath, document.baseURI).href;
      script.onerror = () => { cleanup(); reject(new Error('Modelo local não encontrado.')); };
      document.head.append(script);
    });
    const padding = base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0;
    const bytes = new Uint8Array(base64.length / 4 * 3 - padding);
    // Decodifica em blocos, permitindo que a página responda entre eles.
    const chunkSize = 262144;
    for (let offset = 0; offset < base64.length; offset += chunkSize) {
      const chunk = atob(base64.slice(offset, offset + chunkSize));
      const target = offset / 4 * 3;
      for (let i = 0; i < chunk.length; i++) bytes[target + i] = chunk.charCodeAt(i);
      if (offset % (chunkSize * 4) === 0) await nextTask();
    }
    return bytes.buffer;
  }

  async function setup() {
    const [THREE, { GLTFLoader }, { OrbitControls }] = await Promise.all([
      import('https://esm.sh/three@0.180.0'),
      import('https://esm.sh/three@0.180.0/examples/jsm/loaders/GLTFLoader.js'),
      import('https://esm.sh/three@0.180.0/examples/jsm/controls/OrbitControls.js')
    ]);
    const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.25));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    renderer.domElement.setAttribute('aria-label', 'Modelo 3D Lamborghini R6 125 DCR. Arraste para girar e use a roda do mouse para aproximar.');
    renderer.domElement.tabIndex = 0;
    host.prepend(renderer.domElement);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, 1, 0.01, 100);
    const controls = new OrbitControls(camera, renderer.domElement);

    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    // Scroll normal continua dando zoom
    controls.enableZoom = true;

    // Clique esquerdo = gira a câmera
    // Clique do scroll = move a câmera
    // Clique direito = também move
    controls.mouseButtons = {
      LEFT: THREE.MOUSE.ROTATE,
      MIDDLE: THREE.MOUSE.PAN,
      RIGHT: THREE.MOUSE.PAN
    };

    controls.screenSpacePanning = true;

    controls.enablePan = false;
    controls.maxPolarAngle = Math.PI * 0.49;
    controls.listenToKeyEvents(renderer.domElement);
    scene.add(new THREE.HemisphereLight(0xffffff, 0x52677d, 2.5));
    const light = new THREE.DirectionalLight(0xffffff, 3);
    light.position.set(4, 7, 5);
    scene.add(light);
    const fill = new THREE.DirectionalLight(0xc5deff, 1.2);
    fill.position.set(-4, 3, -2);
    scene.add(fill);
    const loader = new GLTFLoader();
    let model, radius = 1, busy = false, frame = 0, preparing = false;
    let lastWidth = 0, lastHeight = 0;
    let receiver, cameraTween = null, focusedNav = false, focusedDisplay = false;
    const navBounds = new THREE.Box3();
    const navCenter = new THREE.Vector3();
    const markerPoint = new THREE.Vector3();
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    function updateMarker() {
      if (!receiver?.visible || preparing || focusedDisplay) { navMarker.hidden = true; return; }
      navBounds.setFromObject(receiver);
      navBounds.getCenter(markerPoint);
      markerPoint.y = navBounds.max.y;
      markerPoint.project(camera);
      const visible = markerPoint.z >= -1 && markerPoint.z <= 1 && Math.abs(markerPoint.x) < 0.95 && Math.abs(markerPoint.y) < 0.95;
      navMarker.hidden = !visible;
      if (visible) {
        navMarker.style.left = ((markerPoint.x + 1) * host.clientWidth / 2) + 'px';
        navMarker.style.top = ((1 - markerPoint.y) * host.clientHeight / 2) + 'px';
      }
    }
    function focusReceiver() {
      pendingNavFocus = true;
      if (!receiver?.visible || busy) return;
      pendingNavFocus = false;
      focusedNav = true;
      focusedDisplay = false;
      pendingDisplayFocus = false;
      navFocusButton.setAttribute('aria-pressed', 'true');
      navBounds.setFromObject(receiver);
      navBounds.getCenter(navCenter);
      const navRadius = navBounds.getBoundingSphere(new THREE.Sphere()).radius;
      const halfFov = THREE.MathUtils.degToRad(camera.fov / 2);
      const distance = navRadius / Math.sin(Math.min(halfFov, Math.atan(Math.tan(halfFov) * camera.aspect))) * 1.8;
      controls.minDistance = navRadius * 1.15;
      cameraTween = {
        start: performance.now(), fromPosition: camera.position.clone(), fromTarget: controls.target.clone(),
        toPosition: navCenter.clone().add(new THREE.Vector3(1.1, 0.9, 1.4).normalize().multiplyScalar(distance)),
        toTarget: navCenter.clone()
      };
      if (matchMedia('(prefers-reduced-motion: reduce)').matches) cameraTween.start -= 650;
      render();
    }
    function focusGfxDisplay() {
      pendingDisplayFocus = true;
      pendingNavFocus = false;
      if (!model || busy) return;
      pendingDisplayFocus = false;
      focusedNav = false;
      focusedDisplay = true;
      navFocusButton.setAttribute('aria-pressed', 'false');

      // Aproximação frontal: câmera entre a alavanca e a tela do monitor.
      const screenCenter = new THREE.Vector3(-0.417, 0.364, -0.250);
      const screenNormal = new THREE.Vector3(0.905, 0.179, -0.386).normalize();
      const distance = 0.185;

      // O limite da visão externa impedia a câmera de se aproximar da tela.
      controls.minDistance = 0.08;
      camera.near = 0.001;
      camera.updateProjectionMatrix();
      const damping = controls.enableDamping;
      controls.enableDamping = false;
      controls.update();
      controls.enableDamping = damping;
      cameraTween = {
        start: performance.now(),
        fromPosition: camera.position.clone(),
        fromTarget: controls.target.clone(),
        toPosition: screenCenter.clone().addScaledVector(screenNormal, distance),
        toTarget: screenCenter
      };
      if (matchMedia('(prefers-reduced-motion: reduce)').matches) cameraTween.start -= 650;
      render();
    }
    focusNav = focusReceiver;
    focusDisplay = focusGfxDisplay;

    navFocusButton.addEventListener('click', focusReceiver);
    navMarker.addEventListener('click', focusReceiver);
    controls.addEventListener('start', () => { cameraTween = null; });
    let pointerStart;
    renderer.domElement.addEventListener('pointerdown', event => {
      pointerStart = { x: event.clientX, y: event.clientY, id: event.pointerId };
    });
    renderer.domElement.addEventListener('pointercancel', () => { pointerStart = null; });
    renderer.domElement.addEventListener('pointerup', event => {
      const start = pointerStart;
      pointerStart = null;
      if (!receiver?.visible || !start || start.id !== event.pointerId || Math.hypot(event.clientX - start.x, event.clientY - start.y) > 5) return;
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.set((event.clientX - rect.left) / rect.width * 2 - 1, -(event.clientY - rect.top) / rect.height * 2 + 1);
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObject(model, true);
      let hit = hits[0]?.object;
      while (hit && hit !== receiver) hit = hit.parent;
      if (hit === receiver) focusReceiver();
    });
    syncSystem = () => {
      if (receiver) receiver.visible = usesNav900;
      navFocusButton.hidden = !usesNav900;
      navFocusButton.disabled = !receiver || busy;
      if (!usesNav900) navMarker.hidden = true;
      fit();
      render();
    };
    function render() {
      // Consolida eventos do mouse e ignora áreas/abas ocultas.
      if (frame || preparing || !inViewport || document.hidden) return;
      frame = requestAnimationFrame(now => {
        frame = 0;
        if (!preparing && inViewport && !document.hidden && host.clientWidth && host.clientHeight) {
          if (cameraTween) {
            const t = Math.min(1, (now - cameraTween.start) / 650);
            const eased = t * t * (3 - 2 * t);
            camera.position.lerpVectors(cameraTween.fromPosition, cameraTween.toPosition, eased);
            controls.target.lerpVectors(cameraTween.fromTarget, cameraTween.toTarget, eased);
            if (t >= 1) cameraTween = null;
            controls.update();
          }
          renderer.render(scene, camera);
          updateMarker();
          if (cameraTween) render();
        }
      });
    }
    requestRender = render;
    document.addEventListener('visibilitychange', render);
    function fit() {
      cameraTween = null;
      focusedNav = false;
      focusedDisplay = false;
      camera.near = 0.01;
      navFocusButton.setAttribute('aria-pressed', 'false');
      if (!model || !host.clientWidth) return;
      const halfFov = THREE.MathUtils.degToRad(camera.fov / 2);
      const horizontal = Math.atan(Math.tan(halfFov) * camera.aspect);
      const distance = radius / Math.sin(Math.min(halfFov, horizontal)) * 1.15;
      controls.target.set(0, 0, 0);
      camera.position.copy(new THREE.Vector3(1.3, 0.75, 1.6).normalize().multiplyScalar(distance));
      camera.far = Math.max(distance * 20, 100);
      camera.updateProjectionMatrix();
      controls.minDistance = radius * 1.2;
      controls.maxDistance = distance * 3;
      controls.update();
      render();
    }
    function resize() {
      const width = host.clientWidth, height = host.clientHeight;
      if (!width || !height || (width === lastWidth && height === lastHeight)) return;
      lastWidth = width;
      lastHeight = height;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      if (focusedDisplay) focusGfxDisplay(); else if (focusedNav) focusReceiver(); else fit();
      render();
    }
    new ResizeObserver(resize).observe(host);
    resize();
    controls.addEventListener('change', render);
    reset.addEventListener('click', fit);
    renderer.domElement.addEventListener('webglcontextlost', event => {
      event.preventDefault();
      showStatus('A visualização 3D foi interrompida. Atualize a página para recarregar.');
    });
    function resources(object) {
      const textures = new Set(), materials = new Set(), geometries = new Set();
      object.traverse(node => {
        if (node.geometry) geometries.add(node.geometry);
        if (node.material) (Array.isArray(node.material) ? node.material : [node.material]).forEach(m => materials.add(m));
      });
      materials.forEach(material => {
        Object.values(material).forEach(value => { if (value?.isTexture) textures.add(value); });
      });
      return { textures, materials, geometries };
    }
    function disposeModel(object) {
      const { textures, materials, geometries } = resources(object);
      geometries.forEach(geometry => geometry.dispose());
      materials.forEach(material => material.dispose());
      const images = new Set();
      textures.forEach(texture => { images.add(texture.source?.data); texture.dispose(); });
      images.forEach(image => image?.close?.());
    }
    async function load(file) {
      if (busy) return;
      busy = true;
      picker.disabled = true;
      reset.disabled = true;
      navFocusButton.disabled = true;
      cameraTween = null;
      host.setAttribute('aria-busy', 'true');
      showStatus('Carregando Lamborghini R6 125 DCR…');
      let candidate;
      try {
        await nextTask();
        let gltf;
        if (file) {
          gltf = await loader.parseAsync(await file.arrayBuffer(), '');
        } else if (location.protocol === 'file:') {
          gltf = await loader.parseAsync(await localModelBuffer(), '');
        } else {
          gltf = await loader.loadAsync(assetURL.href, progress => {
            if (progress.total) showStatus('Carregando trator: ' + Math.round(progress.loaded / progress.total * 100) + '%');
          });
        }
        const next = gltf.scene;
        candidate = next;
        showStatus('Preparando a visualização…');
        await nextTask();
        const box = new THREE.Box3().setFromObject(next);
        const size = box.getSize(new THREE.Vector3());
        const largest = Math.max(size.x, size.y, size.z);
        if (!Number.isFinite(largest) || largest <= 0) throw new Error('Modelo sem geometria válida.');
        const tractor = new THREE.Group();
        tractor.add(next);
        next.position.sub(box.getCenter(new THREE.Vector3()));
        tractor.scale.setScalar(4 / largest);
        tractor.updateMatrixWorld(true);
        const group = new THREE.Group();
        group.add(tractor);
        candidate = group;
        showStatus('Preparando NAV-900…');
        await nextTask();
        const navGltf = location.protocol === 'file:'
          ? await loader.parseAsync(await localModelBuffer('nav900-model-data', 'training/js/nav900-model-data.js'), '')
          : await loader.loadAsync(navAssetURL.href);
        const navSource = navGltf.scene;
        const navBox = new THREE.Box3().setFromObject(navSource);
        const navSize = navBox.getSize(new THREE.Vector3());
        const navScale = 0.28 / Math.max(navSize.x, navSize.z);
        const navPivot = new THREE.Group();
        navSource.position.sub(new THREE.Vector3((navBox.min.x + navBox.max.x) / 2, navBox.min.y, (navBox.min.z + navBox.max.z) / 2));
        navPivot.add(navSource);
        navPivot.scale.setScalar(navScale);
        navSource.traverse(node => {
          if (node.isMesh) {
            if (!node.geometry.attributes.normal) node.geometry.computeVertexNormals();
            node.material.color.setHex(0xe5e9ed);
            node.material.roughness = 0.65;
            node.material.metalness = 0.05;
          }
        });
        // Ancoragem específica do Lamborghini R6: centro transversal e teto da cabine.
        // Um raio vertical encontra a superfície real do teto, evitando flutuação.
        const tractorBounds = new THREE.Box3().setFromObject(tractor);
        const mountX = THREE.MathUtils.lerp(tractorBounds.min.x, tractorBounds.max.x, 0.5);
        const mountZ = THREE.MathUtils.lerp(tractorBounds.min.z, tractorBounds.max.z, 0.33);
        const roofRay = new THREE.Raycaster(new THREE.Vector3(mountX, tractorBounds.max.y + 1, mountZ), new THREE.Vector3(0, -1, 0));
        const roof = roofRay.intersectObject(tractor, true)[0];
        navPivot.position.set(mountX, (roof?.point.y ?? tractorBounds.max.y) + 0.003, mountZ);
        navPivot.name = 'NAV-900';
        navPivot.visible = usesNav900;
        group.add(navPivot);
        group.updateMatrixWorld(true);

        // Prepara cada textura em uma tarefa separada antes do primeiro quadro.
        const { textures } = resources(group);
        for (const texture of textures) {
          await nextTask();
          renderer.initTexture(texture);
        }
        await nextTask();
        await renderer.compileAsync(group, camera, scene);
        preparing = true;
        if (model) { scene.remove(model); disposeModel(model); }
        model = group;
        receiver = navPivot;
        receiver.visible = usesNav900;
        candidate = null;
        scene.add(model);
        // Reuse the exact loaded model as the simulator's top-view tractor.
        const spriteCamera = new THREE.OrthographicCamera(-2.45, 2.45, 2.45, -2.45, 0.01, 30);
        spriteCamera.position.set(0, 10, 0);
        spriteCamera.up.set(0, 0, -1);
        spriteCamera.lookAt(0, 0, 0);
        renderer.setSize(256, 256, false);
        renderer.render(scene, spriteCamera);
        const sprite = document.createElement('canvas');
        sprite.width = renderer.domElement.width;
        sprite.height = renderer.domElement.height;
        sprite.getContext('2d').drawImage(renderer.domElement, 0, 0);
        window.portfolioTractorSprite = sprite;
        window.portfolioTractor3D = { THREE, model };
        window.dispatchEvent(new CustomEvent('portfolio:tractor-ready'));
        renderer.setSize(lastWidth || host.clientWidth, lastHeight || host.clientHeight, false);
        radius = new THREE.Box3().setFromObject(model).getBoundingSphere(new THREE.Sphere()).radius;
        fit();
        status.hidden = true;
      } catch (error) {
        if (candidate) disposeModel(candidate);
        throw error;
      } finally {
        preparing = false;
        busy = false;
        picker.disabled = false;
        reset.disabled = !model;
        navFocusButton.hidden = !usesNav900;
        navFocusButton.disabled = !receiver;
        if (pendingNavFocus && usesNav900) focusReceiver();
        if (pendingDisplayFocus) focusGfxDisplay();
        host.setAttribute('aria-busy', 'false');
        render();
      }
    }
    return { load };
  }
  function ensureSetup() {
    if (!setupPromise) setupPromise = setup().catch(error => { setupPromise = null; throw error; });
    return setupPromise;
  }
  picker.addEventListener('change', async () => {
    const file = picker.files[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.glb')) {
      showStatus('Selecione um arquivo no formato .glb.');
      return;
    }
    try { await (await ensureSetup()).load(file); } catch (error) { showError(error); }
    picker.value = '';
  });
  const observer = new IntersectionObserver(async entries => {
    inViewport = entries.some(entry => entry.isIntersecting);
    if (!inViewport) return;
    requestRender();
    if (loadStarted) return;
    loadStarted = true;
    showStatus('Preparando visualização 3D…');
    try { await (await ensureSetup()).load(); } catch (error) { showError(error); }
  });
  observer.observe(host);
  document.addEventListener('portfolio:load-tractor', async () => {
    if (loadStarted) return;
    loadStarted = true;
    showStatus('Preparando visualização 3D…');
    try { await (await ensureSetup()).load(); } catch (error) {
      showError(error);

    }
  });
})();
