//delaunay triangulation
delaunay = (function() {
    //get the circumcircle for any given triangle
    //returns the center point and radius
	getCircumCircle = function(tri) {
		p1 = tri.points[0];
		p2 = tri.points[1];
		p3 = tri.points[2];
		
		yDeltaA = (p2.y - p1.y);
		xDeltaA = (p2.x - p1.x);
		
		yDeltaB = (p3.y - p2.y);
		xDeltaB = (p3.x - p2.x);
		
		ma = yDeltaA / xDeltaA;
		mb = yDeltaB / xDeltaB;
		
		cx = 0;
		cy = 0;
		
		ABMidX = (p2.x + p1.x) / 2;
		BCMidX = (p3.x + p2.x) / 2;
		
		ABMidY = (p2.y + p1.y) / 2;
		BCMidY = (p3.y + p2.y) / 2;
		
		if(yDeltaA == 0) {
			cx = ABMidX;
			if(xDeltaB == 0) cy = BCMidY;
			else cy = BCMidY + (BCMidX-cx)/mb;
		} else if (yDeltaB == 0) {
			cx = BCMidX;
			if(xDeltaA == 0) cy = ABMidY;
			else cy = ABMidY + (ABMidX-cx)/ma;
		} else if(xDeltaA == 0) {
			cy = ABMidY;
			cx = mb * (BCMidY-cy) + BCMidX;
		} else if(xDeltaB == 0) {
			cy = BCMidY;
			cx = ma * (ABMidY-cy) + ABMidX;
		} else {
			cx = (ma*mb*(ABMidY-BCMidY) - ma*BCMidX + mb*ABMidX)/(mb-ma);
			cy = ABMidY - (cx - ABMidX)/ma;
		}
		
		r = Math.sqrt((cy - p1.y)**2 + (cx - p1.x)**2);
		
		return {'cx':cx, 'cy':cy, 'r':r};
	}
	
    //returns true if vert v falls in circle c
	vertInCircle = function(v, c) {
		dy = c.cy - v.y;
		dx = c.cx - v.x;
		
		return Math.sqrt(dy**2 + dx**2) < c.r;
	}
	
    //creates a triangle that contains all verts given
	createSuperTriangle = function(vertsIn) {
		xmin = Number.POSITIVE_INFINITY;
		xmax = Number.NEGATIVE_INFINITY;
		ymin = Number.POSITIVE_INFINITY;
		ymax = Number.NEGATIVE_INFINITY;
		
		for(vi in vertsIn) {
			v = vertsIn[vi];
			
			if(v.x < xmin) xmin = v.x;
			if(v.x > xmax) xmax = v.x;
			if(v.y < ymin) ymin = v.y;
			if(v.y > ymax) ymax = v.y;
		}
		
		deltax = (xmax - xmin) * 10;
		deltay = (ymax - ymin) * 10;
		deltamax = Math.max(deltax, deltay);
		
		return new common.shapes.Triangle([
			new common.shapes.Point(xmin - deltax, ymin - deltay * 3),
			new common.shapes.Point(xmin - deltax, ymax + deltay),
			new common.shapes.Point(xmax + deltax * 3, ymax + deltay)
		]);
	}
	
	addVertex = function(vertex, tris) {
		edgeBuffer = [];
		
		//check if this vertex is inside this triangles circumcircle
		tris = tris.filter(function(tri) {
			//get the circumcircle for this triangle
			c = getCircumCircle(tri);
			
			if(vertInCircle(vertex, c)) {
				edgeBuffer.push(new common.shapes.Edge(
					tri.points[0],
					tri.points[1]
				));
				edgeBuffer.push(new common.shapes.Edge(
					tri.points[0],
					tri.points[2]
				));
				edgeBuffer.push(new common.shapes.Edge(
					tri.points[1],
					tri.points[2]
				));
				
				return false;
			}
			return true;
		});
		
		//remove double edges
		var uEdges = [];
		for(i1 in edgeBuffer) {
			var isUnique = true;
			for(i2 in edgeBuffer) {
				if(i1 == i2) continue;
				
				if(common.functions.edgeEquals(edgeBuffer[i1], edgeBuffer[i2])) {
					isUnique = false;
					break;
				}
			}
			
			if(isUnique) uEdges.push(edgeBuffer[i1]);
		}
		
		for(e in uEdges) {
			edge = uEdges[e];
			p1 = edge.p1;
			p2 = edge.p2;
			
			t = new common.shapes.Triangle([p1, p2, vertex]);
			tris.push(t);
		}
		
		return tris;
	}
	
	triangulate = function(verts) {
		var t1 = performance.now();
		
		if(verts.length < 3) return;
		
		allTris = [];
		
		superTri = createSuperTriangle(verts);
		allTris.push(superTri);
		
		sp1 = superTri.points[0];
		sp2 = superTri.points[1];
		sp3 = superTri.points[2];
		
		for(v in verts) {
			vert = verts[v];
			allTris = addVertex(vert, allTris);
		}

		allTris = allTris.filter(function(tri) {
			return !(tri.points[0] == superTri.points[0] || tri.points[0] == superTri.points[1] || tri.points[0] == superTri.points[2] ||
					tri.points[1] == superTri.points[0] || tri.points[1] == superTri.points[1] || tri.points[1] == superTri.points[2] ||
					tri.points[2] == superTri.points[0] || tri.points[2] == superTri.points[1] || tri.points[2] == superTri.points[2])
		});
		
		var t2 = performance.now();
        //debug performance
		console.info("delaunay.triangulate completed in " + (t2 - t1) + "ms");
	
		return allTris;
	}
	
    //only expose the triangulate function
	return {
		triangulate: triangulate
	}
}());