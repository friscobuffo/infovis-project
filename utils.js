function distance(node1, node2) {
    deltaX = node1.x - node2.x;
    deltaY = node1.y - node2.y;
    return Math.sqrt(deltaX*deltaX + deltaY*deltaY);
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

function inorderLeafVisit(root) {
    const result = [];
    function inorder(node) {
        if (!node) return;
        const numChildren = node.children.length;
        for (let i = 0; i < numChildren; i++)
            inorder(node.children[i]);
        if (numChildren === 0)
            result.push(node);
    }
    inorder(root);
    return result;
}