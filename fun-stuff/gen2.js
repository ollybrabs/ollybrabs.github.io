var cv = document.getElementById("cv");
var ctx = cv.getContext("2d");

var WIDTH = cv.width;
var HEIGHT = cv.height;

//various states that cells can be in
var CellStates = {
	"NOTHING": -1,
	"ROOM": 1,
	"CORRIDOR": 2,
	"BLOCK_ROOM": 3,
	"FAILED_MEAN_ROOM": 4
}

class Grid {
	constructor(w, h) {
		this.cells = [];
		
		this.w = w;
		this.h = h;
		
		for(var x = 0; x < w; x++) {
			for(var y = 0; y < h; y++) {
				this.cells.push( new Cell(y, x, CellStates.NOTHING) );
			}
		}
	}
	
	getCell(x, y) {
		return this.cells[x + y * this.w];
	}
	
	canPlaceRoom(room) {
		if((room.x + room.w) > WIDTH || (room.y + room.h) > HEIGHT) return false;
		
		for(var i = room.x - roomPadding; i < room.x + room.w + roomPadding; i++) {
			for(var j = room.y - roomPadding; j < room.y + room.h + roomPadding; j++) {
				var myCell = this.getCell(i, j);
				if(myCell == undefined) continue;
				
				if(myCell.state == CellStates.ROOM || myCell.state == CellStates.BLOCK_ROOM) return false;
			}
		}
		
		return true;
	}
}

class Cell {
	constructor(x, y, state) {
		this.x = x;
		this.y = y;
		
		this.state = state;
	}
}

class Room {
	constructor(x, y, w, h) {
		this.x = x;
		this.y = y;
		
		this.w = w;
		this.h = h;
		
		this.area = w * h;
		
		this.roomId = null;
	}
	
	getMidPoint() {
		return {
			"x": Math.floor(this.x + this.w/2),
			"y": Math.floor(this.y + this.h/2)
		}
	}
}

function getRoomById(rooms, id) {
	for(var i = 0; i < rooms.length; i++) {
		room = rooms[i];
		if(room.roomId == id) return room;	
	}
}

//debug settings changed via HTML form
var showIDs = false;
var drawMST = false;
var drawOffRooms = true;

var restoreEdge = 0.05;

//global variables
var mainGrid = null;
var allRooms = [];
var allRoomsSmall = [];

var delaunayTris = [];
var delaunayPoints = [];
var delaunayPointId = 0;

var MSTEdges = [];

//room parameters
var numRoomsMade = 0;
var numRooms = 10;

//width bounds
var minRoomW = 10;
var maxRoomW = 20;

//height bounds
var minRoomH = 10;
var maxRoomH = 20;

//number of cells between each room minimum
var roomPadding = 1;

var corridorThickness = 1;

//after this many attempts script gives up trying to generate more rooms
var maxAttempts = 10000;

var coverageWanted = 0.55;
//when removing rooms in the mean test this is the modifier, 1 to just use mean size
var meanRatio = 1.25;

function remakeMap() {
	numRoomsMade = 0;
	delaunayPoints = [];
	delaunayPointId = 0;
	
	allRooms = [];
	
	init();
	draw();
}

function init() {
	var t1 = performance.now();
	mainGrid = new Grid(WIDTH, HEIGHT);
	
	makeRooms();

	removeRooms();
	
	createExits();
	
	delaunayTris = delaunay.triangulate(delaunayPoints);
	
	createMST();
	restoreEdges(restoreEdge);
	
	createCorridors();
	
	var t2 = performance.now();
	
	var timeTaken = (t2 - t1);
	
	document.getElementById("timeTaken").innerHTML = "Last time taken: " + timeTaken + "ms";
}

function randInt(min, max) {
	return Math.floor(Math.random() * (max - min)) + min;
}

//get the percentage of the grid that is covered in room cells
function getCoverage(gW, gH, rooms) {
	var area = 0;
	rooms.forEach(function(room) {
		area += room.area;
	});

	return area / (gW * gH);
}

//place rooms until coverage is achieved
function makeRooms() {
	attemptsLeft = maxAttempts;
	
	while (getCoverage(WIDTH, HEIGHT, allRooms) < coverageWanted) {
        //either continue until coverage is achieved or maximum iterations is reached
		if(!attemptsLeft--) {
			console.error("makeRooms exceeded maximum allowed iterations");
			break;
		}
		
		var room = randomRoom(minRoomW, maxRoomW, minRoomH, maxRoomH);
		
		if(mainGrid.canPlaceRoom(room)) {
			room.roomId = numRoomsMade++;
			allRooms.push(room);
			placeRoom(room);
		}
	}
}

