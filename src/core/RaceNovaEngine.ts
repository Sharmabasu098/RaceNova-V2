import * as THREE from "three";

export class RaceNovaEngine {
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private clock: THREE.Clock;

  constructor(container: HTMLElement) {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87ceeb);

    this.camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );

    this.camera.position.set(0, 5, 10);
    this.camera.lookAt(0, 0, 0);

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: "high-performance"
    });

    this.renderer.setPixelRatio(
      Math.min(window.devicePixelRatio, 2)
    );

    this.renderer.setSize(
      window.innerWidth,
      window.innerHeight
    );

    container.appendChild(this.renderer.domElement);

    this.clock = new THREE.Clock();

    this.setupLighting();
    this.setupTestWorld();

    window.addEventListener("resize", this.handleResize);
  }

  private setupLighting(): void {
    const ambientLight = new THREE.AmbientLight(
      0xffffff,
      1.5
    );

    this.scene.add(ambientLight);

    const sun = new THREE.DirectionalLight(
      0xffffff,
      2
    );

    sun.position.set(10, 20, 10);

    this.scene.add(sun);
  }

  private setupTestWorld(): void {
    const groundGeometry = new THREE.PlaneGeometry(
      100,
      100
    );

    const groundMaterial = new THREE.MeshStandardMaterial({
      color: 0x3f7d3f
    });

    const ground = new THREE.Mesh(
      groundGeometry,
      groundMaterial
    );

    ground.rotation.x = -Math.PI / 2;

    this.scene.add(ground);

    const roadGeometry = new THREE.PlaneGeometry(
      12,
      100
    );

    const roadMaterial = new THREE.MeshStandardMaterial({
      color: 0x303030
    });

    const road = new THREE.Mesh(
      roadGeometry,
      roadMaterial
    );

    road.rotation.x = -Math.PI / 2;
    road.position.y = 0.01;

    this.scene.add(road);
  }

  public start(): void {
    this.animate();
  }

  private animate = (): void => {
    requestAnimationFrame(this.animate);

    const delta = this.clock.getDelta();

    this.update(delta);

    this.renderer.render(
      this.scene,
      this.camera
    );
  };

  private update(_delta: number): void {
    // Game systems will be connected here.
  }

  private handleResize = (): void => {
    this.camera.aspect =
      window.innerWidth / window.innerHeight;

    this.camera.updateProjectionMatrix();

    this.renderer.setSize(
      window.innerWidth,
      window.innerHeight
    );
  };
  }
