#pragma once

#include <Arduino.h>
#include <IPAddress.h>

#include "secret.h"

#include "components/app.h"
#include "components/wifi_connector.h"
#include "components/trigger_sensors_manager.h"


#ifndef WIFI_CONFIG_DEFINED
    WifiConfig wifiConfig = {
        .ESP_IP = IPAddress(192, 168, 1, 10),
        .GATEWAY = IPAddress(192, 168, 1, 1),
        .SUBNET_MASK = IPAddress(255, 255, 255, 0),
        .SSID = "ssid",
        .PASSWORD = "password"
    };
#endif

#ifndef TRIGGER_SENSOR_PIN_CONFIG_DEFINED
    TriggerSensorsPinConfig triggerSensorsPinConfig = {
        .DRIVEWAY_GATES = 12,
        .YARD_GATE = 13,
        .FRONT_DOOR = 14
    };
#endif

#ifndef APP_CONFIG_DEFINED
    AppConfig appConfig = {
        .ESP_RELAY_PIN = 16
    };
#endif

#ifndef APP_LOG_CONFIG_DEFINED
    AppLogConfig appLogConfig = {};
#endif
