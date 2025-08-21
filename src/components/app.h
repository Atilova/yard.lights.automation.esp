#pragma once

#include <Arduino.h>
#include <iostream>
#include <Esp.h>
#if defined(ESP32)
    #include <SPIFFS.h>
#elif defined(ESP8266)
    #include <FS.h>
#else
  #error "This code is for ESP32 and ESP8266 only."
#endif
#include <EEPROM.h>

#include <ESPAsyncWebServer.h>

#include "components/constants.h"
#include "components/data.h"
#include "components/eeprom_manager.h"
#include "components/millis_timer.h"
#include "components/serializers.h"
#include "components/trigger_sensors_manager.h"
#include "components/utils.h"
#include "components/validation.h"
#include "components/webserver_supervisor.h"
#include "components/wifi_connector.h"


struct AppConfig {
    const uint8_t ESP_RELAY_PIN;  // Вывод выхода сигнала на реле вкл/выкл освещения
    const bool RELAY_LEVEL_ON = HIGH;
    const uint16_t WEB_SERVER_PORT = 80;
};


struct AppLogConfig {
    const bool DEBUG_OFF_DELAY = false;
    const bool DEBUG_TRIGGER_ACTIVE_SENSORS = false;
};


void sendAPIRequestResult(AsyncWebServerRequest *request, bool isOk) {
    char jsonBuffer[50];
    sprintf(
        jsonBuffer,
        apiResultJsonTemplate,
        toJsonBool(isOk)
    );

    request->send(200, "application/json", jsonBuffer);
}


class AppAutoTimer {
    private:
        bool isTimerActive = false;
        MillisTimer periodTimer = MillisTimer(60000);

    public:
        void set(uint32_t period)
            {
                isTimerActive = true;
                periodTimer.setInterval(secondsToMillis(period));
                periodTimer.refresh();
            }

        void acknowledge()
            {
                isTimerActive = false;
                periodTimer.flush();
            }

        bool isExpired() {
            return isTimerActive && periodTimer.isReady();
        }

        bool isActive() {
            return isTimerActive;
        }

        uint32_t remains() {
            return millisToSeconds(periodTimer.remains());
        }
};


class App {
    private:
		LightsData lightsData;  // Данные из eeprom
		AsyncWebServer *webServer;
        WebServerSupervisor *webServerSupervisor = nullptr;

        WifiConnector *wifiConnector = nullptr;
        EEPromManager<LightsData> *eepromManager = nullptr;
        TriggerSensorsManager *triggerSensorsManager = nullptr;
        AppConfig *config = nullptr;
        AppLogConfig *logConfig = nullptr;

        MillisTimer readSensorsTimer = MillisTimer(500);  // Время опроса дверей
        MillisTimer offDelayTimer = MillisTimer(10000);  // Сколько горит свет
        bool isLightsActive = false;  // Вкл или выкл реле

        AppAutoTimer autoDisableTimer = AppAutoTimer();

    void main()
        {
            if (lightsData.isZoneControlEnabled && readSensorsTimer.isReady())
                {
                    const bool isAnyActiveSensor = triggerSensorsManager->isAnyActiveFromMask(
                        lightsData,
                        logConfig->DEBUG_TRIGGER_ACTIVE_SENSORS
                    );
                    if (isAnyActiveSensor)
                        {
                            if (!isLightsActive)
                                {
                                    isLightsActive = true;
                                    digitalWrite(config->ESP_RELAY_PIN, config->RELAY_LEVEL_ON);
                                }

                            offDelayTimer.refresh();
                        }

                    readSensorsTimer.refresh();
                }

            if (isLightsActive)
                {
                    if (offDelayTimer.isReady())
                        {
                            digitalWrite(config->ESP_RELAY_PIN, !config->RELAY_LEVEL_ON);
                            isLightsActive = false;
                        }

                    if (logConfig->DEBUG_OFF_DELAY)
                        {
                            const uint32_t offDelayRemained = offDelayTimer.remains();
                            std::cout << "Time left (sec) before timer off: "
                                    << (offDelayRemained > 0 ? offDelayRemained / 1000 : 0)
                                    << std::endl;
                        }
                }

            if (autoDisableTimer.isExpired()) {
                lightsData.isZoneControlEnabled = true;
                eepromManager->save(lightsData);
                autoDisableTimer.acknowledge();
            }
        }

