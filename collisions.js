// Calculate orientation of ordered triplet (p, q, r)
// 0 --> p, q and r are collinear
// 1 --> Clockwise
// 2 --> Counterclockwise
function computeOrientation(p, q, r) {
    let val = (q.y - p.y) * (r.x - q.x) - (q.x - p.x) * (r.y - q.y);
    if (val === 0) return 0;  // collinear
    return (val > 0) ? 1 : 2; // 1 -> clockwise, 2 -> counterclockwise
}

// Check if point q lies on the segment pr
function onSegment(p, q, r) {
    return (q.x <= Math.max(p.x, r.x) && q.x >= Math.min(p.x, r.x) &&
            q.y <= Math.max(p.y, r.y) && q.y >= Math.min(p.y, r.y))
}

function doIntersect(p1, q1, p2, q2) {
    // Find the four orientations needed for the general and special cases
    let o1 = computeOrientation(p1, q1, p2);
    let o2 = computeOrientation(p1, q1, q2);
    let o3 = computeOrientation(p2, q2, p1);
    let o4 = computeOrientation(p2, q2, q1);

    // General case
    if (o1 !== o2 && o3 !== o4)
        return true;

    // Special Cases (checking if the points are collinear)
    // p1, q1 and p2 are collinear and p2 lies on segment p1q1
    if (o1 === 0 && onSegment(p1, p2, q1)) return true;

    // p1, q1 and q2 are collinear and q2 lies on segment p1q1
    if (o2 === 0 && onSegment(p1, q2, q1)) return true;

    // p2, q2 and p1 are collinear and p1 lies on segment p2q2
    if (o3 === 0 && onSegment(p2, p1, q2)) return true;

    // p2, q2 and q1 are collinear and q1 lies on segment p2q2
    if (o4 === 0 && onSegment(p2, q1, q2)) return true;

    // Doesn't fall in any of the above cases
    return false;
}

function countCollisions(tree) {
    let edges = [];
    function traverse(node) {
        if (node.children && node.children.length > 0)
            for (let child of node.children) {
                edges.push([node, child]);
                traverse(child);
            }
    }
    traverse(tree);
    let totalCollisions = 0;
    for (let i = 0; i < edges.length; i++)
        for (let j = i + 1; j < edges.length; j++) {
            const [p1, q1] = edges[i];
            const [p2, q2] = edges[j];
            if (p1 == p2) continue;
            if (p1 == q2) continue;
            if (q1 == p2) continue;
            if (q1 == q2) continue;
            if (doIntersect(p1, q1, p2, q2))
                totalCollisions++;
        }
    return totalCollisions;
}

function displayNumberOfCollisions(root) {
    collisions = countCollisions(root);
    const numberOfCollisionsSpan = document.getElementById('number-collisions');
    numberOfCollisionsSpan.textContent = `Number Of Collisions: ${collisions}`;
}