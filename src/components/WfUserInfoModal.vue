<template>
  <div class="wf-user-info-modal">
    <img
      :src="selectedCommentUserInfo.avatarURL"
      :class="{ 'wf-anonymous': isAnonymousUser }"
      @error="avatarOnError">
    <div>
      <h3>{{selectedCommentUserInfo.displayName}}</h3>
      <p v-if="encodedIP">
        <span>IP:</span> {{encodedIP}}
      </p>
      <p v-if="!isAnonymousUser">
        <span>Email:</span> {{selectedCommentUserInfo.email}}
      </p>
    </div>
  </div>
</template>

<script>
import Bus from '../common/bus'
import { handleImageOnError } from '../common/utils'
export default {
  name: 'wf-user-info-modal',
  computed: {
    config: () => Bus.config,
    i18next: () => Bus.i18next,
    selectedCommentUserInfo: () => Bus.$data.selectedCommentUserInfo,
    encodedIP () {
      const ip = this.selectedCommentUserInfo.ip
      if (!ip || (ip.indexOf('unknown') !== -1)) { return this.i18next.t('common.unknown_ip') }
      const lastDotIdx = ip.lastIndexOf('.')
      const lastSec = ip.slice(lastDotIdx + 1)
      return lastSec ? `***.**.**.${lastSec}` : this.i18next.t('common.unknown_ip')
    },
    isAnonymousUser () {
      return !this.selectedCommentUserInfo.uid
    }
  },
  methods: {
    avatarOnError (event) {
      handleImageOnError(
        event.target,
        this.config.defaultAvatarURL,
        this.i18next.t('CommentCard.html_title.image_onerror')
        )
    }
  }
}
</script>
