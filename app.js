App({
  onLaunch() {
    try {
      const sysInfo = wx.getSystemInfoSync()
      this.globalData.systemInfo = sysInfo
    } catch (e) {
      console.warn('[AxisSnap] 获取系统信息失败:', e)
      this.globalData.systemInfo = {
        platform: 'devtools',
        windowWidth: 375,
        windowHeight: 812
      }
    }
  },
  globalData: {
    systemInfo: null
  }
})
