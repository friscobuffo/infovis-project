const boardHeight = Math.floor(0.8*window.screen.height);
const boardWidth = Math.floor(0.8*window.screen.width);

function distance(node1, node2) {
    deltaX = node1.x - node2.x;
    deltaY = node1.y - node2.y;
    return Math.sqrt(deltaX*deltaX + deltaY*deltaY);
}

const elasticConstant = 0.5;
const baseSpringLength = 60.0;
const electrostaticConstant = 4000;

function computeSpringForce(node) {
    const dParent = distance(node, node.parent);
    const springTerm = elasticConstant*(baseSpringLength-dParent);
    const deltaX = node.x - node.parent.x;
    const deltaY = node.y - node.parent.y;
    const springForceX = springTerm*deltaX/dParent;
    const springForceY = springTerm*deltaY/dParent;
    return [springForceX, springForceY];
}

function computeElectroForce(node, nodesOnBoard) {
    let electroForceX = 0.0;
    let electroForceY = 0.0;
    nodesOnBoard.forEach(function(otherNode) {
        if (otherNode.id !== node.id) {
            const d = distance(node, otherNode);
            const electroTerm = electrostaticConstant/(d*d);
            const deltaX = node.x - otherNode.x;
            const deltaY = node.y - otherNode.y;
            electroForceX += electroTerm*(deltaX/d);
            electroForceY += electroTerm*(deltaY/d);
        }
    });
    return [electroForceX, electroForceY];
}

function updateNodes(fixedNodesInTheBoard, depthMap, depth, svgBoard) {
    if (depth === 0) return true;
    let totalForce = 0.0;
    const nodesToUpdate = depthMap.get(depth);
    const nodesOnBoard = fixedNodesInTheBoard.concat(nodesToUpdate);
    nodesToUpdate.forEach(function(node) {
        const springForce = computeSpringForce(node);
        const electroForce = computeElectroForce(node, nodesOnBoard);
        const totalForceX = springForce[0] + electroForce[0];
        const totalForceY = springForce[1] + electroForce[1];

        node.x += totalForceX;
        node.y += totalForceY;
        totalForce += (Math.abs(totalForceX) + Math.abs(totalForceY));
    });

    return totalForce < 0.01;
}

function drawLinks(nodesToDraw, svgBoard) {
    svgBoard.selectAll(".newLinks")
        .data(nodesToDraw)
        .enter()
        .append("path")
        .attr("stroke-width", 5)
        .attr("class", "newLinks")
        .attr("stroke", "black")
        .attr("d", function(node) {
            return `M ${node.parent.x},${node.parent.y} L ${node.parent.x},${node.parent.y}`
        });

    svgBoard.selectAll(".newLinks")
        .data(nodesToDraw)
        .attr("class", "links")
        .transition()
        .duration(1500)
        .attr("d", function(node) {
            return `M ${node.parent.x},${node.parent.y} L ${node.x},${node.y}`
        });
}

function drawNodesOfDepth(fixedNodesInTheBoard, depthMap, depth, svgBoard) {
    let nodesToDraw = depthMap.get(depth);
    svgBoard.selectAll(".newCircle")
        .data(nodesToDraw)
        .enter()
        .append("circle")
        .attr("fill", `hsl(50, 100%, 50%)`)
        .attr("stroke", "black")
        .attr("stroke-width", 10)
        .attr("r", 5)
        .attr("cx", node => node.x)
        .attr("cy", node => node.y)
        .attr("class", "newCircle");

    let didNodesConverge = false;
    while (!didNodesConverge)
        didNodesConverge = updateNodes(fixedNodesInTheBoard, depthMap, depth, svgBoard);

    svgBoard.selectAll(".newCircle")
        .data(depthMap.get(depth))
        .transition()
        .duration(750)
        .attr("cx", node => node.x)
        .attr("cy", node => node.y)
        .attr("class", "fixedCircle");

    if (depth !== 0) drawLinks(nodesToDraw, svgBoard);
}

function assignRandomInitialPositions(depthMap) {
    depthMap.get(0)[0].x = boardWidth / 2;
    depthMap.get(0)[0].y = boardHeight / 2;

    const xRandomScale = d3.scaleLinear();
    const yRandomScale = d3.scaleLinear();
    xRandomScale.domain([0, 1]);
    yRandomScale.domain([0, 1]);
    xRandomScale.range([0, boardWidth]);
    yRandomScale.range([boardHeight, 0]);

    for (i = 1; i < depthMap.size; i++) {
        depthMap.get(i).forEach(function (node) {
            node.x = parseFloat(xRandomScale(Math.random()));
            node.y = parseFloat(yRandomScale(Math.random()));
        });
    }
}

let fixedNodesInTheBoard = [];
let currentDepth = -1;
let svg;
let depthMapGlobal;

d3.json("data.json")
    .then(function(data) {
        const svgBoard = d3.select("#svg-board");
        svg = svgBoard;
        svgBoard.attr("width", boardWidth);
        svgBoard.attr("height", boardHeight);
        let root = computeTree(data);
        const depthMap = createDepthMap(root);
        depthMapGlobal = depthMap;
        assingLevels(depthMap);
        assignRandomInitialPositions(depthMap);
        drawNextLayer();
    })
    .catch(error => console.log(error));

function drawNextLayer() {
    currentDepth = currentDepth + 1;
    drawNodesOfDepth(fixedNodesInTheBoard, depthMapGlobal, currentDepth, svg);
    fixedNodesInTheBoard = fixedNodesInTheBoard.concat(depthMapGlobal.get(currentDepth));
    if (currentDepth === depthMapGlobal.size-1)
        document.getElementById('draw-next-layer').remove();
}