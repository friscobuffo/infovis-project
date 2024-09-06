const boardHeight = Math.floor(0.8*window.screen.height);
const boardWidth = Math.floor(0.6*window.screen.width);

let elasticConstant = 0.8;
let baseSpringLength = 10.0;
let electrostaticConstant = 6000;

let fixedNodesInTheBoard = [];
let currentDepth = -1;
let svgBoard;
let drawingArea;
let depthMap;

let timeoutBetweenLayers = 1000;
let nodesAnimationDuration = 500;
let linksAnimationDuration = 750;

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
let centerRepulsiveForceValue = 40;

function updateNodes() {
    if (currentDepth === 0) return true;
    let totalForce = 0.0;
    const nodesToUpdate = depthMap.get(currentDepth);
    const nodesOnBoard = fixedNodesInTheBoard.concat(nodesToUpdate);
    nodesToUpdate.forEach(function(node) {
        const springForce = computeSpringForce(node);
        const electroForce = computeElectroForce(node, nodesOnBoard);
        const centerRepulsiveDirection = {x: (node.x - depthMap.get(0)[0].x),
                                          y: (node.y - depthMap.get(0)[0].y)};
        normalizeVector(centerRepulsiveDirection);
        if (!useCenterRepulsiveForce) centerRepulsiveForceValue = 0;
        const totalForceX = springForce.x + electroForce.x + centerRepulsiveDirection.x*centerRepulsiveForceValue;
        const totalForceY = springForce.y + electroForce.y + centerRepulsiveDirection.y*centerRepulsiveForceValue;
        node.x += totalForceX;
        node.y += totalForceY;
        totalForce += (Math.abs(totalForceX) + Math.abs(totalForceY));
    });
    return totalForce < 0.1;
}

function drawLinks(nodesToDraw) {
    drawingArea.selectAll(".newLinks")
        .data(nodesToDraw)
        .enter()
        .append("path")
        .attr("stroke-width", 5)
        .attr("class", "newLinks")
        .attr("stroke", "black")
        .attr("d", function(node) {
            return `M ${node.parent.x},${node.parent.y} L ${node.parent.x},${node.parent.y}`
        });

    drawingArea.selectAll(".newLinks")
        .data(nodesToDraw)
        .attr("class", "links")
        .transition().duration(linksAnimationDuration)
        .attr("d", function(node) {
            return `M ${node.parent.x},${node.parent.y} L ${node.x},${node.y}`
        });
}

function drawNodesOfCurrentDepth() {
    let nodesToDraw = depthMap.get(currentDepth);
    drawingArea.selectAll(".newCircle")
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

    drawingArea.selectAll(".newCircle")
        .data(nodesToDraw)
        .transition().duration(nodesAnimationDuration)
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
        drawingArea = svgBoard.append("g");
        const root = computeTree(data);
        depthMap = createDepthMap(root);
        // assingLevels(depthMap);
        assignRandomInitialPositions(depthMap);
        // computeSubtreeSizes(root);

        var zoom = d3.zoom()
        zoom.scaleExtent([0.1, 2])
            .on("zoom", function (event) {
                drawingArea.attr("transform", event.transform);
            });
        svgBoard.call(zoom);
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
    const root = depthMap.get(0)[0];
    setTimeout(() => {
        displayNumberOfCollisions(countCollisions(root));
    }, depthMap.size*timeoutBetweenLayers);
}

function redrawTree() {
    drawingArea.selectAll("*").remove();
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
const centerRepulsiveForceInput = document.getElementById('center-repulsive-force');
centerRepulsiveForceInput.value = centerRepulsiveForceValue;
checkboxUseCenterRepulsiveForce.addEventListener('change', function(event) {
    if (event.target.checked) {
        useCenterRepulsiveForce = true;
        centerRepulsiveForceInput.readOnly = false;
    }
    else {
        useCenterRepulsiveForce = false;
        centerRepulsiveForceInput.readOnly = true;
    }
});
centerRepulsiveForceInput.addEventListener('input', function(event) {
    if (event.target.value < 0) event.target.value *= -1;
    centerRepulsiveForceValue = event.target.value;
});

const sliderElasticConstant = document.getElementById('slider-elastic-constant');
const sliderElasticConstantValue = document.getElementById('slider-elastic-constant-value');
sliderElasticConstant.value = elasticConstant;
sliderElasticConstantValue.textContent = elasticConstant;
sliderElasticConstant.addEventListener('input', function(event) {
    sliderElasticConstantValue.textContent = event.target.value;
    elasticConstant = event.target.value;
});

const electroStaticConstantInput = document.getElementById('electro-static-constant');
electroStaticConstantInput.value = electrostaticConstant;
electroStaticConstantInput.addEventListener('input', function(event) {
    if (event.target.value < 0) event.target.value *= -1;
    electrostaticConstant = event.target.value;
});

const baseSprintLengthInput = document.getElementById('base-spring-length');
baseSprintLengthInput.value = baseSpringLength;
baseSprintLengthInput.addEventListener('input', function(event) {
    if (event.target.value < 0) event.target.value *= -1;
    baseSpringLength = event.target.value;
});

const timeBetweenLayersInput = document.getElementById('time-between-layers');
timeBetweenLayersInput.value = timeoutBetweenLayers;
timeBetweenLayersInput.addEventListener('input', function(event) {
    if (event.target.value < 0) event.target.value *= -1;
    timeoutBetweenLayers = event.target.value;
});

const nodesAnimationDurationInput = document.getElementById('nodes-animation-duration');
nodesAnimationDurationInput.value = nodesAnimationDuration;
nodesAnimationDurationInput.addEventListener('input', function(event) {
    if (event.target.value < 0) event.target.value *= -1;
    nodesAnimationDuration = event.target.value;
});

const linksAnimationDurationInput = document.getElementById('links-animation-duration');
linksAnimationDurationInput.value = linksAnimationDuration;
linksAnimationDurationInput.addEventListener('input', function(event) {
    if (event.target.value < 0) event.target.value *= -1;
    linksAnimationDuration = event.target.value;
});

function displayNumberOfCollisions(collisions) {
    const numberOfCollisionsSpan = document.getElementById('number-collisions');
    numberOfCollisionsSpan.textContent = `Number Of Collisions: ${collisions}`;
}