	void setupWebServer()
		{
			DefaultHeaders::Instance().addHeader("Access-Control-Allow-Origin", "*");

			webServer->onNotFound([](AsyncWebServerRequest *request) {
				request->send(404, "text/html", "<script>location.replace(\"/\");</script>");
			});

			webServer->on("/", HTTP_GET, [](AsyncWebServerRequest *request){
				request->send(SPIFFS, "/index.html", "text/html; charset=utf-8", false);
			});

			webServer->on(
                "/api/getEspFreeHeap/",
                HTTP_GET,
                [](AsyncWebServerRequest *request) {
                    char jsonBuffer[100];
                    sprintf(
                        jsonBuffer,
                        apiGetEspFreeHeapJsonTemplate,
                        ESP.getFreeHeap()
                    );

                    request->send(200, "application/json", jsonBuffer);
                }
            );

            webServer->on(
                "/api/getState/",  // Горит не горит лампочка
                HTTP_GET,
                [this](AsyncWebServerRequest *request) {
                    char jsonBuffer[300];
                    sprintf(
                        jsonBuffer,
                        apiGetStateJsonTemplate,
                        toJsonBool(this->isLightsActive),
                        millisToSeconds(this->offDelayTimer.remains()),
                        toJsonBool(this->lightsData.isZoneControlEnabled),
                        toJsonBool(this->autoDisableTimer.isActive()),
                        this->autoDisableTimer.remains()
                    );

                    request->send(200, "application/json", jsonBuffer);
                }
            );

            webServer->on(
                "/api/manageZoneControl/",
                HTTP_POST,
                [this](AsyncWebServerRequest *request) {
                    if (this->autoDisableTimer.isActive()) {
                        sendAPIRequestResult(request, false);
                        return;
                    }

                    const bool isOk = (
                        serializeManageZoneControlRequest(request, this->lightsData) &&
                        this->eepromManager->save(this->lightsData)
                    );

                    if (isOk && !this->lightsData.isZoneControlEnabled)
                        {
                            this->offDelayTimer.flush();
                        }

                    sendAPIRequestResult(request, isOk);
                }
            );

            webServer->on(
                "/api/getPreference/",
                HTTP_GET,
                [this](AsyncWebServerRequest *request) {
                    char jsonBuffer[300];
                    sprintf(
                        jsonBuffer,
                        apiGetPreferenceJsonTemplate,
                        toJsonBool(this->lightsData.triggerOnDrivewayGates),
                        toJsonBool(this->lightsData.triggerOnYardGate),
                        toJsonBool(this->lightsData.triggerOnFrontDoor),
                        this->lightsData.offDelay,
                        this->lightsData.autoDisableTimerPeriod
                    );

                    request->send(200, "application/json", jsonBuffer);
                }
            );

			webServer->on(
                "/api/savePreference/",  // Настройки пользователя принимаем сюда после нажатия кнопки save, валидируем и сохраняем в епром
                HTTP_POST,
                [this](AsyncWebServerRequest *request) {
                    const bool isOk = (
                        serializeSavePreferenceRequest(request, this->lightsData) &&
                        this->eepromManager->save(this->lightsData)
                    );

                    if (isOk)
                        {
                            this->offDelayTimer.setInterval(secondsToMillis(lightsData.offDelay));
                            this->offDelayTimer.refresh();

                            if (!isAnyEnabledTriggers(this->lightsData))
                                {
                                    this->offDelayTimer.flush();
                                }
                        }

                    sendAPIRequestResult(request, isOk);
                }
            );

            webServer->on(
                "/api/setAutoDisableTimer/",
                HTTP_POST,
                [this](AsyncWebServerRequest *request) {
                    const bool isSerialized = serializeSetAutoDisableTimerRequest(request, this->lightsData);

                    if (!isSerialized) {
                        sendAPIRequestResult(request, false);
                        return;
                    }

                    this->lightsData.isZoneControlEnabled = false;
                    this->offDelayTimer.flush();
                    this->autoDisableTimer.set(this->lightsData.autoDisableTimerPeriod);
                    const bool isOk = this->eepromManager->save(this->lightsData);

                    sendAPIRequestResult(request, isOk);
                }
            );

            webServer->on(
                "/api/cancelAutoDisableTimer/",
                HTTP_POST,
                [this](AsyncWebServerRequest *request) {
                    if (!this->autoDisableTimer.isActive()) {
                        sendAPIRequestResult(request, false);
                        return;
                    }

                    this->lightsData.isZoneControlEnabled = true;
                    this->autoDisableTimer.acknowledge();
                    const bool isOk = this->eepromManager->save(this->lightsData);

                    sendAPIRequestResult(request, isOk);
                }
            );

			webServer->serveStatic("/static/", SPIFFS, "/static/");
		}

    public:
        App(
            WifiConnector &wifiConnector,
            EEPromManager<LightsData> &eepromManager,
            TriggerSensorsManager &triggerSensorsManager,
            AppConfig &config,
            AppLogConfig &logConfig
        ) :
            wifiConnector(&wifiConnector),
            eepromManager(&eepromManager),
            triggerSensorsManager(&triggerSensorsManager),
            config(&config),
            logConfig(&logConfig)
        {
            webServer = new AsyncWebServer(this->config->WEB_SERVER_PORT);
            webServerSupervisor = new WebServerSupervisor(*webServer);
        }

        ~App() {
            webServerSupervisor->forceEnd();

            delete webServerSupervisor;
			delete webServer;
		}

        void setup()
            {
                pinMode(config->ESP_RELAY_PIN, OUTPUT);
                digitalWrite(config->ESP_RELAY_PIN, !config->RELAY_LEVEL_ON);

                eepromManager->setup();
                wifiConnector->setup();
                triggerSensorsManager->setup();

                if (eepromManager->load(lightsData))
                    {
                        std::cout << "Successfully loaded lightsData from EEProm" << std::endl;
                        offDelayTimer.setInterval(secondsToMillis(lightsData.offDelay));
                    }

				SPIFFS.begin();
				setupWebServer();
            }

        void run()
            {
                wifiConnector->maintain();
                webServerSupervisor->maintain();
                main();
            }

        void onWifiStatusChange(bool isConnected)
            {
                webServerSupervisor->onNetworkConnectionChange(isConnected);
            }
};
