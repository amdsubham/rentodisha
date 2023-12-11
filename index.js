import { registerRootComponent } from 'expo';
import App from './App';
import { vexo } from 'vexo-analytics';
//import DevApp from './DevApp';
//import { AppRegistry } from 'react-native';

vexo("2098a553-a127-4f33-943d-51ba5b24be59")
// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
//AppRegistry.runApplication('main', () => DevApp)
