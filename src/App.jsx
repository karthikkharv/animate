import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

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
    camera.position.set(0, 5, 10);

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

      // Store the original color for resetting later
      originalColors.current[mesh] = color;
    };

    // Adding different geometries, spaced evenly
    const colors = [0xff0000, 0x00ff00, 0xffa500, 0xffff00, 0x00ffff];
    const spacing = 4; // Space between objects

    // Distribute objects evenly along X-axis
    addObject(new THREE.BoxGeometry(1, 1, 1), colors[0], [-spacing * 2, 0, 0]);
    addObject(new THREE.SphereGeometry(0.75, 32, 32), colors[1], [-spacing, 0, 0]);
    addObject(new THREE.TorusGeometry(0.7, 0.2, 16, 100), colors[2], [0, 0, 0]);
    addObject(new THREE.CylinderGeometry(0.5, 0.5, 2, 32), colors[3], [spacing, 0, 0]);
    addObject(new THREE.ConeGeometry(0.7, 1.5, 32), colors[4], [spacing * 2, 0, 0]);

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
    
      // Reset all objects to their original color and remove unique properties
      objects.forEach((obj, index) => {
        // Reset the color to its original color
        obj.material.color.set(colors[index]);
    
        // Remove wireframe and outline if exists
        obj.material.wireframe = false;
        if (obj.userData.outline) {
          scene.remove(obj.userData.outline); // Remove the outline if it exists
          obj.userData.outline = null; // Clear reference to the outline
        }
      });
    
      // If a new object is clicked
      if (intersects.length > 0) {
        const selected = intersects[0].object;
    
        // Change color of the clicked object (highlighting)
        selected.material.color.set(0xffffff); // Highlight color (e.g., white)
    
        // Set rotation direction to reverse
        selected.userData.rotateDirection = -1;
    
        // Create and apply outline effect
        const outline = new THREE.Mesh(selected.geometry, outlineMaterial);
        // outline.scale.set(1.05, 1.05, 1.05);
        outline.position.copy(selected.position);
        outline.rotation.copy(selected.rotation);
        outline.quaternion.copy(selected.quaternion);
    
        scene.add(outline);
        selected.userData.outline = outline; // Store the outline for future removal
    
        // Add wireframe effect to make it visually distinct
        selected.material.wireframe = true;
    
        // Store the selected object reference
        selectedRef.current = { object: selected, outline };
      }
    };
    

    renderer.domElement.addEventListener("click", onClick);

    const animate = () => {
      controls.update();

      objects.forEach((obj) => {
        if (obj.userData.rotateDirection === -1) {
          obj.rotation.y -= 0.005; // Reverse rotation when selected
        } else {
          obj.rotation.y += 0.005; // Normal rotation for other objects
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
