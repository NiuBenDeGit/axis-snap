# 横竖轴定格 (AxisSnap) 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建一款微信小程序，竖屏拍照时右上角有可拖动的横屏预览框，一键拍出竖屏原图+横屏裁剪图两张照片

**Architecture:** 原生微信小程序，两个页面（camera 拍照页 + preview 预览页），Camera 组件取景，movable-view 实现可拖动横屏预览框，离屏 Canvas 裁剪生成横屏图，wx.saveImageToPhotosAlbum 分别保存

**Tech Stack:** 微信小程序原生框架（WXML/WXSS/JS），微信开发者工具 + 真机调试

**验证方式:** 每个任务完成后在微信开发者工具中编译运行，对照检查项验证

---

### Task 1: 项目脚手架

**Files:**
- Create: `app.json`
- Create: `app.js`
- Create: `app.wxss`
- Create: `project.config.json`
- Create: `sitemap.json`

- [ ] **Step 1: 创建 app.json**

```json
{
  "pages": [
    "pages/camera/camera",
    "pages/preview/preview"
  ],
  "window": {
    "navigationStyle": "custom",
    "backgroundTextStyle": "dark"
  },
  "sitemapLocation": "sitemap.json"
}
```

- [ ] **Step 2: 创建 app.js**

```javascript
App({
  onLaunch() {
    // 获取系统信息，用于后续坐标映射
    const sysInfo = wx.getSystemInfoSync()
    this.globalData.systemInfo = sysInfo
  },
  globalData: {
    systemInfo: null
  }
})
```

- [ ] **Step 3: 创建 app.wxss**

```css
page {
  width: 100%;
  height: 100%;
  background: #000;
  overflow: hidden;
}
```

- [ ] **Step 4: 创建 project.config.json**

```json
{
  "description": "横竖轴定格",
  "packOptions": { "ignore": [] },
  "setting": {
    "urlCheck": true,
    "es6": true,
    "enhance": true,
    "postcss": true,
    "preloadBackgroundData": false,
    "minified": true,
    "newFeature": false,
    "coverView": true,
    "nodeModules": false,
    "autoAudits": false,
    "showShadowRootInWxmlPanel": true,
    "scopeDataCheck": false,
    "uglifyFileName": false,
    "checkInvalidKey": true,
    "checkSiteMap": true,
    "uploadWithSourceMap": true,
    "compileHotReLoad": false,
    "useMultiFrameRuntime": true,
    "useApiHook": true,
    "useApiHostProcess": true,
    "babelSetting": {
      "ignore": [],
      "disablePlugins": [],
      "outputPath": ""
    },
    "enableEngineNative": false,
    "bundle": false,
    "useIsolateContext": true,
    "useCompilerModule": true,
    "userConfirmedUseCompilerModuleSwitch": false,
    "userConfirmedBundleSwitch": false,
    "packNpmManually": false,
    "packNpmRelationList": [],
    "minifyWXSS": true,
    "compileWorklet": false,
    "minifyWXML": true,
    "localPlugins": false,
    "disableUseStrict": false,
    "useCompilerPlugins": false,
    "condition": false,
    "swc": false,
    "disableSWC": true
  },
  "compileType": "miniprogram",
  "libVersion": "3.3.4",
  "appid": "",
  "projectname": "AxisSnap",
  "condition": {},
  "simulatorPluginLibVersion": {}
}
```

- [ ] **Step 5: 创建 sitemap.json**

```json
{
  "rules": [{
    "action": "allow",
    "page": "*"
  }]
}
```

- [ ] **Step 6: 验证 — 在微信开发者工具中打开项目，确保无编译报错**

---

### Task 2: 拍照页布局 (WXML)

**Files:**
- Create: `pages/camera/camera.wxml`
- Create: `pages/camera/camera.json`

- [ ] **Step 1: 创建 camera.json 页面配置**

```json
{
  "navigationStyle": "custom",
  "disableScroll": true
}
```

- [ ] **Step 2: 创建 camera.wxml 页面结构**

