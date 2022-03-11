// -*- javascript -*-
////////////////////////////////////////////Convex hull



function norm(v){
    let s = 0.0;
    for(let dim=0; dim<3; dim++){
        s += v[dim]*v[dim];
    }
    return sqrt(s);
}


function normalize(v){
    let n = 1./norm(v);
    let newv = new Array(3);
    for(let dim=0; dim<3; dim++){
        newv[dim] = v[dim]*n;
    }
    return newv;
}


function plain(vertices, vs){
    //println(["vs",vs]);
    let v0 = vertices.get(vs[0]);
    let v1 = vertices.get(vs[1]);
    let v2 = vertices.get(vs[2]);
    let v01 = [];
    let v02 = [];
    for(let dim=0; dim<3; dim++){
        v01.push(v1[dim]-v0[dim]);
        v02.push(v2[dim]-v0[dim]);
    }
    //normal vector
    let n = [v02[1]*v01[2] - v02[2]*v01[1],
             v02[2]*v01[0] - v02[0]*v01[2],
             v02[0]*v01[1] - v02[1]*v01[0],];
    n = normalize(n);
    //plain: nx(x-a)+ny(y-b)+nz(z-c)=0 ==> ax+by+cz+d=0//
    n.push(-n[0]*v0[0]-n[1]*v0[1]-n[2]*v0[2]);
    if(n[3]>0.0){
        return null;
    }
    return n;
}



function addVertex(triangles, /*HashMap*/ vertices, newv, nextv){
    let edges = {};
    let i=0;
    while(i<triangles.length){
        let s = 0.0;
        for(let dim=0;dim<3;dim++){
            s += triangles[i][3][dim]*newv[dim];
        }
        s += triangles[i][3][3];
        if(s > 0.0){
            edges[triangles[i][0]*1024+triangles[i][1]] = 1;
            edges[triangles[i][1]*1024+triangles[i][2]] = 1;
            edges[triangles[i][2]*1024+triangles[i][0]] = 1;
            triangles.splice(i,1);
        }
        else{
            i += 1;
        }
    }
    for(edge in edges){
        const e0 = edge >> 10;
        const e1 = edge % 1024;
        egde = e1*1024+e0;
        edges[egde] -= 1;
    }
    let rim = [];
    //remove the overlapped edges
    for(let edge in edges){
        if(edges[edge]==1){
            rim.push(edge);
        }
    }
    //add the vertice
    vertices.put(nextv, newv);
    let vv = nextv;
    //println(["Added",vv]);
    nextv += 1;
    //add the triangles
    for(let i=0;i<rim.length;i++){
        const edge = rim[i];
        const e0 = edge >> 10;
        const e1 = edge % 1024;
        let t = [e0,e1,vv];
        t.push(plain(vertices,t));
        triangles.push(t);
    }
    return nextv;
}



function triangulation(rim, veryfirst, vertices, tris){
    let first = veryfirst;
    
    while(1){
        //first triplet
        let second = rim[first];
        let third  = rim[second];
        let t = [first,second,third];
        //check
        let pl = plain(vertices,t);
        while ( pl === null ){
            first = second;
            second = third;
            third = rim[third];
            if (first == veryfirst){
                //println(["RemovalFailed",vv]);
                return 1;//err. removal failed.
            }
            t = [first,second,third];
            pl = plain(vertices,t);
        }
        t.push(pl);
        if(rim[third] == first){ //rim is triangle
            tris.push(t);
            return 0;
        }
        let next = rim[third];
        let isconvex = 1;
        while ( next != first ){
            let newv = vertices.get(next);
            let s = 0.0;
            for(let dim=0;dim<3;dim++){
                s += t[3][dim]*newv[dim];
            }
            s += t[3][3];
            if(s > 0.0){
                isconvex = 0;
                break;
            }
            next = rim[next];
        }
        if ( isconvex ){
            tris.push(t);
            rim[first] = third; //skip the second
            //recurse
            return triangulation(rim, first, vertices, tris);
        }
        first = second;
        if(first == veryfirst){
            return 3;
        }
    }
}


function removeVertex(triangles, /*HashMap*/ vertices, vv){
    if ( vv < 0 ){
        return 9;
    }
    //println(["Remove",vv]);
    //for(let i in triangles){
    //    println([i,triangles[i]]);
    //}
    let rim = {}; // chain of rim vertices.
    //look up the triangles having vv
    let trash = [];
    let i=0;
    let first = 0;
    for(let i=0;i<triangles.length;i++){
        if(triangles[i][0] == vv){
            rim[triangles[i][1]] = triangles[i][2];
            first = triangles[i][1];
            trash.push(i);
        }
        else if (triangles[i][1] == vv){
            rim[triangles[i][2]] = triangles[i][0];
            first = triangles[i][2];
            trash.push(i);
        }
        else if (triangles[i][2] == vv){
            rim[triangles[i][0]] = triangles[i][1];
            first = triangles[i][0];
            trash.push(i);
        }
    }
    //for(let i in rim){
    //    println(["Rim",i,rim[i]]);
    //}
    //remove the vertex
    //hatch the hole.
    let hatches = [];
    let err = triangulation(rim, first, vertices, hatches);
    if ( err ){
        return err;
    }
    //all succeeded
    //remove the triangles
    while( trash.length > 0 ){
        let tri = trash.pop();
        triangles.splice(tri,1);
    }
    //remove the vertex
    vertices.remove(vv);

    for(let i=0;i<hatches.length;i++){
        //println(["hatches",hatches[i]]);
        triangles.push(hatches[i]);
    }
    return 0;//no error
}


/////////////////////////globals and initialization

//initial tetrahedron
HashMap vertices = new HashMap();;   // do not reuse the vertex label
/*
vertices.put(0, normalize([0.,0.,-1.]));
vertices.put(1, normalize([0.,-1.,0.]));
vertices.put(2, normalize([-1.,0.,0.]));
vertices.put(3, normalize([+1.,0.,0.]));
*/
vertices.put(0, normalize([-1.,-1.,-1.]));
vertices.put(1, normalize([+1.,+1.,-1.]));
vertices.put(2, normalize([-1.,+1.,+1.]));
vertices.put(3, normalize([+1.,-1.,+1.]));
let nextv = 4;

let triangles = [];
let t;
t = [0,1,2];
t.push(plain(vertices,t));
triangles.push(t);
t = [0,2,3];
t.push(plain(vertices,t));
triangles.push(t);
t = [0,3,1];
t.push(plain(vertices,t));
triangles.push(t);
t = [3,2,1];
t.push(plain(vertices,t));
triangles.push(t);
/*4..11*/
/*nextv = addVertex(triangles, vertices, normalize([0.,-0.1,+1.]), nextv);
nextv = addVertex(triangles, vertices, normalize([0.,+0.1,+1.]), nextv);
nextv = addVertex(triangles, vertices, normalize([-0.1,0.,+1.]), nextv);
nextv = addVertex(triangles, vertices, normalize([+0.1,0.,+1.]), nextv);
nextv = addVertex(triangles, vertices, normalize([0.,-0.1,-1.]), nextv);
nextv = addVertex(triangles, vertices, normalize([0.,+0.1,-1.]), nextv);
nextv = addVertex(triangles, vertices, normalize([-0.1,0.,-1.]), nextv);
nextv = addVertex(triangles, vertices, normalize([+0.1,0.,-1.]), nextv);
*/

