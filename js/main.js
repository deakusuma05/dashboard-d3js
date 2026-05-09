import { appState, loadDataFromCSV, subscribe } from "./core/state.js";
import { setupFilters, onFilterChange, filterFlatData, activeFilters } from "./core/filters.js";
import { aggregateToHierarchy } from "./core/csv-parser.js";
import { renderRadialTree } from "./charts/radial-tree.js";

let isDataLoaded = false;

function updateVisualizations() {
    if (!isDataLoaded || !appState.rawData) return;
    
    // Apply filters to flat data
    const filteredFlat = filterFlatData(appState.rawData);
    // Aggregate to hierarchy
    appState.filteredData = aggregateToHierarchy(filteredFlat);
    
    renderCurrentView();
    updateOverviewText(filteredFlat);
}

function updateOverviewText(filteredFlat) {
    const totalSales = filteredFlat.reduce((sum, d) => sum + d.Sales, 0);
    const totalSalesStr = '$' + totalSales.toLocaleString();
    document.getElementById('overview-total-sales').textContent = totalSalesStr;

    const { years, regions, categories } = activeFilters;
    
    let text = `<p>Menampilkan data penjualan untuk tahun <strong>${years.join(', ')}</strong> di wilayah <strong>${regions.join(', ')}</strong>.</p>`;
    
    if (categories.length < 3) {
        text += `<p>Kategori yang difilter: <strong>${categories.join(', ')}</strong>.</p>`;
    } else {
        text += `<p>Semua kategori produk sedang ditampilkan.</p>`;
    }
    
    text += `<p>Total dari <strong>${filteredFlat.length}</strong> transaksi memenuhi kriteria filter.</p>`;

    document.getElementById('dynamic-overview-text').innerHTML = text;
}

function renderCurrentView() {
    if (!isDataLoaded) return;
    
    if (appState.currentView === "radialtree") {
        renderRadialTree(appState.filteredData, "chart-container");
    }
}

subscribe(({ key }) => {
    if (key === "currentView") {
        renderCurrentView();
    }
});

onFilterChange(() => {
    updateVisualizations();
});

async function init() {
    setupFilters();
    
    makeDraggable('.overview-card');
    makeDraggable('.legend-card');
    
    // Setup Filter Toggle logic
    const filterBtn = document.getElementById('filter-toggle-btn');
    const filterDropdown = document.getElementById('filter-dropdown');
    if (filterBtn && filterDropdown) {
        filterBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            filterDropdown.classList.toggle('hidden');
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!filterDropdown.contains(e.target) && !filterBtn.contains(e.target)) {
                filterDropdown.classList.add('hidden');
            }
        });
        
        // Prevent closing when clicking inside the dropdown
        filterDropdown.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    }
    
    try {
        await loadDataFromCSV('superstore.csv');
        isDataLoaded = true;
        renderCurrentView();
        updateVisualizations(); // trigger initial overview calculation
    } catch (error) {
        document.getElementById("chart-container").innerHTML = `<div style="color: red; padding: 20px;">Error loading data: ${error.message}</div>`;
    }
}

function makeDraggable(selector) {
    const elmnt = document.querySelector(selector);
    if (!elmnt) return;

    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;

    elmnt.onmousedown = dragMouseDown;

    function dragMouseDown(e) {
        e = e || window.event;
        if (e.target.tagName.toLowerCase() === 'input' || e.target.tagName.toLowerCase() === 'button') return;
        
        e.preventDefault();
        pos3 = e.clientX;
        pos4 = e.clientY;
        document.onmouseup = closeDragElement;
        document.onmousemove = elementDrag;
        elmnt.style.boxShadow = "0 25px 50px rgba(0,0,0,0.2)";
    }

    function elementDrag(e) {
        e = e || window.event;
        e.preventDefault();
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;
        elmnt.style.top = (elmnt.offsetTop - pos2) + "px";
        elmnt.style.left = (elmnt.offsetLeft - pos1) + "px";
        elmnt.style.right = 'auto'; 
        elmnt.style.transform = 'none'; 
    }

    function closeDragElement() {
        document.onmouseup = null;
        document.onmousemove = null;
        elmnt.style.boxShadow = "0 15px 35px rgba(0,0,0,0.1)";
    }
}

// Start the app
init();
