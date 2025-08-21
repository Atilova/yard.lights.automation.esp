#pragma once

#include <Arduino.h>
#include <IPAddress.h>

#include "components/app.h"
#include "components/wifi_connector.h"
#include "components/trigger_sensors_manager.h"

#define WIFI_CONFIG_DEFINED
// #define TRIGGER_SENSOR_PIN_CONFIG_DEFINED
// #define APP_CONFIG_DEFINED
// #define APP_LOG_CONFIG_DEFINED

WifiConfig wifiConfig = {
    .ESP_IP = IPAddress(192, 168, 1, 10),
    .GATEWAY = IPAddress(192, 168, 1, 1),
    .SUBNET_MASK = IPAddress(255, 255, 255, 0),
    .SSID = "your_ssid",
    .PASSWORD = "your_password"
};
