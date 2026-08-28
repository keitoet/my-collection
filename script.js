const ITEMS_PER_PAGE = 12;

function loadPicksFromJson() {
    const grid = document.getElementById('collectionGrid');
    const paginationArea = document.getElementById('paginationArea');
    if (!grid) return;

    const urlParams = new URLSearchParams(window.location.search);
    let currentPage = parseInt(urlParams.get('page')) || 1;

    fetch('picks.json')
        .then(response => response.json())
        .then(data => {
            if (!data) return;

            const totalItems = data.length;
            const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);

            const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
            const endIndex = startIndex + ITEMS_PER_PAGE;
            const pageData = data.slice(startIndex, endIndex);

            grid.innerHTML = pageData.map(item => {
                const imgHtml = item.img && item.img.trim() !== "" 
                    ? `<img src="${item.img}" alt="${item.title}">` 
                    : `<span class="no-img-text">NO IMAGE</span>`;

                const isLink = item.link && item.link.trim() !== "";
                const tagStart = isLink 
                    ? `<a href="${item.link}" class="item-card" target="_blank" style="text-decoration: none; color: inherit;">` 
                    : `<div class="item-card">`;
                const tagEnd = isLink ? `</a>` : `</div>`;

                return `
                    ${tagStart}
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
                    ${tagEnd}
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

window.addEventListener('DOMContentLoaded', loadPicksFromJson);
