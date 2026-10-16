// 3D Motion Graphic Scene for Free Fire & BGMI Top-Up Store using Three.js
class Gaming3DScene {
  constructor(canvasContainerId) {
    this.container = document.getElementById(canvasContainerId);
    if (!this.container) return;

    this.currentGame = 'freefire';
    this.mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
    this.clock = new THREE.Clock();

    this.initScene();
    this.initLights();
    this.initParticles();
    this.createDiamondModel();
    this.createAirdropModel();
    this.bindEvents();
    this.animate();
  }

  initScene() {
    this.scene = new THREE.Scene();
    
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || 320;

    this.camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    this.camera.position.z = 7;

    this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.3;

    this.container.appendChild(this.renderer.domElement);
  }

  initLights() {
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    this.scene.add(ambientLight);

    // Cyan key light
    this.cyanLight = new THREE.PointLight(0x00f3ff, 3, 20);
    this.cyanLight.position.set(4, 4, 4);
    this.scene.add(this.cyanLight);

    // Orange/Gold rim light
    this.orangeLight = new THREE.PointLight(0xff7700, 3.5, 20);
    this.orangeLight.position.set(-4, -3, 3);
    this.scene.add(this.orangeLight);

    // Top spotlight
    this.spotLight = new THREE.SpotLight(0xffffff, 2);
    this.spotLight.position.set(0, 8, 5);
    this.spotLight.angle = Math.PI / 4;
    this.scene.add(this.spotLight);
  }

