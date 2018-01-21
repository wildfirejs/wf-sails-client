<template >
  <Tabs value="notification-box" class="wf-personal-center">
    <TabPane :label="i18next.t('PersonalCenter.tab.notification')" name="notification-box">
      <span v-if="Object.keys(notifications).length === 0">{{i18next.t('PersonalCenter.text.empty_notif_list')}}</span>
      <wf-tip v-else>{{i18next.t('PersonalCenter.text.tips')}}</wf-tip>
      <ul class="wf-ul">
        <li v-for="(notif, idx) in notifications" class="wf-li" :key="notif.id" :class="{'wf-is-read': notif.isRead}">
          <span class="wf-meta">{{distanceInWordsToNow(notif.createdAt)}}</span>
          <span class="wf-detail" v-html="notifsContent[idx]"></span>
          <div class="wf-buttons">
            <i-button type="text" @click="toggleRead(idx)">{{i18next.t(notif.isRead ? 'PersonalCenter.btn.read' : 'PersonalCenter.btn.unread')}}</i-button>
            <i-button type="text" style="color: #ed3f14" @click="deleteNotif(idx)">{{i18next.t('PersonalCenter.btn.delete')}}</i-button>
          </div>
        </li>
      </ul>
    </TabPane>
  </Tabs>
</template>

<script>
import Vue from 'vue'
import Bus from '../common/bus'
import { textContent } from '../common/utils'
export default {
  name: 'wf-personal-center',
  data () {
    return {
      notifications: [],
    }
  },
  computed: {
    config: () => Bus.config,
    db: () => Bus.db,
    i18next: () => Bus.i18next,
    b64DecodeUnicode: () => Bus.b64DecodeUnicode,
    user: () => Bus.user,
    distanceInWordsToNow: () => Bus.distanceInWordsToNow,
    notifsContent () {
      return this.notifications.map(notif => this.getNotifContent(notif))
    },
  },
  created () {
    const uid = this.user.uid

    this.db.get('/notifications', ({ data: notifs, error }) => {
      if (error) return this.$Message.error(this.i18next.t('PersonalCenter.error.fetching_notifications'))
      this.notifications.push.apply(this.notifications, notifs)

      const unreadCount = this.notifications.filter(notif => !notif.isRead).length
      if (unreadCount) {
        this.$Notice.open({ title: this.i18next.t('PersonalCenter.text.unread_notification_n', { unreadCount }) })
      }
      
      this.db.on('new-notification', ({ data }) => {
        this.notifications.unshift(data)
        this.$Notice.open({
            title: this.i18next.t('PersonalCenter.text.new_notification'),
            desc: this.getNotifContent(data)
        })
      })
    })
  },
  methods: {
    getNotifContent (notif) {
      const { aboutComment, type, pageURL, pageTitle } = notif
      if (!aboutComment) return this.i18next.t('PersonalCenter.text.related_content_no_longer_exists')

      let commentAuthor = {
        displayName: this.i18next.t('common.anonymous_user'),
        email: this.i18next.t('common.anonymous_user'),
      }
      if (aboutComment.byUser) {
        commentAuthor.displayName = aboutComment.byUser.displayName
        commentAuthor.email = aboutComment.byUser.email
      }
      const decodedPageURL = pageURL && this.b64DecodeUnicode(pageURL)
      let content = ''

  
      switch (type) {
        case 'c':
          content += this.i18next.t('PersonalCenter.text.new_comment_on_page', {
              email: commentAuthor.email,
              displayName: commentAuthor.displayName,
              content: textContent(aboutComment.content),
              pageTitle,
              pageURL: decodedPageURL
            })
          break
        case 'r':
          content += this.i18next.t('PersonalCenter.text.new_reply_to_comment', {
              email: commentAuthor.email,
              displayName: commentAuthor.displayName,
              content: textContent(aboutComment.content)
            })
          break
        case 'd':
          content += this.i18next.t('PersonalCenter.text.new_disc_in_comment', {
              email: commentAuthor.email,
              displayName: commentAuthor.displayName,
              content: textContent(aboutComment.content)
            })
        case 'm':
          content += this.i18next.t('PersonalCenter.text.new_mention', {
              email: commentAuthor.email,
              displayName: commentAuthor.displayName,
              content: textContent(aboutComment.content)
            })
          break
        case 'rm':
          content += this.i18next.t('PersonalCenter.text.new_reply_to_comment_mention', {
              email: commentAuthor.email,
              displayName: commentAuthor.displayName,
              content: textContent(aboutComment.content)
            })
          break
        case 'dm':
          content += this.i18next.t('PersonalCenter.text.new_disc_in_comment_mention', {
              email: commentAuthor.email,
              displayName: commentAuthor.displayName,
              content: textContent(aboutComment.content)
            })
          break
      }
      return content + ` <a href="${decodedPageURL}" target="blank"><i class="ivu-icon ivu-icon-ios-search"></i>${this.i18next.t('PersonalCenter.text.details')}</a>`
    },
    deleteNotif (idx) {
      const notifId = this.notifications[idx].id
      this.db.delete('/notification', { id: notifId }, ({ data, error }) => {
        if (error) return this.$Message.error(this.i18next.t('PersonalCenter.error.deleting_notification'))
        this.notifications.splice(idx, 1)
        this.$Message.success(this.i18next.t('PersonalCenter.success.deleting_notification'))
      })
    },
    toggleRead (idx) {
      const notifId = this.notifications[idx].id
      this.db.put('/toggleNotificationIsRead', { id: notifId }, ({ data, error }) => {
        if (error) return this.$Message.error(this.i18next.t('PersonalCenter.error.toggling_read'))
        this.$set(this.notifications[idx], 'isRead', !this.notifications[idx].isRead)
        this.$Message.success(this.i18next.t('PersonalCenter.success.toggling_read'))
      })
    },
  }
}
</script>
