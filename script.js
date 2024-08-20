const boardHeight = Math.floor(0.8*window.screen.height);
const boardWidth = Math.floor(0.8*window.screen.width);

function distance(node1, node2) {
    deltaX = node1.x - node2.x;
    deltaY = node1.y - node2.y;
    return Math.sqrt(deltaX*deltaX + deltaY*deltaY);
}

const elasticConstant = 3.0;
const baseSpringLength = 2.0;
const electrostaticConstant = 0.1;

function updateNodes(fixedNodesInTheBoard, depthMap, depth, svgBoard) {
    if (depth === 0) return true;
    let nodesToUpdate = depthMap.get(depth);
    nodesToUpdate.forEach(function(node) {
        const dParent = distance(node, node.parent);
        const springTerm = elasticConstant*(baseSpringLength-dParent);
        console.log("distance from parent", dParent);
        console.log("spring term:", springTerm);

        const deltaX = node.parent.x-node.x;
        const deltaY = node.parent.y-node.y;
        const springForceX = springTerm*deltaX/dParent;
        const springForceY = springTerm*deltaY/dParent;
        console.log("spring forces: ", springForceX, springForceY);

        let electroForceX = 0.0;
        let electroForceY = 0.0;
        fixedNodesInTheBoard.concat(nodesToUpdate).forEach(function(otherNode) {
            if (otherNode.id !== node.id) {
                const d = distance(node, otherNode);
                const electroTerm = electrostaticConstant/(d*d);
                const deltaX = node.x - otherNode.x;
                const deltaY = node.y - otherNode.y;
                electroForceX = electroForceX + electroTerm*(deltaX/d);
                electroForceY = electroForceY + electroTerm*(deltaY/d);
            }
        });
        console.log("electro forces:", electroForceX, electroForceY);
        const totalForceX = springForceX + electroForceX;
        const totalForceY = springForceY + electroForceY;
        node.x = node.x + totalForceX;
        node.y = node.y + totalForceY;
    });

    svgBoard.selectAll(".newCircle")
        .data(nodesToUpdate)
        .transition().duration(750)
        .attr("cx", node => node.x)
        .attr("cy", node => node.y);

    return true;
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

    // let didNodesConverge = false;
    // while (!didNodesConverge)
    for (i = 0; i < 3; i++)
        didNodesConverge = updateNodes(fixedNodesInTheBoard, depthMap, depth, svgBoard);

    svgBoard.selectAll(".newCircle")
        .attr("class", "fixedCircle");
}

function assignRandomInitialPositions(depthMap) {
    depthMap.get(0)[0].x = boardWidth / 2;
    depthMap.get(0)[0].y = boardHeight / 2;

    let xScale = d3.scaleLinear();
    let yScale = d3.scaleLinear();
    xScale.domain([0, 1]);
    yScale.domain([0, 1]);
    xScale.range([0, boardWidth]);
    yScale.range([boardHeight, 0]);

    for (i = 1; i < depthMap.size; i++) {
        depthMap.get(i).forEach(function (node) {
            node.x = parseFloat(xScale(Math.random()));
            node.y = parseFloat(yScale(Math.random()));
        });
    }
}

function drawTree(depthMap, svgBoard) {
    assignRandomInitialPositions(depthMap);
    fixedNodesInTheBoard = [];
    for (let i = 0; i < depthMap.size; i++) {
        drawNodesOfDepth(fixedNodesInTheBoard, depthMap, i, svgBoard);
        fixedNodesInTheBoard = fixedNodesInTheBoard.concat(depthMap.get(i));
    }
}

d3.json("data.json")
    .then(function(data) {
        const svgBoard = d3.select("#svg-board");
        svgBoard.attr("width", boardWidth);
        svgBoard.attr("height", boardHeight);
        let root = computeTree(data);
        const depthMap = createDepthMap(root);
        assingLevels(depthMap);
        drawTree(depthMap, svgBoard);
    })
    .catch(error => console.log(error));