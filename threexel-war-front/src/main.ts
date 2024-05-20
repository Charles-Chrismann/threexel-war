import './style.css'
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/Addons.js';
import {socket, reloadSocket} from './socket';
import { getAllMaps } from './utils';
import { Map } from './types';
import { MicroScene } from './MicroScene';

let roomName = localStorage.getItem('room')

function setSocket() {
  socket.on('message', (msg) => {
    console.log(msg)
  })
  
  socket.on('join room', (msg) => {
    console.log('joining room', msg)
  })
  
  socket.on('update voxel', (voxel) => {
    console.log(voxel)
    setVoxel(voxel)
  })

  socket.on('connect', () => {
    socket.emit('identification', localStorage.getItem('authorization'))
    if(roomName) socket.emit('join room', roomName)
  });
}

setSocket()

socket.on('delete voxel', (voxel) => {
  const voxelToDelete = objects.find((object) => object.position.x === voxel.x && object.position.y === voxel.y && object.position.z === voxel.z)
  if(!voxelToDelete) return
  scene.remove(voxelToDelete)
  objects.splice(objects.indexOf(voxelToDelete), 1)
})

fetch('/api/maps/' + roomName).then(res => res.json()).then((res: Map) => {
  currentMap = res
  setHistoryCursorAttributes()
  res.voxels.forEach((voxel) => setVoxel(voxel))
})

let camera: THREE.PerspectiveCamera;
let scene: THREE.Scene;
let renderer: THREE.WebGLRenderer;
const canvas: HTMLCanvasElement = document.querySelector('canvas')!;
const historyInput = document.querySelector('.ui-history input[type="range"]')! as HTMLInputElement
const uiBar = document.querySelector('.ui-bar')! as HTMLDivElement
const uiControls = document.querySelector('.ui-controls')! as HTMLDivElement
let plane : THREE.Mesh;
let pointer : THREE.Vector2;
let raycaster : THREE.Raycaster;
let isShiftDown = false;
let isRDown = false;

let lastHoveredVoxel: THREE.Object3D | THREE.Mesh | null = null;

let rollOverMesh : THREE.Mesh;
let rollOverMaterial : THREE.MeshBasicMaterial;
let cubeGeo : THREE.BoxGeometry;
let controls: OrbitControls

const colorsPalette:string[] = ["#000000", "#666666", "#aaaaaa", "#ffffff", "#0050cd", "#26c9ff", "#017420", "#11b03c", "#990000", "#ff0013", "#964112", "#ff7829", "#b0701c", "#99004e", "#ff008f", "#cb5a57", "#feafa8", "#ffc126"]

let objects : THREE.Object3D[] = [];
const colorPicker = document.querySelector('#color-picker') as HTMLInputElement

const mapsTab = document.querySelector('#maps')! as HTMLDivElement
let maps : Map[] = []
let currentMap: Map


const authorization = localStorage.getItem('authorization')
const pointerOpacity = authorization ? 0.5 : 0

const modeIndicator = document.querySelector('.ui-mode') as HTMLDivElement

colorsPalette.forEach((color) => {
  const button = document.createElement('button')
  button.classList.add('color-button')
  button.style.backgroundColor = color
  button.onclick = () => {
    colorPicker.value = color
  }
  document.querySelector('#palette')?.appendChild(button)
})

if(!authorization) {
  document.querySelector('.ui-disabled')?.classList.add('active');
  document.querySelector('.auth')?.classList.add('active');
  (document.querySelector('.auth')! as HTMLElement).style.display = 'block'

  const changeForm = document.querySelector('#change-form') as HTMLButtonElement
  const confirmPassword = document.querySelector('#confirm-password') as HTMLInputElement
  const submitButton = document.querySelector('#submit-auth') as HTMLButtonElement
  const loginButton = document.querySelector('#submit-auth') as HTMLButtonElement

  changeForm.onclick = () => {
    changeForm.textContent = changeForm.textContent === "S'inscrire" ? "Se connecter" : "S'inscrire";
    loginButton.textContent = changeForm.textContent === "S'inscrire" ? "Connexion" : "Inscription";
    confirmPassword.classList.toggle('active');
  }

  submitButton.addEventListener('click', async (e) => {
    e.preventDefault();
    const username = (document.querySelector('#username') as HTMLInputElement).value
    const password = (document.querySelector('#password') as HTMLInputElement).value
    const confirmPassword = (document.querySelector('#confirm-password') as HTMLInputElement).value
    const action = changeForm.textContent === "Se connecter" ? 'register' : 'login'
    if(action === 'register' && password !== confirmPassword) {
      alert('Les mots de passe ne correspondent pas')
      return
    }

    const resLoging = await fetch("/api/"+action, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, password, confirmPassword })
    })
    const res = await resLoging.json()
    if(res.status !== '200') {
      alert(res.message);
      return
    }
    localStorage.setItem('authorization', res.token)
    setControls();
    (document.querySelector('.auth')! as HTMLElement).style.display = 'none'
    if(!localStorage.getItem('room')) localStorage.setItem('room', username)
    roomName = username
    inputEl.value = username
    document.querySelector('.ui-disabled')?.classList.remove('active');
    await loadAndResetScene()
    rollOverMaterial.opacity = 0.5
    reloadSocket()
    setSocket()
  })
}