//return a random room between given bounds
function randomRoom(minW, maxW, minH, maxH) {
	var randomX = randInt(0, WIDTH);
	var randomY = randInt(0, HEIGHT);
	
	var randomW = randInt(minW, maxW);
	var randomH = randInt(minH, maxH);
	
	return new Room(randomX, randomY, randomW, randomH);
}

//places a room in the grid
function placeRoom(room) {
	for(var x = room.x; x < room.x + room.w; x++) {
		for(var y = room.y; y < room.y + room.h; y++) {
			mainGrid.getCell(x, y).state = CellStates.ROOM;
		}
	}
}

//create exits so grids can tile together. This is done by adding aditional points
//to the triangulation on the edges of the grid (peripheral egress)
function createExits() {
	var exitPadding = 5;
	//create north exit
	var r = randInt(exitPadding, WIDTH - exitPadding);
	var p = new common.shapes.Point(r, 0);
	p.nodeId = delaunayPointId++;
	delaunayPoints.push( p );
	//east
	r = randInt(exitPadding, HEIGHT - exitPadding);
	p = new common.shapes.Point(WIDTH, r);
	p.nodeId = delaunayPointId++;
	delaunayPoints.push( p );
	//south
	r = randInt(exitPadding, HEIGHT - exitPadding);
	p = new common.shapes.Point(0, r);
	p.nodeId = delaunayPointId++;
	delaunayPoints.push( p );
	//west
	r = randInt(exitPadding, WIDTH - exitPadding);
	p = new common.shapes.Point(r, HEIGHT);
	p.nodeId = delaunayPointId++;
	delaunayPoints.push( p );
}

//removes rooms that are smaller than the mean room size * mean ratio
function removeRooms() {
	var meanSize = 0;
	allRooms.forEach(function(room) {
		meanSize += room.area;
	});
	meanSize /= allRooms.length;
	meanSize *= meanRatio;
	
	allRooms.forEach(function (room) {
        //this room fails the mean test
		if(room.area < meanSize) {
			for(var i = room.x; i < room.x + room.w; i++) {
				for(var j = room.y; j < room.y + room.h; j++) {
					mainGrid.getCell(i, j).state = CellStates.BLOCK_ROOM;
				}
			}
        //this room passes the test and is added for delaunay triangulation
		} else {
			room.roomId = delaunayPointId++;
			var mp = room.getMidPoint();
			var p = new common.shapes.Point(mp.x, mp.y);
			p.nodeId = room.roomId;
			delaunayPoints.push( p );
		}
	});
}

//create a minimum spanning tree
function createMST() {
	uniqueEdges = prims.getUniqueEdgesFromTriangles(delaunayTris);
	
	graph = prims.getAdjacencyMatrix(uniqueEdges, delaunayPointId);
	MSTEdges = prims.prim(graph);
}

//restores edges previously deleted with a random probablility
//prob = probability eg 0.15 = 15%
function restoreEdges(prob) {
	//edges not in the minimum spanning tree
	var otherEdges = prims.getUniqueEdges(
		prims.getUniqueEdgesFromTriangles(delaunayTris),
		MSTEdges
	);
	
	otherEdges.forEach(function(edge) {
		if(Math.random() < prob) {
			MSTEdges.push(edge);
		}
	});
}

//create manhattan style corridors
function createCorridors() {
	for(var i = 0; i < MSTEdges.length; i++) {
		
		var edge = MSTEdges[i];
		var p1 = edge.p1;
		var p2 = edge.p2;
		
		//dx negative when p2 is to the right of p1 
		var dx = p1.x - p2.x;
		//dy positive when p2 is below p1 as y = 0 is the top in javascript canvas 
		var dy = p1.y - p2.y;
		
		//start at p1 work out direction soon
		var startX = p1.x;
		var endX = p2.x
		
		var startY = p1.y;
		var endY = p2.y;
		
		for(var x = startX; x != endX; x -= 1 * Math.sign(dx)) {
			for(var t = 0; t < corridorThickness; t++) {
				var cell = mainGrid.getCell(x, startY + t);
				if(cell == undefined) continue;
				if(cell.state == CellStates.BLOCK_ROOM) {
					reactivateRoom(x, startY + t);
				}
				
				if(cell.state != CellStates.ROOM) cell.state = CellStates.CORRIDOR;
			}
		}
		
		for(var y = startY; y != endY; y -= 1 * Math.sign(dy)) {
			for(var t = 0; t < corridorThickness; t++) {
				var cell = mainGrid.getCell(endX + t, y);
				if(cell == undefined) continue;
				if(cell.state == CellStates.BLOCK_ROOM) {
					reactivateRoom(endX, y);
				}
				
				if(cell.state != CellStates.ROOM) cell.state = CellStates.CORRIDOR;
			}
		}
		
	}
}

