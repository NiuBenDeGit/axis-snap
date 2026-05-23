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
  }
})
