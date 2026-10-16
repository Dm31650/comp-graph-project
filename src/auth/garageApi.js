export async function garageRequest(path, method = 'GET', data) {
 const response = await fetch(`/api/${path}`, { method, credentials: 'same-origin', cache: 'no-store', signal: AbortSignal.timeout(15000), headers: data ? { 'Content-Type': 'application/json' } : {}, body: data ? JSON.stringify(data) : undefined });
 let result; try { result = await response.json(); } catch { throw new Error('The garage service is unavailable. Please try again.'); }
 if (!response.ok) throw new Error(result.error || 'Unable to save your garage.');
 return result;
}
