class ForceDirectedDrawer {
    constructor(root, depthMap, drawingArea) {
        this._root = root;
        this._depthMap = depthMap;
        this._drawingArea = drawingArea;
        
        this._elasticConstant = 0.8;
        this._baseSpringLength = 10.0;
        this._electrostaticConstant = 6000;

        this._useCenterRepulsiveForce = true;
        this._centerRepulsiveForceValue = 40;
        
        this._timeoutBetweenLayers = 1000;

        this._initializeButtons();
    }

    _computeSpringForce(node) {
        const dParent = distance(node, node.parent);
        const springTerm = this._elasticConstant*(this._baseSpringLength-dParent);
        const deltaX = node.x - node.parent.x;
        const deltaY = node.y - node.parent.y;
        const springForceX = springTerm*deltaX/dParent;
        const springForceY = springTerm*deltaY/dParent;
        return {x: springForceX, y: springForceY};
    }

    _computeElectroForce(node, nodesOnBoard) {
        let electroForceX = 0.0;
        let electroForceY = 0.0;
        nodesOnBoard.forEach((otherNode) => {
            if (otherNode.id !== node.id) {
                const d = distance(node, otherNode);
                const multiplier = 1.0 + 2*node.children.length + 2*otherNode.children.length;
                const electroTerm = multiplier*(this._electrostaticConstant)/(d*d);
                const deltaX = node.x - otherNode.x;
                const deltaY = node.y - otherNode.y;
                electroForceX += electroTerm*(deltaX/d);
                electroForceY += electroTerm*(deltaY/d);
            }
        });
        return {x: electroForceX, y: electroForceY};
    }

    _updateNodes(depth, fixedNodesInTheBoard) {
        if (depth === 0) return true;
        let totalForce = 0.0;
        const nodesToUpdate = this._depthMap.get(depth);
        const nodesOnBoard = fixedNodesInTheBoard.concat(nodesToUpdate);
        nodesToUpdate.forEach((node) => {
            const springForce = this._computeSpringForce(node);
            const electroForce = this._computeElectroForce(node, nodesOnBoard);
            if (this._useCenterRepulsiveForce) {
                const centerRepulsiveDirection = {x: (node.x - this._depthMap.get(0)[0].x),
                                                  y: (node.y - this._depthMap.get(0)[0].y)};
                normalizeVector(centerRepulsiveDirection);
                var totalForceX = springForce.x + electroForce.x + 
                                  centerRepulsiveDirection.x*this._centerRepulsiveForceValue;
                var totalForceY = springForce.y + electroForce.y +
                                  centerRepulsiveDirection.y*this._centerRepulsiveForceValue;
            }
            else {
                var totalForceX = springForce.x + electroForce.x;
                var totalForceY = springForce.y + electroForce.y;
            }
            node.x += totalForceX;
            node.y += totalForceY;
            totalForce += (Math.abs(totalForceX) + Math.abs(totalForceY));
        });
        return totalForce < 0.1;
    }

    _drawNodesOfDepth(depth, fixedNodesInTheBoard, nodesAnimationDuration, linksAnimationDuration) {
        let nodesToDraw = this._depthMap.get(depth);
        this._drawingArea.selectAll(".newCircle")
            .data(nodesToDraw)
            .enter()
            .append("circle")
            .attr("fill", `hsl(50, 100%, 50%)`)
            .attr("stroke", "black")
            .attr("stroke-width", 10)
            .attr("r", 5)
            .attr("cx", node => node.x)
            .attr("cy", node => node.y)
            .attr("class", "newCircle");
    
        let didNodesConverge = false;
        let iterations = 0;
        while (!didNodesConverge) {
            didNodesConverge = this._updateNodes(depth, fixedNodesInTheBoard);
            iterations += 1;
            if (iterations === 2000) break;
        }
    
        this._drawingArea.selectAll(".newCircle")
            .data(nodesToDraw)
            .transition().duration(nodesAnimationDuration)
            .attr("cx", node => node.x)
            .attr("cy", node => node.y)
            .attr("class", "fixedCircle");
    
        if (depth !== 0) this._drawLinks(nodesToDraw, linksAnimationDuration);

        fixedNodesInTheBoard.push(...nodesToDraw);
    }
    
