# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

横竖轴定格 (AxisSnap) — 微信小程序相机工具。竖屏拍照时右上角显示可拖动的横屏预览框，按下快门后通过 Canvas 裁剪同时生成竖屏原图和横屏裁剪图，预览确认后保存到系统相册。

## 开发方式

- 用**微信开发者工具**打开项目根目录，编译运行
- `project.config.json` 中 `appid` 需填写真实 AppID 才能真机调试
- Camera 组件的 `takePhoto` 仅真机可用，开发者工具不支持拍照
- **无自动化测试框架**，验证靠开发者工具编译 + 真机测试

## 架构要点

### 页面导航

```
camera（默认入口） --拍照--> preview --保存/返回--> camera
```

两页面间图片路径通过 `app.globalData.previewImages` 传递（`{ portrait, landscape }`），而非 URL 参数。原因：临时文件路径过长会超微信 `navigateTo` URL 长度限制。预览页 `onLoad` 读取后立即置 `null`。

### 坐标映射 (utils/image.js)

`mapCropCoords(box, screen, image)` 处理混合单位：
- `box.x / box.y` — 来自 `movable-view` 的 `bindchange` 事件，**单位已是 px**
- `box.width / box.height` — 通过 WXML `style="width: {{...}}rpx"` 设置，**单位是 rpx**

函数内只对 width/height 做 rpx→px 转换，x/y 保持不变。修改时注意这个单位差异，否则裁剪位置会偏移。

### Camera 页生命周期

- `onReady` — 创建 `cameraCtx`
- `onShow` — 重置 `loading: false`（用户从预览页返回后可再次拍照）
- `takePhoto` 有防重复点击的 loading 守卫，拍照前检查 `cameraCtx` 是否就绪

### Canvas 裁剪

拍照页的 `<canvas type="2d" id="cropCanvas">` 通过 CSS `position:fixed; top:-9999rpx` 隐藏，仅用于离屏裁剪。`cropLandscape` 使用新版 Canvas 2D API（通过 `node: true` 获取节点），高 DPR 设备上做超采样后输出。

### 权限处理

- 相机权限：`<camera>` 组件自动触发授权，`onCameraError` 兜底
- 相册权限：`checkAlbumPermission()` 三级降级 — 已授权跳过、已拒绝弹引导弹窗、未授权调 `wx.authorize`
