let playersData = [];
let opponentsData = [];
let matchupRecordCache = new Map();

document.addEventListener('DOMContentLoaded', async function() {
    await Promise.all([loadPlayers(), loadOpponents()]);
    await loadAllGameRecords();
});

async function loadPlayers() {
    try {
        const response = await fetch('/api/players');
        playersData = await response.json();

        const playerSelect = document.getElementById('playerSelect');
        playerSelect.innerHTML = '<option value="">请选择球员...</option>';

        playersData.forEach(player => {
            const option = document.createElement('option');
            option.value = player.id;
            option.textContent = `${player.name} (#${player.jersey_number}) - ${player.primary_position || '未指定位置'}`;
            playerSelect.appendChild(option);
        });
    } catch (error) {
        console.error('加载球员数据失败:', error);
        showAlert('加载球员数据失败', 'danger');
    }
}

async function loadOpponents() {
    try {
        const response = await fetch('/api/matchup/opponents');
        opponentsData = await response.json();

        const opponentSelect = document.getElementById('opponentSelect');
        opponentSelect.innerHTML = '<option value="">请选择对手...</option>';

        opponentsData.forEach(opponent => {
            const option = document.createElement('option');
            option.value = opponent;
            option.textContent = opponent;
            opponentSelect.appendChild(option);
        });
    } catch (error) {
        console.error('加载对手数据失败:', error);
        showAlert('加载对手数据失败', 'danger');
    }
}

function buildMatchupQuery() {
    const params = new URLSearchParams();
    const playerId = document.getElementById('playerSelect').value;
    const opponent = document.getElementById('opponentSelect').value;

    if (playerId) {
        params.set('player_id', playerId);
    }
    if (opponent) {
        params.set('opponent', opponent);
    }

    return params;
}

async function loadMatchupStats() {
    const params = buildMatchupQuery();

    if (![...params.keys()].length) {
        showAlert('请至少选择球员或对手中的一个筛选条件', 'warning');
        return;
    }

    try {
        const response = await fetch(`/api/matchup/search_records?${params.toString()}`);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || '加载筛选记录失败');
        }

        document.getElementById('infoAlert').style.display = 'none';
        hideAllTeamRecords();
        displayQuerySummary(data);
        renderBattingTable(data.batting_records, {
            cardId: 'filteredBattingCard',
            tableSelector: '#filteredBattingTable',
            tableBodyId: 'filteredBattingTableBody',
            emptyMessage: '当前筛选条件下没有打击记录'
        });
        renderPitchingTable(data.pitching_records, {
            cardId: 'filteredPitchingCard',
            tableSelector: '#filteredPitchingTable',
            tableBodyId: 'filteredPitchingTableBody',
            emptyMessage: '当前筛选条件下没有投球记录'
        });

        if ((!data.batting_records || data.batting_records.length === 0) &&
            (!data.pitching_records || data.pitching_records.length === 0)) {
            showAlert('没有找到符合条件的比赛记录', 'warning');
        }
    } catch (error) {
        console.error('加载对局数据失败:', error);
        showAlert(error.message || '加载对局数据失败', 'danger');
        resetFilteredResults();
    }
}