```xml
<view class="page">
  <!-- 全屏相机 -->
  <camera
    id="camera"
    class="camera"
    device-position="back"
    flash="{{flash}}"
    binderror="onCameraError"
  />

  <!-- 横屏预览可拖动小框 -->
  <movable-area class="movable-area">
    <movable-view
      class="crop-box"
      direction="all"
      x="{{cropBox.x}}"
      y="{{cropBox.y}}"
      style="width: {{cropBox.width}}rpx; height: {{cropBox.height}}rpx;"
      bindchange="onCropBoxChange"
      bindscale="onCropBoxScale"
    >
      <view class="crop-border">
        <text class="crop-label">横屏</text>
      </view>
    </movable-view>
  </movable-area>

  <!-- 底部控制栏 -->
  <view class="controls">
    <!-- 闪光灯 -->
    <view class="flash-btn" bindtap="toggleFlash">
      <text class="flash-icon">{{flashIcon}}</text>
    </view>

    <!-- 快门 -->
    <view class="shutter-btn" bindtap="takePhoto">
      <view class="shutter-inner" />
    </view>

    <!-- 占位，保持快门居中 -->
    <view class="placeholder" />
  </view>
</view>

<!-- 离屏裁剪 Canvas（不可见） -->
<canvas
  type="2d"
  id="cropCanvas"
  class="crop-canvas"
  style="width: {{canvasWidth}}px; height: {{canvasHeight}}px;"
/>
```

- [ ] **Step 3: 验证 — 在微信开发者工具中编译，应看到全屏相机 + 右上角小框 + 底部快门按钮**

---

### Task 3: 拍照页样式 (WXSS)

**Files:**
- Create: `pages/camera/camera.wxss`

- [ ] **Step 1: 创建 camera.wxss 完整样式**

```css
.page {
  width: 100%;
  height: 100%;
  position: relative;
}

.camera {
  width: 100%;
  height: 100%;
}

/* 可拖动区域覆盖全屏 */
.movable-area {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

/* 横屏预览小框 */
.crop-box {
  pointer-events: auto;
  border: 3rpx solid rgba(255, 255, 255, 0.8);
  border-radius: 8rpx;
  box-shadow: 0 0 0 9999rpx rgba(0, 0, 0, 0.35);
  overflow: hidden;
}

.crop-border {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.crop-border::before,
.crop-border::after {
  content: '';
  position: absolute;
  background: rgba(255, 255, 255, 0.5);
}

/* 水平网格线 */
.crop-border::before {
  left: 0;
  right: 0;
  height: 1rpx;
  top: 33%;
  box-shadow: 0 200% 0 rgba(255, 255, 255, 0.5);
}

/* 垂直网格线 */
.crop-border::after {
  top: 0;
  bottom: 0;
  width: 1rpx;
  left: 33%;
  box-shadow: 200% 0 0 rgba(255, 255, 255, 0.5);
}

.crop-label {
  color: rgba(255, 255, 255, 0.6);
  font-size: 20rpx;
  background: rgba(0, 0, 0, 0.5);
  padding: 4rpx 12rpx;
  border-radius: 4rpx;
}

/* 底部控制栏 */
.controls {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 240rpx;
  display: flex;
  align-items: center;
  justify-content: space-around;
  padding: 0 60rpx;
  padding-bottom: env(safe-area-inset-bottom);
  box-sizing: border-box;
}

.flash-btn {
  width: 80rpx;
  height: 80rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.flash-icon {
  font-size: 48rpx;
  color: #fff;
}

.shutter-btn {
  width: 120rpx;
  height: 120rpx;
  border-radius: 50%;
  border: 6rpx solid #fff;
  display: flex;
  align-items: center;
  justify-content: center;
}

.shutter-inner {
  width: 88rpx;
  height: 88rpx;
  border-radius: 50%;
  background: #fff;
}

.placeholder {
  width: 80rpx;
  height: 80rpx;
}

/* 离屏 Canvas — 完全隐藏 */
.crop-canvas {
  position: fixed;
  top: -9999rpx;
  left: -9999rpx;
}
```

- [ ] **Step 2: 验证 — 在开发者工具中查看样式：小框右上角带网格线+框外暗色蒙层，快门白色圆环居中，闪光灯图标在右侧**

---

### Task 4: 图片工具函数

**Files:**
- Create: `utils/image.js`

