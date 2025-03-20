// Load all data immediately
loadAllData();

async function loadAllData() {
    await Promise.all([
        loadPlayers(),
        loadReasons(),
        loadFines()
    ]);
}

async function loadPlayers() {
    try {
        const response = await fetch('/api/players');
        const players = await response.json();
        
        // Update player select
        const playerSelect = document.getElementById('playerSelect');
        playerSelect.innerHTML = '<option value="">Selecteer speler</option>';
        players.forEach(player => {
            playerSelect.innerHTML += `<option value="${player.id}">${player.name}</option>`;
        });

        // Update players list
        const playersList = document.getElementById('playersList');
        if (playersList) {
            playersList.innerHTML = '';
            players.forEach(player => {
                playersList.innerHTML += `
                    <div class="list-group-item d-flex justify-content-between align-items-center">
                        ${player.name}
                    </div>
                `;
            });
        }
    } catch (error) {
        console.error('Error loading players:', error);
        showToast('Fout bij laden spelers', true);
    }
}

async function loadReasons() {
    try {
        const response = await fetch('/api/reasons');
        const reasons = await response.json();
        
        // Update reason select
        const reasonSelect = document.getElementById('reasonSelect');
        reasonSelect.innerHTML = '<option value="">Selecteer reden</option>';
        reasons.forEach(reason => {
            reasonSelect.innerHTML += `<option value="${reason.id}">${reason.description}</option>`;
        });

        // Update reasons list
        const reasonsList = document.getElementById('reasonsList');
        if (reasonsList) {
            reasonsList.innerHTML = '';
            reasons.forEach(reason => {
                reasonsList.innerHTML += `
                    <div class="list-group-item d-flex justify-content-between align-items-center">
                        ${reason.description}
                    </div>
                `;
            });
        }
    } catch (error) {
        console.error('Error loading reasons:', error);
        showToast('Fout bij laden redenen', true);
    }
}

async function loadFines() {
    try {
        const response = await fetch('/api/recent-fines');
        const fines = await response.json();
        
        const finesList = document.getElementById('finesList');
        if (finesList) {
            finesList.innerHTML = '';
            fines.forEach(fine => {
                const date = formatDate(fine.date);
                finesList.innerHTML += `
                    <tr>
                        <td>${fine.player_name || 'Onbekend'}</td>
                        <td>${fine.reason_description || 'Onbekend'}</td>
                        <td>€${fine.amount.toFixed(2)}</td>
                        <td>${date}</td>
                    </tr>
                `;
            });
        }
    } catch (error) {
        console.error('Error loading fines:', error);
        showToast('Fout bij laden boetes', true);
    }
}

// Add fine form handler
document.getElementById('addFineForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const playerId = document.getElementById('playerSelect').value;
    const reasonId = document.getElementById('reasonSelect').value;
    const amount = document.getElementById('amount').value;

    if (!playerId || !reasonId || !amount) {
        showToast('Vul alle velden in', true);
        return;
    }

    try {
        const response = await fetch('/api/fines', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                player_id: parseInt(playerId),
                reason_id: parseInt(reasonId),
                amount: parseFloat(amount)
            })
        });

        if (response.ok) {
            document.getElementById('addFineForm').reset();
            await Promise.all([
                loadFines(),
                loadTotalFines(),
                loadLeaderboard()
            ]);
            showToast('Boete succesvol toegevoegd!');
        } else {
            const error = await response.json();
            console.error('Server error:', error);
            showToast(error.error || 'Er is een fout opgetreden bij het toevoegen van de boete', true);
        }
    } catch (error) {
        console.error('Error adding fine:', error);
        showToast('Er is een fout opgetreden bij het toevoegen van de boete', true);
    }
});

// Add player form handler
document.getElementById('addPlayerForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('newPlayer').value;

    try {
        const response = await fetch('/api/players', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name })
        });

        if (response.ok) {
            document.getElementById('newPlayer').value = '';
            await loadPlayers();
            showToast('Speler succesvol toegevoegd!');
        } else {
            showToast('Er is een fout opgetreden bij het toevoegen van de speler', true);
        }
    } catch (error) {
        console.error('Error adding player:', error);
        showToast('Er is een fout opgetreden bij het toevoegen van de speler', true);
    }
});

// Add reason form handler
document.getElementById('addReasonForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const description = document.getElementById('newReason').value;

    try {
        const response = await fetch('/api/reasons', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ description })
        });

        if (response.ok) {
            document.getElementById('newReason').value = '';
            await loadReasons();
            showToast('Reden succesvol toegevoegd!');
        } else {
            showToast('Er is een fout opgetreden bij het toevoegen van de reden', true);
        }
    } catch (error) {
        console.error('Error adding reason:', error);
        showToast('Er is een fout opgetreden bij het toevoegen van de reden', true);
    }
});

function formatDate(dateString) {
    if (!dateString) return 'Onbekend';
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return 'Ongeldige datum';
        
        const months = ['Januari', 'Februari', 'Maart', 'April', 'Mei', 'Juni', 'Juli', 'Augustus', 'September', 'Oktober', 'November', 'December'];
        return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
    } catch (error) {
        console.error('Error formatting date:', error);
        return 'Ongeldige datum';
    }
}

function showToast(message, isError = false) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    
    toast.className = `toast ${isError ? 'bg-danger' : 'bg-success'} text-white`;
    toast.textContent = message;
    toast.style.display = 'block';
    setTimeout(() => {
        toast.style.display = 'none';
    }, 3000);
} 