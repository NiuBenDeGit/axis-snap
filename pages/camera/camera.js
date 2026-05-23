const { mapCropCoords, cropLandscape } = require('../../utils/image')
const app = getApp()

Page({
  data: {
    flash: 'auto',
    flashIcon: '⚡️',
    cropBox: {
      x: 500,
      y: 80,
      width: 200,
      height: 112
    },
    canvasWidth: 400,
    canvasHeight: 225
  },

  onReady() {
    this.cameraCtx = wx.createCameraContext()
  },

  toggleFlash() {
    const map = {
      'auto': { flash: 'on', icon: '⚡️' },
      'on':   { flash: 'off', icon: '⚡️🚫' },
      'off':  { flash: 'auto', icon: '⚡️🔛' }
    }
    const next = map[this.data.flash]
    this.setData({ flash: next.flash, flashIcon: next.icon })
  },

  onCropBoxChange(e) {
    this.setData({
      'cropBox.x': e.detail.x,
      'cropBox.y': e.detail.y
    })
  },

  onCropBoxScale(e) {
    this.setData({
      'cropBox.width': e.detail.x,
      'cropBox.height': e.detail.y
    })
  }
})
