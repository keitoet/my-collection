const ITEMS_PER_PAGE = 12;
let allItemsData = [];

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
            allItemsData = data;

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

                return `
                    <div class="item-card" onclick="openModal(${actualIndex})">
                        <div class="item-img-box">
                            ${imgHtml}
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

// 👁️ 4. クリックしたら画面中央に詳細ポップアップを開く機能
window.openModal = function(index) {
    const item = allItemsData[index];
    if (!item) return;

    const modal = document.getElementById('detail-modal');
    const modalImgBox = document.getElementById('modalImgBox');
    const modalTitle = document.getElementById('modalTitle');
    const modalDetails = document.getElementById('modalDetails');

    const imgHtml = item.img && item.img.trim() !== "" 
        ? `<img src="${item.img}" alt="${item.title}" style="width:100%; height:100%; object-fit:cover;">` 
        : `<span class="no-img-text">NO IMAGE</span>`;
    
    modalImgBox.innerHTML = imgHtml;
    modalTitle.innerText = item.title;

    // 💡 慧斗くんの言う通り、JSONの"got"のデータだけを見てバッジを切り替えます！
    const gotStatusHtml = item.got === true
        ? `<li>状態：<span style="color:#2f855a; background:#c6f6d5; padding:2px 8px; border-radius:12px; font-size:12px; display:inline-block; vertical-align:middle;">🟢 GET済み！</span></li>`
        : `<li>状態：<span style="color:#9b2c2c; background:#fed7d7; padding:2px 8px; border-radius:12px; font-size:12px; display:inline-block; vertical-align:middle;">🔴 まだ持ってない</span></li>`;

    modalDetails.innerHTML = `
        <li>価格：<span style="color:#1a202c;">${item.price}</span></li>
        <li>ほしい度：<span class="stars">${item.stars}</span></li>
        ${gotStatusHtml}
        <li>メモ：<span style="color:#1a202c; font-weight:normal;">${item.memo}</span></li>
    `;

    // 💡 商品ページへ飛ぶボタンだけのシンプルな設定に直しました
    const actionArea = document.getElementById('modalActionArea');
    if (actionArea) {
        if (item.link && item.link.trim() !== "") {
            actionArea.innerHTML = `<a href="${item.link}" target="_blank" class="btn" style="width: 100%; text-align: center; background: #3182ce; color: #fff; border-color: #3182ce;">商品ページを見に行く ➡️</a>`;
        } else {
            actionArea.innerHTML = '';
        }
    }

    modal.style.display = "flex";
};

// ❌ 5. ポップアップを閉じる機能
window.closeItemModal = function() {
    document.getElementById('detail-modal').style.display = "none";
};

// 🚀 6. スタートスイッチ
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
