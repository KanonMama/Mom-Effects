# Mom Effects

A standalone visual effects extension for **SillyTavern** by KanonMama.

**Version:** 0.5.3

Mom Effects adds weather, seasons, particles, lighting and atmospheric effects to your chats. Effects can be enabled manually, adjusted individually and grouped into saved presets.

## Features

- Approximately 49 effects, including rain, snow, blizzards, fog, aurora, fireflies, magic particles, lighting and cinematic effects.
- RU/EN interface, settings drawer and floating, draggable controls.
- Global sliders for quantity, speed and opacity, plus individual effect strength.
- Scene presets and per-chat binding, JSON import/export.
- Optional synchronization with **Mom Infoblock** for in-story weather, time of day and environment.
- Automatically selected effects display an `AUTO` indicator and never overwrite manual selection.
- Uses the existing `mom_particles` settings key for migration from older Mom Particles builds.

## Installation

In SillyTavern, open **Extensions** → **Install extension**, and paste:

`https://github.com/KanonMama/Mom-Effects`

Or copy this repository's files into `SillyTavern/public/scripts/extensions/third-party/Mom-Effects/` and restart SillyTavern.

**Upgrading from Mom Particles:** remove/disable the old `Mom-Particles` extension folder before installing `Mom-Effects`, otherwise both may load simultaneously. Make a backup first. The settings storage key is deliberately retained, so your current settings should remain available in the same SillyTavern browser/profile.

## Optional integration with Mom Infoblock

Install [Mom Infoblock](https://github.com/KanonMama/Mom-Infoblock) separately. Enable automatic weather, game time and environment in the Mom Effects settings. Effects work without Mom Infoblock too.

The model-generated scene description may be ambiguous; automatic effects are best-effort. Manual effects remain independent. Weather metadata may contain multiple codes (e.g. `heavy_rain,windy`).

## JSON import/export

Use the controls in the extension settings. Only declarative effect/preset JSON is imported; external JavaScript is not executed. Existing `mom-particles-v1` JSON exports remain supported.

## Notes

Visual effects can increase CPU/GPU usage on slower devices. If you experience discomfort from motion or flashing lights, disable the relevant effects and use reduced-motion preferences.
