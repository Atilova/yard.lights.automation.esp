#pragma once

#include <Arduino.h>


constexpr const char* apiGetEspFreeHeapJsonTemplate = R"({
    "freeHeap": %d
})";

constexpr const char* apiGetStateJsonTemplate = R"({
    "light": {
        "active": %s,
        "remained": %d,
        "zoneControlEnabled": %s
    },
    "autoDisableTimer": {
        "active": %s,
        "remained": %d
    }
})";

constexpr const char* apiGetPreferenceJsonTemplate = R"({
    "triggerOnDrivewayGates": %s,
    "triggerOnYardGate": %s,
    "triggerOnFrontDoor": %s,
    "offDelay": %d,
    "autoDisableTimerPeriod": %d
})";

constexpr const char* apiResultJsonTemplate = R"({
    "ok": %s
})";
