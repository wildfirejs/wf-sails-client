// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
import App from './App'
import wildfire from '../../src'
import WfPinnedComment from '../../src/plugins/WfPinnedComment'

Vue.config.productionTip = true
Vue.use(wildfire, {
  databaseProvider: 'firebase',
  databaseConfig: {
    apiKey: 'AIzaSyDCHvWMGjVVTMcL67sorfJm3Uv-_luAKg0',
    authDomain: 'wildfire-plugin.firebaseapp.com',
    databaseURL: 'https://wildfire-plugin.firebaseio.com',
    projectId: 'wildfire-plugin',
    storageBucket: '',
    messagingSenderId: '712535216662'
  },
  // databaseProvider: 'wilddog',
  // databaseConfig: {
  //   siteId: 'wd5350450577zvbtov'
  // },
  pageURL: 'https://test.wildfire.js.org',
  pageTitle: 'Wildfire Dev',
  // isURLWithHashtag: true, // default: false
  // defaultAvatarURL: 'https://image.flaticon.com/icons/svg/621/621863.svg',
  theme: 'light',
  // theme: 'dark',
  // locale: 'en',
  locale: 'zh-CN',
  plugins: [
    // WfPinnedComment()
  ]
})

/* eslint-disable no-new */
new Vue({
  el: '#app',
  template: '<App/>',
  components: { App }
})
