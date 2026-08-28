const ITEMS_PER_PAGE = 12;
let allItemsData = [];

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
                    <div class="item-card" onclick="openItemModal(${actualIndex})">
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

function openItemModal(index) {
    const item = allItemsData[index];
    if (!item) return;

    const modal = document.getElementById('itemModal');
    const modalImgBox = document.getElementById('modalImgBox');
    const modalTitle = document.getElementById('modalTitle');
    const modalDetails = document.getElementById('modalDetails');
    const modalLinkBtn = document.getElementById('modalLinkBtn');

    const imgHtml = item.img && item.img.trim() !== "" 
        ? `<img src="${item.img}" alt="${item.title}" style="width:100%; height:100%; object-fit:cover;">` 
        : `<span class="no-img-text">NO IMAGE</span>`;
    
    modalImgBox.innerHTML = imgHtml;
    modalTitle.innerText = item.title;
    modalDetails.innerHTML = `
        <li>価格：<span style="color:#1a202c;">${item.price}</span></li>
        <li>ほしい度：<span class="stars">${item.stars}</span></li>
        <li>メモ：<span style="color:#1a202c; font-weight:normal;">${item.memo}</span></li>
    `;

    if (item.link && item.link.trim() !== "") {
        modalLinkBtn.href = item.link;
        modalLinkBtn.style.display = "block";
    } else {
        modalLinkBtn.style.display = "none";
    }

    modal.style.display = "flex";
}

function closeItemModal() {
    document.getElementById('itemModal').style.display = "none";
}

window.addEventListener('DOMContentLoaded', () => {
    loadSharedComponents();
    loadStatusFromJson();
    loadPicksFromJson();
});
