import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import "./App.css"
export default function App() {
  const mountRef = useRef(null);
  const selectedRef = useRef(null);

  const originalColors = useRef({});

  useEffect(() => {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x202020);

    const camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      100
    );
    camera.position.set(0, 5, 15);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    mountRef.current.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 10, 7.5);
    scene.add(ambientLight, directionalLight);

    // Ground
    const groundGeo = new THREE.PlaneGeometry(100, 100);
    const groundMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -1;
    scene.add(ground);

    // Objects
    const objects = [];

    const addObject = (geometry, color, position) => {
      const material = new THREE.MeshStandardMaterial({ color });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(...position);
      scene.add(mesh);
      objects.push(mesh);

      originalColors.current[mesh] = color;
    };

    const colors = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff, 0x00ffff];
    const spacing = 4;

    addObject(new THREE.SphereGeometry(0.75, 32, 32), colors[0], [-spacing * 2, 0, 0]);
    addObject(new THREE.CylinderGeometry(0.5, 0.5, 2, 32), colors[1], [-spacing, 0, 0]);
    addObject(new THREE.ConeGeometry(0.7, 1.5, 32), colors[2], [0, 0, 0]);
    addObject(
      new THREE.LatheGeometry([
        new THREE.Vector2(0, 0),
        new THREE.Vector2(0.3, 0.5),
        new THREE.Vector2(0.2, 1)
      ]),
      colors[3],
      [spacing, 0, 0]
    );
    addObject(new THREE.CapsuleGeometry(0.3, 1, 4, 8), colors[4], [spacing * 2, 0, 0]);

    // Raycaster
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const outlineMaterial = new THREE.MeshBasicMaterial({
      color: 0xffff00,
      side: THREE.BackSide,
    });

    const onClick = (event) => {
      const bounds = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
      mouse.y = -((event.clientY - bounds.top) / bounds.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(objects);

      objects.forEach((obj, index) => {
        obj.material.color.set(colors[index]);
        obj.material.wireframe = false;
        if (obj.userData.outline) {
          scene.remove(obj.userData.outline);
          obj.userData.outline = null;
        }
      });

      if (intersects.length > 0) {
        const selected = intersects[0].object;
        selected.material.color.set(0xffffff);
        selected.userData.rotateDirection = -1;

        const outline = new THREE.Mesh(selected.geometry, outlineMaterial);
        outline.position.copy(selected.position);
        outline.rotation.copy(selected.rotation);
        outline.quaternion.copy(selected.quaternion);

        scene.add(outline);
        selected.userData.outline = outline;
        selected.material.wireframe = true;
        selectedRef.current = { object: selected, outline };
      }
    };

    renderer.domElement.addEventListener("click", onClick);

    const animate = () => {
      controls.update();

      objects.forEach((obj) => {
        if (obj.userData.rotateDirection === -1) {
          obj.rotation.y -= 0.005;
        } else {
          obj.rotation.y += 0.005;
        }
      });

      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    };

    animate();

    window.addEventListener("resize", () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }, []);

  return <div ref={mountRef} style={{ width: "100vw", height: "100vh" }} />;
}
