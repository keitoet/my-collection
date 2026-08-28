const ITEMS_PER_PAGE = 12;
let itemData = [];
let savedGets = JSON.parse(localStorage.getItem('zukan_get_dates')) || {};

// 🔒 1. 自分の status.json から緊急アラートを読み込む機能
function loadStatusFromJson() {
    fetch('status.json')
        .then(response => response.json())
        .then(data => {
            const emergencyAlert = document.getElementById('emergencyAlert');
            if (emergencyAlert && data.alert && data.alert.trim() !== "") {
                if (data.alertUrl) {
                    emergencyAlert.innerHTML = `<a href="${data.alertUrl}" style="color: inherit; text-decoration: none; display: block; width: 100%; height: 100%;">${data.alert}</a>`;
                } else {
                    emergencyAlert.innerText = data.alert;
                }
                emergencyAlert.style.display = "block";
            } else if (emergencyAlert) {
                emergencyAlert.style.display = "none";
            }
        })
        .catch(error => console.error('Error loading status:', error));
}

// 📦 2. 自分の shared.html からヘッダー・フッターを読み込む機能
function loadSharedComponents() {
    fetch('shared.html')
        .then(res => res.text())
        .then(html => {
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const headerEl = document.querySelector('header');
            const footerEl = document.querySelector('footer');
            const sharedHeader = doc.getElementById('commonHeader');
            const sharedFooter = doc.getElementById('commonFooter');
            if (headerEl && sharedHeader) headerEl.innerHTML = sharedHeader.innerHTML;
            if (footerEl && sharedFooter) footerEl.innerHTML = sharedFooter.innerHTML;
        })
        .catch(error => console.error('Error loading shared components:', error));
}

// 🎁 3. 自分の data.json から商品を読み込んでカードを並べる機能
function loadPicksFromJson() {
    const grid = document.getElementById('collectionGrid');
    const paginationArea = document.getElementById('paginationArea');
    if (!grid) return;

    const urlParams = new URLSearchParams(window.location.search);
    let currentPage = parseInt(urlParams.get('page')) || 1;

    fetch('data.json')
        .then(response => response.json())
        .then(data => {
            if (!data) return;
            itemData = data;

            const totalItems = data.length;
            const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
            const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
            const endIndex = startIndex + ITEMS_PER_PAGE;
            const pageData = data.slice(startIndex, endIndex);

            grid.innerHTML = pageData.map((item, index) => {
                const actualIndex = startIndex + index;
                const imgHtml = item.img && item.img.trim() !== "" 
                    ? `<img src="${item.img}" alt="${item.title}">` 
                    : `<span class="no-img-text">NO IMAGE</span>`;

                // 💡 GET済みなら画像の上に薄くGETオーバーレイを出す元の機能を合流！
                const getInfo = savedGets[item.title];
                const getOverlay = getInfo ? `<div class="get-overlay" style="position:absolute; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.4); color:#fff; display:flex; flex-direction:column; align-items:center; justify-content:center; font-weight:bold; font-size:18px;">GET<span style="font-size:11px;">―${getInfo.date}―</span></div>` : '';

                return `
                    <div class="item-card" onclick="openModal(${actualIndex})">
                        <div class="item-img-box" style="position: relative;">
                            ${imgHtml}
                            ${getOverlay}
                        </div>
                        <div class="item-info">
                            <div class="item-title">${item.title}</div>
                            <ul class="item-detail-list">
                                <li>価格：<span>${item.price}</span></li>
                                <li>ほしい度：<span class="stars">${item.stars}</span></li>
                                <li>メモ：<span>${item.memo}</span></li>
                            </ul>
                        </div>
                    </div>
                `;
            }).join('');

            if (paginationArea) {
                if (totalPages > 1) {
                    let pageButtonsHtml = '<div class="pagination">';
                    for (let i = 1; i <= totalPages; i++) {
                        const isCurrent = i === currentPage ? 'current' : '';
                        pageButtonsHtml += `<a href="?page=${i}" class="page-link ${isCurrent}">${i}</a>`;
                    }
                    pageButtonsHtml += '</div>';
                    paginationArea.innerHTML = pageButtonsHtml;
                } else {
                    paginationArea.innerHTML = '';
                }
            }
        })
        .catch(error => console.error('Error loading picks:', error));
}

