// API Base URL
const API_BASE_URL = '/api';

// Theme handling
function setTheme(isDark) {
    if (isDark) {
        document.documentElement.classList.add('dark');
        localStorage.theme = 'dark';
        $('#theme-icon').removeClass('fa-moon').addClass('fa-sun');
    } else {
        document.documentElement.classList.remove('dark');
        localStorage.theme = 'light';
        $('#theme-icon').removeClass('fa-sun').addClass('fa-moon');
    }
    
    // Update Select2 dropdowns
    updateSelect2Theme(isDark);
}

// Initialize theme
if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    setTheme(true);
} else {
    setTheme(false);
}

$('#theme-toggle').click(() => {
    setTheme(!document.documentElement.classList.contains('dark'));
});

// Format currency
function formatCurrency(amount) {
    if (typeof amount !== 'number' || isNaN(amount)) {
        console.warn('Invalid amount:', amount);
        return '€0,00';
    }
    return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(amount);
}

// Format date
function formatDate(dateString) {
    if (!dateString) return 'Onbekend';
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'Ongeldige datum';
        
        const months = ['januari', 'februari', 'maart', 'april', 'mei', 'juni', 'juli', 'augustus', 'september', 'oktober', 'november', 'december'];
        const day = date.getDate();
        const month = months[date.getMonth()];
        const year = date.getFullYear();
        
        return `${day} ${month} ${year}`;
    } catch (error) {
        console.error('Error formatting date:', error);
        return 'Ongeldige datum';
    }
}

// Show/hide loading spinner
function toggleLoading(show) {
    $('#loadingSpinner').toggleClass('flex hidden', show);
}

// Show toast message
function showToast(message, type = 'success') {
    const toast = $(`
        <div class="flex items-center p-4 mb-4 rounded-lg ${type === 'success' ? 'bg-green-600' : 'bg-red-600'} text-white">
            <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'} mr-3"></i>
            <span>${message}</span>
        </div>
    `).hide();
    
    $('#toastContainer').append(toast);
    toast.fadeIn();
    
    setTimeout(() => {
        toast.fadeOut(() => toast.remove());
    }, 3000);
}

// Create a card for a fine
function createFineCard(fine) {
    return `
        <div class="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 space-y-3">
            <div class="flex items-center justify-between">
                <div class="font-semibold">${fine.player_name || 'Onbekend'}</div>
                <div class="text-lg font-bold text-blue-600 dark:text-blue-500">${formatCurrency(fine.amount)}</div>
            </div>
            <div class="text-gray-600 dark:text-gray-400">${fine.reason_description || 'Onbekend'}</div>
            <div class="text-sm text-gray-500 dark:text-gray-500">${formatDate(fine.date)}</div>
        </div>
    `;
}

// Create a card for player history
function createHistoryCard(fine) {
    return `
        <div class="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 space-y-3">
            <div class="flex items-center justify-between">
                <div class="text-sm text-gray-500 dark:text-gray-500">${formatDate(fine.date)}</div>
                <div class="text-lg font-bold text-blue-600 dark:text-blue-500">${formatCurrency(fine.amount)}</div>
            </div>
            <div class="text-gray-600 dark:text-gray-400">${fine.reason_description || 'Onbekend'}</div>
        </div>
    `;
}

// Create a card for leaderboard
function createLeaderboardCard(player, index) {
    const medals = ['🥇', '🥈', '🥉'];
    const medal = index < 3 ? medals[index] : '';
    
    return `
        <div class="bg-gray-50 dark:bg-gray-900 rounded-xl p-4">
            <div class="flex items-center justify-between">
                <div class="flex items-center space-x-3">
                    <div class="text-lg font-bold ${index < 3 ? 'text-blue-600 dark:text-blue-500' : 'text-gray-600 dark:text-gray-400'}">#${index + 1}</div>
                    <div class="font-semibold">${player.name || 'Onbekend'} ${medal}</div>
                </div>
                <div class="text-lg font-bold text-blue-600 dark:text-blue-500">${formatCurrency(player.total)}</div>
            </div>
        </div>
    `;
}

// Initialize Select2
function initializeSelect2() {
    // Clean up existing instances
    $('.select2-container').remove();
    
    // Initialize player select
    $('#playerSelect').select2({
        theme: 'classic',
        placeholder: 'Selecteer een speler',
        allowClear: true,
        width: '100%',
        dropdownParent: $('#playerSelect').parent()
    }).on('select2:open', function() {
        document.querySelector('.select2-search__field').focus();
    });
    
    // Update theme
    updateSelect2Theme(document.documentElement.classList.contains('dark'));
}

// Update Select2 theme
function updateSelect2Theme(isDark) {
    $('.select2-container--classic .select2-selection--single').css({
        'background-color': isDark ? 'rgb(17, 24, 39)' : 'white',
        'border-color': isDark ? 'rgb(55, 65, 81)' : 'rgb(209, 213, 219)',
        'color': isDark ? 'white' : 'inherit'
    });
    
    $('.select2-container--classic .select2-selection--single .select2-selection__rendered').css({
        'color': isDark ? 'white' : 'inherit'
    });
    
    $('.select2-container--classic .select2-dropdown').css({
        'background-color': isDark ? 'rgb(17, 24, 39)' : 'white',
        'border-color': isDark ? 'rgb(55, 65, 81)' : 'rgb(209, 213, 219)'
    });
    
    $('.select2-container--classic .select2-results__option').css({
        'color': isDark ? 'white' : 'inherit'
    });
    
    $('.select2-container--classic .select2-search__field').css({
        'background-color': isDark ? 'rgb(17, 24, 39)' : 'white',
        'color': isDark ? 'white' : 'inherit'
    });
}

