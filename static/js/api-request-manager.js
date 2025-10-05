// static/js/api-request-manager.js

export async function fetchNeosByDateRange(startDate, endDate) {
  const url = `/api/neos/range?start_date=${encodeURIComponent(startDate)}&end_date=${encodeURIComponent(endDate)}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to fetch NEO data');
  }
  return await response.json();
}

export async function fetchNeoByDateCenter(date) {
    const url = `/api/neos/range?center_date=${encodeURIComponent(date)}`;
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error('Failed to fetch NEO data');
    }
    return await response.json();
}

export async function fetchNeoPositions(neoId, startDate, endDate) {
    if (!neoId) {
        throw new Error('NEO ID is required');
    }
    let url = `/api/neos/${encodeURIComponent(neoId)}/positions`;
    url += `?start_date=${encodeURIComponent(startDate)}&end_date=${encodeURIComponent(endDate)}`;
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error('Failed to fetch NEO position data');
    }
    return await response.json();
}

export async function fetchNeoDetails(neoId) {
    if (!neoId) {
        throw new Error('NEO ID is required');
    }
    const url = `/api/neos/${encodeURIComponent(neoId)}`;
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error('Failed to fetch NEO details');
    }
    return await response.json();
}
