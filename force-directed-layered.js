class ForceDirectedLayeredDrawer {
    constructor(root, drawingArea) {
        this._root = root;
        this._depthMap = createDepthMap(root);
        this._drawingArea = drawingArea;
        
        this._elasticConstant = 0.8;
        this._baseSpringLength = 10.0;
        this._electrostaticConstant = 6000;

        this._useCenterRepulsiveForce = true;
        this._centerRepulsiveForceValue = 40;
        
        this._timeoutBetweenLayers = 2000;
        this._freezeDrawnNodes = true;
        this._maxIterations = 1500;

        this._initializeButtons();
    }

    _neighborsOfNode(node, depth) {
        let neighbors = [node.parent];
        if (depth === node.depth) return neighbors;
        if (!this._freezeDrawnNodes)
            neighbors.push(...node.children);
        return neighbors;
    }

    _computeSpringForce(node, depth) {
        let springForceX = 0.0;
        let springForceY = 0.0;
        const neighbors = this._neighborsOfNode(node, depth);
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

    _computeElectroForce(node, nodesOnBoard) {
        let electroForceX = 0.0;
        let electroForceY = 0.0;
        nodesOnBoard.forEach((otherNode) => {
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

    _updateNodes(depth, nodesToUpdate, fixedNodes) {
        let totalForce = 0.0;
        const nodesOnBoard = fixedNodes.concat(nodesToUpdate);
        nodesToUpdate.forEach((node) => {
            if (node.id === this._root.id) return;
            const springForce = this._computeSpringForce(node, depth);
            const electroForce = this._computeElectroForce(node, nodesOnBoard);
            let totalForceX = springForce.x + electroForce.x;
            let totalForceY = springForce.y + electroForce.y;
            if (this._useCenterRepulsiveForce) {
                const centerRepulsiveForce = this._computeCenterRepulsiveForce(node);
                totalForceX += centerRepulsiveForce.x;
                totalForceY += centerRepulsiveForce.y;
            }
            node.x += totalForceX;
            node.y += totalForceY;
            totalForce += (Math.abs(totalForceX) + Math.abs(totalForceY));
        });
        return totalForce;
    }

    _drawNodesOfDepth(depth, drawnNodes, animationDuration) {
        let newNodes = this._depthMap.get(depth);
        this._drawingArea.selectAll(".newCircle")
            .data(newNodes)
            .enter()
            .append("circle")
            .attr("fill", `hsl(50, 100%, 50%)`)
            .attr("stroke", "black")
            .attr("stroke-width", 10)
            .attr("r", 5)
            .attr("cx", node => node.parent.x)
            .attr("cy", node => node.parent.y)
        this._drawingArea.selectAll(".newLinks")
            .data(newNodes)
            .enter()
            .append("path")
            .attr("stroke-width", 5)
            .attr("stroke", "black")
            .attr("d", function(node) {
                return `M ${node.parent.x},${node.parent.y} L ${node.parent.x},${node.parent.y}`
            });
        // placing new nodes
        let iterationsNewNodes = 0;
        while (true) {
            const totalForceNewNodes = this._updateNodes(depth, newNodes, drawnNodes);
            iterationsNewNodes += 1;
            if (iterationsNewNodes === this._maxIterations || totalForceNewNodes < 0.1)
                break;
        }
        if (!this._freezeDrawnNodes) {
            let iterations = 0;
            const nonRootNodes = drawnNodes.slice(1).concat(newNodes);
            while (true) {
                const totalForce = this._updateNodes(depth, nonRootNodes, [this._root]);
                iterations += 1;
                if (iterations === this._maxIterations || totalForce < 0.1)
                    break;
            }
        }
        this._drawingArea.selectAll("circle")
            .data(drawnNodes.concat(newNodes))
            .transition().duration(animationDuration)
            .attr("cx", node => node.x)
            .attr("cy", node => node.y)
            .attr("class", "circle");

        const nonRootNodes = drawnNodes.slice(1).concat(newNodes);
        this._drawingArea.selectAll("path")
            .data(nonRootNodes)
            .attr("class", "links")
            .transition().duration(animationDuration)
            .attr("d", function(node) {
                return `M ${node.parent.x},${node.parent.y} L ${node.x},${node.y}`
            });

        drawnNodes.push(...newNodes);
    }

    _drawRoot() {
        let nodesToDraw = this._depthMap.get(0);
        this._drawingArea.selectAll("circle")
            .data(nodesToDraw)
            .enter()
            .append("circle")
            .attr("fill", `hsl(50, 100%, 50%)`)
            .attr("stroke", "black")
            .attr("stroke-width", 10)
            .attr("r", 5)
            .attr("cx", node => node.x)
            .attr("cy", node => node.y)
            .attr("class", "circle");
    }

    drawTree(animationDuration) {
        this._drawingArea.selectAll("*").remove();
        assignRandomInitialPositions(this._depthMap);
        this._drawRoot();
        let drawnNodes = [this._root];
        for (let depth = 1; depth < this._depthMap.size; depth++) {
            setTimeout(() => {
                const start = new Date().getTime();
                this._drawNodesOfDepth(depth, drawnNodes, animationDuration);
                const elapsedTime = new Date().getTime() - start;
            }, depth*this._timeoutBetweenLayers);
        }
        setTimeout(() => {
            displayNumberOfCollisions(this._root);
        }, this._depthMap.size*this._timeoutBetweenLayers);
    }

    _initializeButtons() {
        // center repulsive force
        const checkboxUseCenterRepulsiveForce = document.getElementById('center-repulsive-force-box');
        const centerRepulsiveForceInput = document.getElementById('center-repulsive-force');
        checkboxUseCenterRepulsiveForce.checked = this._useCenterRepulsiveForce;
        centerRepulsiveForceInput.value = this._centerRepulsiveForceValue;
        checkboxUseCenterRepulsiveForce.addEventListener('change', (event) => {
            if (event.target.checked) {
                this._useCenterRepulsiveForce = true;
                centerRepulsiveForceInput.readOnly = false;
            }
            else {
                this._useCenterRepulsiveForce = false;
                centerRepulsiveForceInput.readOnly = true;
            }
        });
        centerRepulsiveForceInput.addEventListener('input', (event) => {
            if (event.target.value < 0) event.target.value *= -1;
            this._centerRepulsiveForceValue = event.target.value;
        });
        // freeze drawn nodes
        const checkboxFreezeDrawnNodes = document.getElementById('freeze-drawn-nodes-box');
        checkboxFreezeDrawnNodes.checked = this._freezeDrawnNodes;
        checkboxFreezeDrawnNodes.addEventListener('change', (event) => {
            this._freezeDrawnNodes = event.target.checked;
        });
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
        // timer between layers
        const timeBetweenLayersInput = document.getElementById('time-between-layers');
        timeBetweenLayersInput.value = this._timeoutBetweenLayers;
        timeBetweenLayersInput.addEventListener('input', (event) => {
            if (event.target.value < 0) event.target.value *= -1;
            this._timeoutBetweenLayers = event.target.value;
        });
    }
}