/*nextv = addVertex(triangles, vertices, normalize([0.,0.,-1.]), nextv);
nextv = addVertex(triangles, vertices, normalize([-0.5,0.,-1.]), nextv);
nextv = addVertex(triangles, vertices, normalize([-2.,0.,-1.]), nextv);
*/

//nextv = addVertex(triangles, vertices, normalize([0.,+1.,0.]), nextv);
//nextv = addVertex(triangles, vertices, normalize([0.,0.,+1.]), nextv);
//nextv = addVertex(triangles, vertices, normalize([+1.,-1.,-1.]), nextv);
//nextv = addVertex(triangles, vertices, normalize([+1.,+1.,+1.]), nextv);



//test
//newv = [1.,2.,3.];
//newv = normalize(newv);
//nextv = addVertex(triangles, vertices, newv, nextv);
//for(let i=0;i<triangles.length;i++){
//  println([triangles[i][0],triangles[i][1],triangles[i][2]]);
//}
//println(vertices.length);



/////////////////////////utility

const pi = 3.14159265359;

function cartesian2euler(v){
    const r = sqrt(v[0]*v[0]+v[2]*v[2]);
    const theta = atan(v[1]/r);
    let phi   = atan(v[2]/v[0]);
    if(v[0]<0){
        phi += pi;
    }
    if(phi > pi){
        phi -= 2*pi;
    }
    return [phi,theta];
} 


/////////////////////////setup

// PImage online;
// Button buttonZoom;
// Button buttonMap;

let frontimg = 0;
let leftimg = 0;
let zenithimg = 0;
let backimg = 0;
let rightimg = 0;
let nadirimg = 0;
//println(test.pixels);
/*
image(f,width/4*3,width/4*2);
image(b,width/4*3-160,width/4*2);
image(l,width/4*3-80,width/4*2);
image(r,width/4*3-240,width/4*2);
image(z,width/4*3,width/4*2-80);
image(n,width/4*3,width/4*2+80);
*/
let winx = screen.width;
let winy = screen.height;
//orthographic circle
let orthx = winy/4;
let orthy = winy/4;
let orthr = winy/4;
//rectilinear view
let rectx = winx/2;
let recty = winy/2;
let rectr = winy/2;
//development panel
let devSx = 0;
let devSy = winy/2;
let devSw = winx/2;
let devSh = winy/2;
let devLx = 0;
let devLy = 0;
let devLw = winx;
let devLh = winy;
let devx = devSx;
let devy = devSy;
let devw = devSw;
let devh = devSh;
//
let cube = 1024;
if ( winx < cube ){
    cube = winx;
}


function setup() {  // this is run once.   
    
    size(winx,winy,OPENGL);
    const url = "erb.jpg";
    const urlButtonMap = "buttonMap.png";
    const urlButtonZoom = "buttonZoom.png";
    //String url = "geode6000.jpg";
    online = loadImage(url);
    buttonZoom = new Button(loadImage(urlButtonZoom), devSx, devSy);
    buttonMap = new Button(loadImage(urlButtonMap), devSx+50,devSy);
    textureMode(NORMALIZED);
    
    //online512 = loadImage("geode512.jpg");
//size(min(screen.width,screen.height),min(screen.width,screen.height)); 
      
    // smooth edges
    smooth();
    
    // limit the number of frames per second
    frameRate(24);
    
    // set the width of the line. 
    //strokeWeight(12);
} 


/////////////////////////mouse action


let origin = -1;
let phi = 0;  //rotation angle of preview
let cosa = cos(phi);
let sina = sin(phi);
let theta = 0;  //rotation angle of preview
let cosb = cos(theta);
let sinb = sin(theta);
let mode  = 0;  //2==orthographic panel / 3==rectilinear panel
let lastx = 0;
let lasty = 0;
let updated = 1;
let idlejob = [];
let pressedTime = 0;
let pressedX = 0; //initial position
let pressedY = 0;
let mapOrthographic = 0;
let mapDevelop = 0;
//for development
let links;
let com = new Array(2);



class Button
{
    constructor( i, x, y )
    {
        this.icon = i;
        this.posx = x;
        this.posy = y;
    }
    Draw()
    {
        fill(255);
        image(this.icon,this.posx,this.posy);
    }
    isPointed()
    {
        return ( ( this.posx <= mouseX ) && 
                 ( mouseX <= this.posx + this.icon.width ) && 
                 ( this.posy <= mouseY ) && 
                 ( mouseY <= this.posy + this.icon.height ) );
    }
};


function addVertexOnOrthographic(){
    //add a new point by default
    let x = (mouseX - orthx)/orthr;
    let y = (mouseY - orthy)/orthr;
    let d = x*x+y*y;
    if ( d < 1.0 ){
        let z = -sqrt(1.0-d);
        //let rx = x*cosa + y*sina;
        //let ry = -x*sina + y*cosa;
        let nx = x;                         //horiz
        let ny = y*cosb - z*sinb;  //vert
    	let nz = y*sinb + z*cosb;  //depth
        let rx = nx*cosa + nz*sina;//horiz
        let ry = ny;                   //vert
    	let rz =-nx*sina + nz*cosa;//depth
        let newv = [rx,ry,rz];
        let euler = cartesian2euler(newv);
        let sx = (euler[0]/ (2*pi) + 0.5);
        let sy = (euler[1] / pi + 0.5);
        newv.push(sx);
        newv.push(sy);
        //angle = -(sx / width * 2*pi) + pi/2;
        let target = nextv;
        nextv = addVertex(triangles, vertices, newv, nextv);
        return target;
    }
    return -1;
}


function addVertexOnRectilinear(){
    //add a new point by default
    let x = (mouseX - rectx)/rectr;
    let y = (mouseY - recty)/rectr;
    let z = -1.0;
    let newv = normalize([x,y,z]);
    //let rx = newv[0]*cosa + newv[1]*sina;
    //let ry = -newv[0]*sina + newv[1]*cosa;
    //let x0 = newv[0]*cosa - newv[1]*sina;//horiz
    //let y0 = newv[0]*sina + newv[1]*cosa;//depth
    //let z0 = newv[2];                   //vert
    let nx = newv[0];                         //horiz
    let ny = newv[1]*cosb - newv[2]*sinb;  //vert
    let nz = newv[1]*sinb + newv[2]*cosb;  //depth
    let rx = nx*cosa + nz*sina;//horiz
    let ry = ny;                   //vert
    let rz =-nx*sina + nz*cosa;//depth
    //rotation around the horizontal axis, i.e. 
    //let nx = x0;                         //horiz
    //let ny = y0*cosb + z0*sinb;  //vert
    //let nz =-y0*sinb + z0*cosb;  //depth
    //newv = [rx,ry,newv[2]];
    newv = [rx,ry,rz];
    let euler = cartesian2euler(newv);
    let sx = (euler[0]/ (2*pi) + 0.5);
    let sy = (euler[1] / pi + 0.5);
    newv.push(sx);
    newv.push(sy);
    //angle = -(sx / width * 2*pi) + pi/2;
    let target = nextv;
    nextv = addVertex(triangles, vertices, newv, nextv);
    return target;
}




