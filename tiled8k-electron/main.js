const {app, BrowserWindow, screen} = require('electron');
const fs = require('fs');

if (require('electron-squirrel-startup'))
  return;

const CALIBRATION_PATH =
    'C:/ProgramData/Looking Glass Factory/8K_tiled/uniforms.json';

app.whenReady().then(() => {
  fs.readFile(CALIBRATION_PATH, 'utf8', (err, calibrationFile) => {
    if (err) {
      throw err;
    }

    const calibrationString =
        Buffer.from(calibrationFile, 'utf-8').toString('base64');

    const displays = screen.getAllDisplays();
    const secondaryDisplay = displays.find((display) => {
      return display.bounds.x != 0 || display.bounds.y != 0;
    });

    const primaryWindow = new BrowserWindow();
    primaryWindow.loadFile('tiled8k-electron/ui.html', {
      query : {
        calibration : calibrationString,
      }
    });

    const secondaryWindow = new BrowserWindow({
      x : secondaryDisplay.bounds.x,
      y : secondaryDisplay.bounds.y,
      width : secondaryDisplay.bounds.width,
      height : secondaryDisplay.bounds.height,
      fullscreen : true,
      frame : false,
    });
    secondaryWindow.loadFile('tiled8k-electron/render.html', {
      query : {
        calibration : calibrationString,
      }
    });
  });
});
