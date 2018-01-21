<template>
  <li class="wf-comment-item" :class="{'wf-reply-item': !isTopLevelComment}">
    <section class="wf-section-comment">
      <div class="wf-avatar">
        <img
          :src="author.avatarURL"
          :class="{ 'wf-anonymous': isPostedByAnonymousUser }"
          @error="avatarOnError" />
      </div>
      <div class="wf-comment-body">
        <header class="wf-comment-header">
          <div class="wf-content">
            <a class="wf-username" :title="author.displayName" @click="showUserInfo">{{shortenedUsername(author.displayName)}}</a>
            <i-poptip
              v-if="!isTopLevelComment"
              trigger="hover"
              placement="top">
              <span class="wf-parent-link">
                <i-icon type="forward"></i-icon>
                {{shortenedUsername(replyToComment.author.displayName)}}
              </span>
              <div
                v-if="replyToComment.content &&
                      replyToComment.author.displayName &&
                      replyToComment.author.avatarURL"
                slot="content"
                class="wf-reply-poptip">
                <img
                  :src="replyToComment.author.avatarURL"
                  :class="{ 'wf-anonymous': replyToComment.author.isAnonymous }"
                  @error="avatarOnError">
                <div>
                  <span :title="replyToComment.author.displayName">
                    <strong>{{replyToComment.author.displayName}}</strong>
                  </span>
                  <span :title="textContent(replyToComment.content)">{{textContent(replyToComment.content)}}</span>
                </div>
              </div>
              <div slot="content" v-else>
                {{i18next.t('CommentCard.text.loading_comments_content')}}
              </div>
            </i-poptip>
            <span class="wf-meta">
              <i-poptip
                :content="formatDate(comment.createdAt)"
                trigger="hover"
                placement="right">
              · {{distanceInWordsToNow(comment.createdAt)}}
              </i-poptip>
            </span>
          </div>
          <i-dropdown v-if="this.user"
            trigger="click"
            placement="bottom-end"
            @on-click="handleDropdownClick">
            <a href="javascript:void(0)" class="wf-dropdown-menu-button">
              <i-icon type="arrow-down-b"></i-icon>
            </a>
            <i-dropdown-menu slot="list">
              <component v-for="(cpntName, idx) in pluginComponents['comment.menu.top']"
                :is="cpntName"
                :key="idx"
                :bus="bus"
                :comment="comment"/>
              <i-dropdown-item v-if="!user || !user.isAdmin" style="color: red"
                name="reportCurrentComment">
                {{i18next.t('CommentCard.btn.report_comment')}}
              </i-dropdown-item>
              <i-dropdown-item v-if="user && user.isAdmin" style="color: red"
                name="banCurrentUser">
                {{i18next.t('CommentCard.btn.ban_user')}}
              </i-dropdown-item>
              <component v-for="(cpntName, idx) in pluginComponents['comment.menu.bottom']"
                :is="cpntName"
                :key="idx"
                :bus="bus"
                :comment="comment"/>
            </i-dropdown-menu>
          </i-dropdown>
        </header>
        <div class="wf-comment-content"
          :class="{'wf-code-overflow-hidden': !isShowingFullText}"
          :id="'wf-comment-content-'+comment.id">
          <div :class="{ 'wf-less': isContentTooLong && !isShowingFullText }">
            <wf-marked-content :content="comment.content"></wf-marked-content>
          </div>
          <i-button v-if="isContentTooLong"
            class="wf-toggle-content-btn"
            @click="isShowingFullText = !isShowingFullText"
            type="text" long>
            <template v-if="isShowingFullText">
              <i-icon type="chevron-up"></i-icon>
              {{i18next.t('CommentCard.btn.show_less_content')}}
            </template>
            <template v-else>
              <i-icon type="chevron-down"></i-icon>
              {{i18next.t('CommentCard.btn.show_full_content')}}
            </template>
          </i-button>
        </div>
        <footer class="wf-comment-footer">
          <a :title="i18next.t('CommentCard.html_title.like_comment')"
            :class="{
              'wf-inactive': attitudeOfCurrentUser !== true,
              'wf-disabled': !user
            }"
            @click="toggleVote('like')">
            <span>{{votes.likes.length || ''}}</span>
            <i-icon type="heart"></i-icon>
          </a>
          <span class="wf-separator">|</span>
          <a :title="i18next.t('CommentCard.html_title.dislike_comment')"
            :class="{
              'wf-inactive': attitudeOfCurrentUser !== false,
              'wf-disabled': !user
            }"
            @click="toggleVote('dislike')">
            <span>{{votes.dislikes.length || ''}}</span>
            <i-icon type="heart-broken"></i-icon>
          </a>
          <component v-for="(cpntName, idx) in pluginComponents['comment.buttons.pre']"
            :is="cpntName"
            :key="idx"
            :bus="bus"
            :comment="comment"/>
          <i-button
            type="text"
            class="wf-reply-btn"
            @click="toggleReplyArea">
            {{isShowingReplyArea ? i18next.t('CommentCard.btn.hide') : i18next.t('CommentCard.btn.reply')}}
          </i-button>
          <i-poptip
            confirm
            :title="i18next.t('CommentCard.confirm.deleting_comment')"
            @on-ok="confirmDelete">
            <i-button type="text" class="wf-delete-btn"
              v-if="canDelete">
              {{i18next.t('CommentCard.btn.delete')}}
            </i-button>
          </i-poptip>
          <component v-for="(cpntName, idx) in pluginComponents['comment.buttons.post']"
            :is="cpntName"
            :key="idx"
            :bus="bus"
            :comment="comment"/>
        </footer>
        <!-- If this is a comment -->
        <wf-reply-area v-if="!parentComment"
          v-show="isShowingReplyArea"
          ref="replyArea"
          :user="user"
          :reply-to-comment-author-username="author.displayName"
          :reply-to-comment="comment"
          @finished-replying="isShowingReplyArea = false"></wf-reply-area>
        <!-- If this is a reply (to a comment/reply) -->
        <wf-reply-area v-if="parentComment"
          v-show="isShowingReplyArea"
          ref="replyArea"
          :user="user"
          :reply-to-comment-author-username="author.displayName"
          :reply-to-comment="comment"
          :root-comment="parentComment"
          @finished-replying="isShowingReplyArea = false"></wf-reply-area>
      </div>
    </section>
    <section class="wf-section-replies">
      <ul class="wf-reply-group" v-if="isTopLevelComment">
        <wf-comment-card
          v-for="(reply, idx) in replies"
          v-show="!isShowingLessReplies ||
                  (isShowingLessReplies && idx < numberOfRepliesWhenShowingLess)"
          :key="reply.id"
          :user="user"
          :comment="reply"
          :parent-comment="comment"></wf-comment-card>
        <i-button type="text"
          v-show="replies.length > numberOfRepliesWhenShowingLess"
          @click="isShowingLessReplies = !isShowingLessReplies"
          long>
          <template v-if="isShowingLessReplies">
            <i-icon type="chevron-down"></i-icon>
            {{i18next.t('CommentCard.btn.show_more_discussion', { count: foldedDiscussionCount })}}
          </template>
          <template v-else>
            <i-icon type="chevron-up"></i-icon>
            {{i18next.t('CommentCard.btn.show_less_discussion', { count: foldedDiscussionCount })}}
          </template>
        </i-button>
      </ul>
    </section>
  </li>
