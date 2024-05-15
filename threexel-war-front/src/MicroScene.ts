import * as THREE from 'three';
import { Map, Voxel } from "./types";

export class MicroScene {
  camera : THREE.PerspectiveCamera
  scene: THREE.Scene
  renderer: THREE.WebGLRenderer
  objects : THREE.Object3D[] = []
  cubeGeo = new THREE.BoxGeometry( 50, 50, 50 );
  constructor(parentElement: HTMLElement, map: Map) {
    const canvas = document.createElement('canvas')
    parentElement.appendChild(canvas)
    this.camera = new THREE.PerspectiveCamera( 45, 300 / 300, 1, 10000 );
    this.camera.position.set( 500, 800, 1300 );
    this.camera.lookAt( 0, 0, 0 );

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color( 0xf0f0f0 );

    const ambientLight = new THREE.AmbientLight( 0x606060, 3 );
    this.scene.add( ambientLight );

    const directionalLight = new THREE.DirectionalLight( 0xffffff, 3 );
    directionalLight.position.set( 1, 0.75, 0.5 ).normalize();
    this.scene.add( directionalLight );

    this.renderer = new THREE.WebGLRenderer( { antialias: true , canvas} );
    this.renderer.setPixelRatio( window.devicePixelRatio );
    this.renderer.setSize( 300, 300 );

    map.voxels.forEach(voxel => this.setVoxel(voxel))

    this.renderer.render(this.scene, this.camera)
  }

  setVoxel(voxelData: Voxel) {
    let cubeMaterial = new THREE.MeshBasicMaterial( { color: voxelData.color } );
  
    const voxel = new THREE.Mesh( this.cubeGeo, cubeMaterial );
    voxel.position.set(voxelData.x, voxelData.y, voxelData.z)
    // voxel.position.copy( intersect.point ).add( intersect.face!.normal );
    // voxel.position.divideScalar( 50 ).floor().multiplyScalar( 50 ).addScalar( 25 );
    
    this.scene.add( voxel );
    this.objects.push( voxel );
  }
}