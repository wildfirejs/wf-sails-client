<template> 
  <i-tabs class="wf-user-setting">
    <i-tab-pane :label="i18next.t('UserSetting.tab.profile')" name="profile" :disabled="updatingAccount">
      <div class="wf-form-warp" :class="{ 'wf-is-small-screen': isSmallScreen }">
        <i-form ref="profileForm" :model="profileForm" :rules="rule" label-position="top">
          <i-form-item :label="i18next.t('UserSetting.label.display_name')" prop="displayName">
            <i-input type="text" v-model="profileForm.displayName" :placeholder="i18next.t('UserSetting.placeholder.display_name')">
            </i-input>
          </i-form-item>
          <i-form-item :label="i18next.t('UserSetting.label.photo_url')" prop="avatarURL">
            <i-input type="text" v-model="profileForm.avatarURL" :placeholder="i18next.t('UserSetting.placeholder.photo_url')">
              <i-button slot="append" icon="refresh" @click="resetAvatar"></i-button>
            </i-input>
          </i-form-item>
          <div class="wf-buttons wf-align-for-profile">
            <i-button 
            type="primary" 
            @click="handleChangeProfile()" 
            :disabled="updatingProfile || avatarTesting" 
            :loading="updatingProfile">
              {{ i18next.t('UserSetting.btn.update') }}
            </i-button>
            <i-button 
            type="text" 
            @click="closeModel()" 
            :disabled="updatingProfile">
              {{ i18next.t('UserSetting.btn.cancel') }}
            </i-button>
          </div>
        </i-form>
        <div class="wf-avatar" >
          <img :src="avatarTestURL" @error="avatarOnError">
        </div>
      </div>
    </i-tab-pane>

    <i-tab-pane :label="i18next.t('UserSetting.tab.account')" name="account" :disabled="updatingProfile">
      <div class="wf-form-warp">
        <i-form ref="accountForm" :model="accountForm" :rules="rule" label-position="top">
          <i-form-item :label="i18next.t('UserSetting.label.old_pwd')" prop="oldPassword">
            <i-input type="password" v-model="accountForm.oldPassword" :placeholder="i18next.t('UserSetting.placeholder.old_pwd')">
            </i-input>
          </i-form-item>
          <i-form-item :label="i18next.t('UserSetting.label.new_pwd')" prop="newPassword">
            <i-input type="password" v-model="accountForm.newPassword" :placeholder="i18next.t('UserSetting.placeholder.new_pwd')">
            </i-input>
          </i-form-item>
          <i-form-item :label="i18next.t('UserSetting.label.confirm_pwd')" prop="passwordCheck">
            <i-input type="password" v-model="accountForm.passwordCheck" :placeholder="i18next.t('UserSetting.placeholder.confirm_pwd')">
            </i-input>
          </i-form-item>
          <div class="wf-buttons">
            <i-button
            type="primary" 
            @click="handleChangeAccount()" 
            :disabled="updatingAccount || passwordTesting" 
            :loading="updatingAccount">
              {{ i18next.t('UserSetting.btn.update') }} 
            </i-button>
            <i-button 
            type="text" 
            @click="closeModel()" 
            :disabled="updatingAccount">
              {{ i18next.t('UserSetting.btn.cancel') }}
            </i-button>
          </div>
        </i-form>
      </div>
    </i-tab-pane>
  </i-tabs>

</template>

