export function parseCSVData(csvText) {
    const parser = d3.dsvFormat(";");
    const rawData = parser.parse(csvText, (d) => {
        // Parse Sales: replace comma with dot and parse float
        let salesVal = 0;
        if (d.Sales) {
            salesVal = parseFloat(d.Sales.replace(/,/g, '.'));
            if (isNaN(salesVal)) salesVal = 0;
        }

        const monthNames = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const monthNum = parseInt(d["Month "], 10);
        const monthStr = (monthNum >= 1 && monthNum <= 12) ? monthNames[monthNum] : d["Month "];

        return {
            Year: d.Year,
            Quarter: d.Quartal,
            Month: monthStr,
            Country: d["Country/Region"],
            Region: d.Region,
            Category: d.Category,
            SubCategory: d["Sub-Category"],
            Sales: salesVal
        };
    });
    return rawData;
}

export function aggregateToHierarchy(flatData) {
    // Group by: Region -> Quarter -> Month -> Category -> SubCategory -> sum(Sales)
    const grouped = d3.rollup(flatData, 
        v => d3.sum(v, d => d.Sales),
        d => d.Region,
        d => d.Quarter,
        d => d.Month,
        d => d.Category,
        d => d.SubCategory
    );

    function mapToChildren(mapObj, depth) {
        if (!(mapObj instanceof Map)) {
            return mapObj;
        }

        const children = [];
        for (let [key, value] of mapObj.entries()) {
            if (depth === 4) {
                // Leaf level (SubCategory)
                children.push({ name: key, value: value });
            } else {
                children.push({ name: key, children: mapToChildren(value, depth + 1) });
            }
        }
        return children;
    }

    return {
        name: "All Sales",
        children: mapToChildren(grouped, 0)
    };
}