- [ ] **Step 1: 创建 utils/image.js — 坐标映射 + Canvas 裁剪**

```javascript
/**
 * 将屏幕上的小框坐标映射为原图上的裁剪像素坐标
 * @param {Object} box - 小框信息 { x, y, width, height } 单位 rpx
 * @param {Object} screen - 屏幕信息 { width, height } 单位 px
 * @param {Object} image - 图片信息 { width, height } 单位 px
 * @returns {Object} { x, y, width, height } 像素坐标
 */
function mapCropCoords(box, screen, image) {
  const ratio = 750 / screen.width
  const boxPx = {
    x: box.x / ratio,
    y: box.y / ratio,
    width: box.width / ratio,
    height: box.height / ratio
  }

  return {
    x: Math.round(boxPx.x * (image.width / screen.width)),
    y: Math.round(boxPx.y * (image.height / screen.height)),
    width: Math.round(boxPx.width * (image.width / screen.width)),
    height: Math.round(boxPx.height * (image.height / screen.height))
  }
}

/**
 * 使用离屏 Canvas 从原图中裁剪出横屏图
 * @param {string} srcPath - 竖屏原图临时路径
 * @param {Object} cropRect - 裁剪区域 { x, y, width, height } 像素
 * @param {Object} outputSize - 输出尺寸 { width, height } 像素，16:9
 * @returns {Promise<string>} 裁剪后的横屏图临时路径
 */
function cropLandscape(srcPath, cropRect, outputSize) {
  return new Promise((resolve, reject) => {
    const query = wx.createSelectorQuery()
    query.select('#cropCanvas')
      .fields({ node: true, size: true })
      .exec((res) => {
        if (!res || !res[0] || !res[0].node) {
          reject(new Error('Canvas 节点未找到'))
          return
        }

        const canvas = res[0].node
        const ctx = canvas.getContext('2d')
        const dpr = wx.getSystemInfoSync().pixelRatio || 2

        canvas.width = outputSize.width * dpr
        canvas.height = outputSize.height * dpr
        ctx.scale(dpr, dpr)

        const img = canvas.createImage()
        img.onload = () => {
          ctx.drawImage(
            img,
            cropRect.x, cropRect.y, cropRect.width, cropRect.height,
            0, 0, outputSize.width, outputSize.height
          )

          wx.canvasToTempFilePath({
            canvas: canvas,
            destWidth: outputSize.width,
            destHeight: outputSize.height,
            fileType: 'jpg',
            quality: 0.95,
            success: (result) => resolve(result.tempFilePath),
            fail: reject
          })
        }
        img.onerror = reject
        img.src = srcPath
      })
  })
}

module.exports = {
  mapCropCoords,
  cropLandscape
}
```

- [ ] **Step 2: 验证 — 在微信开发者工具编译，确认 utils/image.js 无语法报错**

---

### Task 5: 拍照页逻辑 (JS) — 初始化和交互

**Files:**
- Create: `pages/camera/camera.js`

- [ ] **Step 1: 创建 camera.js — 基础数据和生命周期**

```javascript
const { mapCropCoords, cropLandscape } = require('../../utils/image')
const app = getApp()

Page({
  data: {
    flash: 'auto',        // auto, on, off
    flashIcon: '⚡️',       // ⚡️ / ⚡️🔛 / ⚡️🚫
    cropBox: {
      x: 500,              // 默认右上角 (rpx)
      y: 80,
      width: 200,          // 16:9
      height: 112
    },
    canvasWidth: 400,      // 裁剪输出尺寸 (px)
    canvasHeight: 225      // 16:9
  },

  onReady() {
    this.cameraCtx = wx.createCameraContext()
  },

  // 闪光灯切换
  toggleFlash() {
    const map = {
      'auto': { flash: 'on', icon: '⚡️' },
      'on':   { flash: 'off', icon: '⚡️🚫' },
      'off':  { flash: 'auto', icon: '⚡️🔛' }
    }
    const next = map[this.data.flash]
    this.setData({ flash: next.flash, flashIcon: next.icon })
  },

  // 小框拖动/缩放回调
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
```

