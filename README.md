# ElectronExample


##### [Install](#Install-normal-Dependencies-and-devDependencies)
##### [Rebuild](#Rebuild-for-electron)
##### [Run App](#Run-App-in-Development)


## NPM Commands

#### Install normal Dependencies and devDependencies
```bash
npm run install-all 
```

#### Rebuild for electron
If you have an Package that must rebuild for electron you must edit the package.json

```text
Replace in package.json <PACKAGE> with your Package
```

```javascript
"rebuild": "electron-rebuild -f -w <PACKAGE>"
```

##### Rebuild
```bash
npm run rebuild
```


#### Run App in Development 
```bash
npm run app
```

#### Change Icon 

Go into the Folder ./assets/icons for every OS is there a Folder, you can Change the Images


#### Package your App for your OS on your OS
```bash
npm run package-mac 
npm run package-win 
npm run package-linux
```












