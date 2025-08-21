from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel


app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

cfg = {
    "trigger_on_driveway_gates": True,
    "trigger_on_yard_gate": True,
    "trigger_on_front_door": True,
    "off_delay": 600,
}
operation = 'up'
remained = 60
step = 10
zoneControlEnabled = False

auto_disable_timer_period = 60
auto_disable_timer_active = False
auto_disable_timer_remained = 0


@app.get("/api/getState/")
async def get_light_status():
    global operation
    global remained
    global auto_disable_timer_active
    global auto_disable_timer_remained


    if remained >= 60:
        operation = 'down'

    if remained <= -30:
        operation = 'up'

    if operation == 'up':
        remained += step
    elif operation == 'down':
        remained -= step

    if auto_disable_timer_remained > 0 and auto_disable_timer_active:
        auto_disable_timer_remained -= step

    if auto_disable_timer_remained <= 0 and auto_disable_timer_active:
        auto_disable_timer_active = False
        auto_disable_timer_remained = 0

    return {
        "light": {
            "active": True if remained > 0 else False,
            "remained": remained if remained >= 0 else 0,
            "zoneControlEnabled": zoneControlEnabled,
        },
        "autoDisableTimer": {
            "active": auto_disable_timer_active,
            "remained": auto_disable_timer_remained
        }
    }


@app.get("/api/getPreference/")
async def get_preference():
    return {
        "triggerOnDrivewayGates": cfg['trigger_on_driveway_gates'],
        "triggerOnYardGate": cfg['trigger_on_yard_gate'],
        "triggerOnFrontDoor": cfg['trigger_on_front_door'],
        "offDelay": cfg['off_delay'],
        "autoDisableTimerPeriod": auto_disable_timer_period,
    }


@app.post("/api/savePreference")
async def save_preference(
    triggerOnDrivewayGates: bool = Query(...),
    triggerOnYardGate: bool = Query(...),
    triggerOnFrontDoor: bool = Query(...),
    offDelay: int = Query(...),
):
    cfg['trigger_on_driveway_gates'] = triggerOnDrivewayGates
    cfg['trigger_on_yard_gate'] = triggerOnYardGate
    cfg['trigger_on_front_door'] = triggerOnFrontDoor
    cfg['off_delay'] = offDelay

    return {
        "ok": True
    }


@app.post("/api/manageZoneControl/")
async def manage_zone_control(isEnabled: bool = Query(...)):
    print("set_auto_disable_timer: ", isEnabled)

    global zoneControlEnabled
    zoneControlEnabled = isEnabled

    return {
        "ok": True
    }


@app.post("/api/setAutoDisableTimer/")
async def set_auto_disable_timer(period: int = Query(...)):
    global auto_disable_timer_period
    global auto_disable_timer_active
    global auto_disable_timer_remained

    auto_disable_timer_remained = period
    auto_disable_timer_period = period
    auto_disable_timer_active = True
    print("set_auto_disable_timer: ", period)

    return {
        "ok": True
    }


@app.post("/api/cancelAutoDisableTimer/")
async def cancel_auto_disable_timer():
    global auto_disable_timer_active
    global auto_disable_timer_remained

    auto_disable_timer_active = False
    auto_disable_timer_remained = 0
    print("cancel_auto_disable_timer: ")

    return {
        "ok": True
    }