function displayQuerySummary(data) {
    const summaryCard = document.getElementById('querySummaryCard');
    const summaryContent = document.getElementById('querySummaryContent');
    const battingSummary = data.batting_summary;
    const pitchingSummary = data.pitching_summary;

    const summaryParts = [
        `
        <div class="row">
            <div class="col-md-12 mb-3">
                <h5>${data.title}</h5>
                <p class="text-muted mb-0">
                    打击记录 ${data.batting_records.length} 条，投球记录 ${data.pitching_records.length} 条
                </p>
            </div>
        </div>
        `
    ];

    if (battingSummary) {
        summaryParts.push(`
            <div class="row g-3 mb-3">
                <div class="col-md-12">
                    <h6 class="mb-2">打击汇总</h6>
                </div>
                <div class="col-md-2">
                    <div class="card bg-light"><div class="card-body text-center"><div>场次</div><h4>${battingSummary.games}</h4></div></div>
                </div>
                <div class="col-md-2">
                    <div class="card bg-light"><div class="card-body text-center"><div>打数</div><h4>${battingSummary.at_bats}</h4></div></div>
                </div>
                <div class="col-md-2">
                    <div class="card bg-light"><div class="card-body text-center"><div>安打</div><h4>${battingSummary.hits}</h4></div></div>
                </div>
                <div class="col-md-2">
                    <div class="card bg-light"><div class="card-body text-center"><div>打点</div><h4>${battingSummary.rbi}</h4></div></div>
                </div>
                <div class="col-md-2">
                    <div class="card bg-light"><div class="card-body text-center"><div>本垒打</div><h4>${battingSummary.home_runs}</h4></div></div>
                </div>
                <div class="col-md-2">
                    <div class="card bg-light"><div class="card-body text-center"><div>打击率</div><h4 class="${getAvgBadgeClass(battingSummary.batting_average)}">${battingSummary.batting_average.toFixed(3)}</h4></div></div>
                </div>
            </div>
        `);
    }

    if (pitchingSummary) {
        summaryParts.push(`
            <div class="row g-3">
                <div class="col-md-12">
                    <h6 class="mb-2">投球汇总</h6>
                </div>
                <div class="col-md-2">
                    <div class="card bg-light"><div class="card-body text-center"><div>场次</div><h4>${pitchingSummary.games}</h4></div></div>
                </div>
                <div class="col-md-2">
                    <div class="card bg-light"><div class="card-body text-center"><div>局数</div><h4>${pitchingSummary.innings_pitched.toFixed(1)}</h4></div></div>
                </div>
                <div class="col-md-2">
                    <div class="card bg-light"><div class="card-body text-center"><div>三振</div><h4>${pitchingSummary.strikeouts}</h4></div></div>
                </div>
                <div class="col-md-2">
                    <div class="card bg-light"><div class="card-body text-center"><div>ERA</div><h4>${pitchingSummary.era.toFixed(2)}</h4></div></div>
                </div>
                <div class="col-md-2">
                    <div class="card bg-light"><div class="card-body text-center"><div>WHIP</div><h4>${pitchingSummary.whip.toFixed(2)}</h4></div></div>
                </div>
                <div class="col-md-2">
                    <div class="card bg-light"><div class="card-body text-center"><div>好球率</div><h4>${pitchingSummary.strike_percentage.toFixed(1)}%</h4></div></div>
                </div>
            </div>
        `);
    }

    if (!battingSummary && !pitchingSummary) {
        summaryParts.push('<div class="alert alert-warning mb-0">当前筛选条件下没有实际录入的打击或投球数据。</div>');
    }

    summaryContent.innerHTML = summaryParts.join('');
    summaryCard.style.display = 'block';
}

function renderBattingTable(records, options) {
    const { cardId, tableSelector, tableBodyId, emptyMessage } = options;
    const card = document.getElementById(cardId);
    const tableBody = document.getElementById(tableBodyId);

    tableBody.innerHTML = '';

    if (!records || records.length === 0) {
        destroyDataTable(tableSelector);
        card.style.display = 'none';
        return;
    }

    records.forEach(record => {
        matchupRecordCache.set(record.id, {
            game_date: record.game_date,
            opponent: record.opponent,
            player_name: record.player_name
        });

        const row = document.createElement('tr');
        row.innerHTML = `
            <td><strong>${record.player_name}</strong></td>
            <td>${record.player_jersey}</td>
            <td>${record.game_date}</td>
            <td>${record.opponent}</td>
            <td>${record.at_bats}</td>
            <td>${record.hits}</td>
            <td>${record.runs}</td>
            <td>${record.rbi}</td>
            <td>${record.home_runs}</td>
            <td>${record.strikeouts}</td>
            <td>${record.walks}</td>
            <td>${record.stolen_bases}</td>
            <td><span class="badge ${getAvgBadgeClass(record.batting_average)}">${record.batting_average.toFixed(3)}</span></td>
            <td>
                <button class="btn btn-sm btn-danger" onclick="deleteGameRecord(${record.id})">
                    <i class="fas fa-trash"></i> 删除
                </button>
            </td>
        `;
        tableBody.appendChild(row);
    });

    card.style.display = 'block';
    initDataTable(tableSelector, 2);
}

function renderPitchingTable(records, options) {
    const { cardId, tableSelector, tableBodyId } = options;
    const card = document.getElementById(cardId);
    const tableBody = document.getElementById(tableBodyId);

    tableBody.innerHTML = '';

    if (!records || records.length === 0) {
        destroyDataTable(tableSelector);
        card.style.display = 'none';
        return;
    }

    records.forEach(record => {
        matchupRecordCache.set(record.id, {
            game_date: record.game_date,
            opponent: record.opponent,
            player_name: record.player_name
        });

        const row = document.createElement('tr');
        row.innerHTML = `
            <td><strong>${record.player_name}</strong></td>
            <td>${record.player_jersey}</td>
            <td>${record.game_date}</td>
            <td>${record.opponent}</td>
            <td>${record.innings_pitched.toFixed(1)}</td>
            <td>${record.hits_allowed}</td>
            <td>${record.runs_allowed}</td>
            <td>${record.earned_runs}</td>
            <td>${record.walks_allowed}</td>
            <td>${record.strikeouts}</td>
            <td>${record.home_runs_allowed}</td>
            <td>${record.pitches}</td>
            <td>${record.strike_percentage.toFixed(1)}%</td>
            <td>${record.era.toFixed(2)}</td>
            <td>${record.whip.toFixed(2)}</td>
            <td>${record.result_text}</td>
            <td>
                <button class="btn btn-sm btn-danger" onclick="deleteGameRecord(${record.id})">
                    <i class="fas fa-trash"></i> 删除
                </button>
            </td>
        `;
        tableBody.appendChild(row);
    });

    card.style.display = 'block';
    initDataTable(tableSelector, 2);
}

