export function getQuickFilterResults(items, { onlyFavs, onlyLastMinute, onlyKuschelwochen, ready, favorites, lastMinuteMap }) {
  const results = [];
  const counts = { favorites: 0, lastMinute: 0, kuschelwochen: 0 };
  for (const item of items) {
    const favorite = ready && favorites.has(String(item.id));
    const lastMinute = lastMinuteMap.has(String(item.id));
    const kuschelwochen = item.kuschelwochenEnabled === true;
    const matchFavorite = !onlyFavs || !ready || favorite;
    const matchLastMinute = !onlyLastMinute || lastMinute;
    const matchKuschelwochen = !onlyKuschelwochen || kuschelwochen;
    // Each count describes this filter combined with the other active filters.
    if (favorite && matchLastMinute && matchKuschelwochen) counts.favorites++;
    if (lastMinute && matchFavorite && matchKuschelwochen) counts.lastMinute++;
    if (kuschelwochen && matchFavorite && matchLastMinute) counts.kuschelwochen++;
    if (matchFavorite && matchLastMinute && matchKuschelwochen) results.push(item);
  }
  return { results, counts };
}
