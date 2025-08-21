#pragma once

#include <Arduino.h>


struct __attribute__ ((packed)) LightsData {
    bool isZoneControlEnabled = true;
    bool triggerOnDrivewayGates = false;
    bool triggerOnYardGate = false;
    bool triggerOnFrontDoor = false;
    uint16_t offDelay = 60;  // In seconds
    uint16_t autoDisableTimerPeriod = 60;  // In seconds
};
