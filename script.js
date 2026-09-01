const ITEMS_PER_PAGE = 12;
let allItemsData = [];

const SHEET_URL = 'https://docs.google.com/spreadsheets/d/1c6iBycArcX-3AwtFvb110x0tv0Zxo3puU09WLRGavUI/export?format=csv';

function loadStatusFromSheet() {
    const avatarContainer = document.getElementById('avatarContainer');
    const statusBadge = document.getElementById('statusBadge');
    const tagsContainer = document.getElementById('tagsContainer');
    const emergencyAlert = document.getElementById('emergencyAlert');

    fetch(SHEET_URL)
        .then(res => {
            if (!res.ok) throw new Error('通信エラー');
            return res.text();
        })
        .then(csvText => {
            const lines = csvText.split('\n').map(line => line.split(','));
            if (!lines || lines.length < 3) return;
            
            const targetRow = lines[2]; 
            const cleanText = (val) => val ? val.replace(/^"|"$/g, '').trim() : '';

            const statusText = cleanText(targetRow[1]);   
            const tagsText = cleanText(targetRow[2]);     
            const alertText = cleanText(targetRow[3]);    
            const alertUrlText = cleanText(targetRow[4]); 

            const isOnline = (statusText === '話せる');
            const tagsArray = tagsText ? tagsText.split('/').map(t => t.trim()) : [];

            if (avatarContainer && statusBadge) {
                if (isOnline) {
                    avatarContainer.className = "avatar-container online";
                    statusBadge.innerHTML = '<span class="dot"></span>話せます';
                } else {
                    avatarContainer.className = "avatar-container offline";
                    statusBadge.innerHTML = '<span class="dot"></span>話せない';
                }
                avatarContainer.style.opacity = "1";
            }

            if (tagsContainer) {
                if (tagsArray.length > 0 && tagsArray[0] !== "") {
                    tagsContainer.innerHTML = tagsArray.map(tag => `<span class="status-tag">#${tag}</span>`).join('');
                } else {
                    tagsContainer.innerHTML = '';
                }
            }
            
            if (emergencyAlert) {
                if (alertText && alertText !== "") {
                    if (alertUrlText) {
                        emergencyAlert.innerHTML = `<a href="${alertUrlText}" style="color: inherit; text-decoration: none; display: block; width: 100%; height: 100%;">${alertText}</a>`;
                    } else {
                        emergencyAlert.innerText = alertText;
                    }
                    emergencyAlert.style.display = "block";
                } else {
                    emergencyAlert.style.display = "none";
                }
            }
        })
        .catch(error => console.error('Error loading status from Sheet:', error));
}

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

function loadPicksFromJson() {
    const grid = document.getElementById('collectionGrid');
    const paginationArea = document.getElementById('paginationArea');
    if (!grid) return;

    grid.innerHTML = '';

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

                const getOverlay = item.got === true 
                    ? `<div class="get-overlay"><div class="get-inner">GET<span class="get-date">―${item.date}―</span></div></div>` 
                    : '';

                return `
                    <div class="item-card" onclick="openModal(${actualIndex})">
                        <div class="item-img-box">
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

window.openModal = function(index) {
    const item = allItemsData[index];
    if (!item) return;

    const modal = document.getElementById('detail-modal');
    const modalContent = document.querySelector('.qr-modal-content');

    const imgHtml = item.img && item.img.trim() !== "" 
        ? `<img src="${item.img}" alt="${item.title}" style="width:100%; height:100%; object-fit:contain;">` 
        : `<span class="no-img-text">NO IMAGE</span>`;
    
    const getOverlay = item.got === true 
        ? `<div class="get-overlay"><div class="get-inner" style="font-size: 52px;">GET<span class="get-date" style="font-size:14px;">―${item.date}―</span></div></div>` 
        : '';

    const linkButton = item.link && item.link.trim() !== "" 
        ? `<a href="${item.link}" target="_blank" class="btn">商品ページを見に行く ➡️</a>` 
        : '';

    modalContent.innerHTML = `
        <span class="qr-modal-close" onclick="closeItemModal()">&times;</span>
        <div class="modal-left-box">
            ${imgHtml}
            ${getOverlay}
        </div>
        <div class="modal-right-box">
            <div style="font-size: 22px; font-weight: bold; color: #1a202c; margin-bottom: 15px; line-height: 1.4;">${item.title}</div>
            <ul style="padding: 0; margin: 0; list-style: none; font-size: 15px; color: #4a5568; font-weight: bold; line-height: 2.2;">
                <li>価格：<span style="color:#1a202c;">${item.price}</span></li>
                <li>ほしい度 : <span class="stars">${item.stars}</span></li>
                <li>メモ：<span style="color:#1a202c; font-weight:normal; display:block; margin-top:4px; line-height:1.6; white-space:pre-wrap;">${item.memo}</span></li>
            </ul>
            ${linkButton}
        </div>
    `;

    modal.style.display = "flex";
};

window.closeItemModal = function() {
    document.getElementById('detail-modal').style.display = "none";
};

document.addEventListener('DOMContentLoaded', () => {
    loadSharedComponents();
    loadStatusFromSheet(); // 💡 起動スイッチの名前のすれ違いもカチッと修正しました！
    loadPicksFromJson();

    const modal = document.getElementById('detail-modal');
    window.addEventListener('click', (e) => {
        if (e.target == modal) closeItemModal();
    });
});
