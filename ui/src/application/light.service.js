export class LightService {
  #httpClient
  #config

  constructor(httpClient, { apiPath }) {
    this.#httpClient = httpClient
    this.#config = { apiPath }
  }

  async getState() {
    return this.#httpClient.getPlain(`${this.#config.apiPath}/getState/`)
  }

  async getPreference() {
    return this.#httpClient.getPlain(`${this.#config.apiPath}/getPreference/`)
  }

  async savePreference(preference) {
    return this.#httpClient.postQueryParams(`${this.#config.apiPath}/savePreference/`, preference)
  }

  async manageZoneControl({ isEnabled }) {
    return this.#httpClient.postQueryParams(`${this.#config.apiPath}/manageZoneControl/`, { isEnabled })
  }

  async setAutoDisableTimer({ period }) {
    return this.#httpClient.postQueryParams(`${this.#config.apiPath}/setAutoDisableTimer/`, { period })
  }

  async cancelAutoDisableTimer() {
    return this.#httpClient.postQueryParams(`${this.#config.apiPath}/cancelAutoDisableTimer/`, {})
  }
}
