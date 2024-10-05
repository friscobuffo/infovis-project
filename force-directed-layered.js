class ForceDirectedLayeredDrawer {
    constructor(root, drawingArea) {
        this._root = root;
        this._depthMap = createDepthMap(root);
        this._drawingArea = drawingArea;
        
        this._elasticConstant = 0.20;
        this._baseSpringLength = 45.0;
        this._electrostaticConstant = 12000;

        this._maxIterationsNewNodes = 500;
        this._maxIterations = 2000;

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
            const electroTerm = (this._electrostaticConstant)/(d*d);
            const deltaX = node.x - otherNode.x;
            const deltaY = node.y - otherNode.y;
            electroForceX += electroTerm*(deltaX/d);
            electroForceY += electroTerm*(deltaY/d);
        });
        return {x: electroForceX, y: electroForceY};
    }

    _updateNodes(depth, nodesToUpdate, fixedNodes) {
        let totalForce = 0.0;
        const nodesOnBoard = fixedNodes.concat(nodesToUpdate);
        nodesToUpdate.forEach((node) => {
            if (node.id === this._root.id) return;
            const springForce = this._computeSpringForce(node, depth);
            const electroForce = this._computeElectroForce(node, nodesOnBoard);
            const totalForceX = springForce.x + electroForce.x;
            const totalForceY = springForce.y + electroForce.y;
            node.x += totalForceX;
            node.y += totalForceY;
            totalForce += (Math.abs(totalForceX) + Math.abs(totalForceY));
        });
        return totalForce;
    }

    _placeNewNodesAndLinks(newNodes) {
        this._drawingArea.selectAll(".newCircle")
            .data(newNodes)
            .enter()
            .append("circle")
            .attr("fill", `hsl(50, 100%, 50%)`)
            .attr("stroke", "black")
            .attr("stroke-width", 10)
            .attr("r", 5)
            .attr("cx", node => node.x)
            .attr("cy", node => node.y)
        this._drawingArea.selectAll(".newLinks")
            .data(newNodes)
            .enter()
            .append("path")
            .attr("stroke-width", 5)
            .attr("stroke", "black")
            .attr("d", function(node) {
                return `M ${node.parent.x},${node.parent.y} L ${node.x},${node.y}`
            });
    }

    _updateAllNodesAndLinks(drawnNodes, newNodes, nonRootNodes, animationDuration) {
        this._drawingArea.selectAll("circle")
            .data(drawnNodes.concat(newNodes))
            .transition().duration(250)
            .attr("cx", node => node.x)
            .attr("cy", node => node.y)
            .attr("class", "circle");
        this._drawingArea.selectAll("path")
            .data(nonRootNodes)
            .attr("class", "links")
            .transition().duration(250)
            .attr("d", function(node) {
                return `M ${node.parent.x},${node.parent.y} L ${node.x},${node.y}`
            });
    }

    _keepUpdatingNewNodes(depth, newNodes, drawnNodes, animationDuration, nonRootNodes) {
        const totalForceNewNodes = this._updateNodes(depth, newNodes, drawnNodes);
        this._iterationsNewNodes += 1;
        const timerNowMilliseconds = performance.now();
        if (timerNowMilliseconds - this._timerStartMilliseconds > 350) {
            this._timerStartMilliseconds = timerNowMilliseconds;
            setTimeout(() => {
                displayNumberOfCollisions(this._root);
                this._updateAllNodesAndLinks(drawnNodes, newNodes, nonRootNodes, animationDuration);
            }, 0);
        }
        if (this._iterationsNewNodes === this._maxIterationsNewNodes || totalForceNewNodes < 0.5) {
            this._iterationsAllNodes = 0;
            setTimeout(() => {
                this._keepUpdatingAllNodes(depth, nonRootNodes, newNodes, animationDuration, drawnNodes);
            }, 0);
            return;
        }
        setTimeout(() => {
            this._keepUpdatingNewNodes(depth, newNodes, drawnNodes, animationDuration, nonRootNodes);
        }, 0);
    }

    _keepUpdatingAllNodes(depth, nonRootNodes, newNodes, animationDuration, drawnNodes) {
        const totalForce = this._updateNodes(depth, nonRootNodes, [this._root]);
        this._iterationsAllNodes += 1;
        const timerNowMilliseconds = performance.now();
        if (timerNowMilliseconds - this._timerStartMilliseconds > 350) {
            this._timerStartMilliseconds = timerNowMilliseconds;
            setTimeout(() => {
                displayNumberOfCollisions(this._root);
                this._updateAllNodesAndLinks(drawnNodes, newNodes, nonRootNodes, animationDuration);
            }, 0);
        }
        if (this._iterationsAllNodes === this._maxIterations || totalForce < 0.5) {
            drawnNodes.push(...newNodes);
            if (depth < this._depthMap.size-1)
                setTimeout(() => {
                    this._drawNodesOfDepth(depth+1, drawnNodes, animationDuration);
                }, 0);
            else {
                setTimeout(() => {
                    displayNumberOfCollisions(this._root);
                    this._updateAllNodesAndLinks(drawnNodes, newNodes, nonRootNodes, animationDuration);
                }, 350);
            }
            return;
        }
        setTimeout(() => {
            this._keepUpdatingAllNodes(depth, nonRootNodes, newNodes, animationDuration, drawnNodes);
        }, 0);
    }

    _drawNodesOfDepth(depth, drawnNodes, animationDuration) {
        let newNodes = this._depthMap.get(depth);
        newNodes.forEach((node) => {
            node._countCollisions = true;
        });
        setTimeout(() => this._placeNewNodesAndLinks(newNodes), 0);
        const nonRootNodes = drawnNodes.slice(1).concat(newNodes);
        this._iterationsNewNodes = 0;
        setTimeout(() => {
            this._keepUpdatingNewNodes(depth, newNodes, drawnNodes, animationDuration, nonRootNodes);
        }, 0);
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

    async drawTree(animationDuration) {
        for (let i = 0; i < this._depthMap.size; i++) {
            this._depthMap.get(i).forEach((node) => {
                node._countCollisions = false;
            });
        }
        this._drawingArea.selectAll("*").remove();
        assignRandomInitialPositions(this._depthMap);
        this._drawRoot();
        let drawnNodes = [this._root];
        this._root._countCollisions = true;
        this._timerStartMilliseconds = performance.now();
        this._drawNodesOfDepth(1, drawnNodes, animationDuration);
    }

    _initializeButtons() {
        // elastic force
        const sliderElasticConstant = document.getElementById('slider-elastic-constant-layered');
        const sliderElasticConstantValue = document.getElementById('slider-elastic-constant-layered-value');
        sliderElasticConstant.value = this._elasticConstant;
        sliderElasticConstantValue.textContent = this._elasticConstant;
        sliderElasticConstant.addEventListener('input', (event) => {
            sliderElasticConstantValue.textContent = event.target.value;
            this._elasticConstant = event.target.value;
        });
        const baseSprintLengthInput = document.getElementById('base-spring-length-layered');
        baseSprintLengthInput.value = this._baseSpringLength;
        baseSprintLengthInput.addEventListener('input', (event) => {
            if (event.target.value < 0) event.target.value *= -1;
            this._baseSpringLength = event.target.value;
        });
        // electrostatic force
        const electroStaticConstantInput = document.getElementById('electro-static-constant-layered');
        electroStaticConstantInput.value = this._electrostaticConstant;
        electroStaticConstantInput.addEventListener('input', (event) => {
            if (event.target.value < 0) event.target.value *= -1;
            this._electrostaticConstant = event.target.value;
        });
    }

    hideAllButtons() {
        document.getElementById('elastic-force-layered').hidden = true;
        document.getElementById('electrostatic-layered').hidden = true;
    }

    showAllButtons() {
        document.getElementById('elastic-force-layered').hidden = false;
        document.getElementById('electrostatic-layered').hidden = false;
    }

    _computeLayerPosition(depth, drawnNodes, newNodes) {
        let iterationsNewNodes = 0;
        while (true) {
            const totalForceNewNodes = this._updateNodes(depth, newNodes, drawnNodes);
            iterationsNewNodes += 1;
            if (iterationsNewNodes === this._maxIterationsNewNodes || totalForceNewNodes < 0.5)
                break;
        }
        let iterations = 0;
        const nonRootNodes = drawnNodes.slice(1).concat(newNodes);
        while (true) {
            const totalForce = this._updateNodes(depth, nonRootNodes, [this._root]);
            iterations += 1;
            if (iterations === this._maxIterations || totalForce < 0.5)
                break;
        }
    }

    // does not draw the tree
    computeTree() {
        for (let i = 0; i < this._depthMap.size; i++) {
            this._depthMap.get(i).forEach((node) => {
                node._countCollisions = true;
            });
        }
        assignRandomInitialPositions(this._depthMap);
        let drawnNodes = [this._root];
        for (let depth = 1; depth < this._depthMap.size; depth++) {
            let newNodes = this._depthMap.get(depth);
            this._computeLayerPosition(depth, drawnNodes, newNodes);
            drawnNodes.push(...newNodes);
        }
    }
}