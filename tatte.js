class TatteDrawer {
    constructor(root, drawingArea) {
        this._root = root;
        this._drawingArea = drawingArea;
        this._nodes = [];
        let depthMap = createDepthMap(root);
        for (let depth of depthMap.keys())
            this._nodes.push(...depthMap.get(depth));
        this._leafs = inorderLeafVisit(root);
        this._depthMap = depthMap;
        this._initializeButtons();
    }

    _computeForce(node) {
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

    _updateNodes() {
        let totalForce = 0.0;
        this._nodes.forEach((node) => {
            const force = this._computeForce(node);
            node.x += force.x;
            node.y += force.y;
            totalForce += (Math.abs(totalForceX) + Math.abs(totalForceY));
        });
        return totalForce < 0.1;
    }

    _drawNodesOfDepth(nodesAnimationDuration, linksAnimationDuration) {
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
            didNodesConverge = this._updateNodes();
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
    
    _drawLinks(linksAnimationDuration) {
        this._drawingArea.selectAll(".newLinks")
            .data(this._nodes)
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
        assignRandomInitialPositions(this._depthMap);
        this._drawNodesOfDepth(nodesAnimationDuration, linksAnimationDuration);
        displayNumberOfCollisions(this._root);
    }

    hideAllButtons() {

    }

    showAllButtons() {
        
    }

    _initializeButtons() {
        
    }
}