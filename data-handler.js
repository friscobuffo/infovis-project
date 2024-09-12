function computeTree(data) {
    const lookup = new Map();
    data.forEach(node => {
        lookup.set(node.id, { id: node.id, children: [], parent: null });
    });
    let root = null;
    data.forEach(node => {
        if (node.parent === null)
            root = lookup.get(node.id);
        else {
            let parentId = node.parent;
            let parent = lookup.get(parentId);
            let child = lookup.get(node.id);
            parent.children.push(child);
            child.parent = parent;
        }
    });
    return root;
}

// creates a map with (key = depth) and (value = array of nodes at that level)
function createDepthMap(root) {
    const depthMap = new Map();
    function traverse(node, depth) {
        if (!depthMap.has(depth))
            depthMap.set(depth, []);
        depthMap.get(depth).push(node);
        if (node.children)
            node.children.forEach(child => traverse(child, depth + 1));
    }
    traverse(root, 0);
    return depthMap;
}

// adds the depth to each node object
function assingLevels(depthMap) {
    depthMap.forEach((nodes, level) => {
        nodes.forEach((node) => {
            node.level = level;
        });
    });
}

function computeSubtreeSizes(node) {
    if (!node) return 0;
    let size = 1;
    for (let child of node.children) {
        size += computeSubtreeSizes(child);
    }
    node.subtreeSize = size;
    return size;
}

// this function ensures no two nodes spawn with the same x or the same y
function assignRandomInitialPositions(depthMap) {
    depthMap.get(0)[0].x = boardWidth / 2;
    depthMap.get(0)[0].y = boardHeight / 2;

    const xRandomScale = d3.scaleLinear();
    const yRandomScale = d3.scaleLinear();
    xRandomScale.domain([0, 1]);
    yRandomScale.domain([0, 1]);
    xRandomScale.range([0, boardWidth]);
    yRandomScale.range([boardHeight, 0]);

    const assignedXs = new Set();
    const assignedYs = new Set();

    for (i = 1; i < depthMap.size; i++) {
        depthMap.get(i).forEach(function (node) {
            let x = parseFloat(xRandomScale(Math.random()));
            while (assignedXs.has(x))
                x = parseFloat(xRandomScale(Math.random()));
            let y = parseFloat(yRandomScale(Math.random()));
            while (assignedYs.has(y))
                y = parseFloat(yRandomScale(Math.random()));
            node.x = x;
            node.y = y;
            assignedXs.add(x);
            assignedYs.add(y);
        });
    }
}