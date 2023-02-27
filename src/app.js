/*
Followed this guy's instructions: https://www.youtube.com/watch?v=8K5wJeVgjrM
*/ 

// LIBRARIES
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import gsap from 'gsap';
import { GUI } from 'dat.gui';

// SHADERS
import vertex from './shaders/vertex.glsl';
import fragment from './shaders/fragment.glsl';


export default class Sketch{
    constructor(){
        // Scene, Camera, Renderer
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 0.1, 1000 );
        this.camera.position.set(-2,2,-2);
        this.renderer = new THREE.WebGLRenderer({
            canvas: document.querySelector('#bg'),
        });
        this.renderer.setSize( window.innerWidth, window.innerHeight );
        this.time = 0;
        
        // Orbit Controls
        this.controls = new OrbitControls(this.camera, this.renderer.domElement)
        this.createGUI();

        // Global Variables 
        // in createArrows()
        this.arrows = [];
        this.arrows_dir = [];
        this.offset = [];
        
        // Add Objects
        //this.createMesh();
        this.createGrid();
        this.createArrow();

        // Event Listeners
        window.addEventListener('resize', this.onWindowResize, false);
        this.animate();
    };

    onWindowResize = () =>{
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    };

    render = () =>{
        this.time++;
        this.renderer.render( this.scene, this.camera );
    };

    animate = () =>{
        //console.log(this.arrows.dir);
        //console.log(this.arrows.position)
        this.arrows.forEach( (element,index) => {
            //this.arrows_dir[index] 
            let angle = this.offset[index];
            let current_pos = this.arrows_dir[index];
            let rot_mat = this.rotationMatrix('z', angle);

            let new_pos = this.multiplyMatrixAndPoint(rot_mat, current_pos);
            this.arrows_dir[index] = new_pos;
            element.setDirection(new_pos);
        }) 

        if(this.time == 150 && this.time > 0){
            this.refocusPulse();
        }else if(this.time % 600 == 0){
            this.refocusPulse();
            //alert("Refocused!!!")
        }

        this.render();  
        requestAnimationFrame( this.animate );
    };

    // Manual Rotation Matrices
    rotationMatrix = (axis, angle) => {
        if(axis === 'x'){
            return [1, 0, 0, 
                    0, Math.cos(angle), -Math.sin(angle),
                    0, Math.sin(angle), Math.cos(angle)]
        }else if(axis === 'z'){
            return [Math.cos(angle), 0, Math.sin(angle),
                    0            , 1, 0,
                    -Math.sin(angle), 0, Math.cos(angle)]
        }else if(axis === 'y'){
            return [Math.cos(angle), -Math.sin(angle), 0,
                    Math.sin(angle),  Math.cos(angle), 0,
                    0, 0 ,1]
        }else{
            return None
        }
    };

    // point • matrix
    multiplyMatrixAndPoint = (matrix, point) => {
        // Give a simple variable name to each part of the matrix, a column and row number
        let c0r0 = matrix[0],
            c1r0 = matrix[1],
            c2r0 = matrix[2];
            
        let c0r1 = matrix[3],
            c1r1 = matrix[4],
            c2r1 = matrix[5];
            
        let c0r2 = matrix[6],
            c1r2 = matrix[7],
            c2r2 = matrix[8];

        // Now set some simple names for the point
        let x = point.x;
        let y = point.y;
        let z = point.z;

        // Multiply the point against each part of the 1st column, then add together
        let resultX = x * c0r0 + y * c0r1 + z * c0r2;

        // Multiply the point against each part of the 2nd column, then add together
        let resultY = x * c1r0 + y * c1r1 + z * c1r2;

        // Multiply the point against each part of the 3rd column, then add together
        let resultZ = x * c2r0 + y * c2r1 + z * c2r2;

        return new THREE.Vector3(resultX, resultY, resultZ);
    };

    createGUI = () => {
        // Reset Animation
        this.gui = new GUI();
        this.resetAnimation = 
            () => {
                this.arrows.forEach( (element,index) => {
                    const dir = new THREE.Vector3( 0, 0, 1 );
                    this.arrows_dir[index] = dir;
                    element.setDirection(dir);
                });

                this.time = 0;
            };

        this.gui.add(this,'resetAnimation').name('Reset Animation');

        // Refocusing
        this.refocusPulse = 
            () => {
                this.arrows.forEach( (element,index) => {
                    let angle = Math.PI;
                    let current_pos = this.arrows_dir[index];
                    let rot_mat = this.rotationMatrix('x', angle);
        
                    let new_pos = this.multiplyMatrixAndPoint(rot_mat, current_pos);
                    this.arrows_dir[index] = new_pos;
                    element.setDirection(new_pos);
                });
            };

        this.gui.add(this,'refocusPulse').name('180 RF Pulse');

        // Refocusing VFA
        this.refocusPulseVFA = 
              function() {
                //console.log(this.rotationMatrix('x', 90))
                this.arrows.forEach( (element,index) => {
                    let angle = 90*Math.PI/180;
                    let current_pos = this.arrows_dir[index];
                    let rot_mat = this.rotationMatrix('x', angle);
        
                    let new_pos = this.multiplyMatrixAndPoint(rot_mat, current_pos);
                    this.arrows_dir[index] = new_pos;
                    element.setDirection(new_pos);
                });
            };

        this.gui.add(this,'refocusPulseVFA').name('VFA RF Pulse');
        //this.gui.add(sphere.rotation, 'x', -3, 3).onChange()
        //this.gui.add(sphere.rotation, 'y', -3, 3).onChange()
        //this.gui.add(sphere.rotation, 'z', -3, 3).onChange()
    }

    createMesh = () =>{
        //Mesh
        let number = 512;
        this.geometry = new THREE.BufferGeometry();
        this.positions = new THREE.BufferAttribute(new Float32Array(number*number*3),3);
        this.coordinates = new THREE.BufferAttribute(new Float32Array(number*number*3),3);

        let index = 0;
        for (let i = 0; i < number; i++) {
            let posX = i - number/2;
            for (let j = 0; j < number; j++) {
                this.positions.setXYZ(index, posX, j-number/2, 0);
                this.coordinates.setXYZ(index, i, j, 0);
                index++;
            }    
        }

        this.geometry.setAttribute('position', this.positions);
        this.geometry.setAttribute('aCoordinates', this.coordinates);

        this.material = new THREE.ShaderMaterial({
            vertexShader: vertex,
            fragmentShader: fragment
        })
        this.plane = new THREE.Points(this.geometry, this.material);
        this.scene.add(this.plane);
    }

    createGrid = () => {
        this.gridHelper = new THREE.GridHelper();
        this.scene.add( this.gridHelper );
        this.gridHelper2 = new THREE.GridHelper();
        this.axesHelper = new THREE.AxesHelper( 5 );
        this.scene.add( this.axesHelper );
    } 

    createArrow = () => {

        for (let index = 0; index < 11; index++) {
            const dir = new THREE.Vector3( 0, 0, 1 );

            //normalize the direction vector (convert to vector of length 1)
            dir.normalize();

            const origin = new THREE.Vector3( 0, 0, 0 );
            const length = 2;

            var letters = "0123456789ABCDEF";
      
            // html color code starts with #
            var color = '#';
            
            // generating 6 times as HTML color code consist
            // of 6 letter or digits
            for (var i = 0; i < 6; i++)
            color += letters[(Math.floor(Math.random() * 16))];
            
            //console.log(color);
            const hex = color;

            const arrowHelper = new THREE.ArrowHelper( dir, origin, length, hex );
            this.arrows.push( arrowHelper );
            this.arrows_dir.push( dir );
            this.offset.push( (index-5)/3000); 
            this.scene.add( arrowHelper );
        }
        
    }

    
   
}

var draw = new Sketch();