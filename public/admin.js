// Simplified admin panel without login
document.addEventListener('DOMContentLoaded', function() {
    // Global variables and config
    const API_BASE_URL = '/api';
    const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNzaXlzY2R1d21keW95Z2J1YXZ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTA5MzU0NTgsImV4cCI6MjAyNjUxMTQ1OH0.PiTT51A3a4sJYYnr_M-F4jq6TmCqYp1Tr_eG6yv4OXI';
    
    // Debug flag - set to true for console logs
    const DEBUG = true;
    
    // DOM Elements
    const loadingSpinner = document.getElementById('loadingSpinner');
    const debugStatus = document.getElementById('debugStatus');
    
    // Utility Functions
    function debug(message) {
        if (localStorage.getItem('debug') === 'true') {
            console.log(message);
            if (debugStatus) {
                debugStatus.textContent += `\n${message}`;
            }
        }
    }
    
    const VERSION = new Date().getTime(); // Add cache-busting version
    
    // Function to add cache-busting to API URLs
    function addCacheBuster(url) {
        const separator = url.includes('?') ? '&' : '?';
        return `${url}${separator}cachebust=${Date.now()}`;
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
        if (loadingSpinner) {
            if (show) {
                loadingSpinner.classList.remove('hidden');
                loadingSpinner.classList.add('flex');
            } else {
                loadingSpinner.classList.remove('flex');
                loadingSpinner.classList.add('hidden');
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
                    'Authorization': `Bearer ${SUPABASE_KEY}`,
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache',
                    'Expires': '0',
                    'X-Cache-Bust': VERSION.toString() // Use a header for cache busting
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
        debug('Populating player select dropdown with ' + players.length + ' players');
        const playerSelect = $('#playerSelect');
        
        // Clear any existing options
        playerSelect.empty();
        
        // Add default empty option
        playerSelect.append($('<option>').val('').text(''));
        
        // Add all players
        players.forEach(player => {
            playerSelect.append($('<option>').val(player.id).text(player.name));
        });
        
        // Initialize Select2 with improved mobile settings
        playerSelect.select2({
            placeholder: "Selecteer speler(s)",
            width: '100%',
            allowClear: true,
            multiple: true,
            dropdownParent: $('#addFineForm'), // Attach to form for better mobile positioning
            tags: false, // Disable creating new tags
            tokenSeparators: [], // Disable automatic tokenization
            language: {
                noResults: function() { return "Geen spelers gevonden"; },
                searching: function() { return "Zoeken..."; }
            }
        }).on('select2:opening', function() {
            // Clear search input when dropdown opens
            setTimeout(() => {
                $('.select2-search__field').val('');
            }, 0);
        }).on('select2:close', function() {
            // Clear search input when dropdown closes
            setTimeout(() => {
                $('.select2-search__field').val('');
            }, 0);
        });
        
        // Increase the height and font size of the search field for mobile
        $('body').append(`
            <style>
                @media (max-width: 767px) {
                    .select2-search__field {
                        font-size: 16px !important; /* Prevents iOS zoom on focus */
                        padding: 12px 8px !important;
                        height: auto !important;
                    }
                    .select2-container--open .select2-dropdown {
                        min-width: 280px !important;
                    }
                    .select2-results__option {
                        padding: 12px 8px !important;
                        min-height: 48px;
                    }
                }
            </style>
        `);
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
        } catch (error) {
            debug(`Error initializing Select2: ${error.message}`);
        }
    }
    
    // Add updateSelect2Styling function
    function updateSelect2Styling() {
        // Force Select2 to adopt proper styling
        try {
            $('.select2-container--default .select2-selection--single').css({
                'background-color': 'var(--input-bg)',
                'border-color': 'var(--input-border)',
                'color': 'var(--input-text)'
            });
            
            $('.select2-container--default .select2-selection--multiple').css({
                'background-color': 'var(--input-bg)',
                'border-color': 'var(--input-border)'
            });
        } catch (e) {
            debug(`Failed to update Select2 styling: ${e.message}`);
        }
    }
    
    function renderFinesList(fines) {
        const container = document.getElementById('recentFines');
        if (!container) return;
        
        container.innerHTML = '';
        
        if (!fines || fines.length === 0) {
            container.innerHTML = `
                <div class="text-center py-8 text-gray-500">
                    <i class="fas fa-info-circle text-2xl mb-3"></i>
                    <p>Geen boetes gevonden</p>
                </div>
            `;
            return;
        }
        
        fines.slice(0, 10).forEach(fine => createFineCard(container, fine));
    }
    
    function createFineCard(container, fine) {
        const card = document.createElement('div');
        card.className = 'bg-gray-50 rounded-lg p-4 mb-4 border border-gray-200';
        
        card.innerHTML = `
            <div class="flex justify-between items-start">
                <div>
                    <h3 class="font-semibold">${fine.player_name || 'Onbekende speler'}</h3>
                    <p class="text-gray-600">${fine.reason_description}</p>
                    <p class="text-gray-500 text-sm mt-1">${formatDate(fine.created_at || fine.date)}</p>
                </div>
                <div class="flex items-center">
                    <span class="font-bold text-lg mr-4">€${formatCurrency(fine.amount)}</span>
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
        
        if (!players || players.length === 0) {
            container.innerHTML = `
                <div class="text-center py-8 text-gray-500">
                    <i class="fas fa-info-circle text-2xl mb-3"></i>
                    <p>Geen spelers gevonden</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = `<h2 class="text-xl font-semibold mb-4">Spelers (${players.length})</h2>`;
        
        players.sort((a, b) => a.name.localeCompare(b.name)).forEach(player => {
            const item = document.createElement('div');
            item.className = 'bg-gray-50 rounded-lg p-4 mb-4 border border-gray-200 flex justify-between items-center';
            
            item.innerHTML = `
                <span>${player.name}</span>
                <button class="delete-player-btn text-red-500 hover:text-red-700" data-player-id="${player.id}">
                    <i class="fas fa-trash"></i>
                </button>
            `;
            
            container.appendChild(item);
        });
        
        // Add event listeners for delete buttons
        container.querySelectorAll('.delete-player-btn').forEach(button => {
            button.addEventListener('click', async function() {
                const id = this.getAttribute('data-player-id');
                if (confirm(`Weet je zeker dat je deze speler wilt verwijderen? Alle boetes van deze speler worden ook verwijderd!`)) {
                    await deletePlayer(id);
                }
            });
        });
    }
    
    function renderReasonsList(reasons) {
        const container = document.getElementById('reasonsList');
        if (!container) return;
        
        if (!reasons || reasons.length === 0) {
            container.innerHTML = `
                <div class="text-center py-8 text-gray-500">
                    <i class="fas fa-info-circle text-2xl mb-3"></i>
                    <p>Geen redenen gevonden</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = `<h2 class="text-xl font-semibold mb-4">Redenen (${reasons.length})</h2>`;
        
        reasons.sort((a, b) => a.description.localeCompare(b.description)).forEach(reason => {
            const item = document.createElement('div');
            item.className = 'bg-gray-50 rounded-lg p-4 mb-4 border border-gray-200 flex justify-between items-center';
            
            item.innerHTML = `
                <span>${reason.description}</span>
                <button class="delete-reason-btn text-red-500 hover:text-red-700" data-reason-id="${reason.id}">
                    <i class="fas fa-trash"></i>
                </button>
            `;
            
            container.appendChild(item);
        });
        
        // Add event listeners for delete buttons
        container.querySelectorAll('.delete-reason-btn').forEach(button => {
            button.addEventListener('click', async function() {
                const id = this.getAttribute('data-reason-id');
                if (confirm(`Weet je zeker dat je deze reden wilt verwijderen? Alle boetes met deze reden worden ook verwijderd!`)) {
                    await deleteReason(id);
                }
            });
        });
    }
    
    // CRUD Operations
    async function addFine(data) {
        try {
            debug(`Adding fine: ${JSON.stringify(data)}`);
            
            // If multiple players selected, create multiple fines
            if (Array.isArray(data.player_ids) && data.player_ids.length > 0) {
                showLoading(true);
                let successCount = 0;
                
                // Create a fine for each selected player
                for (const playerId of data.player_ids) {
                    try {
                        const fineData = {
                            player_id: playerId,
                            reason_id: data.reason_id,
                            amount: data.amount,
                            date: new Date().toISOString()
                        };
                        
                        await apiRequest('/fines', 'POST', fineData);
                        successCount++;
                    } catch (error) {
                        debug(`Error adding fine for player ${playerId}: ${error.message}`);
                    }
                }
                
                if (successCount > 0) {
                    const playerText = successCount === 1 ? 'speler' : 'spelers';
                    showToast(`Boete toegevoegd voor ${successCount} ${playerText}!`, 'success');
                    await loadFines();
                    return true;
                } else {
                    throw new Error('Geen enkele boete kon worden toegevoegd');
                }
            } else {
                // Single player fine (backwards compatibility)
                const fineData = {
                    player_id: data.player_id || data.player_ids[0],
                    reason_id: data.reason_id,
                    amount: data.amount,
                    date: new Date().toISOString()
                };
                
                await apiRequest('/fines', 'POST', fineData);
                showToast('Boete toegevoegd!', 'success');
                await loadFines();
                return true;
            }
        } catch (error) {
            debug(`Failed to add fine: ${error.message}`);
            showToast(`Fout bij toevoegen van boete: ${error.message}`, 'error');
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
    
    // Reset all data
    async function resetAllData() {
        try {
            showLoading(true);
            
            if (!confirm('WAARSCHUWING: Dit verwijdert ALLE boetes, spelers en redenen! Weet je het zeker?')) {
                return false;
            }
            
            if (!confirm('Dit is je laatste kans! Alle boetes, spelers en redenen worden verwijderd. Dit kan niet ongedaan worden gemaakt!')) {
                return false;
            }
            
            // Delete all fines first (due to foreign key constraints)
            debug('Deleting all fines...');
            const fineResponse = await fetch(addCacheBuster(`${API_BASE_URL}/fines`), {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${SUPABASE_KEY}`
                }
            });
            
            if (!fineResponse.ok) {
                throw new Error(`Failed to delete fines: ${fineResponse.statusText}`);
            }
            
            // Delete all players
            debug('Deleting all players...');
            const playerResponse = await fetch(addCacheBuster(`${API_BASE_URL}/players`), {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${SUPABASE_KEY}`
                }
            });
            
            if (!playerResponse.ok) {
                throw new Error(`Failed to delete players: ${playerResponse.statusText}`);
            }
            
            // Delete all reasons
            debug('Deleting all reasons...');
            const reasonResponse = await fetch(addCacheBuster(`${API_BASE_URL}/reasons`), {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'apikey': SUPABASE_KEY,
                    'Authorization': `Bearer ${SUPABASE_KEY}`
                }
            });
            
            if (!reasonResponse.ok) {
                throw new Error(`Failed to delete reasons: ${reasonResponse.statusText}`);
            }
            
            // Clear local storage
            localStorage.removeItem('players');
            localStorage.removeItem('reasons');
            localStorage.removeItem('fines');
            localStorage.removeItem('playerData');
            localStorage.removeItem('reasonData');
            localStorage.removeItem('fineData');
            localStorage.removeItem('cachedPlayers');
            localStorage.removeItem('cachedReasons');
            localStorage.removeItem('cachedFines');
            
            showToast('Alle data succesvol gereset!', 'success');
            
            // Reset all UI elements
            clearAllData();
            
            // Reset Select2 elements
            $('#playerSelect').val(null).trigger('change');
            $('#reasonSelect').val(null).trigger('change');
            
            // Reset input fields
            $('#amount').val('');
            $('#playerName').val('');
            $('#reasonDescription').val('');
            $('#bulkPlayerNames').val('');
            
            // Clear tables and lists
            $('#playersList').html('<div class="text-gray-500 text-center py-4">Geen spelers gevonden</div>');
            $('#reasonsList').html('<div class="text-gray-500 text-center py-4">Geen redenen gevonden</div>');
            $('#recentFines').html('<div class="text-gray-500 text-center py-4">Geen boetes gevonden</div>');
            
            // Reset UI on app.html page elements if navigating back
            $('#total-amount').text('€0,00');
            $('#recent-fines').html('<div class="text-gray-500 text-center py-4">Geen recente boetes</div>');
            $('#player-history').html('<div class="text-gray-500 text-center py-4">Selecteer een speler om diens geschiedenis te bekijken</div>');
            $('#leaderboard').html('<div class="text-gray-500 text-center py-4">Geen data beschikbaar</div>');
            
            // Force reload all data to ensure everything is cleared
            await loadAllData();
            
            return true;
        } catch (error) {
            debug(`Failed to reset data: ${error.message}`);
            showToast(`Fout bij resetten van data: ${error.message}`, 'error');
            return false;
        } finally {
            showLoading(false);
        }
    }
    
    // Event Listeners
    function setupEventListeners() {
        // Add Fine Form
        const addFineForm = document.getElementById('addFineForm');
        if (addFineForm) {
            addFineForm.addEventListener('submit', async function(e) {
                e.preventDefault();
                
                const playerSelect = document.getElementById('playerSelect');
                const playerIds = playerSelect ? $(playerSelect).val() : null;
                const reasonId = document.getElementById('reasonSelect').value;
                const amount = document.getElementById('amount').value;
                
                if (!playerIds || playerIds.length === 0) {
                    showToast('Selecteer één of meerdere spelers!', 'error');
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
                    player_ids: playerIds,
                    reason_id: reasonId,
                    amount: parseFloat(amount)
                });
                
                if (success) {
                    // Reset form
                    $(playerSelect).val(null).trigger('change');
                    document.getElementById('reasonSelect').value = '';
                    document.getElementById('amount').value = '';
                    
                    // Reset Select2
                    try {
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
    
    // Add a function to force reload the page
    function forceReload() {
        // Clear any caches that might be preventing updates
        if ('caches' in window) {
            caches.keys().then(function(cacheNames) {
                cacheNames.forEach(function(cacheName) {
                    caches.delete(cacheName);
                    debug(`Deleted cache: ${cacheName}`);
                });
                // Force a hard reload from the server
                window.location.reload(true);
            });
        } else {
            // Fallback for browsers without Cache API support
            window.location.reload(true);
        }
    }
    
    // Initialization
    function init() {
        debug('Initializing admin panel...');
        
        // Add a reload button in the bottom right corner
        $('body').append(`
            <button id="force-reload" 
                    style="position: fixed; bottom: 20px; right: 20px; z-index: 9999; 
                           background-color: var(--btn-primary); color: white; 
                           border: none; border-radius: 50%; width: 50px; height: 50px; 
                           display: flex; align-items: center; justify-content: center;
                           box-shadow: 0 4px 10px rgba(0,0,0,0.2); opacity: 0.8;">
                <i class="fas fa-sync-alt"></i>
            </button>
        `);
        
        // Add event listener for the reload button
        $('#force-reload').on('click', function() {
            debug('Manual reload requested');
            forceReload();
        });
        
        // Setup tabs
        setupTabs();
        
        // Setup event listeners
        setupEventListeners();
        
        // Update Select2 styling
        updateSelect2Styling();
        
        // Load all data
        loadAllData();
        
        debug('Initialization complete');
    }
    
    // Start the application
    init();
}); 