    _drawLinks(nodesToDraw, linksAnimationDuration) {
        this._drawingArea.selectAll(".newLinks")
            .data(nodesToDraw)
            .enter()
            .append("path")
            .attr("stroke-width", 5)
            .attr("class", "newLinks")
            .attr("stroke", "black")
            .attr("d", function(node) {
                return `M ${node.parent.x},${node.parent.y} L ${node.parent.x},${node.parent.y}`
            });
    
        this._drawingArea.selectAll(".newLinks")
            .data(nodesToDraw)
            .attr("class", "links")
            .transition().duration(linksAnimationDuration)
            .attr("d", function(node) {
                return `M ${node.parent.x},${node.parent.y} L ${node.x},${node.y}`
            });
    }

    drawTree(nodesAnimationDuration, linksAnimationDuration) {
        drawingArea.selectAll("*").remove();
        let fixedNodesInTheBoard = [];
        assignRandomInitialPositions(this._depthMap);
        for (let depth = 0; depth < this._depthMap.size; depth++)
            setTimeout(() => {
                this._drawNodesOfDepth(depth, fixedNodesInTheBoard, nodesAnimationDuration, linksAnimationDuration);
            }, depth*this._timeoutBetweenLayers);
        const root = this._depthMap.get(0)[0];
        setTimeout(() => {
            displayNumberOfCollisions(countCollisions(root));
        }, this._depthMap.size*this._timeoutBetweenLayers);
    }

    hideAllButtons() {
        document.getElementById('center-repulsive-force-box').hidden = true;
        document.getElementById('center-repulsive-force').hidden = true;
        document.getElementById('slider-elastic-constant').hidden = true;
        document.getElementById('base-spring-length').hidden = true;
        document.getElementById('electro-static-constant').hidden = true;
        document.getElementById('time-between-layers').hidden = true;
    }

    showAllButtons() {
        document.getElementById('center-repulsive-force-box').hidden = false;
        document.getElementById('center-repulsive-force').hidden = false;
        document.getElementById('slider-elastic-constant').hidden = false;
        document.getElementById('base-spring-length').hidden = false;
        document.getElementById('electro-static-constant').hidden = false;
        document.getElementById('time-between-layers').hidden = false;
    }

    _initializeButtons() {
        // center repulsive force
        const checkboxUseCenterRepulsiveForce = document.getElementById('center-repulsive-force-box');
        const centerRepulsiveForceInput = document.getElementById('center-repulsive-force');
        centerRepulsiveForceInput.value = this._centerRepulsiveForceValue;
        checkboxUseCenterRepulsiveForce.addEventListener('change', function(event) {
            if (event.target.checked) {
                this._useCenterRepulsiveForce = true;
                centerRepulsiveForceInput.readOnly = false;
            }
            else {
                this._useCenterRepulsiveForce = false;
                centerRepulsiveForceInput.readOnly = true;
            }
        });
        centerRepulsiveForceInput.addEventListener('input', function(event) {
            if (event.target.value < 0) event.target.value *= -1;
            this._centerRepulsiveForceValue = event.target.value;
        });
        // elastic force
        const sliderElasticConstant = document.getElementById('slider-elastic-constant');
        const sliderElasticConstantValue = document.getElementById('slider-elastic-constant-value');
        sliderElasticConstant.value = this._elasticConstant;
        sliderElasticConstantValue.textContent = this._elasticConstant;
        sliderElasticConstant.addEventListener('input', function(event) {
            sliderElasticConstantValue.textContent = event.target.value;
            this._elasticConstant = event.target.value;
        });
        const baseSprintLengthInput = document.getElementById('base-spring-length');
        baseSprintLengthInput.value = this._baseSpringLength;
        baseSprintLengthInput.addEventListener('input', function(event) {
            if (event.target.value < 0) event.target.value *= -1;
            this._baseSpringLength = event.target.value;
        });
        // electrostatic force
        const electroStaticConstantInput = document.getElementById('electro-static-constant');
        electroStaticConstantInput.value = this._electrostaticConstant;
        electroStaticConstantInput.addEventListener('input', function(event) {
            if (event.target.value < 0) event.target.value *= -1;
            this._electrostaticConstant = event.target.value;
        });
        // timer between layers
        const timeBetweenLayersInput = document.getElementById('time-between-layers');
        timeBetweenLayersInput.value = this._timeoutBetweenLayers;
        timeBetweenLayersInput.addEventListener('input', function(event) {
            if (event.target.value < 0) event.target.value *= -1;
            this._timeoutBetweenLayers = event.target.value;
        });
    }
}