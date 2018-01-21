<template>
  <i-tabs class="wf-report-management">
    <i-tab-pane
      name="reported"
      :label="i18next.t('ReportManagement.tab.reported_comments')">
      <span v-if="reports.length === 0">
        {{ i18next.t('ReportManagement.text.empty_reported_comment') }}
      </span>
      <ul class="wf-ul">
        <li class="wf-li" v-for="item in reports" :key="item.id">
          <div class="wf-meta">
            <i-tooltip
              placement='top'
              :transfer="true">
              <p class="wf-display-name">{{ item.ofComment.byUser.displayName }}</p>
              <div slot="content">
                <p v-if="item.ofComment.byUser.email">{{ item.ofComment.byUser.email }}</p>
                <p >{{ item.ofComment.ip }}</p>
              </div>
            </i-tooltip>
          </div>
          <div class="wf-detail">
            <i-tooltip
              placement='top'
              :transfer="true">
              <p>
                <span>{{ getAbstract(item.ofComment.content) }}</span>
                <i-poptip
                  v-if="item.ofComment.content.length >= 20"
                  :transfer="true"
                  :showTitle="false"
                  placement='bottom'>
                  <i-button
                    type='text'
                    size='small'
                    icon="ios-search">
                  </i-button>
                  <div class="wf-poptip-content" slot="content">
                    <div v-html="markdown(item.ofComment.content)"></div>
                  </div>
                </i-poptip>
              </p>
              <div slot="content">
                {{ i18next.t('ReportManagement.text.reported_by_n_users', { count: item.reporters.length })}}
              </div>
            </i-tooltip>
          </div>
          <div class="wf-buttons">
            <i-poptip
              :confirm="true"
              :title="getBanActionTip(item.ofComment.byUser, item.ofComment.ip)"
              :transfer="true"
              :okText="i18next.t('ReportManagement.btn.ban')"
              :cancelText="i18next.t('ReportManagement.btn.cancel')"
              @on-ok="banUser(item.ofComment.byUser.id, item.ofComment.ip)" >
              <i-button
                size="small"
                type="text"
                style="color: #f90;">
                {{ i18next.t('ReportManagement.btn.ban') }}
              </i-button>
            </i-poptip>
            <i-poptip
              :confirm="true"
              :title="getDelActionTip(item.ofCommentRepliesCount)"
              :transfer="true"
              :okText="i18next.t('ReportManagement.btn.delete')"
              :cancelText="i18next.t('ReportManagement.btn.cancel')"
              @on-ok="deleteComment(item)">
              <i-button
                size="small"
                type="text"
                style="color: #ed3f14;">
                {{ i18next.t('ReportManagement.btn.delete') }}
              </i-button>
            </i-poptip>
            <i-poptip
              :confirm="true"
              :title="i18next.t('ReportManagement.confirm.ignoring_report')"
              :transfer="true"
              :okText="i18next.t('ReportManagement.btn.ignore')"
              :cancelText="i18next.t('ReportManagement.btn.cancel')"
              @on-ok="ignoreReport(item.id)">
              <i-button
                size="small"
                type="text">
                {{ i18next.t('ReportManagement.btn.ignore') }}
              </i-button>
            </i-poptip>
          </div>
        </li>
      </ul>
    </i-tab-pane>
    <i-tab-pane
      name="ban"
      :label="i18next.t('ReportManagement.tab.ban_list')">
      <span v-if="bans.length === 0">
        {{ i18next.t('ReportManagement.text.empty_banned_user') }}
      </span>
      <ul class="wf-ul">
        <li class="wf-li" v-for="item in bans" :key="item.id">
          <div class="wf-meta">
            {{distanceInWordsToNow(item.createdAt)}}
          </div>
          <div class="wf-detail">
            <!-- <i-tooltip
              placement='top'
              :transfer="true">
              <p class="">{{ item.info }}</p>
              <div slot="content">
                <p >{{ item.displayName }}</p>
              </div>
            </i-tooltip> -->
            <p class="">{{ item.id }}</p>
          </div>
          <div class="wf-buttons">
            <i-poptip
              :confirm="true"
              :title="i18next.t('ReportManagement.confirm.unbanning_user')"
              :transfer="true"
              :okText="i18next.t('ReportManagement.btn.unban')"
              :cancelText="i18next.t('ReportManagement.btn.cancel')"
              @on-ok="unbanUser(item.id)">
              <i-button
                size="small"
                type="text">
                {{ i18next.t('ReportManagement.btn.unban') }}
              </i-button>
            </i-poptip>
          </div>
        </li>
      </ul>
    </i-tab-pane>
  </i-tabs>

</template>

