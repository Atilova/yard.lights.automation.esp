'use strict';

import { HttpClient } from '@src/pkgs/http.client.js'
import { LightService } from '@src/application/light.service.js'
import { LightUI, SystemTimeUnits } from '@src/application/light.ui.js'
import { LightModule } from '@src/application/light.module.js'

import '@src/style/base.css'
import '@src/style/light.css'


const getEnv = (key, fallback) => key in process.env ? process.env[key] : fallback
const getEnvNumber = (key, fallback) => key in process.env ? Number(process.env[key]) : fallback

const API_PATH = getEnv('cf__api__path', `${location.origin}/api`)
const API_REQUEST_TIMEOUT_MS = getEnvNumber('cf__api__request_timeout_ms', 2000)
const STATE_UPDATE_INTERVAL_MS = getEnvNumber('cf__state_update_interval_ms', 2000)
const SYSTEM_TIME_UNITS = getEnv('cf__system_time_units', SystemTimeUnits.SEC)

const httpClient = new HttpClient({ timeoutMs: API_REQUEST_TIMEOUT_MS })

const lightService = new LightService(httpClient, { apiPath: API_PATH })
const lightUI = new LightUI({
  systemTimeUnits: SYSTEM_TIME_UNITS
})
const lightModule = new LightModule(lightService, lightUI, {
  stateUpdateIntervalMs: STATE_UPDATE_INTERVAL_MS
})

lightUI.registerListeners({
  onZoneControlChange: lightModule.manageZoneControl.bind(lightModule),
  onPreferenceReload: lightModule.reloadPreference.bind(lightModule),
  onPreferenceSave: lightModule.savePreference.bind(lightModule),
  onAutoDisableTimerSet: lightModule.setAutoDisableTimer.bind(lightModule),
  onAutoDisableTimerCancel: lightModule.cancelAutoDisableTimer.bind(lightModule)
})

document.addEventListener('DOMContentLoaded', lightModule.run.bind(lightModule))