- [ ] **Step 2: 验证 — 在开发者工具中点击闪光灯按钮，确认图标在 ⚡️ → ⚡️🚫 → ⚡️🔛 之间切换**

---

### Task 6: 拍照页逻辑 (JS) — 拍照 + 裁剪

**Files:**
- Modify: `pages/camera/camera.js` — 追加 takePhoto 方法

- [ ] **Step 1: 在 camera.js 中追加拍照方法和错误处理**

在现有 Page({}) 对象中，`onCropBoxScale` 方法后追加：

```javascript
  // 拍照
  takePhoto() {
    wx.showLoading({ title: '拍照中...', mask: true })

    this.cameraCtx.takePhoto({
      quality: 'high',
      success: async (res) => {
        const portraitPath = res.tempImagePath

        try {
          const landscapePath = await this.doPortraitCrop(portraitPath)
          wx.hideLoading()

          // 跳转预览页
          const portraitEncoded = encodeURIComponent(portraitPath)
          const landscapeEncoded = encodeURIComponent(landscapePath)
          wx.navigateTo({
            url: `/pages/preview/preview?portrait=${portraitEncoded}&landscape=${landscapeEncoded}`
          })
        } catch (err) {
          wx.hideLoading()
          console.error('裁剪失败:', err)
          wx.showToast({ title: '处理失败，请重试', icon: 'none' })
        }
      },
      fail: (err) => {
        wx.hideLoading()
        console.error('拍照失败:', err)
        wx.showToast({ title: '拍照失败，请重试', icon: 'none' })
      }
    })
  },

  // 根据小框位置裁剪横屏图
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

  // camera 组件错误
  onCameraError(e) {
    console.error('相机错误:', e.detail)
    wx.showToast({ title: '相机启动失败', icon: 'none' })
  }
```

- [ ] **Step 2: 验证 — 在真机上拍照，确认能正常跳转预览页（开发者工具 camera 组件不支持 takePhoto，必须真机测试）**

---

### Task 7: 预览页布局和样式

**Files:**
- Create: `pages/preview/preview.wxml`
- Create: `pages/preview/preview.wxss`
- Create: `pages/preview/preview.json`

- [ ] **Step 1: 创建 preview.json**

```json
{
  "navigationStyle": "custom"
}
```

- [ ] **Step 2: 创建 preview.wxml**

```xml
<view class="page">
  <!-- 顶部导航 -->
  <view class="nav-bar">
    <view class="nav-back" bindtap="goBack">
      <text class="back-icon">←</text>
      <text class="back-text">返回重拍</text>
    </view>
  </view>

  <!-- 照片展示区 -->
  <scroll-view class="photos" scroll-y>
    <!-- 竖屏照片 -->
    <view class="photo-card portrait-card" bindtap="previewPortrait">
      <image class="photo portrait-photo" src="{{portraitPath}}" mode="aspectFit" />
      <view class="photo-tag">竖屏</view>
    </view>

    <!-- 横屏照片 -->
    <view class="photo-card landscape-card" bindtap="previewLandscape">
      <image class="photo landscape-photo" src="{{landscapePath}}" mode="aspectFit" />
      <view class="photo-tag">横屏</view>
    </view>
  </scroll-view>

  <!-- 保存按钮 -->
  <view class="save-bar">
    <button class="save-btn" bindtap="saveToAlbum">保存到相册</button>
  </view>
</view>
```

- [ ] **Step 3: 创建 preview.wxss**

