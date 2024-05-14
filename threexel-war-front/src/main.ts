import './style.css'
import { io } from "socket.io-client";
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/Addons.js';

const socket = io({
  auth: {
    token: localStorage.getItem('authorization')
  }
})
socket.on('message', (msg) => {
  console.log(msg)
})

socket.emit('join room', "moi", 1)

socket.on('join room', (msg) => {
  console.log(msg)
})

socket.on('update voxel', (voxel) => {
  console.log(voxel)
  setVoxel(voxel)
})

fetch('/api/map/Tom').then(res => res.json()).then((res: any) => {
  res.forEach((voxel: any) => setVoxel(voxel))
})


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
let controls: OrbitControls

const colorsPalette:string[] = ["#000000", "#666666", "#aaaaaa", "#ffffff", "#0050cd", "#26c9ff", "#017420", "#11b03c", "#990000", "#ff0013", "#964112", "#ff7829", "#b0701c", "#99004e", "#ff008f", "#cb5a57", "#feafa8", "#ffc126"]

const objects : THREE.Object3D[] = [];
const colorPicker = document.querySelector('#color-picker') as HTMLInputElement

const authorization : string = localStorage.getItem('authorization') || ''

init();
render();

function init() {

  colorsPalette.forEach((color) => {
    const button = document.createElement('button')
    button.classList.add('color-button')
    button.style.backgroundColor = color
    button.onclick = () => {
      colorPicker.value = color
    }
    document.querySelector('#palette')?.appendChild(button)
  })

  if(authorization === '') {
    document.querySelector('.ui-disabled')?.classList.add('active');
    document.querySelector('.auth')?.classList.add('active');

    const changeForm = document.querySelector('#change-form') as HTMLButtonElement
    const confirmPassword = document.querySelector('#confirm-password') as HTMLInputElement
    const submitButton = document.querySelector('#submit-auth') as HTMLButtonElement

    changeForm.onclick = () => {
      changeForm.textContent = changeForm.textContent === "S'inscrire" ? "Se connecter" : "S'inscrire";
      confirmPassword.classList.toggle('active');
    }

    submitButton.addEventListener('click', (e) => {
      e.preventDefault();
      const username = (document.querySelector('#username') as HTMLInputElement).value
      const password = (document.querySelector('#password') as HTMLInputElement).value
      const confirmPassword = (document.querySelector('#confirm-password') as HTMLInputElement).value
      const action = changeForm.textContent === "Se connecter" ? 'register' : 'login'
      if(action === 'register' && password !== confirmPassword) {
        alert('Les mots de passe ne correspondent pas')
        return
      }

      fetch("/api/"+action, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      }).then(res => res.json()).then(res => {
          if(res.status !== '200') {
            alert(res.message);
            return
          }
          localStorage.setItem('authorization', res.token)
          location.reload()
        })
    })
  }

  camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 10000 );
  camera.position.set( 500, 800, 1300 );
  camera.lookAt( 0, 0, 0 );

  scene = new THREE.Scene();
  scene.background = new THREE.Color( 0xf0f0f0 );

  // roll-over helpers

  const rollOverGeo = new THREE.BoxGeometry( 50, 50, 50 );

  const pointerOpacity = authorization !== '' ? 0.5 : 0

  rollOverMaterial = new THREE.MeshBasicMaterial( { color: 0xff0000, opacity: pointerOpacity, transparent: true } );
  rollOverMesh = new THREE.Mesh( rollOverGeo, rollOverMaterial );
  scene.add( rollOverMesh );

  // cubes

  cubeGeo = new THREE.BoxGeometry( 50, 50, 50 );

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
  renderer.setSize( window.innerWidth, window.innerHeight );
  controls = new OrbitControls( camera, renderer.domElement );

  if(authorization !== '') {
    canvas.addEventListener( 'pointermove', onPointerMove );
    canvas.addEventListener( 'pointerup', onPointerDown );
    window.addEventListener( 'keydown', onDocumentKeyDown );
    window.addEventListener( 'keyup', onDocumentKeyUp );
  }
  
  //

  window.addEventListener( 'resize', onWindowResize );

}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize( window.innerWidth, window.innerHeight );
}

function onPointerMove( event: MouseEvent) {
  const x = (event.clientX - (event.target as HTMLElement).offsetLeft) / (event.target as HTMLElement).clientWidth
  const y = (event.clientY - (event.target as HTMLElement).offsetTop) / (event.target as HTMLElement).clientHeight
  // pointer.set( ( event.clientX / window.innerWidth ) * 2 - 1, - ( event.clientY / window.innerHeight ) * 2 + 1 );
  pointer.set( x * 2 - 1, - y * 2 + 1 );
  raycaster.setFromCamera( pointer, camera );
  const intersects = raycaster.intersectObjects( objects, false );
  if ( intersects.length > 0 ) {
    const intersect = intersects[ 0 ];
    rollOverMesh.position.copy( intersect.point ).add( intersect.face!.normal );
    rollOverMesh.position.divideScalar( 50 ).floor().multiplyScalar( 50 ).addScalar( 25 );
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
        socket.emit('delete', {
          x: intersect.object.position.x,
          y: intersect.object.position.y,
          z: intersect.object.position.z,
          roomName: "Tom"
        })
      }

      // create cube

    } else {

      let cubeMaterial = new THREE.MeshLambertMaterial( { color: colorPicker.value } );

      const voxel = new THREE.Mesh( cubeGeo, cubeMaterial );
      voxel.position.copy( intersect.point ).add( intersect.face!.normal );
      voxel.position.divideScalar( 50 ).floor().multiplyScalar( 50 ).addScalar( 25 );
      console.log(voxel.position)
      socket.emit('place', { 
        x: voxel.position.x,
        y: voxel.position.y,
        z: voxel.position.z,
        color: colorPicker.value,
        roomName: "Tom"
      })
      // scene.add( voxel );

      // objects.push( voxel );

    }
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
  requestAnimationFrame(render)
  controls.update();
  renderer.render( scene, camera );
}

function setVoxel(voxelData: any) {
  let cubeMaterial = new THREE.MeshLambertMaterial( { color: voxelData.color } );

  const voxel = new THREE.Mesh( cubeGeo, cubeMaterial );
  voxel.position.set(voxelData.x, voxelData.y, voxelData.z)
  // voxel.position.copy( intersect.point ).add( intersect.face!.normal );
  // voxel.position.divideScalar( 50 ).floor().multiplyScalar( 50 ).addScalar( 25 );
  
  scene.add( voxel );
  objects.push( voxel );
}