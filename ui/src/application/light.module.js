const delay = ms => new Promise(resolve => setTimeout(resolve, ms))

const getDefaultState = () => ({
  preference: {
    triggerOnDrivewayGates: null,
    triggerOnYardGate: null,
    triggerOnFrontDoor: null,
    offDelay: null
  },
  autoDisableTimer: {
    period: null
  }
})

export class LightModule {
  #lightService
  #lightUI
  #config
  #running = false
  #state = getDefaultState()
  #timeouts = {
    stateUpdateTimeoutId: null
  }

  constructor(lightService, lightUI, { stateUpdateIntervalMs }) {
    this.#lightService = lightService
    this.#lightUI = lightUI
    this.#config = { stateUpdateIntervalMs }
  }

  async run() {
    if (this.#running) {
      return
    }

    this.#running = true

    await this.reloadPreference()

    this.#timeouts.stateUpdateTimeoutId = setInterval(
      this.#updateState.bind(this),
      this.#config.stateUpdateIntervalMs
    )
  }

  async stop() {
    if (!this.#running) {
      return
    }

    this.#running = false

    clearInterval(this.#timeouts.stateUpdateTimeoutId)

    this.#state = getDefaultState()
    this.#lightUI.setPreference({})
    this.#lightUI.setState({
      isActive: false,
      secondsRemained: 0,
      isZoneControlEnabled: false
    })
    this.#lightUI.setAutoDisableTimerInactive({
      period: null
    })
  }

  async manageZoneControl({ isEnabled }) {
    this.#lightUI.showLoader()
    this.#lightUI.pruneNotification()

   const response = await this.#lightService.manageZoneControl({ isEnabled })

   await delay(150)

   if (!response?.ok) {
    this.#lightUI.setZoneControl(!isEnabled)
    this.#lightUI.hideLoader()
    this.#lightUI.showNotification(
      'Не удалось применить изменения для контроля зон!', {
        isSuccess: false,
      }
    )
    return
   }

    this.#lightUI.hideLoader()
    this.#lightUI.showNotification('Изменения контроля зон применены!')
  }

  async reloadPreference() {
    this.#lightUI.showLoader()
    this.#lightUI.pruneNotification()

    const response = await this.#lightService.getPreference()
    const state = await this.#lightService.getState()

    await delay(150)

    if (response === null || state === null) {
      this.#lightUI.hideLoader()
      this.#lightUI.showNotification(
        'Не удалось загрузить настройки системы, попробуйте перезагрузить страницу!', {
          isSuccess: false,
          timeout: 2500
        }
      )
      return
    }

    const { autoDisableTimerPeriod, ...preference } = response
    Object.assign(this.#state.preference, preference)
    Object.assign(this.#state.autoDisableTimer, { period: autoDisableTimerPeriod })

    this.#lightUI.setPreference(this.#state.preference)
    this.#lightUI.setState({
      isActive: state.light.active,
      secondsRemained: state.light.remained,
      isZoneControlEnabled: state.light.zoneControlEnabled
    })
    if (state.autoDisableTimer.active) {
      this.#lightUI.setAutoDisableTimerActive({
        secondsRemained: state.autoDisableTimer.remained
      })
    } else {
      this.#lightUI.setAutoDisableTimerInactive(this.#state.autoDisableTimer)
    }

    this.#lightUI.hideLoader()
    this.#lightUI.showNotification('Настройки успешно загружены!')
  }

  async savePreference({ preference }) {
    this.#lightUI.showLoader('Сохранение...')
    this.#lightUI.pruneNotification()

    const response = await this.#lightService.savePreference({
      ...preference
    })

    await delay(150)

    if (!response?.ok) {
      this.#lightUI.setPreference(this.#state.preference)
      this.#lightUI.hideLoader()
      this.#lightUI.showNotification(
        'Не удалось сохранить настройки системы, попробуйте ещё раз!', {
          isSuccess: false
        }
      )
      return
    }

    Object.assign(this.#state.preference, preference)
    this.#lightUI.hideLoader()
    this.#lightUI.showNotification('Настройки успешно сохранены!')
  }

  async setAutoDisableTimer({ period }) {
    this.#lightUI.showLoader()
    this.#lightUI.pruneNotification()

    const response = await this.#lightService.setAutoDisableTimer({ period })

    await delay(150)

    if (!response?.ok) {
      this.#lightUI.hideLoader()
      this.#lightUI.showNotification(
        'Не удалось установить автоматический таймер!', {
          isSuccess: false,
        }
      )
      return
    }

    this.#state.autoDisableTimer.period = period
    this.#lightUI.hideLoader()
    this.#lightUI.showNotification('Автоматический таймер установлен!')

    await this.#updateState()
  }

  async cancelAutoDisableTimer() {
    this.#lightUI.showLoader()
    this.#lightUI.pruneNotification()

    const response = await this.#lightService.cancelAutoDisableTimer()

    await delay(150)

    if (!response?.ok) {
      this.#lightUI.hideLoader()
      this.#lightUI.showNotification(
        'Не удалось отменить автоматический таймер!', {
          isSuccess: false,
        }
      )
      return
    }
    this.#lightUI.setAutoDisableTimerInactive({
      period: this.#state.autoDisableTimer.period
    })
    this.#lightUI.hideLoader()
    this.#lightUI.showNotification('Автоматический таймер отменен!')
  }

  async #updateState() {
    const state = await this.#lightService.getState()
    if (state === null) {
      this.#lightUI.showNotification(
        'Не удалось обновить состояние системы!', {
          isSuccess: false,
          timeout: this.#config.stateUpdateIntervalMs
        }
      )

      this.#lightUI.setState({
        isActive: false,
        secondsRemained: 0,
        isZoneControlEnabled: false,
      })
      return
    }

    this.#lightUI.setState({
      isActive: state.light.active,
      secondsRemained: state.light.remained,
      isZoneControlEnabled: state.light.zoneControlEnabled
    })
    if (state.autoDisableTimer.active) {
      this.#lightUI.setAutoDisableTimerActive({
        secondsRemained: state.autoDisableTimer.remained
      })
    } else {
      this.#lightUI.setAutoDisableTimerInactive({})
    }
  }
}