```css
.page {
  width: 100%;
  height: 100%;
  background: #111;
  display: flex;
  flex-direction: column;
}

.nav-bar {
  height: 88rpx;
  display: flex;
  align-items: center;
  padding: 0 30rpx;
  padding-top: env(safe-area-inset-top);
}

.nav-back {
  display: flex;
  align-items: center;
}

.back-icon {
  color: #fff;
  font-size: 36rpx;
  margin-right: 10rpx;
}

.back-text {
  color: #fff;
  font-size: 28rpx;
}

.photos {
  flex: 1;
  padding: 20rpx 30rpx;
}

.photo-card {
  position: relative;
  margin-bottom: 30rpx;
  border-radius: 12rpx;
  overflow: hidden;
  background: #1a1a1a;
}

.portrait-card {
  width: 100%;
  aspect-ratio: 3 / 4;
}

.landscape-card {
  width: 100%;
  aspect-ratio: 16 / 9;
}

.photo {
  width: 100%;
  height: 100%;
}

.photo-tag {
  position: absolute;
  top: 16rpx;
  left: 16rpx;
  background: rgba(0, 0, 0, 0.6);
  color: rgba(255, 255, 255, 0.8);
  font-size: 22rpx;
  padding: 4rpx 16rpx;
  border-radius: 6rpx;
}

.save-bar {
  padding: 30rpx 60rpx;
  padding-bottom: calc(30rpx + env(safe-area-inset-bottom));
}

.save-btn {
  width: 100%;
  height: 90rpx;
  line-height: 90rpx;
  text-align: center;
  background: #07c160;
  color: #fff;
  font-size: 32rpx;
  border-radius: 12rpx;
  border: none;
}

.save-btn::after {
  border: none;
}
```

- [ ] **Step 4: 验证 — 在开发者工具中预览，检查上下两张照片排列、底部绿色保存按钮**

---

### Task 8: 预览页逻辑 (JS) — 展示、保存、重拍

**Files:**
- Create: `pages/preview/preview.js`

- [ ] **Step 1: 创建 preview.js 完整逻辑**

```javascript
Page({
  data: {
    portraitPath: '',
    landscapePath: ''
  },

  onLoad(options) {
    this.setData({
      portraitPath: decodeURIComponent(options.portrait || ''),
      landscapePath: decodeURIComponent(options.landscape || '')
    })
  },

  // 返回重拍
  goBack() {
    wx.navigateBack()
  },

  // 预览竖屏照片
  previewPortrait() {
    wx.previewImage({
      urls: [this.data.portraitPath],
      current: this.data.portraitPath
    })
  },

  // 预览横屏照片
  previewLandscape() {
    wx.previewImage({
      urls: [this.data.landscapePath],
      current: this.data.landscapePath
    })
  },

  // 保存到相册
  saveToAlbum() {
    wx.showLoading({ title: '保存中...', mask: true })

    this.checkAlbumPermission()
      .then(() => {
        return Promise.all([
          this.saveImage(this.data.portraitPath),
          this.saveImage(this.data.landscapePath)
        ])
      })
      .then(() => {
        wx.hideLoading()
        wx.showToast({ title: '已保存到相册', icon: 'success' })
        setTimeout(() => wx.navigateBack(), 1500)
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

  // 检查相册写入权限
  checkAlbumPermission() {
    return new Promise((resolve, reject) => {
      wx.getSetting({
        success: (res) => {
          if (res.authSetting['scope.writePhotosAlbum'] === false) {
            reject('denied')
            return
          }
          wx.authorize({
            scope: 'scope.writePhotosAlbum',
            success: resolve,
            fail: () => reject('denied')
          })
        },
        fail: reject
      })
    })
  },

  // 保存单张图片
  saveImage(path) {
    return new Promise((resolve, reject) => {
      wx.saveImageToPhotosAlbum({
        filePath: path,
        success: resolve,
        fail: reject
      })
    })
  }
})
```

- [ ] **Step 2: 验证 — 真机测试完整流程：拍照 → 预览页可查看两张图 → 点击可全屏预览 → 保存到相册 → 返回拍照页**

---

### Task 9: 整体联调验证

- [ ] **Step 1: 在微信开发者工具中编译，确保 0 报错 0 警告**

- [ ] **Step 2: 真机测试完整流程**
  - 打开小程序，相机正常启动
  - 右上角横屏预览小框可见，可拖动
  - 点击闪光灯按钮可切换状态
  - 按下快门，loading 后跳转预览页
  - 预览页显示竖屏和横屏两张照片
  - 点击单张照片可全屏查看
  - 点击"保存到相册"，系统相册中出现两张照片
  - 保存后自动返回拍照页
  - 点击"返回重拍"回到拍照页

- [ ] **Step 3: 边缘场景**
  - 拒绝相册权限 → 弹出引导弹窗 → 可跳转设置页
  - 小框拖动到屏幕边缘 → 裁剪坐标不越界
  - 小框缩放到最小/最大 → 裁剪结果合理
