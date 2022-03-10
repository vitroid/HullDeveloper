// -*- javascript -*-
/* @pjs preload="erb.jpg"; */
/* @pjs preload="geode6000.jpg"; */
// This sketch builds on a prior work, "hull5", created by Masakazu Matsumoto
// http://studio.sketchpad.cc/sp/pad/view/ro.90J5n40eh-tAf/rev.882



// This sketch builds on a prior work, "hull4", created by Masakazu Matsumoto
// http://studio.sketchpad.cc/sp/pad/view/ro.9We3Kplm-bQ6W/rev.681



// This sketch builds on a prior work, "hull3", created by Masakazu Matsumoto
// http://studio.sketchpad.cc/sp/pad/view/ro.9$Hd6L5iZ4Ot4/rev.123



// This sketch builds on a prior work, "hull2", created by Masakazu Matsumoto
// http://studio.sketchpad.cc/sp/pad/view/ro.9etopzTtVrWvr/rev.735



// This sketch builds on a prior work, "Modified clone of 'hull'", created by Masakazu Matsumoto
// http://studio.sketchpad.cc/sp/pad/view/ro.9LrWM-dHxG6WF/rev.2316



// This sketch builds on a prior work, "hull", created by Masakazu Matsumoto
// http://studio.sketchpad.cc/sp/pad/view/ro.9hhvcmpZ$Xv5K/rev.3095



// Pressing Control-R will render this sketch.

//Convex hull composer.
//The convex hull consists of vertices on a sphere is drawn on an equirectangular map interactively.

//the next step is to develop it.

////////////////////////////////////////////Convex hull

var norm(var v){
    float s = 0.0;
    for(int dim=0; dim<3; dim++){
        s += v[dim]*v[dim];
    }
    return sqrt(s);
}


var normalize(var v){
    float n = 1./norm(v);
    var newv = new Array(3);
    for(int dim=0; dim<3; dim++){
        newv[dim] = v[dim]*n;
    }
    return newv;
}