<script>
import Vue from 'vue'
import Bus from '../common/bus'
import markdown from '../common/markdown'
import { textContent } from '../common/utils'
import '../assets/highlight.css'
import '../assets/highlight.dark.css'
export default {
  name: 'wf-report-management',
  data () {
    return {
      reports: [],
      bans: []
    }
  },
  created () {
    this.listenToReport()
    this.listenToBan()
  },
  computed: {
    config: () => Bus.config,
    db: () => Bus.db,
    i18next: () => Bus.i18next,
    distanceInWordsToNow: () => Bus.distanceInWordsToNow,
    markdown: () => markdown
  },
  methods: {
    listenToReport () {
      this.db.get('/reports', ({ error, data }) => {
        if (error) return

        data.forEach(report => {
          if (!report.ofComment.byUser) {
            report.ofComment.byUser = {
              displayName: this.i18next.t('common.anonymous_user'),
              email: '-'
            }
          }
          this.reports.push(report)
        })

        this.db.on('new-report', ({ data }) => {
          const idx = this.reports.findIndex(report => report.id === data.id)
          if (idx !== -1) {
            this.reports[idx].reporters.push(data.byUser)
          } else {
            data.reporters = [data.byUser]
            if (!data.ofComment.byUser) {
              data.ofComment.byUser = {
                displayName: this.i18next.t('common.anonymous_user'),
                email: '-'
              }
            }
            this.reports.unshift(data)
          }
        })
        this.db.on('delete-report', ({ data }) => {
          const idx = this.reports.findIndex(report => report.id === data.id)
          if (idx !== -1) {
            this.reports.splice(idx, 1)
          }
        })
      })
    },
    listenToBan () {
      this.db.get('/ban', ({ data, error }) => {
        console.log(data)
        // TODO: handle error
        if (error) return

        this.bans.push.apply(this.bans, data)

        this.db.on('new-ban', ({ data }) => {
          this.bans.unshift(data)
        })
        this.db.on('delete-ban', ({ data }) => {
          const idx = this.bans.findIndex(ban => ban.id === data.id)
          if (idx !== -1) {
            this.bans.splice(idx, 1)
          }
        })
      })
    },
    getBanActionTip (user, commentIp) {
      if (user) {
        return this.i18next.t('ReportManagement.confirm.banning_user')
      } else if (/unknown/.test(commentIp)) {
        return this.i18next.t('ReportManagement.error.banning_user_invalid_ip')
      } else {
        return this.i18next.t('ReportManagement.confirm.banning_user_anonymous')
      }
    },
    getDelActionTip (repliesCount) {
      let deleteAttr = ''
      if (repliesCount) {
        deleteAttr = this.i18next.t('ReportManagement.text.deleting_with_n_replies', { count: repliesCount })
      }
      return deleteAttr + this.i18next.t('ReportManagement.confirm.deleting_comment')
    },
    getAbstract (content) {
      const text = textContent(content)
      return text.length >= 20 ? text.slice(0, 17) + '...' : text
    },
    banUser (uid, commentIp) {
      const user = uid || commentIp
      console.log(user)
      if (!user) {
        this.$Message.error(this.i18next.t('ReportManagement.error.banning_user_invalid_ip'))
        return
      }
      this.db.post('/ban', { user }, ({ data, error }) => {
        if (error) {
          switch (error) {
            case 'ban/duplicate_ban':
              this.$Message.error(this.i18next.t('ReportManagement.error.banning_user_repeated'))
              break
            default:
              this.$Message.error(this.i18next.t('ReportManagement.error.banning_user'))
          }
          return
        }

        this.$Message.success(this.i18next.t('ReportManagement.success.banning_user'))
      })
    },
    deleteComment (report) {
      const commentId = report.ofComment.id

      this.db.delete('/comment', {commentId}, ({ data, error }) => {
        if (error) {
          switch (error) {
            case 'comment/no_longer_exist':
              this.$Message.error(this.i18next.t('ReportManagement.error.comment_no_longer_exist'))
              break
            default:
              this.$Message.error(this.i18next.t('ReportManagement.error.deleting_comment'))
          }
          return
        }

        this.$Message.success(this.i18next.t('ReportManagement.success.deleting_comment'))

        const idx = this.reports.findIndex(report => report.ofComment.id === commentId)
        if (idx !== -1) this.reports.splice(idx, 1)
      })
    },
    ignoreReport (reportId) {
      this.db.delete('/report', { id: reportId }, ({ data, error}) => {
        if (error) {
          this.$Message.error(this.i18next.t('ReportManagement.error.ignoring_report'))
          return
        }
        this.$Message.success(this.i18next.t('ReportManagement.success.ignoring_report'))

        const idx = this.reports.findIndex(report => report.id === reportId)
        if (idx !== -1) this.reports.splice(idx, 1)
      })
    },
    unbanUser (user) {
      this.db.delete('/ban', { id: user }, ({ data, error }) => {
        if (error) {
          this.$Message.error(this.i18next.t('ReportManagement.error.unknown'))
          return
        }
        this.$Message.info(this.i18next.t('ReportManagement.success.unbanning_user'))
      })
    }
  }
}
</script>
