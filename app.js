App({
  onLaunch() {
    const sysInfo = wx.getSystemInfoSync()
    this.globalData.systemInfo = sysInfo
  },
  globalData: {
    systemInfo: null
  }
})
