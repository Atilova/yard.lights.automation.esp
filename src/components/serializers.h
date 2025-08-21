#pragma once

#include <Arduino.h>
#include <ESPAsyncWebServer.h>

#include "data.h"
#include "validation.h"


bool serializeSavePreferenceRequest(AsyncWebServerRequest *request, LightsData &data)
    {
        bool triggerOnDrivewayGates, triggerOnYardGate, triggerOnFrontDoor;
        uint16_t offDelay;

        const bool isValid = (
            validateQuery(request, "triggerOnDrivewayGates", triggerOnDrivewayGates) &&
            validateQuery(request, "triggerOnYardGate", triggerOnYardGate) &&
            validateQuery(request, "triggerOnFrontDoor", triggerOnFrontDoor) &&
            validateQuery(request, "offDelay", offDelay) &&
            offDelay >= 1 && offDelay <= 1200  // Значения задержки храним и валиируем в секундах, а отображаем в минутах
        );
        if (!isValid)
            {
                return false;
            }

        data.triggerOnDrivewayGates = triggerOnDrivewayGates;
        data.triggerOnYardGate = triggerOnYardGate;
        data.triggerOnFrontDoor = triggerOnFrontDoor;
        data.offDelay = offDelay;

        return true;
    }


bool serializeManageZoneControlRequest(AsyncWebServerRequest *request, LightsData &data)
    {
        bool isZoneControlEnabled;

        const bool isValid = validateQuery(request, "isEnabled", isZoneControlEnabled);
        if (!isValid)
            {
                return false;
            }

        data.isZoneControlEnabled = isZoneControlEnabled;

        return true;
    }


bool serializeSetAutoDisableTimerRequest(AsyncWebServerRequest *request, LightsData &data)
    {
        uint16_t period;

        const bool isValid = (
            validateQuery(request, "period", period) &&
            period >= 0 && period <= 7200
        );
        if (!isValid)
            {
                return false;
            }

        // If zero period is provided, use latest data.autoDisableTimerPeriod
        // value to start timer, skip update
        if (period >= 1) {
            data.autoDisableTimerPeriod = period;
        }

        return true;
    }
