// Simplified admin panel without login
document.addEventListener('DOMContentLoaded', function() {
    // Configuration
    const API_BASE_URL = 'https://boetepot-api.vercel.app/api';
    
    // Debug flag - set to true for console logs
    const DEBUG = true;
    
    // DOM Elements
    const themeToggle = document.getElementById('themeToggle');
    const themeIcon = document.getElementById('themeIcon');
    
    // Dark mode handling - simplified approach
    function initTheme() {
        // Check for saved theme preference or use system preference
        const savedTheme = localStorage.getItem('theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
            enableDarkMode();
        } else {
            disableDarkMode();
        }
        
        // Log theme status
        debug(`Theme initialized: ${document.documentElement.classList.contains('dark') ? 'dark' : 'light'}`);
    }
    
    function toggleTheme() {
        const isDark = document.documentElement.classList.contains('dark');
        debug(`Toggling theme from ${isDark ? 'dark' : 'light'} to ${!isDark ? 'dark' : 'light'}`);
        
        if (isDark) {
            disableDarkMode();
            localStorage.setItem('theme', 'light');
        } else {
            enableDarkMode();
            localStorage.setItem('theme', 'dark');
        }
    }
    
    function enableDarkMode() {
            document.documentElement.classList.add('dark');
        document.body.classList.add('dark');
            if (themeIcon) {
                themeIcon.classList.remove('fa-moon');
                themeIcon.classList.add('fa-sun');
            }
        updateSelect2Theme(true);
        debug('Dark mode enabled');
    }
    
    function disableDarkMode() {
        document.documentElement.classList.remove('dark');
        document.body.classList.remove('dark');
            if (themeIcon) {
                themeIcon.classList.remove('fa-sun');
                themeIcon.classList.add('fa-moon');
            }
        updateSelect2Theme(false);
        debug('Dark mode disabled');
    }
    
    function updateSelect2Theme(isDark) {
        // Force Select2 to adopt the current theme
        setTimeout(() => {
            const select2Containers = document.querySelectorAll('.select2-container');
            select2Containers.forEach(container => {
                const selection = container.querySelector('.select2-selection');
                if (selection) {
                    if (isDark) {
                        selection.style.backgroundColor = 'var(--input-bg)';
                        selection.style.borderColor = 'var(--input-border)';
                        selection.style.color = 'var(--input-text)';
        } else {
                        selection.style.backgroundColor = '';
                        selection.style.borderColor = '';
                        selection.style.color = '';
                    }
                }
            });
        }, 100);
    }
    
    // Utility Functions
    function debug(message) {
        if (DEBUG) {
            console.log(`[DEBUG] ${message}`);
            const debugStatus = document.getElementById('debugStatus');
            if (debugStatus) {
                debugStatus.textContent += `\n${message}`;
            }
        }
    }
    
function formatCurrency(amount) {
    return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(amount);
}

function formatDate(dateString) {
  if (!dateString) return 'Onbekend';
  try {
    const date = new Date(dateString);
        return new Intl.DateTimeFormat('nl-NL', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }).format(date);
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Ongeldige datum';
  }
}

    function showLoading(show = true) {
        const spinner = document.getElementById('loadingSpinner');
        if (spinner) {
    if (show) {
                spinner.classList.remove('hidden');
                spinner.classList.add('flex');
    } else {
                spinner.classList.remove('flex');
                spinner.classList.add('hidden');
            }
        }
    }
    
    function showToast(message, type = 'info') {
        const toastContainer = document.getElementById('toastContainer');
        if (!toastContainer) return;

        const toast = document.createElement('div');
        toast.className = `p-4 mb-3 rounded-lg shadow-lg flex items-center justify-between max-w-md transition-all duration-500 transform translate-x-full opacity-0`;
        
        // Set color based on type
        if (type === 'success') {
            toast.classList.add('bg-green-500', 'text-white');
        } else if (type === 'error') {
            toast.classList.add('bg-red-500', 'text-white');
        } else {
            toast.classList.add('bg-blue-500', 'text-white');
        }
        
        toast.innerHTML = `
            <div class="flex items-center">
                <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'} mr-3"></i>
                <span>${message}</span>
            </div>
            <button class="ml-4 text-white focus:outline-none">
                    <i class="fas fa-times"></i>
                </button>
            `;
        
        toastContainer.appendChild(toast);
        
        // Animation
  setTimeout(() => {
            toast.classList.remove('translate-x-full', 'opacity-0');
        }, 10);
        
        // Close button functionality
        const closeBtn = toast.querySelector('button');
        closeBtn.addEventListener('click', () => {
            toast.classList.add('translate-x-full', 'opacity-0');
            setTimeout(() => {
                toast.remove();
            }, 500);
        });
        
        // Auto close after 5 seconds
        setTimeout(() => {
            toast.classList.add('translate-x-full', 'opacity-0');
            setTimeout(() => {
                toast.remove();
            }, 500);
        }, 5000);
    }
    
    // Tab functionality
    function setupTabs() {
        const tabBoetes = document.getElementById('tab-boetes');
        const tabBeheer = document.getElementById('tab-beheer');
        const finesTab = document.getElementById('finesTab');
        const beheerTab = document.getElementById('beheerTab');
        
        // Check if elements exist
        if (!tabBoetes || !tabBeheer || !finesTab || !beheerTab) {
            debug('Tab elements missing!');
            return;
        }
        
        function activateTab(tabId) {
            // Reset all tabs
            [tabBoetes, tabBeheer].forEach(tab => {
                tab.classList.remove('tab-active');
            });
            
            // Hide all content
            [finesTab, beheerTab].forEach(content => {
                content.classList.add('hidden');
            });
            
            // Activate selected tab
            if (tabId === 'beheer') {
                tabBeheer.classList.add('tab-active');
                beheerTab.classList.remove('hidden');
                localStorage.setItem('activeTab', 'beheer');
            } else {
                // Default to fines tab
                tabBoetes.classList.add('tab-active');
                finesTab.classList.remove('hidden');
                localStorage.setItem('activeTab', 'boetes');
            }
        }
        
        // Set default active tab from localStorage or default to fines
        const activeTab = localStorage.getItem('activeTab') || 'boetes';
        activateTab(activeTab);
        
        // Add click event listeners
        tabBoetes.addEventListener('click', () => activateTab('boetes'));
        tabBeheer.addEventListener('click', () => activateTab('beheer'));
    }
    
    // API & Data Functions - Improved approach with better error handling and CORS fixes
    async function apiRequest(endpoint, method = 'GET', data = null) {
        try {
            const url = `${API_BASE_URL}${endpoint}`;
            const options = {
                method,
                headers: {
                    'Content-Type': 'application/json'
                },
                mode: 'cors',
                credentials: 'omit' // Changed from 'same-origin' to fix CORS issues
            };
            
            if (data && (method === 'POST' || method === 'PUT')) {
                options.body = JSON.stringify(data);
            }
            
            debug(`Making ${method} request to ${url}`);
            showLoading(true);
            
            // Check if we should use mock data (if API is failing)
            const useMockData = localStorage.getItem('useMockData') === 'true';
            if (useMockData) {
                debug('Using mock data instead of API call');
                return getMockDataForEndpoint(endpoint, method, data);
            }
            
            const response = await fetch(url, options);
            
            if (!response.ok) {
                let errorMessage = `API error: ${response.status}`;
                try {
                    const errorData = await response.json();
                    if (errorData && errorData.message) {
                        errorMessage = errorData.message;
                    }
                } catch (e) {
                    // Ignore JSON parsing errors
                }
                throw new Error(errorMessage);
            }
            
            const responseData = await response.json();
            return responseData;
        } catch (error) {
            debug(`API Error: ${error.message}`);
            
            // On first API error, enable mock data
            if (error.message === 'Failed to fetch') {
                debug('API server unreachable, enabling mock data');
                localStorage.setItem('useMockData', 'true');
                showToast('API server is unavailable. Using local data instead.', 'warning');
                
                // Return mock data for this call
                return getMockDataForEndpoint(endpoint, method, data);
            }
            
            showToast(`API Error: ${error.message}`, 'error');
            throw error;
        } finally {
            showLoading(false);
        }
    }
    
    // Function to get mock data for endpoints when API is unavailable
    function getMockDataForEndpoint(endpoint, method, data) {
        debug(`Getting mock data for ${method} ${endpoint}`);
        
        // Initialize mock data storage if it doesn't exist
        if (!localStorage.getItem('mockPlayers')) {
            localStorage.setItem('mockPlayers', JSON.stringify([
                { id: 1, name: 'Marnix' },
                { id: 2, name: 'Ivar' },
                { id: 3, name: 'Jarno' },
                { id: 4, name: 'Lars B' },
                { id: 5, name: 'Lars R' }
            ]));
        }
        
        if (!localStorage.getItem('mockReasons')) {
            localStorage.setItem('mockReasons', JSON.stringify([
                { id: 1, description: 'Te laat' },
                { id: 2, description: 'Corvee vergeten' },
                { id: 3, description: 'Geen Polo' }
            ]));
        }
        
        if (!localStorage.getItem('mockFines')) {
            localStorage.setItem('mockFines', JSON.stringify([
                { id: 1, player_id: 1, reason_id: 1, player_name: 'Marnix', reason_description: 'Te laat', amount: 5, created_at: new Date().toISOString() },
                { id: 2, player_id: 2, reason_id: 2, player_name: 'Ivar', reason_description: 'Corvee vergeten', amount: 10, created_at: new Date(Date.now() - 86400000).toISOString() }
            ]));
        }
        
        // Get data from localStorage
        const mockPlayers = JSON.parse(localStorage.getItem('mockPlayers') || '[]');
        const mockReasons = JSON.parse(localStorage.getItem('mockReasons') || '[]');
        const mockFines = JSON.parse(localStorage.getItem('mockFines') || '[]');
        
        // Handle GET requests
        if (method === 'GET') {
            if (endpoint === '/players') {
                return [...mockPlayers];
            } else if (endpoint === '/reasons') {
                return [...mockReasons];
            } else if (endpoint === '/fines') {
                return [...mockFines];
            } else if (endpoint.startsWith('/fines/')) {
                const id = parseInt(endpoint.split('/')[2]);
                return mockFines.find(fine => fine.id === id) || null;
            } else if (endpoint.startsWith('/players/')) {
                const id = parseInt(endpoint.split('/')[2]);
                return mockPlayers.find(player => player.id === id) || null;
            } else if (endpoint.startsWith('/reasons/')) {
                const id = parseInt(endpoint.split('/')[2]);
                return mockReasons.find(reason => reason.id === id) || null;
            }
        } 
        // Handle POST requests
        else if (method === 'POST') {
            if (endpoint === '/players' && data) {
                const newPlayer = {
                    id: mockPlayers.length > 0 ? Math.max(...mockPlayers.map(p => p.id)) + 1 : 1,
                    name: data.name
                };
                mockPlayers.push(newPlayer);
                localStorage.setItem('mockPlayers', JSON.stringify(mockPlayers));
                return newPlayer;
            } else if (endpoint === '/reasons' && data) {
                const newReason = {
                    id: mockReasons.length > 0 ? Math.max(...mockReasons.map(r => r.id)) + 1 : 1,
                    description: data.description
                };
                mockReasons.push(newReason);
                localStorage.setItem('mockReasons', JSON.stringify(mockReasons));
                return newReason;
            } else if (endpoint === '/fines' && data) {
                const player = mockPlayers.find(p => p.id === parseInt(data.player_id)) || { name: 'Unknown' };
                const reason = mockReasons.find(r => r.id === parseInt(data.reason_id)) || { description: 'Unknown' };
                
                const newFine = {
                    id: mockFines.length > 0 ? Math.max(...mockFines.map(f => f.id)) + 1 : 1,
                    player_id: parseInt(data.player_id),
                    reason_id: parseInt(data.reason_id),
                    player_name: player.name,
                    reason_description: reason.description,
                    amount: parseFloat(data.amount),
                    created_at: new Date().toISOString()
                };
                mockFines.push(newFine);
                localStorage.setItem('mockFines', JSON.stringify(mockFines));
                return newFine;
            } else if (endpoint === '/reset') {
                localStorage.removeItem('mockPlayers');
                localStorage.removeItem('mockReasons');
                localStorage.removeItem('mockFines');
                return { message: 'All data reset' };
            }
        } 
        // Handle DELETE requests
        else if (method === 'DELETE') {
            if (endpoint.startsWith('/fines/')) {
                const id = parseInt(endpoint.split('/')[2]);
                const index = mockFines.findIndex(fine => fine.id === id);
                if (index !== -1) {
                    mockFines.splice(index, 1);
                    localStorage.setItem('mockFines', JSON.stringify(mockFines));
                    return { message: 'Fine deleted' };
                }
            } else if (endpoint.startsWith('/players/')) {
                const id = parseInt(endpoint.split('/')[2]);
                const index = mockPlayers.findIndex(player => player.id === id);
                if (index !== -1) {
                    mockPlayers.splice(index, 1);
                    localStorage.setItem('mockPlayers', JSON.stringify(mockPlayers));
                    
                    // Also remove related fines
                    const newFines = mockFines.filter(fine => fine.player_id !== id);
                    localStorage.setItem('mockFines', JSON.stringify(newFines));
                    return { message: 'Player deleted' };
                }
            } else if (endpoint.startsWith('/reasons/')) {
                const id = parseInt(endpoint.split('/')[2]);
                const index = mockReasons.findIndex(reason => reason.id === id);
                if (index !== -1) {
                    mockReasons.splice(index, 1);
                    localStorage.setItem('mockReasons', JSON.stringify(mockReasons));
                    
                    // Also remove related fines
                    const newFines = mockFines.filter(fine => fine.reason_id !== id);
                    localStorage.setItem('mockFines', JSON.stringify(newFines));
                    return { message: 'Reason deleted' };
                }
            }
        }
        
        // Default fallback for unknown endpoints
        return [];
    }
    
    // Data loading functions
    async function loadPlayers() {
        try {
            const players = await apiRequest('/players');
            populatePlayerSelect(players);
            renderPlayersList(players);
            return players;
        } catch (error) {
            debug(`Failed to load players: ${error.message}`);
            return [];
        }
    }
    
    async function loadReasons() {
        try {
            const reasons = await apiRequest('/reasons');
            populateReasonSelect(reasons);
            renderReasonsList(reasons);
            return reasons;
        } catch (error) {
            debug(`Failed to load reasons: ${error.message}`);
            return [];
        }
    }
    
    async function loadFines() {
        try {
            const fines = await apiRequest('/fines');
            renderFinesList(fines);
            return fines;
  } catch (error) {
            debug(`Failed to load fines: ${error.message}`);
            return [];
        }
    }
    
    async function loadAllData() {
        debug('Loading all data...');
        try {
            await Promise.all([
                loadPlayers(),
                loadReasons(),
                loadFines()
            ]);
        debug('All data loaded successfully');
  } catch (error) {
        debug(`Error loading data: ${error.message}`);
            showToast('Er is een fout opgetreden bij het laden van gegevens', 'error');
        }
    }
    
    function clearAllData() {
        // Clear UI elements
        const recentFines = document.getElementById('recentFines');
        const playersList = document.getElementById('playersList');
        const reasonsList = document.getElementById('reasonsList');
        
        if (recentFines) recentFines.innerHTML = '';
        if (playersList) playersList.innerHTML = '';
        if (reasonsList) reasonsList.innerHTML = '';
        
        // Reset selects
        const playerSelect = document.getElementById('playerSelect');
        const reasonSelect = document.getElementById('reasonSelect');
        if (playerSelect) playerSelect.innerHTML = '';
        if (reasonSelect) reasonSelect.innerHTML = '';
    }
    
    // UI Rendering Functions
    function populatePlayerSelect(players) {
        const select = document.getElementById('playerSelect');
        if (!select) return;
        
        select.innerHTML = '';
        
        // Add empty option
        const emptyOption = document.createElement('option');
        emptyOption.value = '';
        emptyOption.textContent = 'Selecteer een speler';
        select.appendChild(emptyOption);
        
        // Add player options
        players.forEach(player => {
            const option = document.createElement('option');
            option.value = player.id;
            option.textContent = player.name;
            select.appendChild(option);
        });
        
        // Initialize Select2
        try {
            $(select).select2({
                placeholder: "Selecteer een speler",
                allowClear: true,
                width: '100%'
            });
            
            // Update Select2 to match theme
            updateSelect2Theme(document.documentElement.classList.contains('dark'));
  } catch (error) {
            debug(`Error initializing Select2: ${error.message}`);
        }
    }
    
    function populateReasonSelect(reasons) {
        const select = document.getElementById('reasonSelect');
        if (!select) return;
        
        select.innerHTML = '';
        
        // Add empty option
        const emptyOption = document.createElement('option');
        emptyOption.value = '';
        emptyOption.textContent = 'Selecteer een reden';
        select.appendChild(emptyOption);
        
        // Add reason options
            reasons.forEach(reason => {
            const option = document.createElement('option');
            option.value = reason.id;
            option.textContent = reason.description;
            select.appendChild(option);
        });
        
        // Initialize Select2
        try {
            $(select).select2({
                placeholder: "Selecteer een reden",
                allowClear: true,
                width: '100%'
            });
            
            // Update Select2 to match theme
            updateSelect2Theme(document.documentElement.classList.contains('dark'));
    } catch (error) {
            debug(`Error initializing Select2: ${error.message}`);
        }
    }
    
    function renderFinesList(fines) {
        const container = document.getElementById('recentFines');
        if (!container) return;
        
        container.innerHTML = '';
        
        if (!fines || fines.length === 0) {
            container.innerHTML = `
                <div class="text-center py-8 text-gray-500 dark:text-gray-400">
                    <i class="fas fa-info-circle text-2xl mb-3"></i>
                    <p>Geen boetes gevonden.</p>
                </div>
            `;
      return;
    }
    
        // Sort fines by date (newest first)
        fines.sort((a, b) => new Date(b.created_at || b.date) - new Date(a.created_at || a.date));
        
        fines.forEach(fine => {
            createFineCard(container, fine);
        });
    }
    
    function createFineCard(container, fine) {
        const card = document.createElement('div');
        card.className = 'bg-gray-50 dark:bg-gray-900 rounded-lg p-4 mb-4 border border-gray-200 dark:border-gray-700';
        
        card.innerHTML = `
            <div class="flex justify-between items-start">
                <div>
                    <h3 class="font-semibold text-lg">${fine.player_name}</h3>
                    <p class="text-gray-600 dark:text-gray-300">${fine.reason_description}</p>
                    <p class="text-gray-500 dark:text-gray-400 text-sm mt-1">${formatDate(fine.created_at || fine.date)}</p>
                </div>
                <div class="flex items-center">
                    <span class="font-bold text-lg mr-4 text-blue-600 dark:text-blue-400">${formatCurrency(fine.amount)}</span>
                    <button data-fine-id="${fine.id}" class="delete-fine-btn text-red-500 hover:text-red-700">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
        
        // Add event listener for delete button
        const deleteBtn = card.querySelector('.delete-fine-btn');
        deleteBtn.addEventListener('click', async () => {
            if (confirm('Weet je zeker dat je deze boete wilt verwijderen?')) {
                await deleteFine(fine.id);
            }
        });
        
        container.appendChild(card);
    }
    
    function renderPlayersList(players) {
        const container = document.getElementById('playersList');
        if (!container) return;
        
        container.innerHTML = '';
        
        if (!players || players.length === 0) {
            container.innerHTML = `
                <div class="text-center py-8 text-gray-500 dark:text-gray-400">
                    <i class="fas fa-info-circle text-2xl mb-3"></i>
                    <p>Geen spelers gevonden.</p>
                </div>
            `;
    return;
  }
  
        // Sort players by name
        players.sort((a, b) => a.name.localeCompare(b.name));
        
        players.forEach(player => {
            const item = document.createElement('div');
            item.className = 'bg-gray-50 dark:bg-gray-900 rounded-lg p-4 mb-4 border border-gray-200 dark:border-gray-700 flex justify-between items-center';
            
            item.innerHTML = `
                <span class="font-medium">${player.name}</span>
                <button data-player-id="${player.id}" class="delete-player-btn text-red-500 hover:text-red-700">
                    <i class="fas fa-trash"></i>
                </button>
            `;
            
            // Add event listener for delete button
            const deleteBtn = item.querySelector('.delete-player-btn');
            deleteBtn.addEventListener('click', async () => {
                if (confirm(`Weet je zeker dat je "${player.name}" wilt verwijderen? Dit verwijdert ook alle bijbehorende boetes!`)) {
                    await deletePlayer(player.id);
                }
            });
            
            container.appendChild(item);
        });
    }
    
    function renderReasonsList(reasons) {
        const container = document.getElementById('reasonsList');
        if (!container) return;
        
        container.innerHTML = '';
        
        if (!reasons || reasons.length === 0) {
            container.innerHTML = `
                <div class="text-center py-8 text-gray-500 dark:text-gray-400">
                    <i class="fas fa-info-circle text-2xl mb-3"></i>
                    <p>Geen redenen gevonden.</p>
                </div>
            `;
    return;
  }
  
        // Sort reasons by description
        reasons.sort((a, b) => a.description.localeCompare(b.description));
        
        reasons.forEach(reason => {
            const item = document.createElement('div');
            item.className = 'bg-gray-50 dark:bg-gray-900 rounded-lg p-4 mb-4 border border-gray-200 dark:border-gray-700 flex justify-between items-center';
            
            item.innerHTML = `
                <span class="font-medium">${reason.description}</span>
                <button data-reason-id="${reason.id}" class="delete-reason-btn text-red-500 hover:text-red-700">
                    <i class="fas fa-trash"></i>
                </button>
            `;
            
            // Add event listener for delete button
            const deleteBtn = item.querySelector('.delete-reason-btn');
            deleteBtn.addEventListener('click', async () => {
                if (confirm(`Weet je zeker dat je "${reason.description}" wilt verwijderen? Dit verwijdert ook alle bijbehorende boetes!`)) {
                    await deleteReason(reason.id);
                }
            });
            
            container.appendChild(item);
        });
    }
    
    // CRUD Operations
    async function addFine(data) {
        try {
            await apiRequest('/fines', 'POST', data);
            showToast('Boete succesvol toegevoegd!', 'success');
            await loadFines(); // Reload fines
            return true;
        } catch (error) {
            debug(`Failed to add fine: ${error.message}`);
            return false;
        }
    }
    
    async function deleteFine(id) {
        try {
            await apiRequest(`/fines/${id}`, 'DELETE');
            showToast('Boete succesvol verwijderd!', 'success');
            await loadFines(); // Reload fines
            return true;
    } catch (error) {
            debug(`Failed to delete fine: ${error.message}`);
            return false;
        }
    }
    
    async function addPlayer(data) {
        try {
            await apiRequest('/players', 'POST', data);
            showToast('Speler succesvol toegevoegd!', 'success');
            await loadPlayers(); // Reload players
            return true;
        } catch (error) {
            debug(`Failed to add player: ${error.message}`);
        return false;
    }
    }
    
    async function deletePlayer(id) {
        try {
            await apiRequest(`/players/${id}`, 'DELETE');
            showToast('Speler succesvol verwijderd!', 'success');
            await Promise.all([loadPlayers(), loadFines()]); // Reload players and fines
    return true;
        } catch (error) {
            debug(`Failed to delete player: ${error.message}`);
            return false;
        }
    }
    
    async function addReason(data) {
        try {
            await apiRequest('/reasons', 'POST', data);
            showToast('Reden succesvol toegevoegd!', 'success');
            await loadReasons(); // Reload reasons
            return true;
  } catch (error) {
            debug(`Failed to add reason: ${error.message}`);
            return false;
        }
    }
    
    async function deleteReason(id) {
        try {
            await apiRequest(`/reasons/${id}`, 'DELETE');
            showToast('Reden succesvol verwijderd!', 'success');
            await Promise.all([loadReasons(), loadFines()]); // Reload reasons and fines
            return true;
            } catch (error) {
            debug(`Failed to delete reason: ${error.message}`);
            return false;
        }
    }
    
    async function resetAllData() {
        try {
            await apiRequest('/reset', 'POST');
            showToast('Alle data succesvol gereset!', 'success');
            await loadAllData(); // Reload all data
            return true;
  } catch (error) {
            debug(`Failed to reset data: ${error.message}`);
            return false;
        }
    }
    
    // Event Listeners
    function setupEventListeners() {
        // Theme toggle
        themeToggle.addEventListener('click', toggleTheme);
        
        // Add Fine Form
        const addFineForm = document.getElementById('addFineForm');
        if (addFineForm) {
            addFineForm.addEventListener('submit', async function(e) {
                e.preventDefault();
                
                const playerId = document.getElementById('playerSelect').value;
                const reasonId = document.getElementById('reasonSelect').value;
                const amount = document.getElementById('amount').value;
                
                if (!playerId) {
                    showToast('Selecteer een speler!', 'error');
                    return;
                }
                
                if (!reasonId) {
                    showToast('Selecteer een reden!', 'error');
                    return;
                }
                
                if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
                    showToast('Voer een geldig bedrag in!', 'error');
                    return;
                }
                
                const success = await addFine({
                    player_id: playerId,
                    reason_id: reasonId,
                    amount: parseFloat(amount)
                });
                
                if (success) {
                    // Reset form
                    document.getElementById('playerSelect').value = '';
                    document.getElementById('reasonSelect').value = '';
                    document.getElementById('amount').value = '';
                    
                    // Reset Select2
                    try {
                        $('#playerSelect').val('').trigger('change');
                        $('#reasonSelect').val('').trigger('change');
  } catch (error) {
                        debug(`Error resetting Select2: ${error.message}`);
                    }
                }
            });
        }
        
        // Add Player Form
        const addPlayerForm = document.getElementById('addPlayerForm');
        if (addPlayerForm) {
            addPlayerForm.addEventListener('submit', async function(e) {
                e.preventDefault();
                
                const playerName = document.getElementById('playerName').value.trim();
                
                if (!playerName) {
                    showToast('Voer een geldige naam in!', 'error');
        return;
    }
    
                const success = await addPlayer({
                    name: playerName
                });
                
                if (success) {
                    // Reset form
                    document.getElementById('playerName').value = '';
                }
            });
        }
        
        // Add Reason Form
        const addReasonForm = document.getElementById('addReasonForm');
        if (addReasonForm) {
            addReasonForm.addEventListener('submit', async function(e) {
                e.preventDefault();
                
                const reasonDescription = document.getElementById('reasonDescription').value.trim();
                
                if (!reasonDescription) {
                    showToast('Voer een geldige beschrijving in!', 'error');
        return;
    }
    
                const success = await addReason({
                    description: reasonDescription
                });
                
                if (success) {
                    // Reset form
                    document.getElementById('reasonDescription').value = '';
                }
            });
        }
        
        // Reset Button
        const resetButton = document.getElementById('resetButton');
        if (resetButton) {
            resetButton.addEventListener('click', async function() {
                if (confirm('WAARSCHUWING: Dit zal ALLE data verwijderen! Weet je zeker dat je door wilt gaan?')) {
                    if (confirm('Dit is je laatste kans! Alle boetes, spelers en redenen worden verwijderd. Dit kan niet ongedaan worden gemaakt!')) {
                        await resetAllData();
                    }
                }
            });
        }
        
        // Manual Load Button
        const manualLoadButton = document.getElementById('manualLoadButton');
        if (manualLoadButton) {
            manualLoadButton.addEventListener('click', loadAllData);
        }
        
        // Clear Storage Button
        const clearStorageButton = document.getElementById('clearStorageButton');
        if (clearStorageButton) {
            clearStorageButton.addEventListener('click', function() {
                if (confirm('Weet je zeker dat je alle lokale opslag wilt wissen?')) {
                    localStorage.clear();
                    showToast('Lokale opslag gewist!', 'info');
                    setTimeout(() => {
                        location.reload();
                    }, 1500);
                }
            });
        }
        
        // Add a button to clear mock data
        const debugPanel = document.getElementById('debugPanel');
        if (debugPanel) {
            const buttonRow = debugPanel.querySelector('.grid');
            if (buttonRow) {
                const clearMockDataBtn = document.createElement('button');
                clearMockDataBtn.className = 'bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg text-sm flex items-center justify-center';
                clearMockDataBtn.innerHTML = '<i class="fas fa-database mr-2"></i>Reset Mock Data';
                clearMockDataBtn.addEventListener('click', clearMockData);
                buttonRow.appendChild(clearMockDataBtn);
            }
        }
    }
    
    // Add bulk import form handler
    function setupBulkImport() {
        const bulkImportForm = document.getElementById('bulkImportForm');
        if (!bulkImportForm) {
            debug('Bulk import form not found');
            return;
        }
        
        bulkImportForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const textarea = document.getElementById('bulkPlayerNames');
            if (!textarea) return;
            
            const names = textarea.value.split('\n')
                .map(name => name.trim())
                .filter(name => name.length > 0);

            if (names.length === 0) {
                showToast('Voer ten minste één naam in', 'error');
                return;
            }

            if (names.length > 30) {
                showToast('Maximaal 30 namen toegestaan', 'error');
                return;
            }

            showLoading(true);
            let successCount = 0;
            let errorCount = 0;

            for (const name of names) {
                try {
                    await addPlayer({ name: name });
                    successCount++;
                    debug(`Successfully added player: ${name}`);
                } catch (error) {
                    errorCount++;
                    debug(`Failed to add player: ${name} - ${error.message}`);
                }
            }

            showLoading(false);
            showToast(`${successCount} spelers toegevoegd, ${errorCount} fouten`, successCount > 0 ? 'success' : 'error');
            textarea.value = '';
            await loadPlayers();
        });
    }
    
    // Add a clear mock data function
    function clearMockData() {
        localStorage.removeItem('mockPlayers');
        localStorage.removeItem('mockReasons');
        localStorage.removeItem('mockFines');
        localStorage.setItem('useMockData', 'false');
        debug('Mock data cleared');
        showToast('Mock data cleared. Attempting to use API again.', 'info');
        setTimeout(() => location.reload(), 1500);
    }
    
    // Initialization
    function init() {
        debug('Initializing admin panel...');
        
        // Initialize theme
        initTheme();
        
        // Setup tabs
        setupTabs();
        
        // Load data
        loadAllData();
        
        // Setup event listeners
        setupEventListeners();
        
        // Setup bulk import
        setupBulkImport();
        
        debug('Initialization complete');
    }
    
    // Start the application
    init();
}); 

// Fix the loading spinner function
function showLoadingSpinner() {
    showLoading(true);
}

function hideLoadingSpinner() {
    showLoading(false);
} 