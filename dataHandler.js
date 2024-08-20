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

function calculateSubtreeSizes(node) {
    if (!node) return 0;
    let size = 1;
    for (let child of node.children) {
        size += calculateSubtreeSizes(child);
    }
    node.subtreeSize = size;
    return size;
}