import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { io, type Socket } from 'socket.io-client';
import type { WorldSnapshot } from '@space-mmo/shared';

export default function App() {
 const mountRef = useRef<HTMLDivElement>(null); const socketRef = useRef<Socket | null>(null);
 const [playersCount, setPlayersCount] = useState(0); const [status, setStatus] = useState('CONNECTING');
 useEffect(() => {
  const mount = mountRef.current; if (!mount) return;
  const scene = new THREE.Scene(); scene.background = new THREE.Color('#050914'); scene.fog = new THREE.FogExp2('#050914', 0.012);
  const camera = new THREE.PerspectiveCamera(60, mount.clientWidth / mount.clientHeight, 0.1, 1000); camera.position.set(0, 26, 32); camera.lookAt(0,0,0);
  const renderer = new THREE.WebGLRenderer({ antialias: true }); renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); renderer.setSize(mount.clientWidth, mount.clientHeight); mount.appendChild(renderer.domElement);
  scene.add(new THREE.AmbientLight(0xffffff, 1.1)); const light = new THREE.PointLight(0x77aaff, 2, 200); light.position.set(0,12,0); scene.add(light);
  const starGeo = new THREE.BufferGeometry(); const starPositions = new Float32Array(1200*3); for(let i=0;i<starPositions.length;i++) starPositions[i]=(Math.random()-0.5)*500; starGeo.setAttribute('position',new THREE.BufferAttribute(starPositions,3)); scene.add(new THREE.Points(starGeo,new THREE.PointsMaterial({color:0xb9d9ff,size:0.6})));
  const grid = new THREE.GridHelper(180,60,0x1c3b62,0x10223a); grid.position.y=-0.5; scene.add(grid);
  const sun = new THREE.Mesh(new THREE.SphereGeometry(3,32,32),new THREE.MeshBasicMaterial({color:0xffc66b})); scene.add(sun);
  const planet = new THREE.Mesh(new THREE.SphereGeometry(1.8,24,24),new THREE.MeshStandardMaterial({color:0x2874bd,roughness:0.8})); planet.position.set(15,0,-12); scene.add(planet);
  const ships = new Map<string,THREE.Mesh>(); const socket=io(import.meta.env.VITE_API_URL || 'http://localhost:3000'); socketRef.current=socket;
  socket.on('connect',()=>setStatus('ONLINE')); socket.on('disconnect',()=>setStatus('OFFLINE'));
  socket.on('world:snapshot',(snapshot:WorldSnapshot)=>{setPlayersCount(snapshot.players.length); const seen=new Set<string>(); snapshot.players.forEach(p=>{seen.add(p.id); let mesh=ships.get(p.id); if(!mesh){mesh=new THREE.Mesh(new THREE.ConeGeometry(0.6,1.8,4),new THREE.MeshStandardMaterial({color:0x59d8ff,emissive:0x103344})); mesh.rotation.x=Math.PI/2; scene.add(mesh); ships.set(p.id,mesh);} mesh.position.set(p.position.x,0.2,p.position.z); mesh.rotation.y=p.rotationY;}); for(const [id,mesh] of ships){if(!seen.has(id)){scene.remove(mesh);ships.delete(id);}}});
  const keys=new Set<string>(); const keydown=(e:KeyboardEvent)=>keys.add(e.key.toLowerCase()); const keyup=(e:KeyboardEvent)=>keys.delete(e.key.toLowerCase()); window.addEventListener('keydown',keydown);window.addEventListener('keyup',keyup);
  const loop=()=>{renderer.render(scene,camera); socket.emit('input',{forward:(keys.has('w')||keys.has('arrowup')?1:0)-(keys.has('s')||keys.has('arrowdown')?1:0),turn:(keys.has('d')||keys.has('arrowright')?1:0)-(keys.has('a')||keys.has('arrowleft')?1:0)}); requestAnimationFrame(loop);}; loop();
  const resize=()=>{camera.aspect=mount.clientWidth/mount.clientHeight;camera.updateProjectionMatrix();renderer.setSize(mount.clientWidth,mount.clientHeight);};window.addEventListener('resize',resize);
  return()=>{socket.disconnect();window.removeEventListener('keydown',keydown);window.removeEventListener('keyup',keyup);window.removeEventListener('resize',resize);renderer.dispose();mount.removeChild(renderer.domElement);};
 },[]);
 return <main className="shell"><header className="topbar"><div className="brand"><span className="mark">✦</span><div><strong>ORBITAL</strong><small>SPACE MMO / FLIGHT DECK</small></div></div><div className="status"><i className={status==='ONLINE'?'online':''}/>{status}<span className="divider"/>PILOTS IN SYSTEM <b>{playersCount}</b></div></header><section className="viewport" ref={mountRef}><div className="hud top-left"><small>LOCAL SYSTEM</small><strong>KEPLER SECTOR</strong><span>Navigation grid · 3D space</span></div><div className="hud top-right"><small>SHIP CONTROL</small><strong>W / S <span>THRUST</span></strong><strong>A / D <span>ROTATE</span></strong></div><div className="crosshair">+</div><div className="hud bottom-left"><small>FLIGHT STATUS</small><strong>READY FOR DEPARTURE</strong></div><div className="hud bottom-right"><small>SIMULATION</small><strong>SERVER AUTHORITATIVE</strong><span>100 ms state updates</span></div></section><footer><span>SPACE MMO — PROTOTYPE 0.1</span><span>WASD / ARROWS TO FLY</span><span>THREE.JS WEBGL</span></footer></main>;
}
