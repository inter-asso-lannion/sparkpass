document.addEventListener("DOMContentLoaded", () => {
  const offersContainer = document.querySelector(".offers-container");

  // Ensure container exists
  if (!offersContainer) return;

    // Ensure data is available
    if (typeof offersData === 'undefined') {
        console.error('offersData is not defined');
        return;
    }

    // Function to render offers
    function renderOffers(offers) {
        // Clear any existing content
        offersContainer.innerHTML = '';

        if (offers.length === 0) {
            offersContainer.innerHTML = '<p style="text-align:center; width:100%; color:#505050; font-family: \'Google Sans Flex\', sans-serif;">Aucune offre trouvée.</p>';
            return;
        }

        offers.forEach(offer => {
            const card = document.createElement('div');
            card.className = 'offer-card';

            // Determine the link to use
            let offerLink = offer.link;
            if (!offerLink || offerLink === '#' || offerLink.trim() === '') {
                // Fallback to Google Maps search for "[Title] Lannion"
                offerLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(offer.title + ' Lannion')}`;
            }

            card.innerHTML = `
                <div class="offer-image-container">
                    <img src="${offer.image}" alt="${offer.title}" class="offer-image" />
                </div>
                <div class="offer-details">
                    <div class="offer-tags">
                        ${(offer.tags || []).map(tag => `<span class="offer-tag">${tag}</span>`).join('')}
                    </div>
                    <div class="offer-text">
                        <p class="offer-title">${offer.title}</p>
                        <p class="offer-subtitle">${offer.subtitle}</p>
                    </div>
                    <a href="${offerLink}" target="_blank" rel="noopener noreferrer" class="offer-button">
                        <span class="offer-button-text">J’en profite</span>
                    </a>
                </div>
            `;

            offersContainer.appendChild(card);
        });
    }

    // Initial render
    renderOffers(offersData);

    // Search functionality
    const searchInput = document.querySelector('.search-input');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            const filteredOffers = offersData.filter(offer => 
                offer.title.toLowerCase().includes(query) || 
                offer.subtitle.toLowerCase().includes(query)
            );
            renderOffers(filteredOffers);
        });
    }
});
