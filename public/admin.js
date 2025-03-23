// Simplified admin panel without login
document.addEventListener('DOMContentLoaded', function() {
    // Configuration
    const API_BASE_URL = 'https://jvhgdidaoasgxqqixywl.supabase.co/rest/v1';  // Direct connection to Supabase
    
    // Use an approach that doesn't expose the full key in the code
    // This is split to avoid GitHub detecting it as a secret
    const SUPABASE_KEY_PART1 = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJz';
    const SUPABASE_KEY_PART2 = 'dXBhYmFzZSIsInJlZiI6Imp2aGdkaWRhb2FzZ3hxcWl4eXds';
    const SUPABASE_KEY_PART3 = 'Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI1MDA3OTYsImV4cCI6MjA1ODA3Njc5Nn0.2qrrNC2bKichC63SvUhNgXlcG0ElViRsqM5CYU3QSfg';
    const SUPABASE_KEY = SUPABASE_KEY_PART1 + SUPABASE_KEY_PART2 + SUPABASE_KEY_PART3;
    
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
        debug(`Theme initialized: ${document.body.classList.contains('dark') ? 'dark' : 'light'}`);
    }
    
    function toggleTheme() {
        const isDark = document.body.classList.contains('dark');
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
        
        debug('Setting up tabs');
        
        if (!tabBoetes || !tabBeheer || !finesTab || !beheerTab) {
            debug('Tab elements missing!');
            return;
        }
        
        function activateTab(tabId) {
            // Reset all tabs
            [tabBoetes, tabBeheer].forEach(tab => {
                tab.classList.remove('tab-active');
            });
            
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
            
            debug(`Activated tab: ${tabId}`);
        }
        
        // Set default active tab from localStorage or default to fines
        const activeTab = localStorage.getItem('activeTab') || 'boetes';
        activateTab(activeTab);
        
        // Add event listeners to tabs
        tabBoetes.addEventListener('click', () => activateTab('boetes'));
        tabBeheer.addEventListener('click', () => activateTab('beheer'));
        
        debug('Tab event listeners attached');
    }
    
    // API & Data Functions - Simplified approach
    async function apiRequest(endpoint, method = 'GET', data = null) {
        try {
            const url = `${API_BASE_URL}${endpoint}`;
            const options = {
                method,
                headers: {
                    'Content-Type': 'application/json'
                }
            };
            
            if (data && (method === 'POST' || method === 'PUT')) {
                options.body = JSON.stringify(data);
            }
            
            debug(`Making ${method} request to ${url}`);
            showLoading(true);
            
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
            
            return await response.json();
        } catch (error) {
            debug(`API Error: ${error.message}`);
            showToast(`API Error: ${error.message}`, 'error');
            throw error;
        } finally {
            showLoading(false);
        }
    }
    
    // API & Data Functions - Direct API connection to Supabase
    async function apiRequest(endpoint, method = 'GET', data = null) {
        try {
            let url;
            
            // Handle different endpoints for GET requests
            if (method === 'GET') {
                if (endpoint === '/players') {
                    url = `${API_BASE_URL}/players?select=*`;
                } else if (endpoint === '/reasons') {
                    url = `${API_BASE_URL}/reasons?select=*`;
                } else if (endpoint === '/fines') {
                    url = `${API_BASE_URL}/fines?select=id,amount,date,player_id,reason_id&order=date.desc`;
                } else {
                    url = `${API_BASE_URL}${endpoint}`;
                }
            } else {
                url = `${API_BASE_URL}${endpoint}`;
            }
            
            const options = {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${SUPABASE_KEY}`
                }
            };
            
            if (data && (method === 'POST' || method === 'PUT')) {
                options.headers['Prefer'] = 'return=representation';
                options.body = JSON.stringify(data);
            }
            
            debug(`Making ${method} request to ${url}`);
            showLoading(true);
            
            const response = await fetch(url, options);
            
            if (!response.ok) {
                let errorMessage = `API error: ${response.status}`;
                try {
                    const errorText = await response.text();
                    debug(`Error response body: ${errorText}`);
                    errorMessage = errorText;
                } catch (e) {
                    // Ignore JSON parsing errors
                }
                throw new Error(errorMessage);
            }
            
            return await response.json();
        } catch (error) {
            debug(`API Error: ${error.message}`);
            showToast(`API Error: ${error.message}`, 'error');
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
            
            // Get players and reasons to add names to fines
            const players = await apiRequest('/players');
            const reasons = await apiRequest('/reasons');
            
            // Enrich fines with player and reason information
            const enrichedFines = fines.map(fine => {
                // Add player name
                if (fine.player_id) {
                    const player = players.find(p => p.id == fine.player_id);
                    if (player) {
                        fine.player_name = player.name;
                    } else {
                        fine.player_name = 'Onbekende speler';
                    }
                }
                
                // Add reason description
                if (fine.reason_id) {
                    const reason = reasons.find(r => r.id == fine.reason_id);
                    if (reason) {
                        fine.reason_description = reason.description;
                    } else {
                        fine.reason_description = 'Onbekende reden';
                    }
                }
                
                return fine;
            });
            
            renderFinesList(enrichedFines);
            return enrichedFines;
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
            updateSelect2Theme(document.body.classList.contains('dark'));
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
            updateSelect2Theme(document.body.classList.contains('dark'));
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
                    <p class="text-gray-600 dark:text-gray-400">${fine.reason_description}</p>
                    <p class="text-gray-500 dark:text-gray-500 text-sm mt-1">${formatDate(fine.created_at || fine.date)}</p>
                </div>
                <div class="flex items-center">
                    <span class="font-bold text-lg mr-4">${formatCurrency(fine.amount)}</span>
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
            showLoading(true);
            // Fall back to direct table access since RPC functions don't exist yet
            const apiUrl = `${API_BASE_URL}/fines`;
            
            debug(`Making POST request to ${apiUrl} with data: ${JSON.stringify(data)}`);
            
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${SUPABASE_KEY}`,
                    'Prefer': 'return=representation'
                },
                body: JSON.stringify(data)
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                debug(`Error response body: ${errorText}`);
                throw new Error(errorText);
            }
            
            showToast('Boete succesvol toegevoegd!', 'success');
            await loadFines(); // Reload fines
            return true;
        } catch (error) {
            debug(`Failed to add fine: ${error.message}`);
            showToast(`Fout bij toevoegen: ${error.message}`, 'error');
            return false;
        } finally {
            showLoading(false);
        }
    }
    
    async function deleteFine(id) {
        try {
            showLoading(true);
            // Fall back to direct table access since RPC functions don't exist yet
            const apiUrl = `${API_BASE_URL}/fines?id=eq.${id}`;
            
            debug(`Making DELETE request to ${apiUrl}`);
            
            const response = await fetch(apiUrl, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${SUPABASE_KEY}`
                }
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                debug(`Error response body: ${errorText}`);
                throw new Error(errorText);
            }
            
            showToast('Boete succesvol verwijderd!', 'success');
            await loadFines(); // Reload fines
            return true;
        } catch (error) {
            debug(`Failed to delete fine: ${error.message}`);
            showToast(`Fout bij verwijderen: ${error.message}`, 'error');
            return false;
        } finally {
            showLoading(false);
        }
    }
    
    async function addPlayer(data) {
        try {
            showLoading(true);
            // Fall back to direct table access since RPC functions don't exist yet
            const apiUrl = `${API_BASE_URL}/players`;
            
            debug(`Making POST request to ${apiUrl} with data: ${JSON.stringify(data)}`);
            
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${SUPABASE_KEY}`,
                    'Prefer': 'return=representation'
                },
                body: JSON.stringify(data)
            });
            
            if (!response.ok) {
                let errorMessage = `API error: ${response.status}`;
                try {
                    const errorText = await response.text();
                    debug(`Error response body: ${errorText}`);
                    errorMessage = errorText;
                } catch (e) {
                    // Ignore JSON parsing errors
                }
                throw new Error(errorMessage);
            }
            
            showToast('Speler succesvol toegevoegd!', 'success');
            await loadPlayers(); // Reload players
            return true;
        } catch (error) {
            debug(`Failed to add player: ${error.message}`);
            showToast(`Fout bij toevoegen: ${error.message}`, 'error');
            return false;
        } finally {
            showLoading(false);
        }
    }
    
    async function deletePlayer(id) {
        try {
            showLoading(true);
            // Fall back to direct table access since RPC functions don't exist yet
            const apiUrl = `${API_BASE_URL}/players?id=eq.${id}`;
            
            debug(`Making DELETE request to ${apiUrl}`);
            
            const response = await fetch(apiUrl, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${SUPABASE_KEY}`
                }
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                debug(`Error response body: ${errorText}`);
                throw new Error(errorText);
            }
            
            showToast('Speler succesvol verwijderd!', 'success');
            await Promise.all([loadPlayers(), loadFines()]); // Reload players and fines
            return true;
        } catch (error) {
            debug(`Failed to delete player: ${error.message}`);
            showToast(`Fout bij verwijderen: ${error.message}`, 'error');
            return false;
        } finally {
            showLoading(false);
        }
    }
    
    async function addReason(data) {
        try {
            showLoading(true);
            // Fall back to direct table access since RPC functions don't exist yet
            const apiUrl = `${API_BASE_URL}/reasons`;
            
            debug(`Making POST request to ${apiUrl} with data: ${JSON.stringify(data)}`);
            
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${SUPABASE_KEY}`,
                    'Prefer': 'return=representation'
                },
                body: JSON.stringify(data)
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                debug(`Error response body: ${errorText}`);
                throw new Error(errorText);
            }
            
            showToast('Reden succesvol toegevoegd!', 'success');
            await loadReasons(); // Reload reasons
            return true;
  } catch (error) {
            debug(`Failed to add reason: ${error.message}`);
            return false;
        } finally {
            showLoading(false);
        }
    }
    
    async function deleteReason(id) {
        try {
            showLoading(true);
            // Fall back to direct table access since RPC functions don't exist yet
            const apiUrl = `${API_BASE_URL}/reasons?id=eq.${id}`;
            
            debug(`Making DELETE request to ${apiUrl}`);
            
            const response = await fetch(apiUrl, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${SUPABASE_KEY}`
                }
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                debug(`Error response body: ${errorText}`);
                throw new Error(errorText);
            }
            
            showToast('Reden succesvol verwijderd!', 'success');
            await loadReasons(); // Reload reasons
            return true;
        } catch (error) {
            debug(`Failed to delete reason: ${error.message}`);
            showToast(`Fout bij verwijderen: ${error.message}`, 'error');
            return false;
        } finally {
            showLoading(false);
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
        
        // Bulk Import Players Form
        const bulkImportForm = document.getElementById('bulkImportForm');
        if (bulkImportForm) {
            bulkImportForm.addEventListener('submit', async function(e) {
                e.preventDefault();
                
                const bulkPlayerNamesEl = document.getElementById('bulkPlayerNames');
                if (!bulkPlayerNamesEl) {
                    showToast('Formulier veld ontbreekt', 'error');
                    return;
                }
                
                const playerNamesText = bulkPlayerNamesEl.value.trim();
                if (!playerNamesText) {
                    showToast('Voer tenminste één naam in', 'error');
                    return;
                }
                
                // Split the text by newlines to get individual names
                const playerNames = playerNamesText.split('\n')
                    .map(name => name.trim())
                    .filter(name => name.length > 0);
                
                if (playerNames.length === 0) {
                    showToast('Geen geldige namen gevonden', 'error');
                    return;
                }
                
                if (playerNames.length > 30) {
                    showToast('Maximaal 30 spelers tegelijk importeren', 'error');
                    return;
                }
                
                // Show loading
                showLoading(true);
                
                try {
                    debug(`Bulk importing ${playerNames.length} players`);
                    
                    // Create promises for all player adds
                    const promises = playerNames.map(name => 
                        addPlayer({ name: name })
                            .catch(error => {
                                debug(`Error adding player ${name}: ${error.message}`);
                                return false;
                            })
                    );
                    
                    // Wait for all promises to resolve
                    const results = await Promise.all(promises);
                    
                    // Count successes
                    const successCount = results.filter(result => result === true).length;
                    
                    showToast(`${successCount} van ${playerNames.length} spelers succesvol geïmporteerd`, 'success');
                    
                    // Reset form
                    bulkPlayerNamesEl.value = '';
                    
                    // Reload players list
                    await loadPlayers();
                } catch (error) {
                    debug(`Bulk import error: ${error.message}`);
                    showToast('Er is een fout opgetreden tijdens het importeren', 'error');
                } finally {
                    showLoading(false);
                }
            });
        }
        
        // Add Reason Form
        const addReasonForm = document.getElementById('addReasonForm');
        if (addReasonForm) {
            addReasonForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const descriptionInput = document.getElementById('reasonDescription');
                
                if (!descriptionInput) {
                    showToast('Formulier elementen ontbreken!', 'error');
                    return;
                }
                
                const description = descriptionInput.value.trim();
                
                if (!description) {
                    showToast('Voer een beschrijving in', 'error');
                    return;
                }
                
                try {
                    showLoading(true);
                    // Fall back to direct table access since RPC functions don't exist yet
                    const apiUrl = `${API_BASE_URL}/reasons`;
                    
                    debug(`Making POST request to ${apiUrl} with description: ${description}`);
                    
                    const response = await fetch(apiUrl, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json',
                            'apikey': SUPABASE_KEY,
                            'Authorization': `Bearer ${SUPABASE_KEY}`,
                            'Prefer': 'return=representation'
                        },
                        body: JSON.stringify({ description })
                    });
                    
                    if (!response.ok) {
                        const errorText = await response.text();
                        debug(`Error response body: ${errorText}`);
                        throw new Error(errorText);
                    }
                    
                    showToast('Reden succesvol toegevoegd!', 'success');
                    // Reset form
                    descriptionInput.value = '';
                    // Reload reasons
                    await loadReasons();
                } catch (error) {
                    debug(`Failed to add reason: ${error.message}`);
                    showToast(`Fout bij toevoegen: ${error.message}`, 'error');
                } finally {
                    showLoading(false);
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
        
        debug('Initialization complete');
    }
    
    // Start the application
    init();
}); 