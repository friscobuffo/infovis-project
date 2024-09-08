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