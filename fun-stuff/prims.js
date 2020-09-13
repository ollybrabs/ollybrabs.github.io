//prim's algorithm - used to find minimum spanning trees (MST) from a list of nodes
prims = (function () {
	getUniqueEdges = function(edges) {
		//remove duplicates
		var uniqueEdges = [];
		for(var i = 0; i < edges.length; i++) {
			var isUnique = true;
			for(var u = 0; u < uniqueEdges.length; u++) {
				if(edgeEquals(uniqueEdges[u], edges[i])) {
					isUnique = false;
					break;
				}
			}
			if(isUnique) uniqueEdges.push(edges[i]);
		}
		
		return uniqueEdges;
	}
	
	//gather edges to create a graph
	getUniqueEdgesFromTriangles = function(tris) {
		if(tris == null) return [];
		
		var myEdges = [];
		
		tris.forEach(function(tri) {
			var p1 = tri.points[0];
			var p2 = tri.points[1];
			var p3 = tri.points[2];
			
			myEdges.push(new common.shapes.Edge(p1, p2));
			myEdges.push(new common.shapes.Edge(p1, p3));
			myEdges.push(new common.shapes.Edge(p2, p3));
		});
		
		return getUniqueEdges(myEdges);
	}
	
	//get an adjacency matrix for edges where matrix[i][j]
	//refers to the length of the edge i j if such a link exists
	getAdjacencyMatrix = function(edges, maxNodeId) {
		var matrix = new Array(maxNodeId);
		for(var x = 0; x < maxNodeId; x++) {
			matrix[x] = new Array(maxNodeId);
		}
		
		edges.forEach(function(edge) {
			var p1Id = edge.p1.nodeId;
			var p2Id = edge.p2.nodeId;
			
			if(matrix[p1Id] == undefined) matrix[p1Id] = [];
			if(matrix[p2Id] == undefined) matrix[p2Id] = [];
			
			matrix[p1Id][p2Id] = edge.length;
			matrix[p2Id][p1Id] = edge.length;
		});
		
		return matrix;
	}
	
	getPointById = function(edges, id) {
		for(var i = 0; i < edges.length; i++) {
			var edge = edges[i];
			var p1 = edge.p1;
			var p2 = edge.p2;
			
			if(p1.nodeId == id) return p1;
			if(p2.nodeId == id) return p2;
		}
	}
	
	/* PRIM'S ALGORITHM
	 * graph - an adjacency matrix of weighted edges between vertices
     * returns a list of edges that make up the MST
	 */
	prim = function(graph) {
		if(graph == null) return [];
		
		var treeEdges = [];
		
		var vertsVisited = [];
		var initialVert = Math.floor(Math.random() * graph.length);

		//choose an initial vertex randomly from the graph
		vertsVisited.push( initialVert );
		
		var startV = initialVert;
		while(vertsVisited.length != graph.length) {
			var shortestLength = Number.POSITIVE_INFINITY;
			var endV = null;
			
			vertsVisited.forEach(function(v1) {
				var myLinks = graph[v1];
				
				myLinks.forEach(function(edgeLength, v2) {
					if(vertsVisited.indexOf(v2) != -1) return;
					
					if(edgeLength < shortestLength) {
						shortestLength = edgeLength;
						startV = v1;
						endV = v2;
					}
				});
			});
			
			vertsVisited.push(endV);
			
			treeEdges.push(new common.shapes.Edge(getPointById(uniqueEdges, startV), getPointById(uniqueEdges, endV)));
		}
		
		return treeEdges;
	}

    //expose functions that are needed in the main program
	return {
		getUniqueEdges: getUniqueEdges,
		getUniqueEdgesFromTriangles: getUniqueEdgesFromTriangles,
		getAdjacencyMatrix: getAdjacencyMatrix,
		prim: prim
	}
}());