//this is used to recursively 'turn a room back on' after it has failed the mean test
function reactivateRoom(x, y) {
	if(x < 0 || y < 0 || x > WIDTH || y > HEIGHT) return;
	var cell = mainGrid.getCell(x, y);
	if(cell == undefined) return 0;
	
	if(cell.state == CellStates.BLOCK_ROOM) {
		cell.state = CellStates.ROOM;
		
		reactivateRoom(x-1, y-1);
		reactivateRoom(x, y-1);
		reactivateRoom(x+1, y-1);
		
		reactivateRoom(x-1, y);
		reactivateRoom(x+1, y);
		
		reactivateRoom(x-1, y+1);
		reactivateRoom(x, y+1);
		reactivateRoom(x+1, y+1);
	}
}

//draw onto the JavaScript canvas
function draw() {
	ctx.fillStyle = "black";
	ctx.fillRect(0, 0, WIDTH, HEIGHT);
	
	mainGrid.cells.forEach(function (cell) {
	    if (cell.state == CellStates.ROOM) ctx.fillStyle = "white";
	    if (cell.state == CellStates.NOTHING) ctx.fillStyle = "black";
	    if (cell.state == CellStates.BLOCK_ROOM && drawOffRooms) ctx.fillStyle = "grey";
	    if (cell.state == CellStates.CORRIDOR) ctx.fillStyle = "white";
	    ctx.fillRect(cell.x, cell.y, 1, 1)
	});

	
	if (drawMST) {
	    MSTEdges.forEach(function (edge) {
	        ctx.strokeStyle = "red";
	        ctx.lineWidth = 1;
	        ctx.beginPath();
	        ctx.moveTo(edge.p1.x, edge.p1.y);
	        ctx.lineTo(edge.p2.x, edge.p2.y);
	        ctx.stroke();
	    });
	}

	
	delaunayPoints.forEach(function(p) {
		ctx.fillStyle = "red";
		ctx.strokeStyle = "red";
		drawCircle(ctx, p.x, p.y, 2, 1);
	});
	
	if (showIDs) {
	    allRooms.forEach(function (room) {
	        ctx.fillStyle = "black";
	        ctx.fillText(room.roomId, room.x + 2, room.y + 10);
	    });
	}

}

function drawCircle(ctx, cx, cy, rad, fill) {
	ctx.beginPath();
	ctx.arc(cx, cy, rad, 0, 2 * Math.PI);
	
	if(fill) ctx.fill();
	else ctx.stroke();
}

init();
draw();

//functions used to change parameters via html form
function setFormParameters() {
    document.getElementById("roomPadding").value = roomPadding;
    document.getElementById("coverageWanted").value = coverageWanted;
    document.getElementById("meanRatio").value = meanRatio;
    document.getElementById("drawRoomID").value = showIDs;
    document.getElementById("drawMST").value = drawMST;
    document.getElementById("drawOffRooms").value = drawOffRooms;
    document.getElementById("restoreChance").value = restoreEdge;

    document.getElementById("roomMinW").value = minRoomW;
    document.getElementById("roomMaxW").value = maxRoomW;
    document.getElementById("roomMinH").value = minRoomH;
    document.getElementById("roomMaxH").value = maxRoomH;
}

function getFormParameters() {
    roomPadding = parseInt(document.getElementById("roomPadding").value);
    coverageWanted = parseFloat(document.getElementById("coverageWanted").value);
    meanRatio = parseFloat(document.getElementById("meanRatio").value);
    showIDs = document.getElementById("drawRoomID").checked;
    drawMST = document.getElementById("drawMST").checked;
    drawOffRooms = document.getElementById("drawOffRooms").checked;
    restoreEdge = parseFloat(document.getElementById("restoreChance").value);

    minRoomW = parseInt(document.getElementById("roomMinW").value);
    maxRoomW = parseInt(document.getElementById("roomMaxW").value);
    minRoomH = parseInt(document.getElementById("roomMinH").value);
    maxRoomH = parseInt(document.getElementById("roomMaxH").value);
}