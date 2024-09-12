const boardHeight = Math.floor(0.8*window.screen.height);
const boardWidth = Math.floor(0.6*window.screen.width);

let svgBoard;
let drawingArea;

let forceDirectedLayeredDrawer;
let forceDirectedBasicDrawer;
let currentDrawer;

let nodesAnimationDuration = 750;

d3.json("data100.json")
    .then(function(data) {
        svgBoard = d3.select("#svg-board");
        svgBoard.attr("width", boardWidth);
        svgBoard.attr("height", boardHeight);
        drawingArea = svgBoard.append("g");
        const root = computeTree(data);
        forceDirectedLayeredDrawer = new ForceDirectedLayeredDrawer(root, drawingArea);
        currentDrawer = forceDirectedLayeredDrawer;
        var zoom = d3.zoom();
        zoom.scaleExtent([0.1, 2])
            .on("zoom", function (event) {
                drawingArea.attr("transform", event.transform);
            });
        svgBoard.call(zoom);
    })
    .catch(error => console.log(error));

function drawTree() {
    currentDrawer.drawTree(nodesAnimationDuration);
}

const nodesAnimationDurationInput = document.getElementById('nodes-animation-duration');
nodesAnimationDurationInput.value = nodesAnimationDuration;
nodesAnimationDurationInput.addEventListener('input', function(event) {
    if (event.target.value < 0) event.target.value *= -1;
    nodesAnimationDuration = event.target.value;
});