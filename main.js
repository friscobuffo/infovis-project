const boardHeight = Math.floor(0.8*window.screen.height);
const boardWidth = Math.floor(0.6*window.screen.width);

let forceDirectedLayeredDrawer;
let currentDrawer;

let animationDuration = 750;

d3.json("data100.json")
    .then(function(data) {
        const  svgBoard = d3.select("#svg-board");
        svgBoard.attr("width", boardWidth);
        svgBoard.attr("height", boardHeight);
        const drawingArea = svgBoard.append("g");
        const root = computeTree(data);
        assingLevels(root);
        forceDirectedLayeredDrawer = new ForceDirectedLayeredBasic(root, drawingArea);
        currentDrawer = forceDirectedLayeredDrawer;
        var zoom = d3.zoom();
        zoom.scaleExtent([0.1, 2])
            .on("zoom", (event) => {
                drawingArea.attr("transform", event.transform);
            });
        svgBoard.call(zoom);
    })
    .catch(error => console.log(error));

function drawTree() {
    currentDrawer.drawTree(animationDuration);
}

const animationDurationInput = document.getElementById('animation-duration');
animationDurationInput.value = animationDuration;
animationDurationInput.addEventListener('input', function(event) {
    if (event.target.value < 0) event.target.value *= -1;
    animationDuration = event.target.value;
});