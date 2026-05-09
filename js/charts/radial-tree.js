export function renderRadialTree(data, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    // Clear previous chart
    container.innerHTML = '';
    d3.select("#d3-tooltip").remove();

    if (!data || !data.children || data.children.length === 0) {
        container.innerHTML = `<div style="display:flex; justify-content:center; align-items:center; height:100%; color:white;">No data matches the selected filters.</div>`;
        return;
    }

    const width = container.clientWidth;
    const margin = { top: 40, right: 40, bottom: 40, left: 40 };

    // Calculate a large radius based primarily on width so it can scroll vertically
    const radius = Math.max(400, (width - 700) / 2); 
    const svgHeight = radius * 2 + margin.top + margin.bottom + 120; // Ensure enough vertical space

    const tooltip = d3.select("body").append("div")
        .attr("id", "d3-tooltip")
        .attr("class", "d3-tooltip");

    const svg = d3.select(`#${containerId}`).append("svg")
        .attr("width", width)
        .attr("height", svgHeight)
        .append("g")
        .attr("transform", `translate(${width / 2},${svgHeight / 2})`);

    const tree = d3.tree()
        .size([2 * Math.PI, radius])
        .separation((a, b) => (a.parent == b.parent ? 1 : 2) / a.depth);

    const root = d3.hierarchy(data);
    root.sum(d => d.value ? d.value : 0);
    tree(root);

    // Calculate dynamic scale for leaf nodes
    const leaves = root.leaves();
    const maxVal = d3.max(leaves, d => d.value) || 1;
    const radiusScale = d3.scaleSqrt()
        .domain([0, maxVal])
        .range([5, 40]); // Max radius is bounded to 40px

    const link = d3.linkRadial()
        .angle(d => d.x)
        .radius(d => d.y);

    // Draw Links
    svg.append("g")
        .selectAll("path")
        .data(root.links())
        .join("path")
        .attr("class", "link")
        .attr("d", link);

    // Draw Nodes
    const nodeGroup = svg.append("g")
        .selectAll("g")
        .data(root.descendants())
        .join("g")
        .attr("class", "node")
        .attr("transform", d => `rotate(${d.x * 180 / Math.PI - 90}) translate(${d.y},0)`);

    // Color logic
    function getNodeColor(d) {
        if (d.depth === 0) return "#2B3A67"; // Root
        if (d.depth === 1) return "#94A3B8"; // Region
        
        let quarter = "";
        if (d.depth === 2) quarter = d.data.name;
        if (d.depth === 3) quarter = d.parent.data.name;

        if (quarter === "Q1") return "#70B8D9"; // Light blue
        if (quarter === "Q2") return "#E4C1D9"; // Soft pink
        if (quarter === "Q3") return "#88D8E0"; // Node blue
        if (quarter === "Q4") return "#FFAEC9"; // Another soft pink
        
        let catName = "";
        if (d.depth === 4) catName = d.data.name;
        else if (d.depth === 5) catName = d.parent.data.name;

        if (catName === "Technology") return "#06B6D4"; // Cyan
        if (catName === "Furniture") return "#F43F5E";  // Rose Red
        if (catName === "Office Supplies") return "#F59E0B"; // Amber Yellow
        
        return "#FFFFFF";
    }

    function getRadius(d) {
        if (d.depth === 0) return 30;
        if (d.depth === 1) return 15;
        if (d.depth === 2) return 10;
        if (d.depth === 3) return 8;
        if (d.depth === 4) return 6;
        // Leaf node (Subcategory) depth 5 mapped to scaleSqrt
        return radiusScale(d.value);
    }

    nodeGroup.append("circle")
        .attr("fill", d => getNodeColor(d))
        .attr("r", d => getRadius(d))
        .on("mouseover", function(event, d) {
            d3.select(this)
                .transition()
                .duration(200)
                .attr("stroke-width", "4px")
                .attr("r", d => getRadius(d) * 1.2);
                
            let htmlContent = `<strong>${d.data.name}</strong>`;
            if (d.value) {
                // If it's a leaf node, show its value directly
                htmlContent += `<div class="value" style="color:${getNodeColor(d)}">$${d.value.toLocaleString()}</div>`;
            }
            if (d.depth === 5) {
                htmlContent += `<div style="color:#64748B">${d.parent.data.name} - ${d.parent.parent.parent.parent.data.name} ${d.parent.parent.parent.data.name} ${d.parent.parent.data.name}</div>`;
            } else if (d.depth === 4) {
                htmlContent += `<div style="color:#64748B">${d.parent.parent.parent.data.name} ${d.parent.parent.data.name} ${d.parent.data.name}</div>`;
            }

            tooltip.transition().duration(200).style("opacity", 1);
            tooltip.html(htmlContent)
                .style("left", (event.pageX + 15) + "px")
                .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", function(event, d) {
            d3.select(this)
                .transition()
                .duration(200)
                .attr("stroke-width", "2px")
                .attr("r", d => getRadius(d));
                
            tooltip.transition().duration(500).style("opacity", 0);
        });

    // Add Labels
    nodeGroup.append("text")
        .attr("dy", "0.31em")
        .attr("x", d => d.x < Math.PI === !d.children ? 10 + (d.depth===5 ? getRadius(d) : 0) : -10 - (d.depth===5 ? getRadius(d) : 0))
        .attr("text-anchor", d => d.x < Math.PI === !d.children ? "start" : "end")
        .attr("transform", d => {
            if (d.depth === 0) return "rotate(90)";
            return d.x >= Math.PI ? "rotate(180)" : null;
        })
        .text(d => d.data.name);
}
