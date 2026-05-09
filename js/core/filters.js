import { appState } from "./state.js";

export const activeFilters = {
    years: ["2023", "2024", "2025", "2026"],
    regions: ["Central", "East", "South", "West"],
    categories: ["Furniture", "Office Supplies", "Technology"],
    subcategories: ["Art", "Storage", "Phones"],
    minSales: 0
};

const filterListeners = [];

export function onFilterChange(listener) {
    filterListeners.push(listener);
}

function notifyFilterChange() {
    filterListeners.forEach(listener => listener());
}

export function filterFlatData(flatData) {
    if (!flatData || flatData.length === 0) return [];

    return flatData.filter(d => {
        // Year filter (CSV Year column might be string or number, so == comparison or cast)
        const passYear = activeFilters.years.includes(String(d.Year));
        
        // Region filter
        const passRegion = activeFilters.regions.includes(d.Region);
        
        // Category filter
        const passCategory = activeFilters.categories.includes(d.Category);
        
        // SubCategory filter
        const passSubCategory = activeFilters.subcategories.includes(d.SubCategory);
        
        // Sales filter (at transaction level? Or wait, sales filter is better applied at the aggregate level for subcategories. 
        // But the user requested "SALES RANGE" filter. Usually, this means the sum of sales for that subcategory, OR the individual transaction.
        // In the previous version, we filtered subcategories by their SUM. 
        // Let's filter transaction sales here if they meant transaction size, or we can filter the tree later.
        // Let's keep the Subcategory Sales Sum filter in the aggregate step or we can filter transactions.
        // Actually, the previous implementation filtered the leaf nodes (Subcategories) after summing. 
        // We will just filter transactions here by `minSales`, which means only transactions > minSales are included.
        // Wait, the previous implementation applied minSales to the total value of the Subcategory.
        // Let's do transaction-level filter here. It's more standard for raw data.
        const passSales = d.Sales >= activeFilters.minSales;

        return passYear && passRegion && passCategory && passSubCategory && passSales;
    });
}

export function setupFilters() {
    // Checkbox helper
    const setupCheckboxGroup = (selector, filterKey) => {
        document.querySelectorAll(selector).forEach(cb => {
            cb.addEventListener('change', (e) => {
                if (e.target.checked) {
                    if (!activeFilters[filterKey].includes(e.target.value)) activeFilters[filterKey].push(e.target.value);
                } else {
                    activeFilters[filterKey] = activeFilters[filterKey].filter(v => v !== e.target.value);
                }
                notifyFilterChange();
            });
        });
    };

    setupCheckboxGroup('.year-filter', 'years');
    setupCheckboxGroup('.region-filter', 'regions');
    setupCheckboxGroup('.category-filter', 'categories');
    setupCheckboxGroup('.subcategory-filter', 'subcategories');

    // Sales Range Slider (with basic debounce to prevent freezing)
    const rangeSlider = document.getElementById('sales-range');
    const rangeVal = document.getElementById('range-val');
    let debounceTimer;
    if (rangeSlider && rangeVal) {
        rangeSlider.addEventListener('input', (e) => {
            const val = parseInt(e.target.value);
            rangeVal.textContent = `Min: $${val}`;
            
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                activeFilters.minSales = val;
                notifyFilterChange();
            }, 100);
        });
    }

    // Reset button
    const resetBtn = document.getElementById('reset-btn');
    if (resetBtn) {
        resetBtn.addEventListener('click', resetFilters);
    }
}

export function resetFilters() {
    activeFilters.years = ["2023", "2024", "2025", "2026"];
    activeFilters.regions = ["Central", "East", "South", "West"];
    activeFilters.categories = ["Furniture", "Office Supplies", "Technology"];
    activeFilters.subcategories = ["Art", "Storage", "Phones"];
    activeFilters.minSales = 0;
    
    document.querySelectorAll('.year-filter, .region-filter, .category-filter, .subcategory-filter').forEach(cb => {
        cb.checked = true;
    });
    
    const rangeSlider = document.getElementById('sales-range');
    if (rangeSlider) {
        rangeSlider.value = 0;
        document.getElementById('range-val').textContent = `Min: $0`;
    }
    
    notifyFilterChange();
}
