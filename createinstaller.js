const electronInstaller = require('electron-winstaller');

electronInstaller
    .createWindowsInstaller({
      appDirectory : './tiled8k-electron/build/potree-win32-x64',
      outputDirectory : './tiled8k-electron/dist',
      authors : 'Looking Glass Factory',
      exe : 'potree.exe'
    })
    .then((e) => { console.log('success', e); })
    .catch((e) => { console.log('failed', e); });
