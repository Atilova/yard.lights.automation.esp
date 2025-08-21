export class HttpClient {
  #config

  constructor({ timeoutMs }) {
    this.#config = { timeoutMs }
  }

  async getPlain(url) {
    try {
      const response = await Promise.race([
        fetch(url),
        new Promise((_, reject) =>
          setTimeout(() => reject(
            new Error(`Request timeout: ${url}`)
          ), this.#config.timeoutMs)
        )
      ])

      if (!response.ok) {
        throw new Error(`Error: ${url} ${response.status} ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error(error)
      return null
    }
  }

  async postQueryParams(url, params) {
    const queryParams = new URLSearchParams(params).toString()
    try {
      const response = await Promise.race([
        fetch(`${url}?${queryParams}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        }),
        new Promise((_, reject) =>
          setTimeout(() => reject(
            new Error(`Request timeout: ${url}`)
          ), this.#config.timeoutMs)
        )
      ])

      if (!response.ok) {
        throw new Error(`Error: ${url} ${response.status} ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error(error)
      return null
    }
  }
}
