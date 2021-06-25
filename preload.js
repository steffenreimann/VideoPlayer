var ipcRenderer = require('electron').ipcRenderer;

window.TestEvent = async function (data) {
    const result = await ipcRenderer.invoke('TestEvent', data);
    console.log('TestEvent return ', result);
}

ipcRenderer.on('TestEvent', function (event, data) {
    console.log('TestEvent ', data);
    document.getElementById('testFuncCall').innerText = `Button was pressed ${data} times`
});