var plain(var vertices, var vs){
    //println(["vs",vs]);
    var v0 = vertices.get(vs[0]);
    var v1 = vertices.get(vs[1]);
    var v2 = vertices.get(vs[2]);
    var v01 = [];
    var v02 = [];
    for(int dim=0; dim<3; dim++){
        v01.push(v1[dim]-v0[dim]);
        v02.push(v2[dim]-v0[dim]);
    }
    //normal vector
    var n = [v02[1]*v01[2] - v02[2]*v01[1],
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



void addVertex(var triangles, HashMap vertices, var newv, var nextv){
    var edges = {};
    var i=0;
    while(i<triangles.length){
        var s = 0.0;
        for(int dim=0;dim<3;dim++){
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
        var e0 = edge >> 10;
        var e1 = edge % 1024;
        var egde = e1*1024+e0;
        edges[egde] -= 1;
    }
    var rim = [];
    //remove the overlapped edges
    for(var edge in edges){
        if(edges[edge]==1){
            rim.push(edge);
        }
    }
    //add the vertice
    vertices.put(nextv, newv);
    var vv = nextv;
    //println(["Added",vv]);
    nextv += 1;
    //add the triangles
    for(int i=0;i<rim.length;i++){
        var edge = rim[i];
        var e0 = edge >> 10;
        var e1 = edge % 1024;
        var t;
        t = [e0,e1,vv];
        t.push(plain(vertices,t));
        triangles.push(t);
    }
    return nextv;
}



var triangulation(var rim, var veryfirst, var vertices, var tris){
    var first = veryfirst;
    
    while(1){
        //first triplet
        var second = rim[first];
        var third  = rim[second];
        var t = [first,second,third];
        //���줬������ξ�礬���ꤦ�롣check���ɲä��롣
        //check
        var pl = plain(vertices,t);
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
        //�ޤ��ǽ�θ��䤬�Ǥ�����
        //�Ĥ���������٤�΢�ˤ��뤳�Ȥ��ǧ���롣
        var next = rim[third];
        var isconvex = 1;
        while ( next != first ){
            var newv = vertices.get(next);
            var s = 0.0;
            for(int dim=0;dim<3;dim++){
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


var removeVertex(var triangles, HashMap vertices, var vv){
    if ( vv < 0 ){
        return 9;
    }
    //println(["Remove",vv]);
    //for(var i in triangles){
    //    println([i,triangles[i]]);
    //}
    var rim = {}; // chain of rim vertices.
    //look up the triangles having vv
    var trash = [];
    var i=0;
    var first = 0;
    for(var i=0;i<triangles.length;i++){
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
    //for(var i in rim){
    //    println(["Rim",i,rim[i]]);
    //}
    //remove the vertex
    //hatch the hole.
    var hatches = [];
    var err = triangulation(rim, first, vertices, hatches);
    if ( err ){
        return err;
    }
    //all succeeded
    //remove the triangles
    while( trash.length > 0 ){
        var tri = trash.pop();
        triangles.splice(tri,1);
    }
    //remove the vertex
    vertices.remove(vv);

    for(var i=0;i<hatches.length;i++){
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
var nextv = 4;

var triangles = [];
var t;
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
//for(int i=0;i<triangles.length;i++){
//  println([triangles[i][0],triangles[i][1],triangles[i][2]]);
//}
//println(vertices.length);



/////////////////////////utility

var pi = 3.14159265359;

var cartesian2euler(var v){
    var r = sqrt(v[0]*v[0]+v[2]*v[2]);
    var theta = atan(v[1]/r);
    var phi   = atan(v[2]/v[0]);
    if(v[0]<0){
        phi += pi;
    }
    if(phi > pi){
        phi -= 2*pi;
    }
    return [phi,theta];
} 


/////////////////////////setup

PImage online;
//PImage online;
Button buttonZoom;
Button buttonMap;

PImage frontimg = 0;
PImage leftimg = 0;
PImage zenithimg = 0;
PImage backimg = 0;
PImage rightimg = 0;
PImage nadirimg = 0;
//println(test.pixels);
/*
image(f,width/4*3,width/4*2);
image(b,width/4*3-160,width/4*2);
image(l,width/4*3-80,width/4*2);
image(r,width/4*3-240,width/4*2);
image(z,width/4*3,width/4*2-80);
image(n,width/4*3,width/4*2+80);
*/
var winx = screen.width;
var winy = screen.height;
//orthographic circle
var orthx = winy/4;
var orthy = winy/4;
var orthr = winy/4;
//rectilinear view
var rectx = winx/2;
var recty = winy/2;
var rectr = winy/2;
//development panel
var devSx = 0;
var devSy = winy/2;
var devSw = winx/2;
var devSh = winy/2;
var devLx = 0;
var devLy = 0;
var devLw = winx;
var devLh = winy;
var devx = devSx;
var devy = devSy;
var devw = devSw;
var devh = devSh;
//
var cube = 1024;
if ( winx < cube ){
    cube = winx;
}


void setup() {  // this is run once.   
    
    size(winx,winy,OPENGL);
    String url = "erb.jpg";
    String urlButtonMap = "buttonMap.png";
    String urlButtonZoom = "buttonZoom.png";
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


var origin = -1;
var phi = 0;  //rotation angle of preview
var cosa = cos(phi);
var sina = sin(phi);
var theta = 0;  //rotation angle of preview
var cosb = cos(theta);
var sinb = sin(theta);
var mode  = 0;  //2==orthographic panel / 3==rectilinear panel
var lastx = 0;
var lasty = 0;
var updated = 1;
var idlejob = [];
var pressedTime = 0;
var pressedX = 0; //initial position
var pressedY = 0;
var mapOrthographic = 0;
var mapDevelop = 0;
//for development
var links;
float com[2];



class Button
{
    PImage icon;
    var posx,posy;
    Button( PImage i, int x, int y )
    {
	icon = i;
	posx = x;
	posy = y;
    }
    void Draw()
    {
	fill(255);
	image(icon,posx,posy);
    }
    int isPointed()
    {
	return ( ( posx <= mouseX ) && ( mouseX <= posx+icon.width ) && ( posy <= mouseY ) && ( mouseY <= posy + icon.height ) );
    }
};


var addVertexOnOrthographic(){
    //add a new point by default
    var x = (mouseX - orthx)/orthr;
    var y = (mouseY - orthy)/orthr;
    var d = x*x+y*y;
    if ( d < 1.0 ){
        var z = -sqrt(1.0-d);
        //var rx = x*cosa + y*sina;
        //var ry = -x*sina + y*cosa;
        var nx = x;                         //horiz
        var ny = y*cosb - z*sinb;  //vert
	var nz = y*sinb + z*cosb;  //depth
        var rx = nx*cosa + nz*sina;//horiz
        var ry = ny;                   //vert
	var rz =-nx*sina + nz*cosa;//depth
        var newv = [rx,ry,rz];
        var euler = cartesian2euler(newv);
        var sx = (euler[0]/ (2*pi) + 0.5);
        var sy = (euler[1] / pi + 0.5);
        newv.push(sx);
        newv.push(sy);
        //angle = -(sx / width * 2*pi) + pi/2;
        var target = nextv;
        nextv = addVertex(triangles, vertices, newv, nextv);
        return target;
    }
    return -1;
}


var addVertexOnRectilinear(){
    //add a new point by default
    var x = (mouseX - rectx)/rectr;
    var y = (mouseY - recty)/rectr;
    var z = -1.0;
    var newv = normalize([x,y,z]);
    //var rx = newv[0]*cosa + newv[1]*sina;
    //var ry = -newv[0]*sina + newv[1]*cosa;
    //var x0 = newv[0]*cosa - newv[1]*sina;//horiz
    //var y0 = newv[0]*sina + newv[1]*cosa;//depth
    //var z0 = newv[2];                   //vert
    var nx = newv[0];                         //horiz
    var ny = newv[1]*cosb - newv[2]*sinb;  //vert
    var nz = newv[1]*sinb + newv[2]*cosb;  //depth
    var rx = nx*cosa + nz*sina;//horiz
    var ry = ny;                   //vert
    var rz =-nx*sina + nz*cosa;//depth
    //rotation around the horizontal axis, i.e. 
    //var nx = x0;                         //horiz
    //var ny = y0*cosb + z0*sinb;  //vert
    //var nz =-y0*sinb + z0*cosb;  //depth
    //newv = [rx,ry,newv[2]];
    newv = [rx,ry,rz];
    var euler = cartesian2euler(newv);
    var sx = (euler[0]/ (2*pi) + 0.5);
    var sy = (euler[1] / pi + 0.5);
    newv.push(sx);
    newv.push(sy);
    //angle = -(sx / width * 2*pi) + pi/2;
    var target = nextv;
    nextv = addVertex(triangles, vertices, newv, nextv);
    return target;
}




void mousePressed() {
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
    var dmx = mouseX - orthx;
    var dmy = mouseY - orthy;
    if ( dmx*dmx + dmy*dmy < orthr*orthr ){
        //orthographic panel
        mode = 2;
	//no quick response
        //look up the existing vertices
        var candidate = -1;
        var mindist   = 20*20;
        Iterator i = vertices.entrySet().iterator();  // Get an iterator
        while (i.hasNext()) {
	    Map.Entry me = (Map.Entry)i.next();
	    var vtx = me.getValue();
	    if ( vtx[7] == 1 ){ //frontside
                var x = vtx[5];
                var y = vtx[6];
                var dx = x - mouseX;
                var dy = y - mouseY;
                var dd = dx*dx + dy*dy;
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
        var candidate = -1;
        var mindist   = 20*20;
        Iterator i = vertices.entrySet().iterator();  // Get an iterator
        while (i.hasNext()) {
	    Map.Entry me = (Map.Entry)i.next();
	    var vtx = me.getValue();
	    if ( vtx[8] == 1 ){ //frontside
                var x = vtx[9];
                var y = vtx[10];
                var dx = x - mouseX;
                var dy = y - mouseY;
                var dd = dx*dx + dy*dy;
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


void delayedAction()
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



void mouseDragged(){
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
		int err = removeVertex(triangles, vertices, origin);
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
		int err = removeVertex(triangles, vertices, origin);
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
		var target = addVertexOnOrthographic();
		removeVertex(triangles, vertices, origin);
		origin = target;
		updated = 1;
            }
            if ( mode == 3 ){
		//rectilinear panel
		//drag mode;
		var target = addVertexOnRectilinear();
		removeVertex(triangles, vertices, origin);
		origin = target;
		updated = 1;
            }
	}
    }
}




void mouseReleased(){
    if ( ( mode == 4 ) || (mode == 5 ) ){
	return;
    }
    var dx = mouseX - pressedX;
    var dy = mouseY - pressedY;
    if ( dx*dx + dy*dy < 2 ){
	//just clicked
	//orthographic panel
	var x = (mouseX - orthx)/orthr;
	var z = (mouseY - orthy)/orthr;
	var d = x*x+z*z;
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





void orthographic_panel(var vertices, var triangles)
{
    var layer = -1;
    fill(255,255,255,100);
    stroke(0);
    strokeWeight(1);
    ellipse(orthx,orthy,orthr*2,orthr*2);
    //rotate vertices in advance
    Iterator i = vertices.entrySet().iterator();  // Get an iterator
    while (i.hasNext()) {
        Map.Entry me = (Map.Entry)i.next();
        vtx = me.getValue();
	//rotation around the vertical axis
        //var x0 = vtx[0]*cosa - vtx[1]*sina;//horiz
        //var y0 = vtx[2];                   //vert
	//var z0 = vtx[0]*sina + vtx[1]*cosa;//depth
        var x0 = vtx[0]*cosa - vtx[2]*sina;//horiz
        var y0 = vtx[1];                   //vert
	var z0 = vtx[0]*sina + vtx[2]*cosa;//depth
	//rotation around the horizontal axis, i.e. 
        var nx = x0;                         //horiz
        var ny = y0*cosb + z0*sinb;  //vert
	var nz =-y0*sinb + z0*cosb;  //depth
        vtx[5] = orthr * nx + orthx;
        vtx[6] = orthr * ny + orthy;
        vtx[7] = 0; //backward
    }

    for(int i=0; i<triangles.length;i++){
        var plane = triangles[i][3];
        //rotate normal
        var x0 = plane[0]*cosa - plane[2]*sina;//horiz
        var y0 = plane[1];                   //vert
	var z0 = plane[0]*sina + plane[2]*cosa;//depth
	//rotation around the horizontal axis, i.e. 
        var nx = x0;                         //horiz
        var ny = y0*cosb + z0*sinb;  //vert
	var nz =-y0*sinb + z0*cosb;  //depth
        if ( nz < 0 ){
            fill((int)(255*(-nz)));
            beginShape();
            for(int j=0;j<3;j++){
                var v = vertices.get(triangles[i][j]);
                v[7] = 1;
                vertex(v[5],v[6],layer);
            }
            endShape(CLOSE);
        }
    }
    Iterator i = vertices.entrySet().iterator();  // Get an iterator
    while (i.hasNext()) {
        Map.Entry me = (Map.Entry)i.next();
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

void rectilinear_panel(var vertices, var triangles)
{
    int layer = -3;
    //rotate vertices in advance
    Iterator i = vertices.entrySet().iterator();  // Get an iterator
    while (i.hasNext()) {
        Map.Entry me = (Map.Entry)i.next();
        vtx = me.getValue();
        vtx.length = 11;
        //var ny = vtx[0]*sina + vtx[1]*cosa;
        //var nx = vtx[0]*cosa - vtx[1]*sina;
        //var nz = vtx[2];
        var x0 = vtx[0]*cosa - vtx[1]*sina;//horiz
        var y0 = vtx[2];                   //vert
	var z0 = vtx[0]*sina + vtx[1]*cosa;//depth
        var x0 = vtx[0]*cosa - vtx[2]*sina;//horiz
        var y0 = vtx[1];                   //vert
	var z0 = vtx[0]*sina + vtx[2]*cosa;//depth
	//rotation around the horizontal axis, i.e. 
        var nx = x0;                         //horiz
        var ny = y0*cosb + z0*sinb;  //vert
	var nz =-y0*sinb + z0*cosb;  //depth
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
    for(int i=0; i<triangles.length;i++){
	var t = triangles[i];
	var v0 = vertices.get(t[0]);
	var v1 = vertices.get(t[1]);
	var v2 = vertices.get(t[2]);
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
    Iterator i = vertices.entrySet().iterator();  // Get an iterator
    while (i.hasNext()) {
        Map.Entry me = (Map.Entry)i.next();
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


void distanceMatrix(var vertices, var triangles)
{
    var dm = new Array(triangles.length);
    for(int i=0;i<dm.length;i++){
        dm[i] = new Array(dm.length);
        for(int j=0;j<dm.length;j++){
            dm[i][j] = 1.0;
        }
    }
    //�ޤ���ͭ�դ�ɽ��ɬ�ס�
    var edges = {};
    for(int i=0;i<triangles.length;i++){
        edges[[triangles[i][0],triangles[i][1]]] = i;
        edges[[triangles[i][1],triangles[i][2]]] = i;
        edges[[triangles[i][2],triangles[i][0]]] = i;
    }
    //println("");
    for(int i=0;i<triangles.length;i++){
        var va = triangles[i][0];
        var vb = triangles[i][1];
        var j = edges[[vb,va]];
        if (i<j){
            var s = 0.0;
            for(int dim=0;dim<3;dim++){
                s += vertices.get(va)[dim] * vertices.get(vb)[dim];
            }
            dm[i][j] = [s,va,vb];//innerproduct and labels of shared vertices
            dm[j][i] = [s,vb,va];
            //println([i,j,s]);
        }
        va = triangles[i][1];
        vb = triangles[i][2];
        var j = edges[[vb,va]];
        if (i<j){
            var s = 0.0;
            for(int dim=0;dim<3;dim++){
                s += vertices.get(va)[dim] * vertices.get(vb)[dim];
            }
            dm[i][j] = [s,va,vb];
            dm[j][i] = [s,vb,va];
            //println([i,j,s]);
        }
        va = triangles[i][2];
        vb = triangles[i][0];
        var j = edges[[vb,va]];
        if (i<j){
            var s = 0.0;
            for(int dim=0;dim<3;dim++){
                s += vertices.get(va)[dim] * vertices.get(vb)[dim];
            }
            dm[i][j] = [s,va,vb];
            dm[j][i] = [s,vb,va];
            //println([i,j,s]);
        }
    }
    return dm;
}


var spanningTree(var dm, var triangles)
{
    var links = [];
    var undone = [];
    for(int i=1;i<dm.length;i++){
        undone.push(i);
    }
    var done = [0,];
    fill(#00ff00);
    //first node is always 0
    
    while ( undone.length > 0 ){
        int imax = 0;
        int kmax = 0;
        int vmax = 1.;
        //println(["done",done]);
        //println(["undone",undone]);
        for(int ki=0;ki<done.length;ki++){
            var i = done[ki];
            for(int k=0;k<undone.length;k++){
                var j = undone[k];
                //println(["test",i,j,dm[i][j]]);
                if ( dm[i][j][0] < vmax ){
                    imax = ki;
                    kmax = k;
                    vmax = dm[i][j][0]; // innerproduct
                }
            }
        }
        var i = done[imax];
        var j = undone[kmax];
        links.push([i,j,dm[i][j][1],dm[i][j][2]]);//neighboring faces and shared vertices
        //println(["Nearest",i,j,dm[i][j]]);
        /*
        var v0 = triangles[i][3];//normal vector
        vat v1 = triangles[j][3];//normal vector
        drawLine(v0,v1);
        */
        done.push(j);
        undone.splice(kmax,1);
    }
    return links;
}



var norm2(var v){
    float s = 0.0;
    for(int dim=0; dim<2; dim++){
        s += v[dim]*v[dim];
    }
    return sqrt(s);
}


//determine the position of the third vertex of the triangle.
//vertices are counter-clockwise
//va and vb are 2D vectors.
void thirdvertex(var va, var vb, var Lbc, var Lac)
{
    var vab = [vb[0] - va[0], vb[1] - va[1]];
    var Lab = norm2(vab);
    var vlong = [vab[0]/Lab, vab[1]/Lab];
    var Llong = (Lab*Lab + Lac*Lac - Lbc*Lbc) / (2*Lab);
    var vlat  = [vlong[1], -vlong[0]];
    var Llat  = sqrt( Lac*Lac - Llong*Llong );
    return [ va[0] + Llong * vlong[0] - Llat * vlat[0], 
             va[1] + Llong * vlong[1] - Llat * vlat[1] ];
}



//distances between three vertices on the sphere
var edgelength(v0,v1,v2)
{
    return [norm([v0[0]-v1[0], v0[1]-v1[1], v0[2]-v1[2]]),
            norm([v1[0]-v2[0], v1[1]-v2[1], v1[2]-v2[2]]),
            norm([v2[0]-v0[0], v2[1]-v0[1], v2[2]-v0[2]])];
}


var LocatePanels(var vertices, var triangles, var links)
{
    //fill(#ff0000);
    //textAlign(RIGHT);
    //text("Development",width-2,width/2+10);
    var wrange = [0.0,0.0];
    var hrange = [0.0,0.0];
    var tri0 = links[0][0];
    var L    = edgelength(vertices.get(triangles[tri0][0]),
                          vertices.get(triangles[tri0][1]),
                          vertices.get(triangles[tri0][2]));
    var v0 = [0.0, 0.0];
    var v1 = [0.0, L[0]];
    hrange[1] = L[0];
    var v2 = thirdvertex(v0,v1,L[1],L[2]);
    wrange[0] = min(wrange[0],v2[0]);
    wrange[1] = max(wrange[1],v2[0]);
    hrange[0] = min(hrange[0],v2[1]);
    hrange[1] = max(hrange[1],v2[1]);
    triangles[tri0][4] = new HashMap();
    triangles[tri0][4].put(triangles[tri0][0],v0);
    triangles[tri0][4].put(triangles[tri0][1],v1);
    triangles[tri0][4].put(triangles[tri0][2],v2);
    for(var i=0;i<links.length;i++){
        var tri0 = links[i][0];
        var tri1 = links[i][1];
        var sv1  = links[i][2];//shared vertices
        var sv0  = links[i][3];
        var uv2 = triangles[tri1][0] + triangles[tri1][1] + triangles[tri1][2] - sv0 - sv1; // unshaed vertex of tri1
        //println(["linkage",tri0,tri1,sv0,sv1,uv2,triangles[tri1][0],triangles[tri1][1],triangles[tri1][2]]);
        var L    = edgelength(vertices.get(sv0),
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

var Develop(var vertices, var triangles, var ranges)
{
    var layer = -1;
    var devzoom = min( devw / (ranges[1]-ranges[0]), devh / (ranges[3]-ranges[2]) );
    var devoffsetx = ranges[0];
    var devoffsety = ranges[2];
    noFill();
    stroke(0);
    strokeWeight(1);
    for(int k=0;k<triangles.length;k++){
        beginShape();
        Iterator i = triangles[k][4].entrySet().iterator();  // Get an iterator
        while (i.hasNext()) {
            Map.Entry me = (Map.Entry)i.next();
            var vtx = me.getValue();
            vertex((vtx[0]-devoffsetx)*devzoom+devx,(vtx[1]-devoffsety)*devzoom+devy,layer);
	}
        endShape(CLOSE);
    }
}

////////make the cube pixel by pixel

//nadir == y > 0
var zenith(var width, PImage eq)
{
    var half = width / 2.0;
    PImage sq = createImage(width,width,ARGB);

    for(int i=0;i<sq.pixels.length;i++){
	color c = color(100,100,200,100);
	sq.pixels[i] = c;
    }

    var y = -1.0;
    int i=0;
    for(int iz=0;iz<sq.width;iz++){
	var z = (iz-half)/half;
	for(int ix=0;ix<sq.width;ix++){
	    var x = (ix-half)/half;
	    var v = normalize([x,y,z]);
	    var euler = cartesian2euler(v);
	    int sx = (euler[0]/ (2*pi) + 0.5)*eq.width;
	    int sy = (euler[1] / pi + 0.5)*eq.width/2;
	    int j = (int)sy*eq.width+(int)sx;
	    color c = eq.get((int)sx,(int)sy);
	    sq.pixels[i] = c;
	    i++;
	}
    }
    sq.updatePixels();
    return sq;
}


var nadir(var width, PImage eq)
{
    var half = width / 2.0;
    PImage sq = createImage(width,width,ARGB);

    for(int i=0;i<sq.pixels.length;i++){
	color c = color(100,100,200,100);
	sq.pixels[i] = c;
    }

    var y = 1.0;
    int i=0;
    for(int iz=0;iz<sq.width;iz++){
	var z = (iz-half)/half;
	for(int ix=0;ix<sq.width;ix++){
	    var x = -(ix-half)/half;
	    var v = normalize([x,y,z]);
	    var euler = cartesian2euler(v);
	    int sx = (euler[0]/ (2*pi) + 0.5)*eq.width;
	    int sy = (euler[1] / pi + 0.5)*eq.width/2;
	    int j = (int)sy*eq.width+(int)sx;
	    color c = eq.get((int)sx,(int)sy);
	    sq.pixels[i] = c;
	    i++;
	}
    }
    sq.updatePixels();
    return sq;
}




var left(var width, PImage eq)
{
    var half = width / 2.0;
    PImage sq = createImage(width,width,ARGB);

    for(int i=0;i<sq.pixels.length;i++){
	color c = color(100,100,200,100);
	sq.pixels[i] = c;
    }

    var x = -1.0;
    int i=0;
    for(int iz=0;iz<sq.width;iz++){
	var z = (iz-half)/half;
	for(int iy=0;iy<sq.width;iy++){
	    var y = -(iy-half)/half;
	    var v = normalize([x,y,z]);
	    var euler = cartesian2euler(v);
	    int sx = (euler[0]/ (2*pi) + 0.5)*eq.width;
	    int sy = (euler[1] / pi + 0.5)*eq.width/2;
	    int j = (int)sy*eq.width+(int)sx;
	    color c = eq.get((int)sx,(int)sy);
	    sq.pixels[i] = c;
	    i++;
	}
    }
    sq.updatePixels();
    return sq;
}


var right(var width, PImage eq)
{
    var half = width / 2.0;
    PImage sq = createImage(width,width,ARGB);

    for(int i=0;i<sq.pixels.length;i++){
	color c = color(100,100,200,100);
	sq.pixels[i] = c;
    }

    var x = 1.0;
    int i=0;
    for(int iz=0;iz<sq.width;iz++){
	var z = (iz-half)/half;
	for(int iy=0;iy<sq.width;iy++){
	    var y = (iy-half)/half;
	    var v = normalize([x,y,z]);
	    var euler = cartesian2euler(v);
	    int sx = (euler[0]/ (2*pi) + 0.5)*eq.width;
	    int sy = (euler[1] / pi + 0.5)*eq.width/2;
	    int j = (int)sy*eq.width+(int)sx;
	    color c = eq.get((int)sx,(int)sy);
	    sq.pixels[i] = c;
	    i++;
	}
    }
    sq.updatePixels();
    return sq;
}


var front(var width, PImage eq)
{
    var half = width / 2.0;
    PImage sq = createImage(width,width,ARGB);

    for(int i=0;i<sq.pixels.length;i++){
	color c = color(100,100,200,100);
	sq.pixels[i] = c;
    }

    var z = -1.0;
    int i=0;
    for(int iy=0;iy<sq.width;iy++){
	var y = -(iy-half)/half;
	for(int ix=0;ix<sq.width;ix++){
	    var x = (ix-half)/half;
	    var v = normalize([x,y,z]);
	    var euler = cartesian2euler(v);
	    int sx = (euler[0]/ (2*pi) + 0.5)*eq.width;
	    int sy = (euler[1] / pi + 0.5)*eq.width/2;
	    int j = (int)sy*eq.width+(int)sx;
	    color c = eq.get((int)sx,(int)sy);
	    sq.pixels[i] = c;
	    i++;
	}
    }
    sq.updatePixels();
    return sq;
}


var back(var width, PImage eq)
{
    var half = width / 2.0;
    PImage sq = createImage(width,width,ARGB);

    for(int i=0;i<sq.pixels.length;i++){
	color c = color(100,100,200,100);
	sq.pixels[i] = c;
    }

    var z = 1.0;
    int i=0;
    for(int iy=0;iy<sq.width;iy++){
	var y = (iy-half)/half;
	for(int ix=0;ix<sq.width;ix++){
	    var x = (ix-half)/half;
	    var v = normalize([x,y,z]);
	    var euler = cartesian2euler(v);
	    int sx = (euler[0]/ (2*pi) + 0.5)*eq.width;
	    int sy = (euler[1] / pi + 0.5)*eq.width/2;
	    int j = (int)sy*eq.width+(int)sx;
	    color c = eq.get((int)sx,(int)sy);
	    sq.pixels[i] = c;
	    i++;
	}
    }
    sq.updatePixels();
    return sq;
}



var mapping(PImage img, var v)
{
    var layer = -4;
    var div = v.length-1.;
    noStroke();
    fill(255);
    for(int i=0;i<div;i++){
	for(int j=0;j<div;j++){
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




var drawFront(PImage img)
{
    var div=15;
    var divh = div/2.;
    var v = new Array(div+1);
    for(int i=0;i<div+1;i++){
	v[i] = new Array(div+1);
    }
    for(int i=0;i<div+1;i++){
	for(int j=0;j<div+1;j++){
	    var vtx = normalize([i/divh-1,-j/divh+1,-1]);
            var x0 = vtx[0]*cosa - vtx[2]*sina;//horiz
            var y0 = vtx[1];                   //vert
	    var z0 = vtx[0]*sina + vtx[2]*cosa;//depth
	    //rotation around the horizontal axis, i.e. 
            var nx = x0;                         //horiz
            var ny = y0*cosb + z0*sinb;  //vert
	    var nz =-y0*sinb + z0*cosb;  //depth
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


var drawBack(PImage img)
{
    var div=15;
    var divh = div/2.;
    var v = new Array(div+1);
    for(int i=0;i<div+1;i++){
	v[i] = new Array(div+1);
    }
    for(int i=0;i<div+1;i++){
	for(int j=0;j<div+1;j++){
	    var vtx = normalize([i/divh-1,j/divh-1,+1]);
            var x0 = vtx[0]*cosa - vtx[2]*sina;//horiz
            var y0 = vtx[1];                   //vert
	    var z0 = vtx[0]*sina + vtx[2]*cosa;//depth
	    //rotation around the horizontal axis, i.e. 
            var nx = x0;                         //horiz
            var ny = y0*cosb + z0*sinb;  //vert
	    var nz =-y0*sinb + z0*cosb;  //depth
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


var drawZenith(PImage img)
{
    var div=15;
    var divh = div/2.;
    var v = new Array(div+1);
    for(int i=0;i<div+1;i++){
	v[i] = new Array(div+1);
    }
    for(int i=0;i<div+1;i++){
	for(int j=0;j<div+1;j++){
	    var vtx = normalize([i/divh-1,-1,j/divh-1]);
            var x0 = vtx[0]*cosa - vtx[2]*sina;//horiz
            var y0 = vtx[1];                   //vert
	    var z0 = vtx[0]*sina + vtx[2]*cosa;//depth
	    //rotation around the horizontal axis, i.e. 
            var nx = x0;                         //horiz
            var ny = y0*cosb + z0*sinb;  //vert
	    var nz =-y0*sinb + z0*cosb;  //depth
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






var drawNadir(PImage img)
{
    var div=15;
    var divh = div/2.;
    var v = new Array(div+1);
    for(int i=0;i<div+1;i++){
	v[i] = new Array(div+1);
    }
    for(int i=0;i<div+1;i++){
	for(int j=0;j<div+1;j++){
	    var vtx = normalize([-i/divh+1,+1,j/divh-1]);
            var x0 = vtx[0]*cosa - vtx[2]*sina;//horiz
            var y0 = vtx[1];                   //vert
	    var z0 = vtx[0]*sina + vtx[2]*cosa;//depth
	    //rotation around the horizontal axis, i.e. 
            var nx = x0;                         //horiz
            var ny = y0*cosb + z0*sinb;  //vert
	    var nz =-y0*sinb + z0*cosb;  //depth
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



var drawLeft(PImage img)
{
    var div=15;
    var divh = div/2.;
    var v = new Array(div+1);
    for(int i=0;i<div+1;i++){
	v[i] = new Array(div+1);
    }
    for(int i=0;i<div+1;i++){
	for(int j=0;j<div+1;j++){
	    var vtx = normalize([-1,-i/divh+1,j/divh-1]);
            var x0 = vtx[0]*cosa - vtx[2]*sina;//horiz
            var y0 = vtx[1];                   //vert
	    var z0 = vtx[0]*sina + vtx[2]*cosa;//depth
	    //rotation around the horizontal axis, i.e. 
            var nx = x0;                         //horiz
            var ny = y0*cosb + z0*sinb;  //vert
	    var nz =-y0*sinb + z0*cosb;  //depth
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



var drawRight(PImage img)
{
    var div=15;
    var divh = div/2.;
    var v = new Array(div+1);
    for(int i=0;i<div+1;i++){
	v[i] = new Array(div+1);
    }
    for(int i=0;i<div+1;i++){
	for(int j=0;j<div+1;j++){
	    var vtx = normalize([+1,i/divh-1,j/divh-1]);
            var x0 = vtx[0]*cosa - vtx[2]*sina;//horiz
            var y0 = vtx[1];                   //vert
	    var z0 = vtx[0]*sina + vtx[2]*cosa;//depth
	    //rotation around the horizontal axis, i.e. 
            var nx = x0;                         //horiz
            var ny = y0*cosb + z0*sinb;  //vert
	    var nz =-y0*sinb + z0*cosb;  //depth
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


var subdivide1(var v0, var v1, var v2, var thres)
{
    var layer = -2;
    // not always unit vectors
    //distance in orthographic panel
    var d01 = abs(v0[5]-v1[5])+abs(v0[6]-v1[6]);
    var d12 = abs(v1[5]-v2[5])+abs(v1[6]-v2[6]);
    var d20 = abs(v2[5]-v0[5])+abs(v2[6]-v0[6]);
    if ( min( d01, d12, d20 ) > thres ){
    //if ( max( d01, d12, d20 ) > thres ){
	//quad division
	var v01 = [(v0[0]+v1[0])/2, (v0[1]+v1[1])/2, (v0[2]+v1[2])/2];
	var v12 = [(v1[0]+v2[0])/2, (v1[1]+v2[1])/2, (v1[2]+v2[2])/2];
	var v20 = [(v2[0]+v0[0])/2, (v2[1]+v0[1])/2, (v2[2]+v0[2])/2];
        var euler = cartesian2euler(normalize(v01));
        v01[3] = (euler[0]/ (2*pi) + 0.5);
        v01[4] = (euler[1] / pi + 0.5);
        var euler = cartesian2euler(normalize(v12));
        v12[3] = (euler[0]/ (2*pi) + 0.5);
        v12[4] = (euler[1] / pi + 0.5);
        var euler = cartesian2euler(normalize(v20));
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
	var v01 = [(v0[0]+v1[0])/2, (v0[1]+v1[1])/2, (v0[2]+v1[2])/2];
        var euler = cartesian2euler(normalize(v01));
        v01[3] = (euler[0]/ (2*pi) + 0.5);
        v01[4] = (euler[1] / pi + 0.5);
	v01[5] = (v0[5]+v1[5])/2;
	v01[6] = (v0[6]+v1[6])/2;
	subdivide1(v2,v0,v01,thres);
	subdivide1(v01,v1,v2,thres);
    }
    else if ( d12 == max(d01,d12,d20) && d12 > thres ){
	//bidivision
	var v12 = [(v1[0]+v2[0])/2, (v1[1]+v2[1])/2, (v1[2]+v2[2])/2];
        var euler = cartesian2euler(normalize(v12));
        v12[3] = (euler[0]/ (2*pi) + 0.5);
        v12[4] = (euler[1] / pi + 0.5);
	v12[5] = (v1[5]+v2[5])/2;
	v12[6] = (v1[6]+v2[6])/2;
	subdivide1(v0,v1,v12,thres);
	subdivide1(v12,v2,v0,thres);
    }
    else if ( d20 == max(d01,d12,d20) && d20 > thres ){
	//bidivision
	var v20 = [(v2[0]+v0[0])/2, (v2[1]+v0[1])/2, (v2[2]+v0[2])/2];
        var euler = cartesian2euler(normalize(v20));
        v20[3] = (euler[0]/ (2*pi) + 0.5);
        v20[4] = (euler[1] / pi + 0.5);
	v20[5] = (v2[5]+v0[5])/2;
	v20[6] = (v2[6]+v0[6])/2;
	subdivide1(v1,v2,v20,thres);
	subdivide1(v20,v0,v1,thres);
    }
    else{
	//boundary treatment required.
	var d = abs(v0[3]-v1[3])+abs(v1[3]-v2[3])+abs(v2[3]-v0[3]);
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


var subdivide_og(var vertices, var triangles, float thres)
{
    for(int i=0;i<triangles.length;i++){
	var t = triangles[i];
        var plane = triangles[i][3];
        //rotate normal
        //var ny = plane[0]*sina + plane[1]*cosa;
        var x0 = plane[0]*cosa - plane[2]*sina;//horiz
        var y0 = plane[1];                   //vert
	var z0 = plane[0]*sina + plane[2]*cosa;//depth
	//rotation around the horizontal axis, i.e. 
        var nx = x0;                         //horiz
        var ny = y0*cosb + z0*sinb;  //vert
	var nz =-y0*sinb + z0*cosb;  //depth
        if ( nz < 0 ){
	    var v0 = vertices.get(t[0]);
	    var v1 = vertices.get(t[1]);
	    var v2 = vertices.get(t[2]);
	    if ( v0[7] && v1[7] && v2[7] ){
		//all the vertices are frontside in the orthographic panel
		subdivide1(v0,v1,v2, thres);
	    }
	}
    }
}


////////////////////////////////////


void subdivide_dev(var vertices, var triangles, var ranges, float thres)
{
    var devzoom = min( devw / (ranges[1]-ranges[0]), devh / (ranges[3]-ranges[2]) );
    var devoffsetx = ranges[0];
    var devoffsety = ranges[2];
    fill(255);
    for(int k=0;k<triangles.length;k++){
	var vs = [];
        Iterator i = triangles[k][4].entrySet().iterator();  // Get an iterator
        while (i.hasNext()) {
            Map.Entry me = (Map.Entry)i.next();
	    var v = [];
	    var vtx = me.getKey();
	    //println(vtx);
	    vtx = vertices.get(vtx);
            var pos = me.getValue();
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




void draw() {  // this is run repeatedly.
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
            var dm = distanceMatrix(vertices, triangles);
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
	    var w = 80;
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
        var dm = distanceMatrix(vertices, triangles);
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