  initParticles() {
    const particleCount = 140;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    const cyan = new THREE.Color(0x00f3ff);
    const gold = new THREE.Color(0xffd000);
    const orange = new THREE.Color(0xff4655);

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 16;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 12;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 10;

      // Color variation
      const r = Math.random();
      const col = r < 0.4 ? cyan : (r < 0.7 ? gold : orange);
      colors[i * 3] = col.r;
      colors[i * 3 + 1] = col.g;
      colors[i * 3 + 2] = col.b;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    // Particle texture
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.4, 'rgba(255,255,255,0.7)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 32, 32);

    const texture = new THREE.CanvasTexture(canvas);

    const material = new THREE.PointsMaterial({
      size: 0.22,
      map: texture,
      transparent: true,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.particles = new THREE.Points(geometry, material);
    this.scene.add(this.particles);
  }

  createDiamondModel() {
    this.diamondGroup = new THREE.Group();

    // Main Diamond: Octahedron with bevel and facet shimmer
    const diamondGeo = new THREE.OctahedronGeometry(1.65, 0);
    // Scale to resemble a brilliant cut diamond
    diamondGeo.scale(1.2, 1.45, 1.2);

    // Glowing faceted glass material
    const diamondMat = new THREE.MeshPhysicalMaterial({
      color: 0x00e1ff,
      emissive: 0x003366,
      emissiveIntensity: 0.35,
      metalness: 0.15,
      roughness: 0.05,
      transmission: 0.88,
      thickness: 1.2,
      reflectivity: 0.95,
      clearcoat: 1.0,
      clearcoatRoughness: 0.05,
      wireframe: false
    });

    this.diamondMesh = new THREE.Mesh(diamondGeo, diamondMat);
    this.diamondGroup.add(this.diamondMesh);

    // Holographic glowing neon wireframe edges
    const wireGeo = new THREE.WireframeGeometry(diamondGeo);
    const wireMat = new THREE.LineBasicMaterial({
      color: 0x88ffff,
      linewidth: 2,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending
    });
    const wireLines = new THREE.LineSegments(wireGeo, wireMat);
    this.diamondGroup.add(wireLines);

    // Orbiting mini diamonds
    this.orbitShards = [];
    const shardCount = 6;
    for (let i = 0; i < shardCount; i++) {
      const shardGeo = new THREE.OctahedronGeometry(0.28, 0);
      const shardMat = new THREE.MeshPhysicalMaterial({
        color: 0x00ffff,
        emissive: 0x00ffff,
        emissiveIntensity: 0.6,
        roughness: 0.1,
        metalness: 0.2
      });
      const shard = new THREE.Mesh(shardGeo, shardMat);
      const angle = (i / shardCount) * Math.PI * 2;
      const radius = 2.7 + Math.sin(i) * 0.4;
      shard.position.set(Math.cos(angle) * radius, (Math.random() - 0.5) * 1.5, Math.sin(angle) * radius);
      shard.userData = { angle, radius, speed: 0.8 + Math.random() * 0.6, yOffset: shard.position.y };
      this.diamondGroup.add(shard);
      this.orbitShards.push(shard);
    }

    this.scene.add(this.diamondGroup);
  }

  createAirdropModel() {
    this.airdropGroup = new THREE.Group();

    // Airdrop Crate (Red & Blue military crate with cross straps)
    const crateGeo = new THREE.BoxGeometry(2.0, 1.8, 2.0);
    
    // Multi-material for PUBG/BGMI crate: Red body, Blue tarp top
    const redMat = new THREE.MeshStandardMaterial({
      color: 0xd91a2a,
      roughness: 0.35,
      metalness: 0.4
    });
    const blueMat = new THREE.MeshStandardMaterial({
      color: 0x1a53d9,
      roughness: 0.45,
      metalness: 0.2
    });
    const metalMat = new THREE.MeshStandardMaterial({
      color: 0x222222,
      roughness: 0.2,
      metalness: 0.85
    });

    // Box faces: [+X, -X, +Y, -Y, +Z, -Z]
    const materials = [
      redMat,
      redMat,
      blueMat, // Top is blue tarp
      redMat,
      redMat,
      redMat
    ];

    this.crateMesh = new THREE.Mesh(crateGeo, materials);
    this.airdropGroup.add(this.crateMesh);

    // Metal Frame Straps around crate
    const strapGeo1 = new THREE.BoxGeometry(2.04, 1.84, 0.2);
    const strapMesh1 = new THREE.Mesh(strapGeo1, metalMat);
    this.airdropGroup.add(strapMesh1);

    const strapGeo2 = new THREE.BoxGeometry(0.2, 1.84, 2.04);
    const strapMesh2 = new THREE.Mesh(strapGeo2, metalMat);
    this.airdropGroup.add(strapMesh2);

    // Golden floating UC Coins orbiting crate
    this.orbitCoins = [];
    const coinCount = 5;
    for (let i = 0; i < coinCount; i++) {
      const coinGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.08, 24);
      const coinMat = new THREE.MeshStandardMaterial({
        color: 0xffcc00,
        metalness: 0.9,
        roughness: 0.2,
        emissive: 0xaa7700,
        emissiveIntensity: 0.4
      });
      const coin = new THREE.Mesh(coinGeo, coinMat);
      coin.rotation.x = Math.PI / 2;
      const angle = (i / coinCount) * Math.PI * 2;
      const radius = 2.6;
      coin.position.set(Math.cos(angle) * radius, (Math.random() - 0.5) * 1.5, Math.sin(angle) * radius);
      coin.userData = { angle, radius, speed: 0.9, yOffset: coin.position.y };
      this.airdropGroup.add(coin);
      this.orbitCoins.push(coin);
    }

    // Yellow smoke glowing halo
    const haloGeo = new THREE.TorusGeometry(2.3, 0.1, 16, 50);
    const haloMat = new THREE.MeshBasicMaterial({
      color: 0xffe600,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending
    });
    this.haloMesh = new THREE.Mesh(haloGeo, haloMat);
    this.haloMesh.rotation.x = Math.PI / 2;
    this.airdropGroup.add(this.haloMesh);

    // Initially hide BGMI airdrop until switched
    this.airdropGroup.visible = false;
    this.scene.add(this.airdropGroup);
  }

  setGame(game) {
    this.currentGame = game;
    if (game === 'freefire') {
      this.diamondGroup.visible = true;
      this.airdropGroup.visible = false;
      this.cyanLight.color.setHex(0x00f3ff);
      this.orangeLight.color.setHex(0xff7700);
    } else {
      this.diamondGroup.visible = false;
      this.airdropGroup.visible = true;
      this.cyanLight.color.setHex(0xffd000); // Golden aura for UC
      this.orangeLight.color.setHex(0xff3300);
    }
  }

  bindEvents() {
    window.addEventListener('resize', () => {
      if (!this.container) return;
      const width = this.container.clientWidth;
      const height = this.container.clientHeight;
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(width, height);
    });

    // Touch & Mouse Parallax
    const handleMove = (clientX, clientY) => {
      const rect = this.container.getBoundingClientRect();
      this.mouse.targetX = ((clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.targetY = -(((clientY - rect.top) / rect.height) * 2 - 1);
    };

    window.addEventListener('mousemove', (e) => {
      handleMove(e.clientX, e.clientY);
    });

    window.addEventListener('touchmove', (e) => {
      if (e.touches && e.touches[0]) {
        handleMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    }, { passive: true });
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    const delta = this.clock.getDelta();
    const elapsedTime = this.clock.getElapsedTime();

    // Smooth mouse interpolation
    this.mouse.x += (this.mouse.targetX - this.mouse.x) * 0.05;
    this.mouse.y += (this.mouse.targetY - this.mouse.y) * 0.05;

    // Rotate particle starfield
    if (this.particles) {
      this.particles.rotation.y = elapsedTime * 0.04;
      this.particles.rotation.x = elapsedTime * 0.02;
    }

    // Animate Free Fire Diamond
    if (this.diamondGroup && this.diamondGroup.visible) {
      this.diamondGroup.rotation.y = elapsedTime * 0.8 + this.mouse.x * 0.6;
      this.diamondGroup.rotation.x = Math.sin(elapsedTime * 0.6) * 0.2 + this.mouse.y * 0.3;
      this.diamondGroup.position.y = Math.sin(elapsedTime * 1.5) * 0.18;

      // Shards orbit
      this.orbitShards.forEach((shard) => {
        shard.userData.angle += delta * shard.userData.speed;
        shard.position.x = Math.cos(shard.userData.angle) * shard.userData.radius;
        shard.position.z = Math.sin(shard.userData.angle) * shard.userData.radius;
        shard.position.y = shard.userData.yOffset + Math.sin(elapsedTime * 2 + shard.userData.angle) * 0.3;
        shard.rotation.x += 0.02;
        shard.rotation.y += 0.03;
      });
    }

    // Animate BGMI Crate & UC Coins
    if (this.airdropGroup && this.airdropGroup.visible) {
      this.airdropGroup.rotation.y = elapsedTime * 0.6 + this.mouse.x * 0.6;
      this.airdropGroup.rotation.x = 0.2 + this.mouse.y * 0.3;
      this.airdropGroup.position.y = Math.sin(elapsedTime * 1.2) * 0.22;

      if (this.haloMesh) {
        this.haloMesh.rotation.z = elapsedTime * 0.5;
        this.haloMesh.scale.setScalar(1 + Math.sin(elapsedTime * 2.5) * 0.05);
      }

      this.orbitCoins.forEach((coin) => {
        coin.userData.angle += delta * coin.userData.speed;
        coin.position.x = Math.cos(coin.userData.angle) * coin.userData.radius;
        coin.position.z = Math.sin(coin.userData.angle) * coin.userData.radius;
        coin.position.y = coin.userData.yOffset + Math.sin(elapsedTime * 2 + coin.userData.angle) * 0.25;
        coin.rotation.y += 0.04;
      });
    }

    this.renderer.render(this.scene, this.camera);
  }
}

// Global hook
window.Gaming3DScene = Gaming3DScene;
