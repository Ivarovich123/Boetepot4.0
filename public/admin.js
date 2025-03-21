// Simple authentication and admin functionality
document.addEventListener('DOMContentLoaded', function() {
    // Configuration
    const ADMIN_PASSWORD = 'Mandje123'; // Hardcoded password
    const AUTH_TOKEN_KEY = 'boetepot_admin_token';
    const API_BASE_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
        ? 'http://localhost:3000/api' 
        : '/api';
    
    // Debug flag - set to true for console logs
    const DEBUG = true;
    
    // DOM Elements
    const loginModal = document.getElementById('loginModal');
    const loginForm = document.getElementById('loginForm');
    const loginError = document.getElementById('loginError');
    const adminContent = document.querySelectorAll('.admin-content');
    const logoutBtn = document.getElementById('logoutBtn');
    const themeToggle = document.getElementById('themeToggle');
    const themeIcon = document.getElementById('themeIcon');
    
    // Theme management
    function initTheme() {
        // Check for saved theme preference or use system preference
        const savedTheme = localStorage.getItem('theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
            document.body.classList.add('dark');
            themeIcon.classList.remove('fa-moon');
            themeIcon.classList.add('fa-sun');
        } else {
            document.body.classList.remove('dark');
            themeIcon.classList.remove('fa-sun');
            themeIcon.classList.add('fa-moon');
        }
        
        // Update Select2 theme
        updateSelect2Theme();
    }
    
    function toggleTheme() {
        if (document.body.classList.contains('dark')) {
            document.body.classList.remove('dark');
            themeIcon.classList.remove('fa-sun');
            themeIcon.classList.add('fa-moon');
            localStorage.setItem('theme', 'light');
        } else {
            document.body.classList.add('dark');
            themeIcon.classList.remove('fa-moon');
            themeIcon.classList.add('fa-sun');
            localStorage.setItem('theme', 'dark');
        }
        
        // Update Select2 theme
        updateSelect2Theme();
    }
    
    function updateSelect2Theme() {
        // Force Select2 to adopt the current theme
        setTimeout(() => {
            const isDark = document.body.classList.contains('dark');
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
    
    // Authentication Functions
    function generateToken() {
        return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    }
    
    function checkAuth() {
        const token = localStorage.getItem(AUTH_TOKEN_KEY);
        return !!token; // Return true if token exists
    }
    
    function login(password) {
        if (password === ADMIN_PASSWORD) {
            // Create and store auth token
            const token = generateToken();
            localStorage.setItem(AUTH_TOKEN_KEY, token);
            
            // Show admin content
            adminContent.forEach(el => el.style.display = 'block');
            loginModal.style.display = 'none';
            
            // Show success message
            showToast('Successfully logged in!', 'success');
            
            // Load admin data
            loadAllData();
            return true;
        } else {
            loginError.classList.remove('hidden');
            return false;
        }
    }
    
    function logout() {
        // Clear auth token
        localStorage.removeItem(AUTH_TOKEN_KEY);
        
        // Hide admin content and show login modal
        adminContent.forEach(el => el.style.display = 'none');
        loginModal.style.display = 'flex';
        
        // Clear any sensitive data
        clearAllData();
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
        const tabPlayers = document.getElementById('tab-players');
        const tabReasons = document.getElementById('tab-reasons');
        const finesTab = document.getElementById('finesTab');
        const playersTab = document.getElementById('playersTab');
        const reasonsTab = document.getElementById('reasonsTab');
        
        // Check if elements exist
        if (!tabBoetes || !tabPlayers || !tabReasons || !finesTab || !playersTab || !reasonsTab) {
            debug('Tab elements missing!');
            return;
        }
        
        function activateTab(tabId) {
            // Reset all tabs
            [tabBoetes, tabPlayers, tabReasons].forEach(tab => {
                tab.classList.remove('tab-active');
            });
            
            // Hide all content
            [finesTab, playersTab, reasonsTab].forEach(content => {
                content.classList.add('hidden');
            });
            
            // Activate selected tab
            if (tabId === 'players') {
                tabPlayers.classList.add('tab-active');
                playersTab.classList.remove('hidden');
                localStorage.setItem('activeTab', 'players');
            } else if (tabId === 'reasons') {
                tabReasons.classList.add('tab-active');
                reasonsTab.classList.remove('hidden');
                localStorage.setItem('activeTab', 'reasons');
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
        tabPlayers.addEventListener('click', () => activateTab('players'));
        tabReasons.addEventListener('click', () => activateTab('reasons'));
    }
    
    // API & Data Functions
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
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `API error: ${response.status}`);
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
            renderFinesList(fines);
            return fines;
        } catch (error) {
            debug(`Failed to load fines: ${error.message}`);
            return [];
        }
    }
    
    async function loadAllData() {
        debug('Loading all data...');
        await Promise.all([
            loadPlayers(),
            loadReasons(),
            loadFines()
        ]);
        debug('All data loaded successfully');
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
            updateSelect2Theme();
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
            updateSelect2Theme();
        } catch (error) {
            debug(`Error initializing Select2: ${error.message}`);
        }
    }
    
    function renderFinesList(fines) {
        const container = document.getElementById('recentFines');
        if (!container) return;
        
        container.innerHTML = '';
        
        if (fines.length === 0) {
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
        
        if (players.length === 0) {
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
        
        if (reasons.length === 0) {
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
        
        // Login form
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const password = document.getElementById('password').value;
            login(password);
        });
        
        // Logout button
        logoutBtn.addEventListener('click', logout);
        
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
                if (confirm('Weet je zeker dat je alle lokale opslag wilt wissen? Je wordt uitgelogd.')) {
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
        
        // Init theme
        initTheme();
        
        // Check authentication
        if (checkAuth()) {
            debug('User is authenticated');
            // Hide login modal, show admin content
            adminContent.forEach(el => el.style.display = 'block');
            loginModal.style.display = 'none';
            
            // Setup tabs
            setupTabs();
            
            // Load data
            loadAllData();
        } else {
            debug('User is not authenticated');
            // Show login modal, hide admin content
            adminContent.forEach(el => el.style.display = 'none');
            loginModal.style.display = 'flex';
        }
        
        // Setup event listeners
        setupEventListeners();
        
        debug('Initialization complete');
    }
    
    // Start the application
    init();
}); 