function mousePressed() {
    if ( mode == 5 ){
	mode = 0;
	devx = devSx;
	devy = devSy;
	devw = devSw;
	devh = devSh;
	updated = 1;
	return;
    }
    else if ( mode == 4 ){
	return;
    }
    origin = -1;
    pressedX = mouseX;
    pressedY = mouseY;
    lastx = mouseX;
    lasty = mouseY;
    pressedTime = frameCount;
    let dmx = mouseX - orthx;
    let dmy = mouseY - orthy;
    if ( dmx*dmx + dmy*dmy < orthr*orthr ){
        //orthographic panel
        mode = 2;
	//no quick response
        //look up the existing vertices
        let candidate = -1;
        let mindist   = 20*20;
        i = vertices.entrySet().iterator();  // Get an iterator
        while (i.hasNext()) {
            const me = i.next();
            let vtx = me.getValue();
    	    if ( vtx[7] == 1 ){ //frontside
                let x = vtx[5];
                let y = vtx[6];
                let dx = x - mouseX;
                let dy = y - mouseY;
                let dd = dx*dx + dy*dy;
                if ( dd < mindist ){
                    candidate = me.getKey();
                    mindist = dd;
                }
    	    }
        }
        if ( candidate >= 0 ){
	    origin = candidate;
	    //angle = -(mouseX / width * 2*pi) + pi/2;
	    //println([target,x,y,mouseX,mouseY]);
	    //updated = 1;
        }
    }
    else if ( buttonMap.isPointed() ){
	mapDevelop = ! mapDevelop;
    }
    else if ( buttonZoom.isPointed() ){
	mode = 4;
	updated = 1;
    }
    else{
        //rectilinear panel
        mode = 3;
	//no quick response
        //look up the existing vertices
        let candidate = -1;
        let mindist   = 20*20;
        i = vertices.entrySet().iterator();  // Get an iterator
        while (i.hasNext()) {
            const me = i.next();
            let vtx = me.getValue();
            if ( vtx[8] == 1 ){ //frontside
                let x = vtx[9];
                let y = vtx[10];
                let dx = x - mouseX;
                let dy = y - mouseY;
                let dd = dx*dx + dy*dy;
                if ( dd < mindist ){
                    candidate = me.getKey();
                    mindist = dd;
                }
    	    }
        }
        if ( candidate >= 0 ){
	    origin = candidate;
	    //angle = -(mouseX / width * 2*pi) + pi/2;
	    //println([target,x,y,mouseX,mouseY]);
	    //updated = 1;
        }
    }
}


function delayedAction()
{
    if ( mode == 2 ) {
        if ( origin < 0 ){
            origin = addVertexOnOrthographic();
        }
	pressedTime = 0;
	pressedX = 0;
	pressedY = 0;
	updated = 1;
    }
    if ( mode == 3 ) {
        if ( origin < 0 ){
            origin = addVertexOnRectilinear();
        }
	pressedTime = 0;
	pressedX = 0;
	pressedY = 0;
	updated = 1;
    }
}



function mouseDragged(){
    if ( (mode == 2) && (origin < 0) ){
        //rotation mode
        phi += (mouseX-pmouseX)*0.01;
	cosa = cos(phi);
	sina = sin(phi);
        theta -= (mouseY-pmouseY)*0.01;
	cosb = cos(theta);
	sinb = sin(theta);
        updated = 1;
	pressedTime = 0;
        return;
    }
    if ( (mode == 3) && (origin < 0) ){
        //rotation mode
        phi += (mouseX-pmouseX)*0.01;
	cosa = cos(phi);
	sina = sin(phi);
        theta -= (mouseY-pmouseY)*0.01;
	cosb = cos(theta);
	sinb = sin(theta);
        updated = 1;
	pressedTime = 0;
        return;
    }
    if ( (mode == 2) || ( mode == 3 ) ){
	if ( abs(mouseX - lastx) + abs(mouseY-lasty) < 15 ){
            //ư�������������ϡ�������ɲäν�ǽ������롣
            lastx = mouseX;
            lasty = mouseY;
            if ( mode == 2 ){
		//orthographic panel
		//drag mode;
		let err = removeVertex(triangles, vertices, origin);
		if ( ! err ) {
                    origin = addVertexOnOrthographic();
		}
		else{
                    origin = -1;
		}
		updated = 1;
		pressedTime = 0;
            }
            if ( mode == 3 ){
		//rectilinear panel
		//drag mode;
		let err = removeVertex(triangles, vertices, origin);
		if ( ! err ) {
                    origin = addVertexOnRectilinear();
		}
		else{
                    origin = -1;
		}
		updated = 1;
		pressedTime = 0;
            }
	}
	else{
            lastx = mouseX;
            lasty = mouseY;
            if ( mode == 2 ){
		//orthographic panel
		//drag mode;
		let target = addVertexOnOrthographic();
		removeVertex(triangles, vertices, origin);
		origin = target;
		updated = 1;
            }
            if ( mode == 3 ){
		//rectilinear panel
		//drag mode;
		let target = addVertexOnRectilinear();
		removeVertex(triangles, vertices, origin);
		origin = target;
		updated = 1;
            }
	}
    }
}




function mouseReleased(){
    if ( ( mode == 4 ) || (mode == 5 ) ){
	return;
    }
    let dx = mouseX - pressedX;
    let dy = mouseY - pressedY;
    if ( dx*dx + dy*dy < 2 ){
	//just clicked
	//orthographic panel
	let x = (mouseX - orthx)/orthr;
	let z = (mouseY - orthy)/orthr;
	let d = x*x+z*z;
	if ( d < 1.0 ){
	    mapOrthographic = ! mapOrthographic;
	}
	//develop panel
	
    }
    updated = 1;
    origin = -1;
    mode = 0;
    pressedTime = 0;
}



/////////////////////////panels





