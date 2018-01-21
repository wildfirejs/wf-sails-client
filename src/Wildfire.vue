<template>
  <div :class="classes">
    <component v-for="(cpntName, idx) in pluginComponents['header.before']"
      :is="cpntName"
      :key="idx"
      :bus="bus"/>
    <wf-header :comments-loading-state="commentsLoadingState"/>
    <component v-for="(cpntName, idx) in pluginComponents['header.after']"
      :is="cpntName"
      :key="idx"
      :bus="bus"/>
    <wf-body
      :page-comments-count="pageCommentsCount"
      :comments="comments"
      :comments-loading-state="commentsLoadingState"/>
    <component v-for="(cpntName, idx) in pluginComponents['footer.before']"
      :is="cpntName"
      :key="idx"
      :bus="bus"/>
    <wf-footer/>
  </div>
</template>

// TODO: all comment card whose author is current user, use current user profile from bus

<script>
import Vue from 'vue'
import elementResizeDetectorMaker from 'element-resize-detector'
import Bus from './common/bus'
import WfHeader from './layout/WfHeader'
import WfBody from './layout/WfBody'
import WfFooter from './layout/WfFooter'
export default {
  name: 'wildfire',
  components: {
    WfHeader,
    WfBody,
    WfFooter
  },
  data () {
    return {
      commentsLoadingState: 'prepare',
      comments: [],
      banData: [],
      banList: []
    }
  },
  computed: {
    bus: () => Bus,
    pluginComponents: () => Bus.pluginComponents,
    auth: () => Bus.auth,
    config: () => Bus.config,
    db: () => Bus.db,
    user: () => Bus.user,
    i18next: () => Bus.i18next,
    classes () {
      return [
        'wf',
        `wf-theme-${this.config.theme}`
      ]
    },
    pageCommentsCount () {
      return this.comments.length
    }
  },
  created () {
    this.listenToAuthStateChange()
    this.listenToCommentsFromDatabase()

    Vue.http.get('https://api.userinfo.io/userinfos')
    .then(response => {
      this.$set(Bus.info, 'ip', response.data.ip_address)
      return response.data
    })
    .catch(error => {
      console.error(error)
      Bus.$data.info = Object.assign({}, Bus.$data.info, {ip: 'unknown'})
    })
    // .then(data => {
    //   if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') { return }
    //   const { pageURL, pageTitle, databaseProvider } = this.config
    //   const wfAnalyticsURL = (databaseProvider === 'firebase' ? 'https://wildfire-bada3.firebaseio.com/' : 'https://autolayout.wilddogio.com/') + `sites/${pageURL}.json`
    //   Vue.http.post(wfAnalyticsURL, Object.assign({}, data, {pageTitle}))
    // })
  },
  mounted () {
    // hide lodaing modal
    const wfLoadingModalEle = document.getElementById('wf-loading-modal')
    if (wfLoadingModalEle) {
      wfLoadingModalEle.style.display = 'none'
    }
    Bus.$data.windowWidth = this.$el.offsetWidth
    this.observer = elementResizeDetectorMaker()
    this.observer.listenTo(this.$el, () => {
      Bus.$data.windowWidth = this.$el.offsetWidth
    })
  },
  methods: {
    /*
      Auth state observer
      Note: when auth state is changed, `this.user` is updated
            accordingly. If a user signs in, it retrieves user
            data from db (different from the auth `user`
            object).
     */
    listenToAuthStateChange () {
      this.db.get('/currentUser', ({ data, error }) => {
        // TODO: handle error
        const { user = null, isBanned } = data
        this.$set(Bus, 'user', user)
        this.$set(Bus.info, 'isBanned', isBanned)

        // hook: authStateChanged
        const cbs = Bus.hooks.authStateChanged || []
        cbs.forEach(cb => cb({
          bus: this.bus,
          user
        }))

        this.db.on('auth-state-change', ({ data }) => {
          const { user = null, isBanned } = data
          this.$set(Bus, 'user', user)
          this.$set(Bus.info, 'isBanned', isBanned)

          // hook: authStateChanged
          const cbs = Bus.hooks.authStateChanged || []
          cbs.forEach(cb => cb({
            bus: this.bus,
            user
          }))
        })
        this.db.on('ban-state-change', ({ data }) => {
          this.$set(Bus.info, 'isBanned', data)

          // hook: banStateChanged
          const cbs = Bus.hooks.banStateChanged || []
          cbs.forEach(cb => cb({
            bus: this.bus,
            newBanState: data
          }))
        })
      })
    },
    /*
      Comments observer
      Note: this keeps the comments up-to-realtime. It also
            watches `commentsCount` node in order to get the
            correct discussion count.
     */
    listenToCommentsFromDatabase () {
      this.commentsLoadingState = 'loading'
      const { pageURL } = this.config

      // TODO: abstract all request URLs
      this.db.get('/comments', {pageURL}, ({error, data = []}) => {
        if (error) {
          this.commentsLoadingState = 'failed'
          return
        }
        const comments = data
        comments.forEach(comment => this.comments.push(comment))
        this.commentsLoadingState = 'finished'

        this.db.on(`new-comment-of-page-${pageURL}`, ({ data }) => {
          this.comments.unshift(data)
          Bus.discussionCount += 1
        })
        this.db.on(`delete-comment-of-page-${pageURL}`, ({ data }) => {
          const idx = this.comments.findIndex(comment => comment.id === data.id)
          if (idx !== -1) {
            this.comments.splice(idx, 1)
            Bus.discussionCount -= 1
          }
        })
      })
    }
  }
}
</script>
