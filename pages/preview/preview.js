const NAV_BACK_DELAY = 1500
const app = getApp()

Page({
  data: {
    portraitPath: '',
    landscapePath: ''
  },

  onLoad() {
    const images = app.globalData.previewImages
    if (images) {
      this.setData({
        portraitPath: images.portrait || '',
        landscapePath: images.landscape || ''
      })
      app.globalData.previewImages = null
    }
  },

  goBack() {
    wx.navigateBack()
  },

  previewPortrait() {
    if (!this.data.portraitPath) return
    wx.previewImage({
      urls: [this.data.portraitPath],
      current: this.data.portraitPath
    })
  },

  previewLandscape() {
    if (!this.data.landscapePath) return
    wx.previewImage({
      urls: [this.data.landscapePath],
      current: this.data.landscapePath
    })
  },

  saveToAlbum() {
    wx.showLoading({ title: '保存中...', mask: true })

    this.checkAlbumPermission()
      .then(() => {
        const tasks = [this.data.portraitPath, this.data.landscapePath]
          .filter(p => p)
          .map(p => this.saveImage(p))
        if (tasks.length === 0) {
          throw new Error('无图片可保存')
        }
        return Promise.all(tasks)
      })
      .then(() => {
        wx.hideLoading()
        wx.showToast({ title: '已保存到相册', icon: 'success' })
        setTimeout(() => wx.navigateBack(), NAV_BACK_DELAY)
      })
      .catch((err) => {
        wx.hideLoading()
        if (err === 'denied') {
          wx.showModal({
            title: '需要相册权限',
            content: '请在设置中开启相册访问权限',
            confirmText: '去设置',
            success: (modalRes) => {
              if (modalRes.confirm) {
                wx.openSetting()
              }
            }
          })
        } else {
          console.error('保存失败:', err)
          wx.showToast({ title: '保存失败，请重试', icon: 'none' })
        }
      })
  },

  checkAlbumPermission() {
    return new Promise((resolve, reject) => {
      wx.getSetting({
        success: (res) => {
          if (res.authSetting['scope.writePhotosAlbum'] === false) {
            console.warn('[AxisSnap] 用户已拒绝相册权限')
            reject('denied')
            return
          }
          if (res.authSetting['scope.writePhotosAlbum'] === true) {
            resolve()
            return
          }
          wx.authorize({
            scope: 'scope.writePhotosAlbum',
            success: resolve,
            fail: () => {
              console.warn('[AxisSnap] 相册权限授权失败')
              reject('denied')
            }
          })
        },
        fail: reject
      })
    })
  },

  saveImage(path) {
    return new Promise((resolve, reject) => {
      if (!path) {
        reject(new Error('图片路径为空'))
        return
      }
      wx.saveImageToPhotosAlbum({
        filePath: path,
        success: resolve,
        fail: reject
      })
    })
  }
})
