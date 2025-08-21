class InputNumberUI {
  #element
  #config
  #timeoutId = null

  constructor(element, { min, max, step = 1, debounceTimeout = 1500 }) {
    this.#element = element
    this.#config = {
      min,
      max,
      step,
      debounceTimeout
    }

    const addButton = this.#element.nextElementSibling
    const removeButton = this.#element.previousElementSibling

    this.#element.addEventListener('input', this.onInput.bind(this))
    this.#element.addEventListener('blur', this.validate.bind(this))
    addButton.addEventListener('click', () => this.shift(this.#config.step))
    removeButton.addEventListener('click', () => this.shift(-this.#config.step))
  }

  get value() {
    const value = parseInt(this.#element.value)
    if (isNaN(value)) {
      return null
    }

    return value
  }

  get safeValue() {
    return this.value ?? 0
  }

  set value(value) {
    this.#element.value = value
  }

  onInput() {
    clearTimeout(this.#timeoutId)
    this.#timeoutId = setTimeout(this.validate.bind(this), this.#config.debounceTimeout)
  }

  shift(step) {
    this.#element.value = Math.min(
      this.#config.max,
      Math.max(this.#config.min, this.safeValue + step)
    )
  }

  validate() {
    clearTimeout(this.#timeoutId)
    this.#element.value = Math.min(
      this.#config.max,
      Math.max(this.#config.min, this.safeValue)
    )
  }
}

export const SystemTimeUnits = {
  MIN: 'min',
  SEC: 'sec'
}

const getUISystemTimeUnits = systemTimeUnits => {
  if (systemTimeUnits === SystemTimeUnits.MIN) {
    return 'мин'
  }

  return 'сек'
}

const makeConvertSystemTimeToSeconds = units => systemValue => {
  if (units === SystemTimeUnits.MIN) {
    return systemValue * 60
  }

  return systemValue
}

const makeConvertSecondsToSystemTime = units => secondsValue => {
  if(units === SystemTimeUnits.MIN) {
    return secondsValue / 60
  }

  return secondsValue
}

const invokeAllListeners = (listeners, ...args) =>
  listeners.forEach(listener => listener(...args))


export class LightUI {
  #config
  #elements = {
    loader: document.getElementById('loader'),
    loaderText: document.getElementById('loaderText'),
    notificationPopup: document.getElementById('notificationPopup'),
    systemTimeUnits: document.querySelectorAll('#systemTimeUnits'),

    zoneControlSwitch: document.getElementById('zoneControlSwitch'),
    lightStatusBulb: document.getElementById('lightStatusBulb'),
    lightStatusTimeRemained: document.getElementById('lightStatusTimeRemained'),

    autoDisableTimerSetBlock: document.getElementById('autoDisableTimerSetBlock'),
    autoDisableTimerCancelBlock: document.getElementById('autoDisableTimerCancelBlock'),
    autoDisableTimerSetButton: document.getElementById('autoDisableTimerSetButton'),
    autoDisableTimerCancelButton: document.getElementById('autoDisableTimerCancelButton'),
    autoDisableTimerTimeRemained: document.getElementById('autoDisableTimerTimeRemained'),

    reloadPreferenceButton: document.getElementById('reloadPreferenceButton'),
    savePreferenceButton: document.getElementById('savePreferenceButton'),

    drivewayGateCheckbox: document.getElementById('drivewayGatesCheckbox'),
    yardGateCheckbox: document.getElementById('yardGateCheckbox'),
    frontDoorCheckbox: document.getElementById('frontDoorCheckbox'),
  }
  #uiElements = {
    offDelayInput: new InputNumberUI(
      document.getElementById('offDelayInput'),
      {
        min: 1,
        max: 20
      }
    ),
    autoDisableTimerInput: new InputNumberUI(
      document.getElementById('autoDisableTimerInput'),
      {
        min: 1,
        max: 120,
        step: 5
      }
    )
  }
  #listeners = {
    onZoneControlChange: new Set(),
    onPreferenceReload: new Set(),
    onPreferenceSave: new Set(),
    onAutoDisableTimerSet: new Set(),
    onAutoDisableTimerCancel: new Set()
  }
  #timeouts = {
    notificationPopupTimeoutId: null
  }
  #convertSystemTimeToSeconds
  #convertSecondsToSystemTime

  constructor({ systemTimeUnits }) {
    this.#config = { systemTimeUnits }
    this.#convertSystemTimeToSeconds = makeConvertSystemTimeToSeconds(this.#config.systemTimeUnits)
    this.#convertSecondsToSystemTime = makeConvertSecondsToSystemTime(this.#config.systemTimeUnits)

    this.#setSystemTimeUnits()
    this.#subscribeListeners()
  }

  registerListeners({
    onZoneControlChange,
    onPreferenceReload,
    onPreferenceSave,
    onAutoDisableTimerSet,
    onAutoDisableTimerCancel
  }) {
    this.#listeners.onZoneControlChange.add(onZoneControlChange)
    this.#listeners.onPreferenceReload.add(onPreferenceReload)
    this.#listeners.onPreferenceSave.add(onPreferenceSave)
    this.#listeners.onAutoDisableTimerSet.add(onAutoDisableTimerSet)
    this.#listeners.onAutoDisableTimerCancel.add(onAutoDisableTimerCancel)

    return () => {
      this.#listeners.onZoneControlChange.delete(onZoneControlChange)
      this.#listeners.onPreferenceReload.delete(onPreferenceReload)
      this.#listeners.onPreferenceSave.delete(onPreferenceSave)
      this.#listeners.onAutoDisableTimerSet.delete(onAutoDisableTimerSet)
      this.#listeners.onAutoDisableTimerCancel.delete(onAutoDisableTimerCancel)
    }
  }

  showLoader(text = 'Загрузка...') {
    this.#elements.loaderText.textContent = text
    this.#elements.loader.style.display = 'flex'
  }

  hideLoader() {
    this.#elements.loader.style.display = 'none'
  }

  showNotification(message, { isSuccess = true, timeout = 2000 } = {}) {
    this.pruneNotification()

    this.#elements.notificationPopup.textContent = message
    this.#elements.notificationPopup.style.backgroundColor = isSuccess ? '#333' : '#9c2525'
    this.#elements.notificationPopup.classList.add('show')

    this.#timeouts.notificationPopupTimeoutId = setTimeout(() => {
      this.pruneNotification()
    }, timeout)
  }

  pruneNotification() {
    clearTimeout(this.#timeouts.notificationPopupTimeoutId)
    this.#elements.notificationPopup.classList.remove('show')
  }

  getPreference() {
    return {
      triggerOnDrivewayGates: this.#elements.drivewayGateCheckbox.checked,
      triggerOnYardGate: this.#elements.yardGateCheckbox.checked,
      triggerOnFrontDoor: this.#elements.frontDoorCheckbox.checked,
      offDelay: this.#convertSystemTimeToSeconds(this.#uiElements.offDelayInput.value)
    }
  }

  setPreference(preference) {
    const {
      triggerOnDrivewayGates,
      triggerOnYardGate,
      triggerOnFrontDoor,
      offDelay
    } = preference

    this.#elements.drivewayGateCheckbox.checked = triggerOnDrivewayGates
    this.#elements.yardGateCheckbox.checked = triggerOnYardGate
    this.#elements.frontDoorCheckbox.checked = triggerOnFrontDoor
    this.#uiElements.offDelayInput.value = this.#convertSecondsToSystemTime(offDelay)
  }

  setZoneControl(isEnabled) {
    this.#elements.zoneControlSwitch.checked = isEnabled
  }

  setState({ isZoneControlEnabled, isActive, secondsRemained }) {
    this.setZoneControl(isZoneControlEnabled)

    if (isActive) {
      this.#elements.lightStatusBulb.classList.add('toolbar__status--active')
    } else {
      this.#elements.lightStatusBulb.classList.remove('toolbar__status--active')
    }

    this.#elements.lightStatusTimeRemained.innerText = `${secondsRemained} сек`
  }

  getAutoDisableTimerPeriod() {
    return this.#convertSystemTimeToSeconds(
      this.#uiElements.autoDisableTimerInput.value
    )
  }

  setAutoDisableTimerActive({ secondsRemained }) {
    this.#elements.autoDisableTimerTimeRemained.innerText = `${secondsRemained} сек`
    this.#elements.autoDisableTimerSetBlock.classList.add('param-container__setting--hidden')
    this.#elements.autoDisableTimerCancelBlock.classList.remove('param-container__setting--hidden')
  }

  setAutoDisableTimerInactive(state) {
    if ('period' in state) {
      this.#uiElements.autoDisableTimerInput.value = this.#convertSecondsToSystemTime(
        state.period
      )
    }

    this.#elements.autoDisableTimerSetBlock.classList.remove('param-container__setting--hidden')
    this.#elements.autoDisableTimerCancelBlock.classList.add('param-container__setting--hidden')
  }

  #setSystemTimeUnits() {
    const units = getUISystemTimeUnits(this.#config.systemTimeUnits)

    this.#elements.systemTimeUnits.forEach(element => {
      element.textContent = `(${units})`
    })
  }

  #subscribeListeners() {
    this.#elements.zoneControlSwitch.addEventListener('change', () => {
      invokeAllListeners(this.#listeners.onZoneControlChange, {
        isEnabled: this.#elements.zoneControlSwitch.checked
      })
    })

    this.#elements.reloadPreferenceButton.addEventListener('click', () => {
      invokeAllListeners(this.#listeners.onPreferenceReload, {})
    })

    this.#elements.savePreferenceButton.addEventListener('click', () => {
      invokeAllListeners(this.#listeners.onPreferenceSave, {
        preference: this.getPreference()
      })
    })

    this.#elements.autoDisableTimerSetButton.addEventListener('click', () => {
      invokeAllListeners(this.#listeners.onAutoDisableTimerSet, {
        period: this.getAutoDisableTimerPeriod()
      })
    })

    this.#elements.autoDisableTimerCancelButton.addEventListener('click', () => {
      invokeAllListeners(this.#listeners.onAutoDisableTimerCancel, {})
    })
  }
}
