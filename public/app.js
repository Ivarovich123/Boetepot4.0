async function loadPlayerHistory(playerId) {
  try {
    console.log('[History] Loading player history...');
    const response = await fetchAPI(`/api/player-history/${playerId}`);
    
    const historyElement = document.getElementById('playerHistory');
    const historyTitleElement = document.getElementById('playerHistoryTitle');
    
    if (!historyElement) {
      console.error('[History] Element not found');
      return;
    }
    
    if (!response || !response.player_name || !response.fines || response.fines.length === 0) {
      historyElement.innerHTML = '<tr><td colspan="3" class="text-center">Geen boetes gevonden</td></tr>';
      if (historyTitleElement) {
        historyTitleElement.innerHTML = '<i class="fas fa-user-clock"></i>Speler Historie';
      }
      return;
    }
    
    const total = response.fines.reduce((sum, fine) => sum + (fine.amount || 0), 0);
    
    if (historyTitleElement) {
      historyTitleElement.innerHTML = `<i class="fas fa-user-clock"></i>Historie van ${response.player_name}`;
    }
    
    const rows = response.fines.map(fine => `
      <tr>
        <td>${formatDate(fine.date)}</td>
        <td>${fine.reason_description || 'Onbekend'}</td>
        <td>${formatCurrency(fine.amount || 0)}</td>
      </tr>
    `).join('');
    
    historyElement.innerHTML = rows + `
      <tr class="table-info">
        <td colspan="2"><strong>Totaal</strong></td>
        <td><strong>${formatCurrency(total)}</strong></td>
      </tr>
    `;
  } catch (error) {
    console.error('[History] Error:', error);
    showToast('Fout bij laden speler historie', true);
  }
}