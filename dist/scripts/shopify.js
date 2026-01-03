document.addEventListener('DOMContentLoaded', () => {
    const btnFetchData = document.getElementById('btn-fetch-data');
    const btnClearShop = document.getElementById('btn-clear-shop');
    const periodDropdown = document.getElementById('period-dropdown');
    let selectedPeriod = 10; // Default period

    // Function to fetch and display financial data
    async function fetchFinancialData() {
        const shopName = localStorage.getItem('shopName');
        const userId = localStorage.getItem('userId'); // Assuming you store userId in localStorage upon login

        if (!shopName || !userId) {
            document.getElementById('total-revenue').textContent = 'No Shop';
            document.getElementById('total-orders').textContent = 'Please add your shop credentials in Settings.';
            document.getElementById('customer-count').textContent = '-';
            document.getElementById('product-count').textContent = '-';
            document.getElementById('revenue-growth-rate').textContent = '';
            document.getElementById('profit').textContent = '';
            document.getElementById('valuation-change').textContent = '';
            console.log("User ID or Shop name not found in local storage. Please save your credentials.");
            return;
        }

        try {
            const response = await fetch('/api/fetchFinancialSummary', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId,
                    shopName,
                    period: selectedPeriod
                }),
                mode: 'cors'
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('Failed to fetch financial summary. Status:', response.status, 'Error:', errorData.error);
                document.getElementById('total-orders').textContent = errorData.error || `Request failed: ${response.statusText}`;
                document.getElementById('total-revenue').textContent = 'Error!';
                return;
            }

            const result = await response.json();
            if (result.success) {
                const data = result.data;
                document.getElementById('total-revenue').textContent = `$${data.totalRevenue.toFixed(2)}`;
                document.getElementById('total-orders').textContent = data.orders.length;
                document.getElementById('customer-count').textContent = data.customerCount;
                document.getElementById('product-count').textContent = data.productCount;
                document.getElementById('revenue-growth-rate').textContent = data.revenueGrowthRate;
                document.getElementById('profit').textContent = `$${data.profitPeriod2.toFixed(2)}`;
                document.getElementById('valuation-change').textContent = data.valuationChangeIndicator;
            } else {
                console.error('Error fetching financial data:', result.error);
                document.getElementById('total-revenue').textContent = 'Error!';
                document.getElementById('total-orders').textContent = result.error;
            }
        } catch (error) {
            console.error('Error:', error);
            document.getElementById('total-revenue').textContent = 'Error!';
            document.getElementById('total-orders').textContent = "A client-side error occurred.";
        }
    }

    // --- Event Listeners ---

    if (btnFetchData) {
        btnFetchData.addEventListener('click', fetchFinancialData);
    }

    document.querySelectorAll('.dropdown-item[data-period]').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            selectedPeriod = parseInt(e.target.getAttribute('data-period'));
            periodDropdown.textContent = e.target.textContent;
            fetchFinancialData();
        });
    });

    if (btnClearShop) {
        btnClearShop.addEventListener('click', () => {
            localStorage.removeItem('shopName');

            if (window.updateProfileDisplay) {
                window.updateProfileDisplay();
            }

            // Clear the financial data display
            document.getElementById('total-revenue').textContent = '';
            document.getElementById('total-orders').textContent = '';
            document.getElementById('customer-count').textContent = '';
            document.getElementById('product-count').textContent = '';
            document.getElementById('revenue-growth-rate').textContent = '';
            document.getElementById('profit').textContent = '';
            document.getElementById('valuation-change').textContent = '';
        });
    }

    // Automatically fetch data on page load if a shop name is saved
    fetchFinancialData();
});