function orthographic_panel(vertices, triangles)
{
    let layer = -1;
    fill(255,255,255,100);
    stroke(0);
    strokeWeight(1);
    ellipse(orthx,orthy,orthr*2,orthr*2);
    //rotate vertices in advance
    i = vertices.entrySet().iterator();  // Get an iterator
    while (i.hasNext()) {
        const me = i.next();
        vtx = me.getValue();
    	//rotation around the vertical axis
        //let x0 = vtx[0]*cosa - vtx[1]*sina;//horiz
        //let y0 = vtx[2];                   //vert
	    //let z0 = vtx[0]*sina + vtx[1]*cosa;//depth
        let x0 = vtx[0]*cosa - vtx[2]*sina;//horiz
        let y0 = vtx[1];                   //vert
        let z0 = vtx[0]*sina + vtx[2]*cosa;//depth
        //rotation around the horizontal axis, i.e. 
        let nx = x0;                         //horiz
        let ny = y0*cosb + z0*sinb;  //vert
    	let nz =-y0*sinb + z0*cosb;  //depth
        vtx[5] = orthr * nx + orthx;
        vtx[6] = orthr * ny + orthy;
        vtx[7] = 0; //backward
    }

    for(let i=0; i<triangles.length;i++){
        let plane = triangles[i][3];
        //rotate normal
        let x0 = plane[0]*cosa - plane[2]*sina;//horiz
        let y0 = plane[1];                   //vert
	    let z0 = plane[0]*sina + plane[2]*cosa;//depth
    	//rotation around the horizontal axis, i.e. 
        let nx = x0;                         //horiz
        let ny = y0*cosb + z0*sinb;  //vert
    	let nz =-y0*sinb + z0*cosb;  //depth
        if ( nz < 0 ){
            fill((int)(255*(-nz)));
            beginShape();
            for(let j=0;j<3;j++){
                let v = vertices.get(triangles[i][j]);
                v[7] = 1;
                vertex(v[5],v[6],layer);
            }
            endShape(CLOSE);
        }
    }
    i = vertices.entrySet().iterator();  // Get an iterator
    while (i.hasNext()) {
        const me = i.next();
        vtx = me.getValue();
        if(vtx[7]==1){
            if(me.getKey() == origin){
                fill(#ff0000);
            }
            else{
                fill(0);
            }
            rect(vtx[5]-4,vtx[6]-4,9,9);
        }
    }
}

function rectilinear_panel(vertices, triangles)
{
    let layer = -3;
    //rotate vertices in advance
    i = vertices.entrySet().iterator();  // Get an iterator
    while (i.hasNext()) {
        const me = i.next();
        vtx = me.getValue();
        vtx.length = 11;
        //let ny = vtx[0]*sina + vtx[1]*cosa;
        //let nx = vtx[0]*cosa - vtx[1]*sina;
        //let nz = vtx[2];
        let x0 = vtx[0]*cosa - vtx[1]*sina;//horiz
        let y0 = vtx[2];                   //vert
    	let z0 = vtx[0]*sina + vtx[1]*cosa;//depth
        let x0 = vtx[0]*cosa - vtx[2]*sina;//horiz
        let y0 = vtx[1];                   //vert
	    let z0 = vtx[0]*sina + vtx[2]*cosa;//depth
	    //rotation around the horizontal axis, i.e. 
        let nx = x0;                         //horiz
        let ny = y0*cosb + z0*sinb;  //vert
    	let nz =-y0*sinb + z0*cosb;  //depth
	if ( nz > 0 ){
	    vtx[8] = 0;
	}
	else{
	    vtx[8] = 1;
	    vtx[9] = -rectr*nx/nz + rectx;
	    vtx[10] = -rectr*ny/nz + recty;
	}
    }
    stroke(0);
    strokeWeight(1);
    for(let i=0; i<triangles.length;i++){
	let t = triangles[i];
	let v0 = vertices.get(t[0]);
	let v1 = vertices.get(t[1]);
	let v2 = vertices.get(t[2]);
        if ( v0[8] && v1[8] ){
            beginShape(LINES);
            vertex(v0[9],v0[10],layer);
            vertex(v1[9],v1[10],layer);
            endShape();
        }
        if ( v2[8] && v1[8] ){
            beginShape(LINES);
            vertex(v2[9],v2[10],layer);
            vertex(v1[9],v1[10],layer);
            endShape();
        }
        if ( v0[8] && v2[8] ){
            beginShape(LINES);
            vertex(v0[9],v0[10],layer);
            vertex(v2[9],v2[10],layer);
            endShape();
        }
    }
    i = vertices.entrySet().iterator();  // Get an iterator
    while (i.hasNext()) {
        const me = i.next();
        vtx = me.getValue();
        if(vtx[8]==1){
            if ( (0 < vtx[10]) && ( vtx[10] < winy ) &&
            (0 < vtx[9]) && ( vtx[9] < winx ) ){
                if(me.getKey() == origin){
                            fill(#ff0000);
                }
                else{
                            fill(0);
                }
                rect(vtx[9]-4,vtx[10]-4,9,9);
            }
        }
    }
}



/////////////////////////development


function distanceMatrix(vertices, triangles)
{
    let dm = new Array(triangles.length);
    for(let i=0;i<dm.length;i++){
        dm[i] = new Array(dm.length);
        for(let j=0;j<dm.length;j++){
            dm[i][j] = 1.0;
        }
    }
    let edges = {};
    for(let i=0;i<triangles.length;i++){
        edges[[triangles[i][0],triangles[i][1]]] = i;
        edges[[triangles[i][1],triangles[i][2]]] = i;
        edges[[triangles[i][2],triangles[i][0]]] = i;
    }
    //println("");
    for(let i=0;i<triangles.length;i++){
        let va = triangles[i][0];
        let vb = triangles[i][1];
        let j = edges[[vb,va]];
        if (i<j){
            let s = 0.0;
            for(let dim=0;dim<3;dim++){
                s += vertices.get(va)[dim] * vertices.get(vb)[dim];
            }
            dm[i][j] = [s,va,vb];//innerproduct and labels of shared vertices
            dm[j][i] = [s,vb,va];
            //println([i,j,s]);
        }
        va = triangles[i][1];
        vb = triangles[i][2];
        let j = edges[[vb,va]];
        if (i<j){
            let s = 0.0;
            for(let dim=0;dim<3;dim++){
                s += vertices.get(va)[dim] * vertices.get(vb)[dim];
            }
            dm[i][j] = [s,va,vb];
            dm[j][i] = [s,vb,va];
            //println([i,j,s]);
        }
        va = triangles[i][2];
        vb = triangles[i][0];
        let j = edges[[vb,va]];
        if (i<j){
            let s = 0.0;
            for(let dim=0;dim<3;dim++){
                s += vertices.get(va)[dim] * vertices.get(vb)[dim];
            }
            dm[i][j] = [s,va,vb];
            dm[j][i] = [s,vb,va];
            //println([i,j,s]);
        }
    }
    return dm;
}


function spanningTree(dm, triangles)
{
    let links = [];
    let undone = [];
    for(let i=1;i<dm.length;i++){
        undone.push(i);
    }
    let done = [0,];
    fill(#00ff00);
    //first node is always 0
    
    while ( undone.length > 0 ){
        let imax = 0;
        let kmax = 0;
        let vmax = 1.;
        //println(["done",done]);
        //println(["undone",undone]);
        for(let ki=0;ki<done.length;ki++){
            let i = done[ki];
            for(let k=0;k<undone.length;k++){
                let j = undone[k];
                //println(["test",i,j,dm[i][j]]);
                if ( dm[i][j][0] < vmax ){
                    imax = ki;
                    kmax = k;
                    vmax = dm[i][j][0]; // innerproduct
                }
            }
        }
        let i = done[imax];
        let j = undone[kmax];
        links.push([i,j,dm[i][j][1],dm[i][j][2]]);//neighboring faces and shared vertices
        //println(["Nearest",i,j,dm[i][j]]);
        /*
        let v0 = triangles[i][3];//normal vector
        vat v1 = triangles[j][3];//normal vector
        drawLine(v0,v1);
        */
        done.push(j);
        undone.splice(kmax,1);
    }
    return links;
}



function norm2(v){
    let s = 0.0;
    for(let dim=0; dim<2; dim++){
        s += v[dim]*v[dim];
    }
    return sqrt(s);
}


//determine the position of the third vertex of the triangle.
//vertices are counter-clockwise
//va and vb are 2D vectors.
function thirdvertex(va, vb, Lbc, Lac)
{
    let vab = [vb[0] - va[0], vb[1] - va[1]];
    let Lab = norm2(vab);
    let vlong = [vab[0]/Lab, vab[1]/Lab];
    let Llong = (Lab*Lab + Lac*Lac - Lbc*Lbc) / (2*Lab);
    let vlat  = [vlong[1], -vlong[0]];
    let Llat  = sqrt( Lac*Lac - Llong*Llong );
    return [ va[0] + Llong * vlong[0] - Llat * vlat[0], 
             va[1] + Llong * vlong[1] - Llat * vlat[1] ];
}



//distances between three vertices on the sphere
function edgelength(v0,v1,v2)
{
    return [norm([v0[0]-v1[0], v0[1]-v1[1], v0[2]-v1[2]]),
            norm([v1[0]-v2[0], v1[1]-v2[1], v1[2]-v2[2]]),
            norm([v2[0]-v0[0], v2[1]-v0[1], v2[2]-v0[2]])];
}


function LocatePanels(vertices, triangles, links)
{
    //fill(#ff0000);
    //textAlign(RIGHT);
    //text("Development",width-2,width/2+10);
    let wrange = [0.0,0.0];
    let hrange = [0.0,0.0];
    let tri0 = links[0][0];
    let L    = edgelength(vertices.get(triangles[tri0][0]),
                          vertices.get(triangles[tri0][1]),
                          vertices.get(triangles[tri0][2]));
    let v0 = [0.0, 0.0];
    let v1 = [0.0, L[0]];
    hrange[1] = L[0];
    let v2 = thirdvertex(v0,v1,L[1],L[2]);
    wrange[0] = min(wrange[0],v2[0]);
    wrange[1] = max(wrange[1],v2[0]);
    hrange[0] = min(hrange[0],v2[1]);
    hrange[1] = max(hrange[1],v2[1]);
    triangles[tri0][4] = new HashMap();
    triangles[tri0][4].put(triangles[tri0][0],v0);
    triangles[tri0][4].put(triangles[tri0][1],v1);
    triangles[tri0][4].put(triangles[tri0][2],v2);
    for(let i=0;i<links.length;i++){
        let tri0 = links[i][0];
        let tri1 = links[i][1];
        let sv1  = links[i][2];//shared vertices
        let sv0  = links[i][3];
        let uv2 = triangles[tri1][0] + triangles[tri1][1] + triangles[tri1][2] - sv0 - sv1; // unshaed vertex of tri1
        //println(["linkage",tri0,tri1,sv0,sv1,uv2,triangles[tri1][0],triangles[tri1][1],triangles[tri1][2]]);
        let L    = edgelength(vertices.get(sv0),
                              vertices.get(sv1),
                              vertices.get(uv2));
        v0 = triangles[tri0][4].get(sv0);
        v1 = triangles[tri0][4].get(sv1);
        v2 = thirdvertex(v0,v1,L[1],L[2]);
	wrange[0] = min(wrange[0],v2[0]);
	wrange[1] = max(wrange[1],v2[0]);
	hrange[0] = min(hrange[0],v2[1]);
	hrange[1] = max(hrange[1],v2[1]);
        //println([v0,v1,v2]);
        triangles[tri1][4] = new HashMap();
        triangles[tri1][4].put(sv0,v0);
        triangles[tri1][4].put(sv1,v1);
        triangles[tri1][4].put(uv2,v2);
    }
    return wrange.concat(hrange);
}

function Develop(vertices, triangles, ranges)
{
    let layer = -1;
    let devzoom = min( devw / (ranges[1]-ranges[0]), devh / (ranges[3]-ranges[2]) );
    let devoffsetx = ranges[0];
    let devoffsety = ranges[2];
    noFill();
    stroke(0);
    strokeWeight(1);
    for(let k=0;k<triangles.length;k++){
        beginShape();
        i = triangles[k][4].entrySet().iterator();  // Get an iterator
        while (i.hasNext()) {
            const me = i.next();
            let vtx = me.getValue();
            vertex((vtx[0]-devoffsetx)*devzoom+devx,(vtx[1]-devoffsety)*devzoom+devy,layer);
	}
        endShape(CLOSE);
    }
}

////////make the cube pixel by pixel

//nadir == y > 0
function zenith(width, /*PImage*/ eq)
{
    let half = width / 2.0;
    let sq = createImage(width,width,ARGB);

    for(let i=0;i<sq.pixels.length;i++){
	c = color(100,100,200,100);
	sq.pixels[i] = c;
    }

    let y = -1.0;
    let i=0;
    for(let iz=0;iz<sq.width;iz++){
	let z = (iz-half)/half;
	for(let ix=0;ix<sq.width;ix++){
	    let x = (ix-half)/half;
	    let v = normalize([x,y,z]);
	    let euler = cartesian2euler(v);
	    let sx = (euler[0]/ (2*pi) + 0.5)*eq.width;
	    let sy = (euler[1] / pi + 0.5)*eq.width/2;
	    let j = int(sy)*eq.width+int(sx);
	    c = eq.get(int(sx),int(sy));
	    sq.pixels[i] = c;
	    i++;
	}
    }
    sq.updatePixels();
    return sq;
}


function nadir(width, /*PImage*/ eq)
{
    let half = width / 2.0;
    let sq = createImage(width,width,ARGB);

    for(let i=0;i<sq.pixels.length;i++){
	c = color(100,100,200,100);
	sq.pixels[i] = c;
    }

    let y = 1.0;
    let i=0;
    for(let iz=0;iz<sq.width;iz++){
	let z = (iz-half)/half;
	for(let ix=0;ix<sq.width;ix++){
	    let x = -(ix-half)/half;
	    let v = normalize([x,y,z]);
	    let euler = cartesian2euler(v);
	    let sx = (euler[0]/ (2*pi) + 0.5)*eq.width;
	    let sy = (euler[1] / pi + 0.5)*eq.width/2;
	    let j = int(sy)*eq.width+int(sx);
	    c = eq.get(int(sx),int(sy));
	    sq.pixels[i] = c;
	    i++;
	}
    }
    sq.updatePixels();
    return sq;
}




function left(width, /*PImage*/ eq)
{
    let half = width / 2.0;
    let sq = createImage(width,width,ARGB);

    for(let i=0;i<sq.pixels.length;i++){
	c = color(100,100,200,100);
	sq.pixels[i] = c;
    }

    let x = -1.0;
    let i=0;
    for(let iz=0;iz<sq.width;iz++){
	let z = (iz-half)/half;
	for(let iy=0;iy<sq.width;iy++){
	    let y = -(iy-half)/half;
	    let v = normalize([x,y,z]);
	    let euler = cartesian2euler(v);
	    let sx = (euler[0]/ (2*pi) + 0.5)*eq.width;
	    let sy = (euler[1] / pi + 0.5)*eq.width/2;
	    let j = int(sy)*eq.width+int(sx);
	    c = eq.get(int(sx),int(sy));
	    sq.pixels[i] = c;
	    i++;
	}
    }
    sq.updatePixels();
    return sq;
}


function right(width, /*PImage*/ eq)
{
    let half = width / 2.0;
    let sq = createImage(width,width,ARGB);

    for(let i=0;i<sq.pixels.length;i++){
	c = color(100,100,200,100);
	sq.pixels[i] = c;
    }

    let x = 1.0;
    let i=0;
    for(let iz=0;iz<sq.width;iz++){
	let z = (iz-half)/half;
	for(let iy=0;iy<sq.width;iy++){
	    let y = (iy-half)/half;
	    let v = normalize([x,y,z]);
	    let euler = cartesian2euler(v);
	    let sx = (euler[0]/ (2*pi) + 0.5)*eq.width;
	    let sy = (euler[1] / pi + 0.5)*eq.width/2;
	    let j = int(sy)*eq.width+int(sx);
	    c = eq.get(int(sx),int(sy));
	    sq.pixels[i] = c;
	    i++;
	}
    }
    sq.updatePixels();
    return sq;
}


function front(width, /*PImage*/ eq)
{
    let half = width / 2.0;
    let sq = createImage(width,width,ARGB);

    for(let i=0;i<sq.pixels.length;i++){
	c = color(100,100,200,100);
	sq.pixels[i] = c;
    }

    let z = -1.0;
    let i=0;
    for(let iy=0;iy<sq.width;iy++){
	let y = -(iy-half)/half;
	for(let ix=0;ix<sq.width;ix++){
	    let x = (ix-half)/half;
	    let v = normalize([x,y,z]);
	    let euler = cartesian2euler(v);
	    let sx = (euler[0]/ (2*pi) + 0.5)*eq.width;
	    let sy = (euler[1] / pi + 0.5)*eq.width/2;
	    let j = int(sy)*eq.width+int(sx);
	    c = eq.get(int(sx),int(sy));
	    sq.pixels[i] = c;
	    i++;
	}
    }
    sq.updatePixels();
    return sq;
}


function back(width, /*PImage*/ eq)
{
    let half = width / 2.0;
    let sq = createImage(width,width,ARGB);

    for(let i=0;i<sq.pixels.length;i++){
	c = color(100,100,200,100);
	sq.pixels[i] = c;
    }

    let z = 1.0;
    let i=0;
    for(let iy=0;iy<sq.width;iy++){
	let y = (iy-half)/half;
	for(let ix=0;ix<sq.width;ix++){
	    let x = (ix-half)/half;
	    let v = normalize([x,y,z]);
	    let euler = cartesian2euler(v);
	    let sx = (euler[0]/ (2*pi) + 0.5)*eq.width;
	    let sy = (euler[1] / pi + 0.5)*eq.width/2;
	    let j = int(sy)*eq.width+int(sx);
	    c = eq.get(int(sx),int(sy));
	    sq.pixels[i] = c;
	    i++;
	}
    }
    sq.updatePixels();
    return sq;
}



function mapping(/*PImage*/ img, v)
{
    let layer = -4;
    let div = v.length-1.;
    noStroke();
    fill(255);
    for(let i=0;i<div;i++){
	for(let j=0;j<div;j++){
	    if ( v[i][j][3] && v[i+1][j][3] && v[i][j+1][3] && v[i+1][j+1][3] ){
		beginShape(TRIANGLE);
		texture(img);
		vertex(v[i][j][4],v[i][j][5],layer,i/div,j/div);
		vertex(v[i+1][j][4],v[i+1][j][5],layer,(i+1)/div,j/div);
		vertex(v[i+1][j+1][4],v[i+1][j+1][5],layer,(i+1)/div,(j+1)/div);
		endShape(CLOSE);
		beginShape(TRIANGLE);
		texture(img);
		vertex(v[i][j][4],v[i][j][5],layer,i/div,j/div);
		vertex(v[i+1][j+1][4],v[i+1][j+1][5],layer,(i+1)/div,(j+1)/div);
		vertex(v[i][j+1][4],v[i][j+1][5],layer,i/div,(j+1)/div);
		endShape(CLOSE);
	    }
	}
    }
}




function drawFront(/*PImage*/ img)
{
    let div=15;
    let divh = div/2.;
    let v = new Array(div+1);
    for(let i=0;i<div+1;i++){
	v[i] = new Array(div+1);
    }
    for(let i=0;i<div+1;i++){
	for(let j=0;j<div+1;j++){
	    let vtx = normalize([i/divh-1,-j/divh+1,-1]);
            let x0 = vtx[0]*cosa - vtx[2]*sina;//horiz
            let y0 = vtx[1];                   //vert
	    let z0 = vtx[0]*sina + vtx[2]*cosa;//depth
	    //rotation around the horizontal axis, i.e. 
            let nx = x0;                         //horiz
            let ny = y0*cosb + z0*sinb;  //vert
	    let nz =-y0*sinb + z0*cosb;  //depth
	    if ( nz > 0 ){
		vtx[3] = 0;
	    }
	    else{
		vtx[3] = 1;
		vtx[4] = -rectr*nx/nz + rectx;
		vtx[5] = -rectr*ny/nz + recty;
	    }
	    v[i][j] = vtx;
	}
    }
    mapping(img,v);
}


function drawBack(/*PImage*/ img)
{
    let div=15;
    let divh = div/2.;
    let v = new Array(div+1);
    for(let i=0;i<div+1;i++){
	v[i] = new Array(div+1);
    }
    for(let i=0;i<div+1;i++){
	for(let j=0;j<div+1;j++){
	    let vtx = normalize([i/divh-1,j/divh-1,+1]);
            let x0 = vtx[0]*cosa - vtx[2]*sina;//horiz
            let y0 = vtx[1];                   //vert
	    let z0 = vtx[0]*sina + vtx[2]*cosa;//depth
	    //rotation around the horizontal axis, i.e. 
            let nx = x0;                         //horiz
            let ny = y0*cosb + z0*sinb;  //vert
	    let nz =-y0*sinb + z0*cosb;  //depth
	    if ( nz > 0 ){
		vtx[3] = 0;
	    }
	    else{
		vtx[3] = 1;
		vtx[4] = -rectr*nx/nz + rectx;
		vtx[5] = -rectr*ny/nz + recty;
	    }
	    v[i][j] = vtx;
	}
    }
    mapping(img,v);
}


function drawZenith(/*PImage*/ img)
{
    let div=15;
    let divh = div/2.;
    let v = new Array(div+1);
    for(let i=0;i<div+1;i++){
	v[i] = new Array(div+1);
    }
    for(let i=0;i<div+1;i++){
	for(let j=0;j<div+1;j++){
	    let vtx = normalize([i/divh-1,-1,j/divh-1]);
            let x0 = vtx[0]*cosa - vtx[2]*sina;//horiz
            let y0 = vtx[1];                   //vert
	    let z0 = vtx[0]*sina + vtx[2]*cosa;//depth
	    //rotation around the horizontal axis, i.e. 
            let nx = x0;                         //horiz
            let ny = y0*cosb + z0*sinb;  //vert
	    let nz =-y0*sinb + z0*cosb;  //depth
	    if ( nz > 0 ){
		vtx[3] = 0;
	    }
	    else{
		vtx[3] = 1;
		vtx[4] = -rectr*nx/nz + rectx;
		vtx[5] = -rectr*ny/nz + recty;
	    }
	    v[i][j] = vtx;
	}
    }
    mapping(img,v);
}






function drawNadir(/*PImage*/ img)
{
    let div=15;
    let divh = div/2.;
    let v = new Array(div+1);
    for(let i=0;i<div+1;i++){
	v[i] = new Array(div+1);
    }
    for(let i=0;i<div+1;i++){
	for(let j=0;j<div+1;j++){
	    let vtx = normalize([-i/divh+1,+1,j/divh-1]);
            let x0 = vtx[0]*cosa - vtx[2]*sina;//horiz
            let y0 = vtx[1];                   //vert
	    let z0 = vtx[0]*sina + vtx[2]*cosa;//depth
	    //rotation around the horizontal axis, i.e. 
            let nx = x0;                         //horiz
            let ny = y0*cosb + z0*sinb;  //vert
	    let nz =-y0*sinb + z0*cosb;  //depth
	    if ( nz > 0 ){
		vtx[3] = 0;
	    }
	    else{
		vtx[3] = 1;
		vtx[4] = -rectr*nx/nz + rectx;
		vtx[5] = -rectr*ny/nz + recty;
	    }
	    v[i][j] = vtx;
	}
    }
    mapping(img,v);
}



function drawLeft(/*PImage*/ img)
{
    let div=15;
    let divh = div/2.;
    let v = new Array(div+1);
    for(let i=0;i<div+1;i++){
	v[i] = new Array(div+1);
    }
    for(let i=0;i<div+1;i++){
	for(let j=0;j<div+1;j++){
	    let vtx = normalize([-1,-i/divh+1,j/divh-1]);
            let x0 = vtx[0]*cosa - vtx[2]*sina;//horiz
            let y0 = vtx[1];                   //vert
	    let z0 = vtx[0]*sina + vtx[2]*cosa;//depth
	    //rotation around the horizontal axis, i.e. 
            let nx = x0;                         //horiz
            let ny = y0*cosb + z0*sinb;  //vert
	    let nz =-y0*sinb + z0*cosb;  //depth
	    if ( nz > 0 ){
		vtx[3] = 0;
	    }
	    else{
		vtx[3] = 1;
		vtx[4] = -rectr*nx/nz + rectx;
		vtx[5] = -rectr*ny/nz + recty;
	    }
	    v[i][j] = vtx;
	}
    }
    mapping(img,v);
}



function drawRight(/*PImage*/ img)
{
    let div=15;
    let divh = div/2.;
    let v = new Array(div+1);
    for(let i=0;i<div+1;i++){
	v[i] = new Array(div+1);
    }
    for(let i=0;i<div+1;i++){
	for(let j=0;j<div+1;j++){
	    let vtx = normalize([+1,i/divh-1,j/divh-1]);
            let x0 = vtx[0]*cosa - vtx[2]*sina;//horiz
            let y0 = vtx[1];                   //vert
	    let z0 = vtx[0]*sina + vtx[2]*cosa;//depth
	    //rotation around the horizontal axis, i.e. 
            let nx = x0;                         //horiz
            let ny = y0*cosb + z0*sinb;  //vert
	    let nz =-y0*sinb + z0*cosb;  //depth
	    if ( nz > 0 ){
		vtx[3] = 0;
	    }
	    else{
		vtx[3] = 1;
		vtx[4] = -rectr*nx/nz + rectx;
		vtx[5] = -rectr*ny/nz + recty;
	    }
	    v[i][j] = vtx;
	}
    }
    mapping(img,v);
}


    
	    

//////////////////////////////////subdivision in orthographic panel


function subdivide1(v0, v1, v2, thres)
{
    let layer = -2;
    // not always unit vectors
    //distance in orthographic panel
    let d01 = abs(v0[5]-v1[5])+abs(v0[6]-v1[6]);
    let d12 = abs(v1[5]-v2[5])+abs(v1[6]-v2[6]);
    let d20 = abs(v2[5]-v0[5])+abs(v2[6]-v0[6]);
    if ( min( d01, d12, d20 ) > thres ){
    //if ( max( d01, d12, d20 ) > thres ){
	//quad division
        let v01 = [(v0[0]+v1[0])/2, (v0[1]+v1[1])/2, (v0[2]+v1[2])/2];
        let v12 = [(v1[0]+v2[0])/2, (v1[1]+v2[1])/2, (v1[2]+v2[2])/2];
        let v20 = [(v2[0]+v0[0])/2, (v2[1]+v0[1])/2, (v2[2]+v0[2])/2];
        let euler = cartesian2euler(normalize(v01));
        v01[3] = (euler[0]/ (2*pi) + 0.5);
        v01[4] = (euler[1] / pi + 0.5);
        euler = cartesian2euler(normalize(v12));
        v12[3] = (euler[0]/ (2*pi) + 0.5);
        v12[4] = (euler[1] / pi + 0.5);
        euler = cartesian2euler(normalize(v20));
        v20[3] = (euler[0]/ (2*pi) + 0.5);
        v20[4] = (euler[1] / pi + 0.5);
        v01[5] = (v0[5]+v1[5])/2;
        v01[6] = (v0[6]+v1[6])/2;
        v12[5] = (v1[5]+v2[5])/2;
        v12[6] = (v1[6]+v2[6])/2;
        v20[5] = (v2[5]+v0[5])/2;
        v20[6] = (v2[6]+v0[6])/2;
        subdivide1(v0,v01,v20,thres);
        subdivide1(v1,v12,v01,thres);
        subdivide1(v2,v20,v12,thres);
        subdivide1(v01,v12,v20,thres);
    }
    else if ( d01 == max(d01,d12,d20) && d01 > thres ){
	//bidivision
	let v01 = [(v0[0]+v1[0])/2, (v0[1]+v1[1])/2, (v0[2]+v1[2])/2];
        let euler = cartesian2euler(normalize(v01));
        v01[3] = (euler[0]/ (2*pi) + 0.5);
        v01[4] = (euler[1] / pi + 0.5);
        v01[5] = (v0[5]+v1[5])/2;
        v01[6] = (v0[6]+v1[6])/2;
        subdivide1(v2,v0,v01,thres);
        subdivide1(v01,v1,v2,thres);
    }
    else if ( d12 == max(d01,d12,d20) && d12 > thres ){
	//bidivision
	let v12 = [(v1[0]+v2[0])/2, (v1[1]+v2[1])/2, (v1[2]+v2[2])/2];
        let euler = cartesian2euler(normalize(v12));
        v12[3] = (euler[0]/ (2*pi) + 0.5);
        v12[4] = (euler[1] / pi + 0.5);
        v12[5] = (v1[5]+v2[5])/2;
        v12[6] = (v1[6]+v2[6])/2;
        subdivide1(v0,v1,v12,thres);
        subdivide1(v12,v2,v0,thres);
    }
    else if ( d20 == max(d01,d12,d20) && d20 > thres ){
	//bidivision
    	let v20 = [(v2[0]+v0[0])/2, (v2[1]+v0[1])/2, (v2[2]+v0[2])/2];
        let euler = cartesian2euler(normalize(v20));
        v20[3] = (euler[0]/ (2*pi) + 0.5);
        v20[4] = (euler[1] / pi + 0.5);
        v20[5] = (v2[5]+v0[5])/2;
        v20[6] = (v2[6]+v0[6])/2;
        subdivide1(v1,v2,v20,thres);
        subdivide1(v20,v0,v1,thres);
    }
    else{
	//boundary treatment required.
	let d = abs(v0[3]-v1[3])+abs(v1[3]-v2[3])+abs(v2[3]-v0[3]);
	if ( d < 0.5 ){
	    //orthographic panel
	    fill(255);
	    //stroke(0);
        noStroke();
	    beginShape(TRIANGLE);
            texture(online);
            vertex(v0[5],v0[6], layer, v0[3],v0[4]);
            vertex(v1[5],v1[6], layer, v1[3],v1[4]);
            vertex(v2[5],v2[6], layer, v2[3],v2[4]);
        endShape();
	}
	else{
	    if ( thres > 10 ){
	    	subdivide1(v0,v1,v2,thres/2);
	    }
	    else{
            //seam
            fill(0);
            noStroke();
            beginShape();
            vertex(v0[5],v0[6],layer);
            vertex(v1[5],v1[6],layer);
            vertex(v2[5],v2[6],layer);
            endShape(CLOSE);
	    }
	}
    }
}


function subdivide_og(vertices, triangles, thres)
{
    for(let i=0;i<triangles.length;i++){
    	let t = triangles[i];
        let plane = triangles[i][3];
        //rotate normal
        //let ny = plane[0]*sina + plane[1]*cosa;
        let x0 = plane[0]*cosa - plane[2]*sina;//horiz
        let y0 = plane[1];                   //vert
        let z0 = plane[0]*sina + plane[2]*cosa;//depth
        //rotation around the horizontal axis, i.e. 
        let nx = x0;                         //horiz
        let ny = y0*cosb + z0*sinb;  //vert
    	let nz =-y0*sinb + z0*cosb;  //depth
        if ( nz < 0 ){
	    let v0 = vertices.get(t[0]);
	    let v1 = vertices.get(t[1]);
	    let v2 = vertices.get(t[2]);
	    if ( v0[7] && v1[7] && v2[7] ){
		//all the vertices are frontside in the orthographic panel
		subdivide1(v0,v1,v2, thres);
	    }
	}
    }
}


////////////////////////////////////


function subdivide_dev(vertices, triangles, ranges, thres)
{
    let devzoom = min( devw / (ranges[1]-ranges[0]), devh / (ranges[3]-ranges[2]) );
    let devoffsetx = ranges[0];
    let devoffsety = ranges[2];
    fill(255);
    for(let k=0;k<triangles.length;k++){
	let vs = [];
        i = triangles[k][4].entrySet().iterator();  // Get an iterator
        while (i.hasNext()) {
            const me = i.next();
            let v = [];
            let vtx = me.getKey();
            //println(vtx);
            vtx = vertices.get(vtx);
            let pos = me.getValue();
            v[0] = vtx[0];//position on the sphere
            v[1] = vtx[1];
            v[2] = vtx[2];
            v[3] = vtx[3];//position on the equirectangular image
            v[4] = vtx[4];
            v[5] = (pos[0]-devoffsetx)*devzoom + devx;//position on the screen
            v[6] = (pos[1]-devoffsety)*devzoom + devy;
            vs.push(v);
        }
    	subdivide1(vs[0],vs[1],vs[2], thres);
    }
}




function draw() {  // this is run repeatedly.
    if ( updated ){
	if ( mode == 4 ){
	    mode = 5;
	    fill(0);
	    textSize(winy/20);
	    text("Developing.... Wait a moment.", devSx, devSy+70);
	    return;
	}
	else if ( mode == 5 ){
        background(255);
	    updated = 0;
	    devx = devLx;
	    devy = devLy;
	    devw = devLw;
	    devh = devLh;
        let dm = distanceMatrix(vertices, triangles);
        links = spanningTree(dm, triangles);
        ranges   = LocatePanels(vertices, triangles, links);
	    subdivide_dev(vertices, triangles, ranges, 8.0);
        Develop(vertices, triangles, ranges);
	    return;
	}
        background(255);
        //fill(200);
        //rect(0,width/2,width,height-width/2);
        updated = 0;
	if ( frontimg == 0 ){
	    if ( online.width /2 < cube ){
    		cube = online.width /2 ;
	    }
	    frontimg = front(40, online);
	    let w = 80;
	    while ( w < cube ){
            idlejob.push(["RefreshFront",w]);
            idlejob.push(["RefreshBack",w]);
            idlejob.push(["RefreshLeft",w]);
            idlejob.push(["RefreshRight",w]);
            idlejob.push(["RefreshZenith",w]);
            idlejob.push(["RefreshNadir",w]);
    		w += w;
	    }
	}
	if ( leftimg == 0 ){
	    leftimg = left(40, online);
	}
	if ( zenithimg == 0 ){
	    zenithimg = zenith(40, online);
	}
	if ( backimg == 0 ){
	    backimg = back(40, online);
	}
	if ( rightimg == 0 ){
	    rightimg = right(40, online);
	}
	if ( nadirimg == 0 ){
	    nadirimg = nadir(40, online);
	}
	drawFront(frontimg);
	drawLeft(leftimg);
	drawZenith(zenithimg);
	drawBack(backimg);
	drawRight(rightimg);
	drawNadir(nadirimg);
    rectilinear_panel(vertices, triangles);
    orthographic_panel(vertices, triangles);
    let dm = distanceMatrix(vertices, triangles);
    links = spanningTree(dm, triangles);
    ranges   = LocatePanels(vertices, triangles, links);
    Develop(vertices, triangles, ranges);

	buttonZoom.Draw();
	buttonMap.Draw();
	idlejob.unshift(["Redraw",]);

    }
    else if ( 0 < idlejob.length ){
	//do idle job
	job = idlejob.shift();
	jobname = job[0];
	//println(jobname);
	if (jobname == "Redraw"){
	    if ( mapOrthographic )
    		subdivide_og(vertices, triangles, 20.0);
        orthographic_panel(vertices, triangles);
        if ( mapDevelop )
            subdivide_dev(vertices, triangles, ranges, 20.0);
        Develop(vertices, triangles, ranges);
	}
	else if (jobname == "RefreshFront"){
	    frontimg = front(job[1], online);
	    updated = 1;
	}
	else if (jobname == "RefreshBack"){
	    backimg = back(job[1], online);
	    updated = 1;
	}
	else if (jobname == "RefreshLeft"){
	    leftimg = left(job[1], online);
	    updated = 1;
	}
	else if (jobname == "RefreshRight"){
	    rightimg = right(job[1], online);
	    updated = 1;
	}
	else if (jobname == "RefreshZenith"){
	    zenithimg = zenith(job[1], online);
	    updated = 1;
	}
	else if (jobname == "RefreshNadir"){
	    nadirimg = nadir(job[1], online);
	    updated = 1;
	}
	else{
	    //unknown job
	}
    }
    if ( ( pressedTime > 0 ) && ( 10 < frameCount - pressedTime ) ){
	delayedAction();
    }
}


/*
vertices
[0..2] coordinate on the sphere
[3,4]  coordinate in equirectangular panel
[5,6]  coordinate in orthographic panel
[7]    1 if foreground in the orthographic panel
*/
