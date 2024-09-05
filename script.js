const boardHeight = Math.floor(0.7*window.screen.height);
const boardWidth = Math.floor(0.5*window.screen.width);

let elasticConstant = 0.8;
const baseSpringLength = 10.0;
const electrostaticConstant = 6000;

let fixedNodesInTheBoard = [];
let currentDepth = -1;
let svgBoard;
let depthMap;

const timeoutBetweenLayers = 1000;

function distance(node1, node2) {
    deltaX = node1.x - node2.x;
    deltaY = node1.y - node2.y;
    return Math.sqrt(deltaX*deltaX + deltaY*deltaY);
}

function computeSpringForce(node) {
    const dParent = distance(node, node.parent);
    const springTerm = elasticConstant*(baseSpringLength-dParent);
    const deltaX = node.x - node.parent.x;
    const deltaY = node.y - node.parent.y;
    const springForceX = springTerm*deltaX/dParent;
    const springForceY = springTerm*deltaY/dParent;
    return {x: springForceX, y: springForceY};
}

function computeElectroForce(node, nodesOnBoard) {
    let electroForceX = 0.0;
    let electroForceY = 0.0;
    nodesOnBoard.forEach(function(otherNode) {
        if (otherNode.id !== node.id) {
            const d = distance(node, otherNode);
            const multiplier = 1.0 + 2*node.children.length + 2*otherNode.children.length;
            const electroTerm = multiplier*electrostaticConstant/(d*d);
            const deltaX = node.x - otherNode.x;
            const deltaY = node.y - otherNode.y;
            electroForceX += electroTerm*(deltaX/d);
            electroForceY += electroTerm*(deltaY/d);
        }
    });
    return {x: electroForceX, y: electroForceY};
}

let useCenterRepulsiveForce = true;
let scale = 40;

function updateNodes() {
    if (currentDepth === 0) return true;
    let totalForce = 0.0;
    const nodesToUpdate = depthMap.get(currentDepth);
    const nodesOnBoard = fixedNodesInTheBoard.concat(nodesToUpdate);
    nodesToUpdate.forEach(function(node) {
        const springForce = computeSpringForce(node);
        const electroForce = computeElectroForce(node, nodesOnBoard);
        const centerRepulsiveForce = {x: (node.x - depthMap.get(0)[0].x),
                                      y: (node.y - depthMap.get(0)[0].y)};
        normalizeVector(centerRepulsiveForce);
        if (!useCenterRepulsiveForce) scale = 0;
        const totalForceX = springForce.x + electroForce.x + centerRepulsiveForce.x*scale;
        const totalForceY = springForce.y + electroForce.y + centerRepulsiveForce.y*scale;
        node.x += totalForceX;
        node.y += totalForceY;
        totalForce += (Math.abs(totalForceX) + Math.abs(totalForceY));
    });
    return totalForce < 0.1;
}

function drawLinks(nodesToDraw) {
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
        .transition().duration(750)
        .attr("d", function(node) {
            return `M ${node.parent.x},${node.parent.y} L ${node.x},${node.y}`
        });
}

function drawNodesOfCurrentDepth() {
    let nodesToDraw = depthMap.get(currentDepth);
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
    let iterations = 0;
    while (!didNodesConverge) {
        didNodesConverge = updateNodes();
        iterations += 1;
        if (iterations === 2000) break;
    }

    svgBoard.selectAll(".newCircle")
        .data(nodesToDraw)
        .transition().duration(500)
        .attr("cx", node => node.x)
        .attr("cy", node => node.y)
        .attr("class", "fixedCircle");

    if (currentDepth !== 0) drawLinks(nodesToDraw);

    nodesToDraw.forEach(function(node) {
        node.isFixed = true;
    })
}

d3.json("data100.json")
    .then(function(data) {
        svgBoard = d3.select("#svg-board");
        svgBoard.attr("width", boardWidth);
        svgBoard.attr("height", boardHeight);
        const root = computeTree(data);
        depthMap = createDepthMap(root);
        // assingLevels(depthMap);
        assignRandomInitialPositions(depthMap);
        // calculateSubtreeSizes(root);
    })
    .catch(error => console.log(error));

function drawNextLayer() {
    currentDepth += 1;
    drawNodesOfCurrentDepth();
    fixedNodesInTheBoard = fixedNodesInTheBoard.concat(depthMap.get(currentDepth));
}

function drawTree() {
    for (i = 0; i < depthMap.size; i++)
        setTimeout(() => {
            drawNextLayer(i);
        }, i*timeoutBetweenLayers);
    document.getElementById('draw-tree').hidden = true;
    document.getElementById('redraw-tree').hidden = false;
}

function redrawTree() {
    svgBoard.selectAll("*").remove();
    fixedNodesInTheBoard = [];
    currentDepth = -1;
    assignRandomInitialPositions(depthMap);
    drawTree();
}

function normalizeVector(vector) {
    const x = vector.x;
    const y = vector.y;
    const magnitude = Math.sqrt(x*x + y*y);
    if (magnitude === 0)
        return vector;
    vector.x /= magnitude;
    vector.y /= magnitude;
}

const checkboxUseCenterRepulsiveForce = document.getElementById('center-repulsive-force-box');
const repulsiveForceMultiplierInput = document.getElementById('center-repulsive-force-multiplier');

repulsiveForceMultiplierInput.value = scale;

checkboxUseCenterRepulsiveForce.addEventListener('change', function(event) {
    if (event.target.checked) {
        useCenterRepulsiveForce = true;
        repulsiveForceMultiplierInput.readOnly = false;
    }
    else {
        useCenterRepulsiveForce = false;
        repulsiveForceMultiplierInput.readOnly = true;
    }
});

repulsiveForceMultiplierInput.addEventListener('input', function(event) {
    if (event.target.value < 0) event.target.value *= -1;
    scale = event.target.value;
});

const sliderElasticConstant = document.getElementById('slider-elastic-constant');
const sliderElasticConstantValue = document.getElementById('slider-elastic-constant-value');

sliderElasticConstant.value = elasticConstant;
sliderElasticConstantValue.textContent = elasticConstant;

sliderElasticConstant.addEventListener('input', function(event) {
    sliderElasticConstantValue.textContent = event.target.value;
    elasticConstant = event.target.value;
});