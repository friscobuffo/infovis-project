class ForceDirectedLayeredBasic {
    constructor(root, drawingArea) {
        this._root = root;
        this._drawingArea = drawingArea;
        
        this._elasticConstant = 0.8;
        this._baseSpringLength = 10.0;
        this._electrostaticConstant = 6000;
        this._maxIterations = 1500;

        const depthMap = createDepthMap(root);
        let nodes = [];
        for (let depth = 0; depth < depthMap.size; depth++)
            nodes.push(...depthMap.get(depth));
        this._nodes = nodes;
        this._depthMap = depthMap;

        this._initializeButtons();
    }

    _neighborsOfNode(node) {
        let neighbors = [node.parent];
            neighbors.push(...node.children);
        return neighbors;
    }

    _computeSpringForce(node) {
        let springForceX = 0.0;
        let springForceY = 0.0;
        const neighbors = this._neighborsOfNode(node);
        neighbors.forEach((neighbor) => {
            const d = distance(node, neighbor);
            const springTerm = this._elasticConstant*(this._baseSpringLength-d);
            const deltaX = node.x - neighbor.x;
            const deltaY = node.y - neighbor.y;
            springForceX += (springTerm*deltaX/d);
            springForceY += (springTerm*deltaY/d);
        });
        return {x: springForceX, y: springForceY};
    }

    _computeElectroForce(node) {
        let electroForceX = 0.0;
        let electroForceY = 0.0;
        this._nodes.forEach((otherNode) => {
            if (otherNode.id === node.id) return;
            const d = distance(node, otherNode);
            const multiplier = 1.0 + 2*node.children.length + 2*otherNode.children.length;
            const electroTerm = multiplier*(this._electrostaticConstant)/(d*d);
            const deltaX = node.x - otherNode.x;
            const deltaY = node.y - otherNode.y;
            electroForceX += electroTerm*(deltaX/d);
            electroForceY += electroTerm*(deltaY/d);
        });
        return {x: electroForceX, y: electroForceY};
    }

    _computeCenterRepulsiveForce(node) {
        const center = this._root;
        let centerRepulsiveForce = {x: (node.x - center.x),
                                    y: (node.y - center.y)};
        normalizeVector(centerRepulsiveForce);
        centerRepulsiveForce.x *= this._centerRepulsiveForceValue;
        centerRepulsiveForce.y *= this._centerRepulsiveForceValue;
        return centerRepulsiveForce;
    }

    _updateNodes() {
        let totalForce = 0.0;
        this._nodes.forEach((node) => {
            if (node.id === this._root.id) return;
            const springForce = this._computeSpringForce(node);
            const electroForce = this._computeElectroForce(node);
            let totalForceX = springForce.x + electroForce.x;
            let totalForceY = springForce.y + electroForce.y;
            node.x += totalForceX;
            node.y += totalForceY;
            totalForce += (Math.abs(totalForceX) + Math.abs(totalForceY));
        });
        return totalForce;
    }

    _computeNodesPositions() {
        let iterationsNewNodes = 0;
        while (true) {
            const totalForceNewNodes = this._updateNodes();
            iterationsNewNodes += 1;
            if (iterationsNewNodes === this._maxIterations || totalForceNewNodes < 0.1)
                break;
        }
    }

    _drawNodesAndLinks(animationDuration) {
        this._drawingArea.selectAll("circle")
            .data(this._nodes)
            .enter()
            .append("circle")
            .attr("fill", `hsl(50, 100%, 50%)`)
            .attr("stroke", "black")
            .attr("stroke-width", 10)
            .attr("r", 5)
            .attr("cx", _ => this._root.x)
            .attr("cy", _ => this._root.y)
        this._drawingArea.selectAll("circle")
                .data(this._nodes)
                .transition().duration(animationDuration)
                .attr("cx", node => node.x)
                .attr("cy", node => node.y)
        const nonRootNodes = this._nodes.slice(1);
        this._drawingArea.selectAll("path")
            .data(nonRootNodes)
            .enter()
            .append("path")
            .attr("stroke-width", 5)
            .attr("stroke", "black")
            .attr("d", (_) => {
                return `M ${this._root.x},${this._root.y} L ${this._root.x},${this._root.y}`
            });
        this._drawingArea.selectAll("path")
            .data(nonRootNodes)
            .attr("class", "links")
            .transition().duration(animationDuration)
            .attr("d", (node) => {
                return `M ${node.parent.x},${node.parent.y} L ${node.x},${node.y}`
            });
    }

    drawTree(animationDuration) {
        this._drawingArea.selectAll("*").remove();
        assignRandomInitialPositions(this._depthMap);
        this._computeNodesPositions();
        this._drawNodesAndLinks(animationDuration);
        displayNumberOfCollisions(this._root);
    }

    _initializeButtons() {
        // elastic force
        const sliderElasticConstant = document.getElementById('slider-elastic-constant');
        const sliderElasticConstantValue = document.getElementById('slider-elastic-constant-value');
        sliderElasticConstant.value = this._elasticConstant;
        sliderElasticConstantValue.textContent = this._elasticConstant;
        sliderElasticConstant.addEventListener('input', (event) => {
            sliderElasticConstantValue.textContent = event.target.value;
            this._elasticConstant = event.target.value;
        });
        const baseSprintLengthInput = document.getElementById('base-spring-length');
        baseSprintLengthInput.value = this._baseSpringLength;
        baseSprintLengthInput.addEventListener('input', (event) => {
            if (event.target.value < 0) event.target.value *= -1;
            this._baseSpringLength = event.target.value;
        });
        // electrostatic force
        const electroStaticConstantInput = document.getElementById('electro-static-constant');
        electroStaticConstantInput.value = this._electrostaticConstant;
        electroStaticConstantInput.addEventListener('input', (event) => {
            if (event.target.value < 0) event.target.value *= -1;
            this._electrostaticConstant = event.target.value;
        });
    }
}