if(authorization) setControls()

function setControls() {
  canvas.addEventListener( 'pointermove', onPointerMove );
  canvas.addEventListener( 'pointerup', onPointerDown );
  window.addEventListener( 'keydown', onDocumentKeyDown );
  window.addEventListener( 'keyup', onDocumentKeyUp );
}

init();
render();

function init() {
  objects = []

  camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 10000 );
  camera.position.set( 500, 800, 1300 );
  camera.lookAt( 0, 0, 0 );

  scene = new THREE.Scene();
  scene.background = new THREE.Color( 0xf0f0f0 );

  // roll-over helpers

  const rollOverGeo = new THREE.BoxGeometry( 50, 50, 50 );

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
  
  //

  window.addEventListener( 'resize', onWindowResize );

}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize( window.innerWidth, window.innerHeight );
}

function onPointerMove(event: MouseEvent) {
  const x = (event.clientX - (event.target as HTMLElement).offsetLeft) / (event.target as HTMLElement).clientWidth;
  const y = (event.clientY - (event.target as HTMLElement).offsetTop) / (event.target as HTMLElement).clientHeight;
  pointer.set(x * 2 - 1, -y * 2 + 1);
  raycaster.setFromCamera(pointer, camera);

  const intersects = raycaster.intersectObjects(objects, false);
  if (intersects.length > 0) {
    const intersect = intersects[0];
    rollOverMesh.position.copy(intersect.point).add(intersect.face!.normal);
    rollOverMesh.position.divideScalar(50).floor().multiplyScalar(50).addScalar(25);
  }

  if (isRDown || isShiftDown) {
    const intersects = raycaster.intersectObjects(objects, false);
    if (intersects.length > 0) {
      const intersect = intersects[0];
      if (intersect.object !== plane) {
        if (lastHoveredVoxel !== intersect.object && intersect.object instanceof THREE.Mesh) {
          intersect.object.material.opacity = 0.5;

          resetlastHoveredVoxel();
          lastHoveredVoxel = intersect.object;
        }
      }
    }
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
          roomName
        })
      }
      
    }// Replace cube
    else if (isRDown) {
      if ( intersect.object !== plane ) {
        //delete current cube
        scene.remove( intersect.object );
        objects.splice( objects.indexOf( intersect.object ), 1 );
        socket.emit('delete', {
          x: intersect.object.position.x,
          y: intersect.object.position.y,
          z: intersect.object.position.z,
          roomName
        })

        // create new cube
        setVoxel({
          x: intersect.object.position.x,
          y: intersect.object.position.y,
          z: intersect.object.position.z,
          color: colorPicker.value
        })
        socket.emit('place', { 
          x: intersect.object.position.x,
          y: intersect.object.position.y,
          z: intersect.object.position.z,
          color: colorPicker.value,
          roomName
        })
      }
    }
    // create cube
    else {

      const voxelPosition = intersect.point.clone().add(intersect.face!.normal);
      voxelPosition.divideScalar(50).floor().multiplyScalar(50).addScalar(25);

      const voxel = {
        x: voxelPosition.x,
        y: voxelPosition.y,
        z: voxelPosition.z,
        color: colorPicker.value,
        roomName
      };

      setVoxel(voxel);
      socket.emit('place', voxel);
    }
  }
}