<script>
import Bus from '../common/bus'
import { handleImageOnError } from '../common/utils'
import WfTip from './WfTip'
export default {
  name: 'wf-user-setting',
  components: { WfTip },
  data () {
    const user = Bus.user
    const _i18next = Bus.i18next
    const validateOldPassword = (rule, value, callback) => {
      this.passwordTesting = true
      Bus.db.get('/validatePassword', { password: value }, ({ error }) => {
        this.passwordTesting = false
        if (error) {
          callback(new Error(_i18next.t('UserSetting.error.password')))
        } else {
          callback()
        }
      })
    }
    const validatePasswordCheck = (rule, value, callback) => {
      if (value !== this.accountForm.newPassword) {
        callback(new Error(_i18next.t('UserSetting.error.passwords_dont_match')))
      } else {
        callback()
      }
    }
    const validateAvatarURL = (rule, value, callback) => {
      this.avatarTesting = true
      var avatar = new Image()
      avatar.src = value
      avatar.onload = () => {
        this.avatarTestURL = value
        this.avatarTesting = false
        callback()
      }
      avatar.onerror = () => {
        this.avatarTestURL = user.avatarURL
        this.avatarTesting = false
        callback(new Error(_i18next.t('UserSetting.error.invalid_photo_url')))
      }
    }
    const validateDisplayName = (rule, value, callback) => {
      callback()
    }
    return {
      avatarTesting: false,
      passwordTesting: false,
      updatingProfile: false,
      updatingAccount: false,
      avatarTestURL: user.avatarURL,
      profileForm: {
        displayName: user.displayName,
        avatarURL: user.avatarURL
      },
      accountForm: {
        oldPassword: '',
        newPassword: '',
        passwordCheck: ''
      },
      rule: {
        displayName: [
          { required: true, message: '', trigger: 'blur' },
          { validator: validateDisplayName, trigger: 'blur' }
        ],
        avatarURL: [
          { required: true, message: '', trigger: 'blur' },
          { validator: validateAvatarURL, trigger: 'blur' }
        ],
        oldPassword: [
          { required: true, message: _i18next.t('UserSetting.error.empty_old_pwd'), trigger: 'blur' },
          { type: 'string', min: 6, message: _i18next.t('UserSetting.error.password_min_length'), trigger: 'blur' },
          { validator: validateOldPassword, trigger: 'blur' }
        ],
        newPassword: [
          { required: true, message: _i18next.t('UserSetting.error.empty_new_pwd'), trigger: 'blur' },
          { type: 'string', min: 6, message: _i18next.t('UserSetting.error.password_min_length'), trigger: 'blur' }
        ],
        passwordCheck: [
          { required: true, message: _i18next.t('UserSetting.error.empty_confirm_pwd'), trigger: 'blur' },
          { validator: validatePasswordCheck, trigger: 'blur' }
        ]
      },
      shouldShowPassword: true
    }
  },
  computed: {
    auth: () => Bus.auth,
    config: () => Bus.config,
    db: () => Bus.db,
    i18next: () => Bus.i18next,
    user: () => Bus.user,
    windowWidth: () => Bus.windowWidth,
    isSmallScreen () {
      // <= screen width of iPhone 6 plus
      return this.windowWidth <= 414
    }
  },
  methods: {
    avatarOnError (event) {
      handleImageOnError(
        event.target,
        this.config.defaultAvatarURL,
        this.i18next.t('CommentCard.html_title.image_onerror')
        )
    },
    handleChangeProfile () {
      this.$refs['profileForm'].validate((valid) => {
        if (valid) {
          this.updatingProfile = true
          const { displayName, avatarURL } = this.profileForm
          this.db.put('/updateProfile', { displayName, avatarURL }, ({ data, error }) => {
            if (error) {
              this.updatingProfile = false
              // TODO: handle error
              this.$Message.error(this.i18next.t('UserSetting.error.unknown'))
              return
            }
            this.$set(Bus, 'user', data)

            this.updatingProfile = false
            this.$Message.info(this.i18next.t('UserSetting.success.updating_profile'))
          })
        } else {
          this.$Message.error(this.i18next.t('UserSetting.error.invalid_form'))
        }
      })
    },
    handleChangeAccount () {
      this.$refs['accountForm'].validate((valid) => {
        if (valid) {
          this.updatingAccount = true
          const password = this.accountForm.newPassword

          this.db.put('/updatePassword', { password }, ({ data, error }) => {
            this.updatingAccount = false
            this.$refs['accountForm'].resetFields()
            if (error) {
              this.$Message.error(this.i18next.t('UserSetting.error.unknown'))
              return
            }
            this.$Message.info(this.i18next.t('UserSetting.success.changing_password'))
          })
        } else {
          this.$Message.error(this.i18next.t('UserSetting.error.invalid_form'))
        }
      })
    },
    resetAvatar () {
      this.profileForm.avatarURL = this.user.avatarURL
      this.avatarTestURL = this.user.avatarURL
      this.$refs.profileForm.validateField('avatarURL')
    },
    closeModel () {
      this.$refs['accountForm'].resetFields()
      this.avatarTestURL = this.user.avatarURL
      this.$parent.close()
    }
  }
}
</script>