async function loadAllGameRecords() {
    try {
        const response = await fetch('/api/matchup/all_game_records');
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || '加载所有比赛记录失败');
        }

        renderBattingTable(data.batting_records, {
            cardId: 'allPlayersBattingCard',
            tableSelector: '#allPlayersBattingTable',
            tableBodyId: 'allPlayersBattingTableBody',
            emptyMessage: '当前没有全队打击记录'
        });
        renderPitchingTable(data.pitching_records, {
            cardId: 'allPlayersPitchingCard',
            tableSelector: '#allPlayersPitchingTable',
            tableBodyId: 'allPlayersPitchingTableBody',
            emptyMessage: '当前没有全队投球记录'
        });
    } catch (error) {
        console.error('加载所有队员比赛记录失败:', error);
        showAlert(error.message || '加载所有队员比赛记录失败', 'danger');
    }
}

function initDataTable(tableSelector, defaultOrderColumn) {
    destroyDataTable(tableSelector);
    $(tableSelector).DataTable({
        language: {
            url: 'https://cdn.datatables.net/plug-ins/1.13.4/i18n/zh-HANS.json'
        },
        pageLength: 10,
        order: [[defaultOrderColumn, 'desc']]
    });
}

function destroyDataTable(tableSelector) {
    if ($.fn.DataTable.isDataTable(tableSelector)) {
        $(tableSelector).DataTable().destroy();
    }
}

function hideAllTeamRecords() {
    destroyDataTable('#allPlayersBattingTable');
    destroyDataTable('#allPlayersPitchingTable');
    document.getElementById('allPlayersBattingCard').style.display = 'none';
    document.getElementById('allPlayersPitchingCard').style.display = 'none';
}

function resetFilteredResults() {
    destroyDataTable('#filteredBattingTable');
    destroyDataTable('#filteredPitchingTable');
    document.getElementById('querySummaryCard').style.display = 'none';
    document.getElementById('filteredBattingCard').style.display = 'none';
    document.getElementById('filteredPitchingCard').style.display = 'none';
}

async function deleteGameRecord(recordId) {
    const recordMeta = matchupRecordCache.get(recordId) || {};
    const gameDate = recordMeta.game_date || '未知日期';
    const opponent = recordMeta.opponent || '未知对手';
    const playerName = recordMeta.player_name || '';
    const playerText = playerName ? `球员 ${playerName} 的` : '';
    const message = `确定要删除${playerText} ${gameDate} 对阵 ${opponent} 的比赛记录吗？此操作会同步扣减累计数据，且不可恢复。`;

    if (!confirm(message)) {
        return;
    }

    try {
        const response = await fetch(`/api/matchup/game_record/${recordId}`, {
            method: 'DELETE'
        });
        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || '删除失败');
        }

        showAlert(`比赛记录删除成功：${result.player_name} 对阵 ${result.opponent} (${result.game_date})`, 'success');

        const hasFilters = document.getElementById('playerSelect').value || document.getElementById('opponentSelect').value;
        if (hasFilters) {
            await loadMatchupStats();
        } else {
            resetFilteredResults();
            document.getElementById('infoAlert').style.display = 'block';
            await loadAllGameRecords();
        }
    } catch (error) {
        console.error('删除比赛记录失败:', error);
        showAlert(`删除失败: ${error.message}`, 'danger');
    }
}

function getAvgBadgeClass(average) {
    const avg = parseFloat(average);
    if (avg >= 0.300) return 'bg-success';
    if (avg >= 0.250) return 'bg-warning';
    return 'bg-secondary';
}

function resetFilters() {
    document.getElementById('playerSelect').value = '';
    document.getElementById('opponentSelect').value = '';
    resetFilteredResults();
    document.getElementById('infoAlert').style.display = 'block';
}

function showAlert(message, type = 'info') {
    const existingAlert = document.querySelector('.alert-dismissible');
    if (existingAlert) {
        existingAlert.remove();
    }

    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
    alertDiv.style.cssText = `
        top: 20px;
        right: 20px;
        z-index: 9999;
        min-width: 300px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `;

    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;

    document.body.appendChild(alertDiv);

    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.remove();
        }
    }, 3000);
}
