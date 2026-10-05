export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

export async function loadItems<T>(url: string, delayMs = 2000): Promise<T[]> {
  const [response] = await Promise.all([fetch(url), delay(delayMs)])
  return response.json() as Promise<T[]>
}
