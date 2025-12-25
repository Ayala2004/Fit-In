
export async function callApi(type: string, data: any) {
  const response = await fetch('/api/test', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ type, data }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'משהו השתבש בקריאת ה-API');
  }

  return response.json();
}