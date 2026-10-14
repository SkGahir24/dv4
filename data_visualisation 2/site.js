// Website search and category buttons.
// This file controls which chart cards are visible.

const filterButtons = [...document.querySelectorAll('[data-filter]')];
const chartCards = [...document.querySelectorAll('.viz-card')];
const searchBox = document.getElementById('search');
let chosenCategory = 'All';

function updateVisibleCharts() {
  const searchText = searchBox.value.toLowerCase().trim();
  let visibleCount = 0;

  for (const card of chartCards) {
    const categoryMatches = chosenCategory === 'All' ||
      card.dataset.topic === chosenCategory;
    const textMatches = card.textContent.toLowerCase().includes(searchText);

    card.hidden = !(categoryMatches && textMatches);
    if (!card.hidden) visibleCount++;
  }

  document.querySelector('.no-results').hidden = visibleCount > 0;
}

// Clicking a category button shows charts in that category.
for (const button of filterButtons) {
  button.addEventListener('click', () => {
    chosenCategory = button.dataset.filter;
    for (const otherButton of filterButtons) {
      otherButton.classList.toggle('active', otherButton === button);
    }
    updateVisibleCharts();
  });
}

// Searching hides cards that do not match the typed words.
searchBox.addEventListener('input', updateVisibleCharts);

document.getElementById('searchButton').addEventListener('click', () => {
  updateVisibleCharts();
  document.getElementById('explore').scrollIntoView({ behavior: 'smooth' });
});

// Service shortcuts at the top select the matching category.
for (const link of document.querySelectorAll('[data-jump]')) {
  link.addEventListener('click', () => {
    const category = link.dataset.jump;
    const button = filterButtons.find(item => item.dataset.filter === category);
    if (button) button.click();
  });
}
