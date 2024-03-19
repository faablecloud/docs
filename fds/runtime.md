# Apps Runtime

Faable applications run in a collection of Linux Containers. This document describes how apps work i the Faable platform.

## App Manager

The app manager keeps apps running automatically; so operating your app is maintenance-free. The Runtime instantiates one app per region unless it is specified in redundancy options. In the case one app container craashes, make sure there's at least two app instances running. Otherwise app will be unresponsive for the restart period.

## Restarting

The Faable Runtime implements an incremental restart policy for crashing apps.

- When an app crashes it will be continuously restarted.
- If an app keeps restarting for 5 minutes, it will be stopped and marked as crashed. Crashed apps must be restarted manually.

After an app exits, the App Manager restarts them with an exponential back-off delay (10s, 20s, 40s, …), that is capped at five minutes. Once an app has executed for 10 minutes without any problems, the manager resets the restart backoff timer for that app. In case the app keeps incrementing the back-off delay up to five minutes, it will be marked as crashed and needs to be restarted manually.
