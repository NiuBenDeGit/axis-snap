const { mapCropCoords, cropLandscape } = require('../../utils/image')
const app = getApp()

Page({
  data: {
    flash: 'auto',
    flashIcon: '⚡️🔛',
    cropBox: {
      x: 0,
      y: 80,
      width: 200,
      height: 112
    },
    baseCropWidth: 200,
    baseCropHeight: 112,
    canvasWidth: 400,
    canvasHeight: 225,
    loading: false,
    error: false,
    errorMsg: ''
  },

  onShow() {
    this.setData({ loading: false })
  },

  onReady() {
    try {
      this.cameraCtx = wx.createCameraContext()
    } catch (e) {
      this.setData({ error: true, errorMsg: '相机初始化失败' })
    }

    // 根据屏幕宽度动态计算裁剪框初始 x 位置 (右上角)
    const sysInfo = app.globalData.systemInfo || wx.getSystemInfoSync()
    const boxPxW = 200 / (750 / sysInfo.windowWidth)
    this.setData({
      'cropBox.x': sysInfo.windowWidth - boxPxW - 16
    })
  },

  toggleFlash() {
    const map = {
      'auto': { flash: 'on', icon: '⚡️' },
      'on':   { flash: 'off', icon: '⚡️🚫' },
      'off':  { flash: 'auto', icon: '⚡️🔛' }
    }
    const next = map[this.data.flash] || { flash: 'auto', icon: '⚡️🔛' }
    this.setData({ flash: next.flash, flashIcon: next.icon })
  },

  onCropBoxChange(e) {
    this.setData({
      'cropBox.x': e.detail.x,
      'cropBox.y': e.detail.y
    })
  },

  onCropBoxScale(e) {
    // e.detail.x / e.detail.y 是缩放比例因子
    this.setData({
      'cropBox.width': Math.round(this.data.baseCropWidth * e.detail.x),
      'cropBox.height': Math.round(this.data.baseCropHeight * e.detail.y)
    })
  },

  takePhoto() {
    if (this.data.loading) return
    if (!this.cameraCtx) {
      wx.showToast({ title: '相机未就绪', icon: 'none' })
      return
    }
    this.setData({ loading: true })

    this.cameraCtx.takePhoto({
      quality: 'high',
      success: async (res) => {
        const portraitPath = res.tempImagePath

        try {
          const landscapePath = await this.doPortraitCrop(portraitPath)
          // 通过 globalData 传递，避免 URL 参数超长
          app.globalData.previewImages = {
            portrait: portraitPath,
            landscape: landscapePath
          }
          wx.navigateTo({ url: '/pages/preview/preview' })
        } catch (err) {
          this.setData({ loading: false })
          console.error('裁剪失败:', err)
          wx.showToast({ title: '处理失败，请重试', icon: 'none' })
        }
      },
      fail: (err) => {
        this.setData({ loading: false })
        console.error('拍照失败:', err)
        wx.showToast({ title: '拍照失败，请重试', icon: 'none' })
      }
    })
  },

  doPortraitCrop(portraitPath) {
    return new Promise((resolve, reject) => {
      wx.getImageInfo({
        src: portraitPath,
        success: (imgInfo) => {
          const screenInfo = app.globalData.systemInfo
          const cropRect = mapCropCoords(
            this.data.cropBox,
            { width: screenInfo.windowWidth, height: screenInfo.windowHeight },
            { width: imgInfo.width, height: imgInfo.height }
          )

          const outputSize = {
            width: this.data.canvasWidth,
            height: this.data.canvasHeight
          }

          cropLandscape(portraitPath, cropRect, outputSize)
            .then(resolve)
            .catch(reject)
        },
        fail: reject
      })
    })
  },

  onCameraError(e) {
    console.error('相机错误:', e.detail)
    this.setData({ error: true, errorMsg: '相机启动失败' })
    wx.showToast({ title: '相机启动失败', icon: 'none' })
  }
})
