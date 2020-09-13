//common functions and classes
common = (function() {
    //edge class, contains 2 points
	class Edge {
		constructor(p1, p2) {
			this.p1 = p1;
			this.p2 = p2;
			
			this.center = new Point((p1.x + p2.x) / 2, (p1.y + p2.y) / 2);
			this.length = Math.sqrt( (p1.x - p2.x)**2 +  (p1.y - p2.y)**2);
		}
	}
	
    //triangle class, contains 3 points given to constructor as a list
	class Triangle {
		constructor(points) {
			this.points = points;
		}
	}
	
    //point class
	class Point {
		constructor(x, y) {
			this.x = x;
			this.y = y;
		}
	}
	
    //returns the inverse of an edge, mainly used for comparing edges more easily
	edgeInvert = function(e1) {
		return new Edge(e1.p2, e1.p1);
	}
	
	edgeEquals = function(e1, e2) {
		e2i = edgeInvert(e2);
		return ((e1.p1 == e2.p1 && e1.p2 == e2.p2) || (e1.p1 == e2i.p1 && e1.p2 == e2i.p2));
	}
	
    //expose classes and functions that are needed
	return {
		shapes: {
			Triangle: Triangle,
			Edge: Edge,
			Point: Point
		},
		
		functions: {
			edgeEquals: edgeEquals
		}
	}
})();