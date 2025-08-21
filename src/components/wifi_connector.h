#pragma once

#include <Arduino.h>
#include <functional>
#include <iostream>
#include <IPAddress.h>
#if defined(ESP32)
    #include <WiFi.h>
#elif defined(ESP8266)
    #include <ESP8266WiFi.h>
#else
  #error "This code is for ESP32 and ESP8266 only."
#endif

#include "utils.h"
#include "millis_timer.h"

#define CONNECTION_TIMEOUT 15000
#define RESET_DELAY 1000

typedef std::function<void(bool)> WifiCallback;


struct WifiConfig {
    const IPAddress ESP_IP;
    const IPAddress GATEWAY;
    const IPAddress SUBNET_MASK;
    const char* SSID;
    const char* PASSWORD;
    const uint8_t INDICATION_PIN = LED_BUILTIN;
    const bool INDICATION_LEVEL_ON = HIGH;
};


enum class WifiState {
    CONNECTED,
    CONNECTING,
    RESETTING
};


const auto defaultWifiCallback = [](bool isConnected)
    {
        std::cout << "WiFi is " << (isConnected ? "connected" : "disconnected") << "!" << std::endl;
    };


class WifiConnector {
    WifiConfig *config = nullptr;
    WifiCallback callback;
    MillisTimer timer = MillisTimer(CONNECTION_TIMEOUT);
    WifiState state = WifiState::CONNECTING;
    uint8_t retries = 0;
    bool isConnectionEstablished = false;

    void reset()
        {
            WiFi.disconnect();  // Обрываем WIFI соединения
            WiFi.softAPdisconnect();  // Отключаем точку доступа, т.е режим роутера
            WiFi.mode(WIFI_OFF);  // Отключаем WIFI
        }

    public:
        WifiConnector(WifiConfig &config, WifiCallback callback = defaultWifiCallback)
            : config(&config),
              callback(callback) {}

        ~WifiConnector() {}

        void setup()
            {
                pinMode(config->INDICATION_PIN, OUTPUT);
                digitalWrite(config->INDICATION_PIN, HIGH);
                repeat(5)
                        {
                            digitalWrite(config->INDICATION_PIN, config->INDICATION_LEVEL_ON);
                            delay(300);
                            digitalWrite(config->INDICATION_PIN, !config->INDICATION_LEVEL_ON);
                            delay(500);
                        }
            }

        void maintain()
            {
                switch (state)
                    {
                        case WifiState::CONNECTED:
                            {
                                if (!WiFi.isConnected())
                                    {
                                        state = WifiState::CONNECTING;
                                        timer.setInterval(CONNECTION_TIMEOUT);
                                        timer.flush();

                                        std::cout << "WiFi initiate connection..." << std::endl;
                                        digitalWrite(config->INDICATION_PIN, !config->INDICATION_LEVEL_ON);

                                        if (isConnectionEstablished)
                                            {
                                                callback(false);
                                                isConnectionEstablished = false;
                                            }
                                    }

                                break;
                            }
                        case WifiState::CONNECTING:
                            {
                                if (WiFi.isConnected())
                                    {
                                        state = WifiState::CONNECTED;
                                        retries = 0;

                                        std::cout << "WiFi is connected!" << std::endl;
                                        digitalWrite(config->INDICATION_PIN, config->INDICATION_LEVEL_ON);

                                        if (!isConnectionEstablished)
                                            {
                                                callback(true);
                                                isConnectionEstablished = true;
                                            }
                                    }
                                else if (timer.isReady())
                                    {
                                        retries += 1;

                                        WiFi.mode(WIFI_STA);
                                        WiFi.config(
                                            config->ESP_IP,
                                            config->GATEWAY,
                                            config->SUBNET_MASK
                                        );
                                        WiFi.begin(config->SSID, config->PASSWORD);

                                        std::cout << "WiFi connecting..." << std::endl;

                                        if (retries > 3)
                                            {
                                                digitalWrite(config->INDICATION_PIN , !config->INDICATION_LEVEL_ON);

                                                retries = 0;
                                                state = WifiState::RESETTING;
                                                reset();
                                                timer.setInterval(RESET_DELAY);
                                            }

                                        timer.refresh();
                                    }

                                break;
                            }
                        case WifiState::RESETTING:
                            {
                                if (timer.isReady())
                                    {
                                        state = WifiState::CONNECTING;
                                        timer.setInterval(CONNECTION_TIMEOUT);
                                        timer.flush();
                                    }

                                break;
                            }
                    }
            }

        bool isConnected()
            {
                return isConnectionEstablished;
            }
};
