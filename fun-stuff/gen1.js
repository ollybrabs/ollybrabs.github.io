var w = 100;
var h = 100;

CELL_NOTHING	= 0x000000;
CELL_BLOCKED 	= 0x000001;
CELL_EMPTY 		= 0x000002;
CELL_ROOM		= 0x000004;
CELL_DISABLEROOM= 0x000008;

CELL_ROOMEDGE	= 0x000010;
CELL_DOOR		= 0x000020;

BLOCK_ROOM		= CELL_BLOCKED | CELL_ROOM;


room_mindimension = 5;
room_maxdimension = 20;

class Grid {
	constructor(sizeX, sizeY) {
		this.x = sizeX;
		this.y = sizeY;
		
		this.cells = [];
		
		for(var i = 0; i < sizeX; i++) {
			for(var j = 0; j < sizeY; j++) {
				this.cells[i + j * sizeY] = CELL_NOTHING;
				this.cells[i + j * sizeY] |= CELL_EMPTY;
			}
		}
	}
}

class Room {
	constructor(width, height, gridX, gridY) {
		this.w = width;
		this.h = height;
		
		this.x = gridX;
		this.y = gridY;
		
		this.area = this.w * this.h;
	}
}

var cv = document.getElementById("cv");
var ctx = cv.getContext("2d");

var g = new Grid(w, h);
//applyCircleMask(g);
var rooms = [];

placeRooms(g);
eliminateRooms(g, rooms);

function draw() {
	ctx.fillStyle = "black";
	ctx.fillRect(0, 0, w, h);
	
	ctx.strokeStyle = "white";
	ctx.strokeWidth = 2;
	
	for(var i = 0; i < w; i++) {
		for(var j = 0; j < h; j++) {
			if(g.cells[i + j * w] & CELL_EMPTY) 	ctx.fillStyle = "green";
			if(g.cells[i + j * w] & CELL_DISABLEROOM)ctx.fillStyle = "yellow";
			if(g.cells[i + j * w] & CELL_BLOCKED) 	ctx.fillStyle = "red";
			if(g.cells[i + j * w] & CELL_ROOM) 		ctx.fillStyle = "white";
			if(g.cells[i + j * w] & CELL_ROOMEDGE) 	ctx.fillStyle = "black";
			if(g.cells[i + j * w] & CELL_BLOCKED
				&& g.cells[i + j * w] & CELL_ROOM) 	ctx.fillStyle = "grey";
			
			ctx.fillRect(i, j, 1, 1);
		}
	}
}

function applyCircleMask(grid) {
	cc = w/2;
	cr = h/2;
	
	for(var i = 0; i < w; i++) {
		for(var j = 0; j < h; j++) {
			if(Math.sqrt((i-cc)**2 + (j-cr)**2) > cr) g.cells[i + j * w] = CELL_BLOCKED;
		}
	}
}

function placeRooms(grid) {
	for(var i = 0; i < w; i+=2) {
		for(var j = 0; j < h; j+=2) {
			room = makeRoom(grid, i, j);
		}
	}
	
	//give up after this many failed attempts
	/*var timeoutThreshold = 1000;
	var currentTries = 0;
	
	var nRooms = 200;
	
	for (var _r = 1; _r <= nRooms; _r++) {
		console.info(_r);
		
		rx = Math.floor(Math.random() * w) + 1;
		ry = Math.floor(Math.random() * h) + 1;
		
		rm = makeRoom(g, rx, ry);
		
		if(rm == -1) {
			_r = (_r-1 < 1) ? 1 : _r-1;
			if(currentTries++ >= timeoutThreshold) {
				console.error("Maximum room creation steps reached");
				break;
			}
		}
	}*/
}

var roomPadding = 3;

function makeRoom(grid, x, y) {
	roomWidth = Math.floor(Math.random() * room_maxdimension) + room_mindimension;
	roomHeight = Math.floor(Math.random() * room_maxdimension) + room_mindimension;
	
	if(x + roomWidth > w || y + roomHeight > h) return -1;
	
	for(var i = x; i < x + roomWidth; i++) {
		for(var j = y; j < y + roomHeight; j++) {
			if(grid.cells[i + j * w] & CELL_BLOCKED) return -1;
			if(grid.cells[i + j * w] & CELL_ROOM) return -1;
			if(g.cells[i + j * w] & CELL_BLOCKED
				&& g.cells[i + j * w] & CELL_ROOM) return -1;
		}
	}
	
	console.info("Room pass with size " + roomWidth + ", " + roomHeight)
	for(var i = x - roomPadding; i < x + roomWidth + roomPadding; i++) {
		if(x <= 0 || x > w) continue;
		for(var j = y - roomPadding; j < y + roomHeight + roomPadding; j++) {
			if(y <= 0 || y > h) continue;
			grid.cells[i + j * w] = BLOCK_ROOM;
		}
	}
	
	for(var i = x; i < x + roomWidth; i++) {
		for(var j = y; j < y + roomHeight; j++) {
			grid.cells[i + j * w] = CELL_ROOM;
		}
	}
	
	for(var i = x; i < x + roomWidth; i++) {
		//grid.cells[i + y * w] = CELL_ROOMEDGE;
		//grid.cells[i + (y + roomHeight) * w] = CELL_ROOMEDGE;
	}
	for(var j = y; j < y + roomHeight; j++) {
		//grid.cells[x + j * w] = CELL_ROOMEDGE;
		//grid.cells[(x + roomWidth) + j * w] = CELL_ROOMEDGE;
	}
	
	rooms.push(new Room(roomWidth, roomHeight, x, y));
}

function eliminateRooms(grid, rooms) {
	mean = 0;
	for(i in rooms) {
		rm = rooms[i];
		mean += rm.area;
	}
	mean /= rooms.length;
	
	for(i in rooms) {
		rm = rooms[i];
		if(rm.area < mean) {
			console.info("Room fails mean test");
			
			for(var k = rm.x - roomPadding; k < rm.x + rm.w + roomPadding; k++) {
				if(k <= 0 || k > w) continue;
				for(var j = rm.y - roomPadding; j < rm.y + rm.h + roomPadding; j++) {
					if(j <= 0 || j > h) continue;
					grid.cells[k + j * w] = CELL_DISABLEROOM;
				}
			}
		}
	}
}

setInterval(draw, 1000/2);