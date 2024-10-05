const boardHeight = Math.floor(0.8*window.screen.height);
const boardWidth = Math.floor(0.6*window.screen.width);

let forceDirectedLayeredDrawer;
let forceDirectedBasicDrawer;
let currentDrawer;

let animationDuration = 750;

d3.json("data1000.json")
    .then(function(data) {
        const  svgBoard = d3.select("#svg-board");
        svgBoard.attr("width", boardWidth);
        svgBoard.attr("height", boardHeight);
        const drawingArea = svgBoard.append("g");
        const root = computeTree(data);
        assingLevels(root);
        forceDirectedBasicDrawer = new ForceDirectedBasicDrawer(root, drawingArea)
        forceDirectedLayeredDrawer = new ForceDirectedLayeredDrawer(root, drawingArea);
        currentDrawer = forceDirectedLayeredDrawer;
        forceDirectedBasicDrawer.hideAllButtons();
        forceDirectedLayeredDrawer.showAllButtons();
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

function statTest() {
    let totalCollisions = 0;
    let totalTime = 0.0;
    const iterations = 15;
    let i = 0;
    const updateProgress = () => {
        if (i < iterations) {
            const start = new Date().getTime();
            currentDrawer.computeTree();
            const elapsedTime = new Date().getTime() - start;
            totalTime += elapsedTime;
            totalCollisions += countCollisions(currentDrawer._root);
            const progress = document.getElementById('stat-tests-progress');
            progress.textContent = (((i + 1) * 100) / iterations).toFixed(2) + "%";
            i++;
            setTimeout(updateProgress, 0);
        } else {
            console.log("average crossings:", totalCollisions / iterations);
            console.log("average time:", totalTime / iterations);
        }
    };
    updateProgress();
}

const dropdown = document.getElementById('algorithm-dropdown');
dropdown.value = 'fd-layered';
dropdown.addEventListener('change', (event) => {
    const selectedAlgorithm = event.target.value;
    if (selectedAlgorithm === "fd-basic") {
        forceDirectedBasicDrawer.showAllButtons();
        forceDirectedLayeredDrawer.hideAllButtons();
        currentDrawer = forceDirectedBasicDrawer;
    }
    else if (selectedAlgorithm === "fd-layered") {
        forceDirectedBasicDrawer.hideAllButtons();
        forceDirectedLayeredDrawer.showAllButtons();
        currentDrawer = forceDirectedLayeredDrawer;
    }
});