// 👁️ 4. 【大復活！】クリックしたら画面中央に詳細ポップアップを開く機能
window.openModal = function(index) {
    const item = itemData[index];
    if (!item) return;

    // 💡 IDの名前を前の設定通りの「detail-modal」に完璧に修正しました！
    const modal = document.getElementById('detail-modal');
    const modalImgBox = document.getElementById('modalImgBox');
    const modalTitle = document.getElementById('modalTitle');
    const modalDetails = document.getElementById('modalDetails');
    const modalLinkBtn = document.getElementById('modalLinkBtn');

    const imgHtml = item.img && item.img.trim() !== "" 
        ? `<img src="${item.img}" alt="${item.title}" style="width:100%; height:100%; object-fit:cover;">` 
        : `<span class="no-img-text">NO IMAGE</span>`;
    
    // GETオーバーレイの引き継ぎ
    const getInfo = savedGets[item.title];
    const getOverlay = getInfo ? `<div class="get-overlay" style="position:absolute; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.4); color:#fff; display:flex; flex-direction:column; align-items:center; justify-content:center; font-weight:bold; font-size:22px;">GET<span style="font-size:12px;">―${getInfo.date}―</span></div>` : '';

    modalImgBox.innerHTML = imgHtml + getOverlay;
    modalTitle.innerText = item.title;

    // GETボタンの出し分け
    let getButtonHTML = '';
    if (getInfo) {
        getButtonHTML = `<button class="btn" style="width: 100%; margin-bottom: 10px; background: #e2e8f0; color: #a0aec0; cursor: not-allowed;" disabled>GET済みです</button>`;
    } else {
        getButtonHTML = `<button class="btn" style="width: 100%; margin-bottom: 10px; background: #ecc94b; color: #fff; border-color: #ecc94b;" onclick="clickGet(${index})">このアイテムをGETする！</button>`;
    }

    modalDetails.innerHTML = `
        <li>価格：<span style="color:#1a202c;">${item.price}</span></li>
        <li>ほしい度：<span class="stars">${item.stars}</span></li>
        <li>メモ：<span style="color:#1a202c; font-weight:normal;">${item.memo}</span></li>
    `;

    // 新しくボタンエリアを組み立てる
    const actionArea = document.getElementById('modalActionArea');
    if (actionArea) {
        const linkButton = item.link && item.link.trim() !== "" 
            ? `<a href="${item.link}" target="_blank" class="btn" style="width: 100%; text-align: center; background: #3182ce; color: #fff; border-color: #3182ce;">商品ページを見に行く ➡️</a>` 
            : '';
        actionArea.innerHTML = getButtonHTML + linkButton;
    }

    modal.style.display = "flex";
};

// ❌ 5. ポップアップを閉じる機能
window.closeItemModal = function() {
    document.getElementById('detail-modal').style.display = "none";
};

// 🟢 6. お気に入りの「GETボタン」を押したときのスタンプ追加機能
window.clickGet = function(index) {
    const item = itemData[index];
    if (savedGets[item.title]) return;

    const today = new Date();
    const dateStr = `${today.getFullYear()}.${today.getMonth() + 1}.${today.getDate()}`;

    savedGets[item.title] = { date: dateStr };
    localStorage.setItem('zukan_get_dates', JSON.stringify(savedGets));

    // 画面中央のポップアップ画像の上に即時GETを表示
    const modalImgBox = document.getElementById('modalImgBox');
    if (modalImgBox) {
        modalImgBox.insertAdjacentHTML('beforeend', `<div class="get-overlay" style="position:absolute; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.4); color:#fff; display:flex; flex-direction:column; align-items:center; justify-content:center; font-weight:bold; font-size:22px;">GET<span style="font-size:12px;">―${dateStr}―</span></div>`);
    }

    // ボタンを「GET済み」に変更
    const actionArea = document.getElementById('modalActionArea');
    if (actionArea) {
        const linkButton = item.link && item.link.trim() !== "" 
            ? `<a href="${item.link}" target="_blank" class="btn" style="width: 100%; text-align: center; background: #3182ce; color: #fff; border-color: #3182ce;">商品ページを見に行く ➡️</a>` 
            : '';
        actionArea.innerHTML = `<button class="btn" style="width: 100%; margin-bottom: 10px; background: #e2e8f0; color: #a0aec0; cursor: not-allowed;" disabled>GET済みです</button>` + linkButton;
    }

    // メイン一覧画面のカード表示も更新
    loadPicksFromJson();
};

// 🚀 7. スタートスイッチ
window.addEventListener('DOMContentLoaded', () => {
    loadSharedComponents();
    loadStatusFromJson();
    loadPicksFromJson();

    // モーダルの外側をクリックしたら閉じる設定
    const modal = document.getElementById('detail-modal');
    window.addEventListener('click', (e) => {
        if (e.target == modal) closeItemModal();
    });
});
