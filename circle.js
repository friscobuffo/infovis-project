function generateCirclePoints(radius, N) {
    const points = [];
    const angleIncrement = (2 * Math.PI) / N;
    for (let i = 0; i < N; i++) {
        const angle = i * angleIncrement;
        const x = radius * Math.cos(angle);
        const y = radius * Math.sin(angle);
        points.push({ x: x, y: y });
    }
    return points;
}

// Example usage:
const radius = 5;
const N = 10; // Number of points
const points = generateCirclePoints(radius, N);
console.log(points);