function onDocumentKeyDown( event: KeyboardEvent) {
  if(modeIndicator.classList.contains('history')) return
  switch ( event.key ) {
    case 'Tab': toggleMapsTab(); break;
    case 'Shift': 
      isShiftDown = true;
      rollOverMaterial.opacity = 0;
      setMode('delete');
      break;
    case 'r': 
      isRDown = true; 
      rollOverMaterial.opacity = 0;
      setMode('edit');
      break;
  }
}

function onDocumentKeyUp( event: KeyboardEvent ) {
  if(modeIndicator.classList.contains('history')) return
  switch ( event.key ) {
    case 'Shift': 
      isShiftDown = false;
      rollOverMaterial.opacity = pointerOpacity;
      resetlastHoveredVoxel();
      setMode('placement');
      break;
    case 'r': 
      isRDown = false; 
      rollOverMaterial.opacity = pointerOpacity;
      resetlastHoveredVoxel();
      setMode('placement');
      break;
  }
}

function render() {
  requestAnimationFrame(render)
  controls.update();
  renderer.render( scene, camera );
}

function setVoxel(voxelData: any) {
  let cubeMaterial = new THREE.MeshBasicMaterial( { color: voxelData.color, transparent:true, opacity:1 } );

  const voxel = new THREE.Mesh( cubeGeo, cubeMaterial );
  voxel.position.set(voxelData.x, voxelData.y, voxelData.z)
  // voxel.position.copy( intersect.point ).add( intersect.face!.normal );
  // voxel.position.divideScalar( 50 ).floor().multiplyScalar( 50 ).addScalar( 25 );
  
  scene.add( voxel );
  objects.push( voxel );
}

const inputEl = document.querySelector('.ui-room input')! as HTMLInputElement
inputEl.value = localStorage.getItem('room') ?? ''
document.querySelector('#switch-room')!.addEventListener('click', async () => {
  if(inputEl.value === '') return
  localStorage.setItem('room', inputEl.value)
  roomName = inputEl.value
  socket.emit('join room', inputEl.value)

  loadAndResetScene()
})

async function loadAndResetScene() {
  const res = await fetch('/api/maps/' + roomName)
  const map = await res.json() as Map
  currentMap = map
  setHistoryCursorAttributes()
  init()
  map.voxels.forEach((voxel) => setVoxel(voxel))
}

function setHistoryCursorAttributes() {
  const startDate = new Date(currentMap.createdAt)
  historyInput.min = String(startDate.getTime())
  historyInput.max = String(Date.now())
  historyInput.value = historyInput.max
  // historyInput.step = String(10000000)
  historyInput.step = String((+historyInput.max - +historyInput.min) / 100)
}

historyInput.addEventListener('input', () => {
  const date = new Date(+historyInput.value)
  const filtered = currentMap.voxels.filter(voxel => voxel.createdAt <= date.toISOString() && voxel.createdAt === voxel.updatedAt)
  objects.forEach(obj => scene.remove(obj))
  objects = []
  console.log(objects)
  filtered.forEach(voxel => setVoxel(voxel))
})

async function toggleMapsTab() {
  if(mapsTab.style.display === 'grid') {
    mapsTab.style.display = 'none'
    return
  } else {
    mapsTab.style.display = 'grid'
  }
  if(!maps.length) {
    maps = await getAllMaps()
    mapsTab.style.display = 'grid'
    maps.forEach(map => {
      const micro = new MicroScene(mapsTab, map)
      micro.renderer.domElement.addEventListener('click', () => {
        mapsTab.style.display = 'none'  
        localStorage.setItem('room', map.user.username)
        roomName = map.user.username 
        inputEl.value = map.user.username 
        socket.emit('join room', map.user.username)

        loadAndResetScene()
      })
    })
  }
}

function resetlastHoveredVoxel() {
  if (lastHoveredVoxel && lastHoveredVoxel instanceof THREE.Mesh) {
    console.log(lastHoveredVoxel)
    lastHoveredVoxel.material.opacity = 1;
    lastHoveredVoxel = null;
  }
}

function setMode(mode: string) {
  modeIndicator.className = '';
  modeIndicator.classList.add('ui-mode', mode)
}
console.log(modeIndicator.textContent)
function toggleHistoryMode() {
  historyInput.classList.toggle('hide')
  modeIndicator.classList.toggle('history')
  modeIndicator.classList.toggle('placement')
  rollOverMesh.visible = rollOverMesh.visible === false ? true : false
  uiBar.classList.toggle('hide')
  uiControls.classList.toggle('hide')
}