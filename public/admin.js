// Simplified admin panel without login
document.addEventListener('DOMContentLoaded', function() {
    // Configuration
    const API_BASE_URL = 'https://vfsdttmqrzcdokqaoofd.supabase.co/rest/v1';  // Direct connection to Supabase
    const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZmc2R0dG1xcnpjZG9rcWFvb2ZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE2Nzc1MDA5NTEsImV4cCI6MTk5MzA3Njk1MX0.BYVqeqh-qwox4Os_DCzPXjtEM32U2FvaSU3VetOjTwY';
    
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
    
    // API & Data Functions - Direct API connection without mock data
    async function apiRequest(endpoint, method = 'GET', data = null) {
        try {
            // Ensure endpoint does not start with slash when appending to API path
            const path = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;
            
            // Build URL with proper query parameters for Supabase
            let url = `${API_BASE_URL}/`;
            
            // Handle different endpoints based on HTTP method
            if (method === 'GET') {
                if (path === 'players') {
                    url += 'players?select=*';
                } else if (path === 'reasons') {
                    url += 'reasons?select=*';
                } else if (path === 'fines') {
                    url += 'fines?select=id,amount,created_at,player_id,reason_id&order=created_at.desc';
                } else {
                    url += path;
                }
            } else if (method === 'POST') {
                url += path;
            } else if (method === 'DELETE') {
                // Handle DELETE requests
                if (path.startsWith('players/')) {
                    const id = path.split('/')[1];
                    url += `players?id=eq.${id}`;
                } else if (path.startsWith('reasons/')) {
                    const id = path.split('/')[1];
                    url += `reasons?id=eq.${id}`;
                } else if (path.startsWith('fines-delete')) {
                    const id = path.split('=')[1];
                    url += `fines?id=eq.${id}`;
                } else {
                    url += path;
                }
            }
            
            debug(`Making ${method} request to ${url}`);
            showLoading(true);
            
            const options = {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${SUPABASE_KEY}`
                },
                mode: 'cors',
                credentials: 'omit'
            };
            
            // Add Prefer header for inserts to return the created item
            if (method === 'POST') {
                options.headers['Prefer'] = 'return=representation';
            }
            
            if (data && (method === 'POST' || method === 'PUT')) {
                options.body = JSON.stringify(data);
            }
            
            // Attempt the API request
            const response = await fetch(url, options);
            
            if (!response.ok) {
                let errorMessage = `API error: ${response.status}`;
                try {
                    const errorData = await response.json();
                    if (errorData && errorData.message) {
                        errorMessage = errorData.message;
                    } else if (errorData && errorData.error) {
                        errorMessage = errorData.error;
                    }
                } catch (e) {
                    // Ignore JSON parsing errors
                }
                throw new Error(errorMessage);
            }
            
            // For GET requests, return the JSON data
            // For DELETE, often there's no content returned
            if (method === 'GET' || method === 'POST') {
                const responseData = await response.json();
                
                // For fines endpoint, join with player and reason data
                if (path === 'fines' && Array.isArray(responseData)) {
                    // Fetch all players and reasons in one request each for efficiency
                    const [playersResponse, reasonsResponse] = await Promise.all([
                        fetch(`${API_BASE_URL}/players?select=id,name`, {
                            headers: {
                                'apikey': SUPABASE_KEY,
                                'Authorization': `Bearer ${SUPABASE_KEY}`
                            }
                        }),
                        fetch(`${API_BASE_URL}/reasons?select=id,description`, {
                            headers: {
                                'apikey': SUPABASE_KEY,
                                'Authorization': `Bearer ${SUPABASE_KEY}`
                            }
                        })
                    ]);
                    
                    const players = await playersResponse.json();
                    const reasons = await reasonsResponse.json();
                    
                    // Map player and reason data to each fine
                    const enhancedFines = responseData.map(fine => {
                        const player = players.find(p => p.id === fine.player_id);
                        const reason = reasons.find(r => r.id === fine.reason_id);
                        
                        return {
                            ...fine,
                            player_name: player ? player.name : 'Onbekend',
                            reason_description: reason ? reason.description : 'Onbekend'
                        };
                    });
                    
                    return enhancedFines;
                }
                
                return responseData;
            }
            
            // For DELETE, return success
            return { success: true };
        } catch (error) {
            debug(`API Error: ${error.message}`);
            showToast(`API Error: ${error.message}`, 'error');
            
            // Return empty arrays for GET requests
            if (method === 'GET') {
                if (endpoint.includes('players')) {
                    return [];
                } else if (endpoint.includes('reasons')) {
                    return [];
                } else if (endpoint.includes('fines')) {
                    return [];
                }
            }
            
            throw error;
        } finally {
            showLoading(false);
        }
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
            await apiRequest(`fines-delete?id=${id}`, 'DELETE');
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
    
    async function deleteReason(id) {
        try {
            await apiRequest(`/reasons/${id}`, 'DELETE');
            showToast('Reden succesvol verwijderd!', 'success');
            await loadReasons(); // Reload reasons
            return true;
        } catch (error) {
            debug(`Failed to delete reason: ${error.message}`);
            return false;
        }
    }
    
    // Function to get mock data when API fails
    function getMockDataForAdmin(type) {
        debug(`Getting mock data for admin: ${type}`);
        
        // Add players
        const players = [
            { id: 1, name: 'Marnix' },
            { id: 2, name: 'Ivar' },
            { id: 3, name: 'Jarno' },
            { id: 4, name: 'Lars B' },
            { id: 5, name: 'Lars R' },
            { id: 6, name: 'Rowan' },
            { id: 7, name: 'Rinse' },
            { id: 8, name: 'Jan Willem' },
            { id: 9, name: 'Leon' },
            { id: 10, name: 'Job' },
            { id: 11, name: 'Bryan' },
            { id: 12, name: 'Steven' },
            { id: 13, name: 'Robbie' },
            { id: 14, name: 'Boaz' },
            { id: 15, name: 'Riewing' },
            { id: 16, name: 'Jordy' },
            { id: 17, name: 'Pouwel' },
            { id: 18, name: 'Ramon' },
            { id: 19, name: 'Steffen' },
            { id: 20, name: 'Bram' },
            { id: 21, name: 'Max' },
            { id: 22, name: 'Mark' },
            { id: 23, name: 'Jur' },
            { id: 24, name: 'Erwin' },
            { id: 25, name: 'Michiel' },
            { id: 26, name: 'Ian' }
        ];
        
        // Add reasons
        const reasons = [
            { id: 1, description: 'Te laat' },
            { id: 2, description: 'Corvee vergeten' },
            { id: 3, description: 'Rijden/wassen vergeten' },
            { id: 4, description: 'Niet optijd afmelden' },
            { id: 5, description: 'Gele/rode kaart' },
            { id: 6, description: 'Geen Polo' },
            { id: 7, description: 'Correctie' }
        ];
        
        // Add fine history - use player_id and reason_id for consistency
        const fines = [
            { id: 1, player_id: 2, reason_id: null, amount: 46, timestamp: new Date('2025-02-27T21:57:47').toISOString() },
            { id: 2, player_id: 3, reason_id: null, amount: 20, timestamp: new Date('2025-02-27T21:58:09').toISOString() },
            { id: 3, player_id: 4, reason_id: null, amount: 1, timestamp: new Date('2025-02-27T21:58:32').toISOString() },
            { id: 4, player_id: 5, reason_id: null, amount: 6, timestamp: new Date('2025-02-27T21:58:42').toISOString() },
            { id: 5, player_id: 6, reason_id: null, amount: 1, timestamp: new Date('2025-02-27T21:58:51').toISOString() },
            { id: 6, player_id: 8, reason_id: null, amount: 20, timestamp: new Date('2025-02-27T21:59:06').toISOString() },
            { id: 7, player_id: 9, reason_id: null, amount: 27, timestamp: new Date('2025-02-27T21:59:26').toISOString() },
            { id: 8, player_id: 10, reason_id: null, amount: 10, timestamp: new Date('2025-02-27T21:59:35').toISOString() },
            { id: 9, player_id: 11, reason_id: null, amount: 38, timestamp: new Date('2025-02-27T21:59:51').toISOString() },
            { id: 10, player_id: 12, reason_id: null, amount: 10, timestamp: new Date('2025-02-27T22:00:07').toISOString() }
        ];
        
        // Store in localStorage
        localStorage.setItem('players', JSON.stringify(players));
        localStorage.setItem('reasons', JSON.stringify(reasons));
        localStorage.setItem('fines', JSON.stringify(fines));
        
        // Show toast about using mock data
        showToast('Using offline data - database connection failed', 'warning');
        
        // Return requested data type
        if (type === 'players') {
            return players;
        } else if (type === 'reasons') {
            return reasons;
        } else if (type === 'fines') {
            return fines;
        }
        
        return [];
    }
});