</template>

<script>
const MAX_CONTENT_HEIGHT = 180

import Bus from '../common/bus'
import { textContent, handleImageOnError } from '../common/utils'
import errorImage from '../assets/images/error-image.svg'
/*
  Wf Comment Card
  Note: this component is used for both top-level `comments`
        and lowerer level comments, or `replies` in
        this project.

        The comment hierarchy has only two levels. Comments
        to the current page are considered top-level. Replies
        to comments, or other replies, are second-level
        comments.
 */
export default {
  name: 'wf-comment-card',
  props: [
    'comment',
    'parentComment'
  ],
  data () {
    return {
      isShowingReplyArea: false,
      author: {
        displayName: '',
        avatarURL: '',
        email: ''
      },
      isContentTooLong: false,
      isShowingFullText: true,
      replyToComment: {
        author: {
          isAnonymousUser: null,
          displayName: '',
          avatarURL: ''
        },
        content: ''
      },
      votes: {
        likes: [],
        dislikes: []
      },
      replies: [],
      isShowingLessReplies: true,
      numberOfRepliesWhenShowingLess: 4
    }
  },
  computed: {
    bus: () => Bus,
    config: () => Bus.config,
    db: () => Bus.db,
    i18next: () => Bus.i18next,
    pluginComponents: () => Bus.pluginComponents,
    user: () => Bus.user,
    isCurrentUserBanned: () => Bus.isCurrentUserBanned,
    textContent: () => textContent,
    distanceInWordsToNow: () => Bus.distanceInWordsToNow,
    formatDate: () => Bus.formatDate,
    isTopLevelComment () {
      return !this.comment.parentComment
    },
    attitudeOfCurrentUser () {
      if (!this.user) return undefined
      const uid = this.user.id
      const { likes, dislikes } = this.votes
      return likes.indexOf(uid) !== -1 ? true : dislikes.indexOf(uid) !== -1 ? false : undefined
    },
    isPostedByAnonymousUser () {
      return !this.comment.byUser
    },
    canDelete () {
      return this.user 
              ? this.user.isAdmin 
                ? true
                : this.comment.byUser 
                  ? this.user.id === this.comment.byUser.id : false
              : false
    },
    foldedDiscussionCount () {
      return this.replies.length - this.numberOfRepliesWhenShowingLess
    }
  },
  watch: {
    user (newVal) {
      if (newVal && this.comment.byUser && newVal.id === this.comment.byUser.id) {
        const { displayName, avatarURL, email } = newVal
        this.author.displayName = displayName
        this.author.avatarURL = avatarURL
        this.author.email = email
      }
    }
  },
  created () {
    // Init user info as anonymous user
    this.author.displayName = this.i18next.t('common.anonymous_user')
    this.author.avatarURL = this.config.defaultAvatarURL
    this.replyToComment.author.isAnonymous = true
    this.replyToComment.author.displayName = this.i18next.t('common.anonymous_user')
    this.replyToComment.author.avatarURL = this.config.defaultAvatarURL

    if (!this.isPostedByAnonymousUser) {
      const { avatarURL, displayName, email } = this.comment.byUser
      this.author.avatarURL = avatarURL
      this.author.displayName = displayName
      this.author.email = email
    }

    // Init voting data
    const _votes = this.comment.votes || []
    _votes.forEach(({ attitude, byUser }) => {
      this.votes[attitude ? 'likes' : 'dislikes'].push(byUser)
    })
    // Subscribe to voting events
    this.db.on(`vote-for-${this.comment.id}`, ({ attitude, byUser }) => {
      this._resetVotingOfUser(byUser, attitude)
    })

    if (this.isTopLevelComment) {
      this.db.get('/replies', {commentId: this.comment.id}, ({ error, data = [] }) => {
        if (error) return

        const replies = data
        replies.forEach(reply => this.replies.push(reply))

        this.db.on(`new-reply-of-comment-${this.comment.id}`, ({ data }) => {
          this.replies.push(data)
          Bus.discussionCount += 1
        })
        this.db.on(`delete-reply-of-comment-${this.comment.id}`, ({ data }) => {
          const idx = this.replies.findIndex(reply => reply.id === data.id)
          if (idx !== -1) {
            this.replies.splice(idx, 1)
            Bus.discussionCount -= 1
          }
        })
      })
    } else if (this.comment.parentComment === this.comment.rootComment) {
      const { content, byUser } = this.parentComment
      this.replyToComment.content = content
      if (byUser) {
        this.replyToComment.author.displayName = byUser.displayName
        this.replyToComment.author.avatarURL = byUser.avatarURL
        this.replyToComment.author.isAnonymous = false
      }
    } else {
      if (!this.comment.parentComment) return
      this.db.get('/comment', { commentId: this.comment.parentComment }, ({ error, data }) => {
        if (error) return

        const { content, byUser } = data
        this.replyToComment.content = content
        if (byUser) {
          this.replyToComment.author.displayName = byUser.displayName
          this.replyToComment.author.avatarURL = byUser.avatarURL
          this.replyToComment.author.isAnonymous = false
        }
      })
    }
  },
  mounted () {
    const contentEle = document.getElementById('wf-comment-content-' + this.comment.id)
    this.checkShouldFold(contentEle)

    const imgEles = contentEle.getElementsByTagName('img')
    for (var i = imgEles.length - 1; i >= 0; i--) {
      imgEles[i].onload = () => {
        this.checkShouldFold(contentEle)
      }
      imgEles[i].onerror = (event) => {
        const imageEle = event.target
        const title = this.i18next.t('CommentCard.html_title.image_onerror')

        imageEle.className = 'wf-error-image'
        handleImageOnError(imageEle, errorImage, title)
        this.checkShouldFold(contentEle)
      }
    }

    Bus.listenTo('OnlyOneReplyAreaShouldBeActive', activeReplyAreaId => {
      if (this.$refs.replyArea._uid !== activeReplyAreaId) {
        this.isShowingReplyArea = false
      }
    }, this.$refs.replyArea._uid)
  },
  beforeDestroy () {
    Bus.enough('CurrentUserInfoUpdated', null, this._uid)
  },
  methods: {
    isAnonymousUser (uid) {
      const { anonymousUserId } = this.config
      return !uid || uid === anonymousUserId
    },
    shortenedUsername (username) {
      if (username.length > 10) { return username.slice(0, 10) + '...' }
      return username
    },
    checkShouldFold (contentEle) {
      /*
        Calculate comment content height
        Note: If longer than MAX_CONTENT_HEIGHT, then fold.
       */
      const contentEleHeight = parseInt(window.getComputedStyle(contentEle).height)
      if (contentEleHeight > MAX_CONTENT_HEIGHT) {
        this.isContentTooLong = true
        this.isShowingFullText = false
      } else {
        this.isContentTooLong = false
        this.isShowingFullText = true
      }
    },
    avatarOnError (event) {
      handleImageOnError(
        event.target,
        this.config.defaultAvatarURL,
        this.i18next.t('CommentCard.html_title.image_onerror')
        )
    },
    toggleReplyArea () {
      this.isShowingReplyArea = !this.isShowingReplyArea
      Bus.$emit('OnlyOneReplyAreaShouldBeActive', this.$refs.replyArea._uid)
    },
    /**
     * @param  {string='like', 'dislike'} type
     */
    toggleVote (type) {
      if (!this.user) { return }
      if (this.isCurrentUserBanned) {
        this.$Modal.error({
          title: this.i18next.t('CommentCard.error.banned_title'),
          content: this.i18next.t('CommentCard.error.banned_content'),
          okText: this.i18next.t('CommentCard.btn.confirm')
        })
        return
      }

      const uid = this.user.id
      const commentId = this.comment.id
      let likes = this.votes.likes
      let dislikes = this.votes.dislikes
      let attitude = likes.indexOf(uid) !== -1 ? true : dislikes.indexOf(uid) !== -1 ? false : undefined
      let newAttitude

      if (type === 'like') {
        newAttitude = attitude === true ? undefined : true
      } else if (type === 'dislike') {
        newAttitude = attitude === false ? undefined : false
      }

      // hook: beforeVoteComment
      const shouldContinue = (Bus.hooks.beforeVoteComment || []).map(cb => cb({
        bus: this.bus,
        comment: this.comment,
        oldVal: attitude,
        newVal: newAttitude
      })).reduce((a, b) => a && b, true)
      if (!shouldContinue) return

      const votedCommentCbs = (err) => {
        // hook: votedComment
        const cbs = Bus.hooks.votedComment || []
        cbs.forEach(cb => cb({
          err,
          bus: this.bus,
          comment: this.comment,
          oldVal: attitude,
          newVal: newAttitude
        }))
      }

      this.db.put('/voteComment', { commentId, attitude: newAttitude }, ({ data, error }) => {
        if (error) {
          votedCommentCbs(error)
          return
        }

        const { attitude, byUser } = data
        this._resetVotingOfUser(byUser, attitude)

        votedCommentCbs()
      })
    },
    _resetVotingOfUser (uid, newAttitude) {
        // reset voting for this user
        const isLiked = this.votes.likes.indexOf(uid)
        if (isLiked !== -1) { this.votes.likes.splice(isLiked, 1)}
        const isDisliked = this.votes.dislikes.indexOf(uid)
        if (isDisliked !== -1) { this.votes.dislikes.splice(isDisliked, 1)}

        // add new voting data
        newAttitude !== undefined && this.votes[newAttitude ? 'likes' : 'dislikes'].push(uid)
    },
    confirmDelete () {
      // hook: beforeDeleteComment
      const shouldContinue = (Bus.hooks.beforeDeleteComment || []).map(cb => cb({ 
        bus: this.bus, 
        comment: this.comment
      })).reduce((a, b) => a && b, true)
      if (!shouldContinue) return

      const commentId = this.comment.id
      const pageURL = this.config.pageURL

      this.db.delete('/comment', {commentId}, ({ data, error }) => {
        if (error) {
          this.$Message.error(this.i18next.t('CommentCard.error.deleting_comment'))

          // hook: deletedComment
          const cbs = Bus.hooks.deletedComment || []
          cbs.forEach(cb => cb({ err: error, bus: this.bus, comment: this.comment }))

          return
        }

        this.$Message.success(this.i18next.t('CommentCard.success.deleting_comment'))

        // hook: deletedComment
        const cbs = Bus.hooks.deletedComment || []
        cbs.forEach(cb => cb({ bus: this.bus, comment: this.comment }))
      })
    },
    handleDropdownClick (name) {
      this[name] && this[name]()
    },
    reportCurrentComment () {
      if (!this.user) { return }
      if (this.isCurrentUserBanned) {
        this.$Modal.error({
          title: this.i18next.t('CommentCard.error.banned_title'),
          content: this.i18next.t('CommentCard.error.banned_content'),
          okText: this.i18next.t('CommentCard.btn.confirm')
        })
        return
      }

      // hook: beforeReportComment
      const shouldContinue = (Bus.hooks.beforeReportComment || []).map(cb => cb({ bus: this.bus, comment: this.comment })).reduce((a, b) => a && b, true)
      if (!shouldContinue) return

      this.db.put('/reportComment', { commentId: this.comment.id }, ({ error, data }) => {
        if (error) {
          // TODO: handle all errors
          switch (error) {
            case 'comment/duplicate_report':
              this.$Message.error(this.i18next.t('CommentCard.error.repeated_reporting'))
              break
            default:
              this.$Message.error(this.i18next.t('CommentCard.error.reporting_comment'))
          }
          
          // hook: reportedComment
          const cbs = Bus.hooks.reportedComment || []
          cbs.forEach(cb => cb({ err: error, bus: this.bus, comment: this.comment }))

          return
        }
        this.$Message.success(this.i18next.t('CommentCard.success.reporting_comment'))

        // hook: reportedComment
        const cbs = Bus.hooks.reportedComment || []
        cbs.forEach(cb => cb({ bus: this.bus, comment: this.comment }))
      })
    },
    banCurrentUser () {
      const user = (this.comment.byUser && this.comment.byUser.id) || this.comment.ip
      if (!user) {
        this.$Message.error(this.i18next.t('ReportManagement.error.banning_user_invalid_ip'))
        return
      }
      this.db.post('/ban', { id: user }, ({ data, error }) => {
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
    showUserInfo () {
      Bus.$emit('ShowUserInfo', {
        uid: this.comment.byUser,
        displayName: this.author.displayName,
        avatarURL: this.author.avatarURL,
        email: this.author.email,
        ip: this.comment.ip
      })
    }
  }
}
</script>