// Load total amount
async function loadTotalFines() {
    try {
        toggleLoading(true);
        const response = await fetch(`${API_BASE_URL}/totaal-boetes`);
        const data = await response.json();
        
        if (!response.ok) throw new Error('Failed to load total');
        
        const total = parseFloat(data.total || 0);
        const totalElement = document.getElementById('totalAmount');
        
        // Animate the counter
        const duration = 2000;
        const steps = 60;
        const stepTime = duration / steps;
        let lastTime = performance.now();
        let currentStep = 0;
        
        const animate = (currentTime) => {
            const deltaTime = currentTime - lastTime;
            
            if (deltaTime >= stepTime) {
                currentStep++;
                const progress = currentStep / steps;
                const easedProgress = 1 - Math.pow(1 - progress, 3); // Cubic ease out
                const current = total * easedProgress;
                
                totalElement.textContent = formatCurrency(current);
                lastTime = currentTime;
                
                if (currentStep < steps) {
                    requestAnimationFrame(animate);
                } else {
                    totalElement.textContent = formatCurrency(total);
                }
            } else {
                requestAnimationFrame(animate);
            }
        };
        
        requestAnimationFrame(animate);
    } catch (error) {
        console.error('Error loading total:', error);
        showToast('Fout bij laden van totaal bedrag', 'error');
        
        const totalElement = document.getElementById('totalAmount');
        if (totalElement) {
            totalElement.textContent = formatCurrency(0);
        }
    } finally {
        toggleLoading(false);
    }
}

// Load recent fines
async function loadRecentFines() {
    try {
        const response = await fetch(`${API_BASE_URL}/recent-fines`);
        const fines = await response.json();
        
        if (!response.ok) throw new Error('Failed to load recent fines');
        
        $('#recentFines').html(
            fines.length ? 
            fines.map(fine => createFineCard(fine)).join('') :
            '<div class="text-center py-4 text-gray-500">Geen recente boetes gevonden</div>'
        );
    } catch (error) {
        console.error('Error loading recent fines:', error);
        showToast('Fout bij laden recente boetes', 'error');
        $('#recentFines').html('<div class="text-center py-4 text-gray-500">Fout bij laden</div>');
    }
}

// Load player history
async function loadPlayerHistory(playerId) {
    if (!playerId) {
        $('#playerHistory').html('<div class="text-center py-4 text-gray-500">Selecteer een speler...</div>');
        return;
    }
    
    try {
        toggleLoading(true);
        const response = await fetch(`${API_BASE_URL}/player-history/${encodeURIComponent(playerId)}`);
        const data = await response.json();
        
        if (!response.ok) throw new Error('Failed to load player history');
        
        if (!data.fines || data.fines.length === 0) {
            $('#playerHistory').html('<div class="text-center py-4 text-gray-500">Geen boetes gevonden</div>');
            return;
        }
        
        const total = data.fines.reduce((sum, fine) => sum + (fine.amount || 0), 0);
        
        $('#playerHistoryTitle').html(`
            <i class="fas fa-user-clock text-blue-600 mr-3"></i>
            Historie van ${data.player_name}
        `);
        
        $('#playerHistory').html(`
            ${data.fines.map(fine => createHistoryCard(fine)).join('')}
            <div class="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
                <div class="flex items-center justify-between">
                    <div class="font-semibold text-blue-900 dark:text-blue-100">Totaal</div>
                    <div class="text-lg font-bold text-blue-600 dark:text-blue-500">${formatCurrency(total)}</div>
                </div>
            </div>
        `);
    } catch (error) {
        console.error('Error loading player history:', error);
        showToast('Fout bij laden speler historie', 'error');
        $('#playerHistory').html('<div class="text-center py-4 text-gray-500">Fout bij laden</div>');
    } finally {
        toggleLoading(false);
    }
}

// Load leaderboard
async function loadLeaderboard() {
    try {
        const response = await fetch(`${API_BASE_URL}/player-totals`);
        const players = await response.json();
        
        if (!response.ok) throw new Error('Failed to load leaderboard');
        
        const sortedPlayers = players
            .sort((a, b) => (b.total || 0) - (a.total || 0))
            .slice(0, 5);
        
        $('#leaderboard').html(
            sortedPlayers.length ? 
            sortedPlayers.map((player, index) => createLeaderboardCard(player, index)).join('') :
            '<div class="text-center py-4 text-gray-500">Geen data beschikbaar</div>'
        );
    } catch (error) {
        console.error('Error loading leaderboard:', error);
        showToast('Fout bij laden leaderboard', 'error');
        $('#leaderboard').html('<div class="text-center py-4 text-gray-500">Fout bij laden</div>');
    }
}

// Load players for select
async function loadPlayers() {
    try {
        const response = await fetch(`${API_BASE_URL}/players`);
        const players = await response.json();
        
        if (!response.ok) throw new Error('Failed to load players');
        
        const select = $('#playerSelect');
        select.empty().append('<option value="">Selecteer een speler</option>');
        
        players.forEach(player => {
            select.append(`<option value="${player.id}">${player.name}</option>`);
        });
        
        initializeSelect2();
    } catch (error) {
        console.error('Error loading players:', error);
        showToast('Fout bij laden spelers', 'error');
    }
}

// Event handlers
$('#playerSelect').on('change', function() {
    const playerId = $(this).val();
    loadPlayerHistory(playerId);
});

// Initialize app
$(document).ready(() => {
    // Load all data
    Promise.all([
        loadTotalFines(),
        loadRecentFines(),
        loadLeaderboard(),
        loadPlayers()
    ]).catch(error => {
        console.error('Error loading initial data:', error);
        showToast('Fout bij laden van gegevens', 'error');
    });
});