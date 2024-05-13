import './style.css'
import { setupCounter } from './counter.ts'
import { io } from "socket.io-client";
import * as THREE from 'three';

const socket = io()
socket.on('message', (msg) => {
  console.log(msg)
})

fetch('/api').then(res => res.json()).then(res => console.log('lares', res))


// let camera, scene, renderer;

let camera: THREE.PerspectiveCamera;
let scene: THREE.Scene;
let renderer: THREE.WebGLRenderer;
let canvas: HTMLCanvasElement = document.querySelector('canvas')!;
let plane : THREE.Mesh;
let pointer : THREE.Vector2;
let raycaster : THREE.Raycaster;
let isShiftDown = false;

let rollOverMesh : THREE.Mesh;
let rollOverMaterial : THREE.MeshBasicMaterial;
let cubeGeo : THREE.BoxGeometry;
let cubeMaterial : THREE.MeshLambertMaterial;

const objects : THREE.Object3D[] = [];

init();
render();

function init() {

  camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 10000 );
  camera.position.set( 500, 800, 1300 );
  camera.lookAt( 0, 0, 0 );

  scene = new THREE.Scene();
  scene.background = new THREE.Color( 0xf0f0f0 );

  // roll-over helpers

  const rollOverGeo = new THREE.BoxGeometry( 50, 50, 50 );
  rollOverMaterial = new THREE.MeshBasicMaterial( { color: 0xff0000, opacity: 0.5, transparent: true } );
  rollOverMesh = new THREE.Mesh( rollOverGeo, rollOverMaterial );
  scene.add( rollOverMesh );

  // cubes

  cubeGeo = new THREE.BoxGeometry( 50, 50, 50 );
  cubeMaterial = new THREE.MeshLambertMaterial( { color: 'red' } );

  // grid
  const gridHelper = new THREE.GridHelper( 1000, 20 );
  scene.add( gridHelper );

  //

  raycaster = new THREE.Raycaster();
  pointer = new THREE.Vector2();

  const geometry = new THREE.PlaneGeometry( 1000, 1000 );
  geometry.rotateX( - Math.PI / 2 );

  plane = new THREE.Mesh( geometry, new THREE.MeshBasicMaterial( { visible: false } ) );
  scene.add( plane );

  objects.push( plane );

  // lights

  const ambientLight = new THREE.AmbientLight( 0x606060, 3 );
  scene.add( ambientLight );

  const directionalLight = new THREE.DirectionalLight( 0xffffff, 3 );
  directionalLight.position.set( 1, 0.75, 0.5 ).normalize();
  scene.add( directionalLight );

  renderer = new THREE.WebGLRenderer( { antialias: true , canvas} );
  renderer.setPixelRatio( window.devicePixelRatio );
  renderer.setSize( canvas.width, canvas.height );

  canvas.addEventListener( 'pointermove', onPointerMove );
  canvas.addEventListener( 'pointerdown', onPointerDown );
  canvas.addEventListener( 'keydown', onDocumentKeyDown );
  canvas.addEventListener( 'keyup', onDocumentKeyUp );

  //

  window.addEventListener( 'resize', onWindowResize );

}

function onWindowResize() {

  camera.aspect = canvas.width / canvas.height;
  camera.updateProjectionMatrix();
  renderer.setSize( canvas.width, canvas.height );
  render();

}

function onPointerMove( event: MouseEvent) {
  pointer.set( ( event.clientX / window.innerWidth ) * 2 - 1, - ( event.clientY / window.innerHeight ) * 2 + 1 );
  console.log(event.clientX, event.clientY, pointer.x, pointer.y)
  raycaster.setFromCamera( pointer, camera );
  const intersects = raycaster.intersectObjects( objects, false );
  if ( intersects.length > 0 ) {
    const intersect = intersects[ 0 ];
    rollOverMesh.position.copy( intersect.point ).add( intersect.face!.normal );
    rollOverMesh.position.divideScalar( 50 ).floor().multiplyScalar( 50 ).addScalar( 25 );
    render();
  }
}

function onPointerDown( event: MouseEvent) {
  pointer.set( ( event.clientX / window.innerWidth ) * 2 - 1, - ( event.clientY / window.innerHeight ) * 2 + 1 );
  raycaster.setFromCamera( pointer, camera );
  const intersects = raycaster.intersectObjects( objects, false );
  if ( intersects.length > 0 ) {
    const intersect = intersects[ 0 ];

    // delete cube
    if ( isShiftDown ) {
      if ( intersect.object !== plane ) {
        scene.remove( intersect.object );
        objects.splice( objects.indexOf( intersect.object ), 1 );
      }

      // create cube

    } else {

      const voxel = new THREE.Mesh( cubeGeo, cubeMaterial );
      voxel.position.copy( intersect.point ).add( intersect.face!.normal );
      voxel.position.divideScalar( 50 ).floor().multiplyScalar( 50 ).addScalar( 25 );
      scene.add( voxel );

      objects.push( voxel );

    }

    render();

  }

}

function onDocumentKeyDown( event: KeyboardEvent) {
  switch ( event.key ) {
    case 'Shift': isShiftDown = true; break;
  }
}

function onDocumentKeyUp( event: KeyboardEvent ) {
  switch ( event.key ) {
    case 'Shift': isShiftDown = false; break;
  }
}

function render() {
  renderer.render( scene, camera );
}