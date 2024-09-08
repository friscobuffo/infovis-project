const boardHeight = Math.floor(0.8*window.screen.height);
const boardWidth = Math.floor(0.6*window.screen.width);

let svgBoard;
let drawingArea;
let depthMap;
let currentDrawer;

let nodesAnimationDuration = 500;
let linksAnimationDuration = 750;

d3.json("data100.json")
    .then(function(data) {
        svgBoard = d3.select("#svg-board");
        svgBoard.attr("width", boardWidth);
        svgBoard.attr("height", boardHeight);
        drawingArea = svgBoard.append("g");
        const root = computeTree(data);
        depthMap = createDepthMap(root);
        // assingLevels(depthMap);
        // computeSubtreeSizes(root);
        currentDrawer = new ForceDirectedDrawer(root, depthMap, drawingArea);
        var zoom = d3.zoom();
        zoom.scaleExtent([0.1, 2])
            .on("zoom", function (event) {
                drawingArea.attr("transform", event.transform);
            });
        svgBoard.call(zoom);
    })
    .catch(error => console.log(error));

function drawTree() {
    currentDrawer.drawTree(nodesAnimationDuration, linksAnimationDuration);
}


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