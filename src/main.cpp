#include <Arduino.h>
#include <iostream>

#include "config.h"

#include "components/data.h"
#include "components/app.h"
#include "components/wifi_connector.h"
#include "components/eeprom_manager.h"
#include "components/trigger_sensors_manager.h"
#include "components/uart_streambuf.h"


void wifiCallbackAdapter(bool isConnected);

UARTStreamBuf uartStreamBuf;

WifiConnector wifiConnector(wifiConfig, wifiCallbackAdapter);
EEPromManager<LightsData> eePromLightsManager;
TriggerSensorsManager triggerSensorsManager(triggerSensorsPinConfig);

App app(
    wifiConnector,
    eePromLightsManager,
    triggerSensorsManager,
    appConfig,
    appLogConfig
);


void wifiCallbackAdapter(bool isConnected)
    {
        app.onWifiStatusChange(isConnected);
    }


void setup()
    {
        Serial.begin(115200);
        delay(200);

        std::cout.rdbuf(&uartStreamBuf);
        std::cout << "Loaded, ready!" << std::endl;

        app.setup();
    }


void loop()
    {
        app.run();
    }
