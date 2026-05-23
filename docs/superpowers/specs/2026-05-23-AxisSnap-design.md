# 横竖轴定格 (AxisSnap) — 设计文档

**日期：** 2026-05-23  
**版本：** v1.0  
**类型：** 微信小程序

---

## 1. 项目概述

一款微信小程序相机工具。竖屏拍照时，右上角提供可拖动的横屏预览小框，按下快门后同时生成并保存一张竖屏原图和一张横屏裁剪图到系统相册。

## 2. 技术选型

| 决策 | 选择 |
|------|------|
| 开发框架 | 原生微信小程序（WXML/WXSS/JS） |
| 横屏照片生成 | Camera 组件 + 离屏 Canvas 前端裁剪 |
| 拍照流程 | 预览确认后保存 |
| UI 风格 | 深色相机风格 |

## 3. 页面结构

```
pages/
  camera/          — 拍照主页（默认入口）
  preview/         — 预览确认页
```

### 3.1 导航流程

```
[camera 拍照页]  ——按下快门——>  [preview 预览页]
     ^                                |
     |______ 点击"重拍" ______________|
                                         
                                 点击"保存"
                                      |
                              保存到系统相册（2张）
                                      |
                              返回 camera 页
```

## 4. 拍照页设计

### 4.1 布局

```
┌──────────────────────────┐
│                          │
│     camera 全屏取景      │
│                          │
│              ┌──────┐    │  ← 右上角横屏预览小框
│              │ 横屏  │    │     16:9 比例 movable-view
│              │ 预览  │    │     可拖动、可缩放
│              └──────┘    │
│                          │
│                    [⚡]  │  ← 闪光灯切换按钮
│              ┌──────┐    │
│              │  ⭕   │    │  ← 快门按钮 (120rpx)
│              └──────┘    │
│                          │
└──────────────────────────┘
```

### 4.2 关键元素

| 元素 | 说明 |
|------|------|
| Camera 组件 | 全屏竖屏取景，mode="normal"，分辨率 high |
| 横屏预览框 | `movable-view`，默认右上角，宽约 200rpx，16:9 比例，半透明边框 |
| 快门按钮 | 底部居中，白色圆环+实心圆，120rpx |
| 闪光灯按钮 | 底部右侧，切换 auto/on/off |

### 4.3 小框交互

- 拖动改变位置（movable-view 原生支持）
- 双指缩放改变小框大小
- 小框位置/大小实时映射为裁剪参数

## 5. 预览页设计

### 5.1 布局

```
┌──────────────────────────┐
│     ← 返回重拍            │
│                          │
│   ┌────────────────┐     │
│   │   竖屏照片      │     │  ← 竖屏原图 (3:4)
│   └────────────────┘     │
│   ┌──────────────┐       │
│   │  横屏照片     │       │  ← 横屏裁剪图 (16:9)
│   └──────────────┘       │
│                          │
│     [    保存到相册    ]  │  ← 主按钮
│                          │
└──────────────────────────┘
```

### 5.2 交互

- 点击"返回"箭头 → 回到拍照页重拍
- 点击任一张照片 → 全屏预览（wx.previewImage）
- 点击"保存到相册" → 分别保存两张图 → 提示成功 → 自动返回拍照页

## 6. 数据处理流程

```
用户按下快门
     │
     ▼
CameraContext.takePhoto({ quality: 'high' })
     │
     ▼
拿到竖屏原图 tempFilePath + 原图尺寸
     │
     ▼
读取小框在屏幕上的位置信息 (left, top, width, height)
     │
     ▼
坐标映射：
  cropX = left × (imgWidth / screenWidth)
  cropY = top × (imgHeight / screenHeight)
  cropW = width × (imgWidth / screenWidth)
  cropH = height × (imgHeight / screenHeight)
     │
     ▼
离屏 Canvas 裁剪 (type="2d")
  ctx.drawImage(tempFilePath, cropX, cropY, cropW, cropH, 0, 0, canvasW, canvasH)
     │
     ▼
Canvas.toTempFilePath() → 横屏图 tempFilePath
     │
     ▼
wx.navigateTo('/pages/preview/preview?portrait=<path>&landscape=<path>')
     │
     ▼
用户确认保存
     │
     ▼
Promise.all([
  wx.saveImageToPhotosAlbum(portraitPath),
  wx.saveImageToPhotosAlbum(landscapePath),
])
     ├─ 需要先 wx.getSetting 检查相册权限
     └─ 如无权限则 wx.authorize 申请
     │
     ▼
wx.showToast('已保存到相册') → wx.navigateBack()
```

## 7. 权限处理

| 权限 | 用途 | 处理 |
|------|------|------|
| camera | 拍照取景 | camera 组件自动申请 |
| writePhotosAlbum | 保存到相册 | 保存前检查，无权限则引导设置页 |

## 8. 项目结构

```
AxisSnap/
├── app.json
├── app.js
├── app.wxss
├── project.config.json
├── sitemap.json
├── pages/
│   ├── camera/
│   │   ├── camera.wxml
│   │   ├── camera.wxss
│   │   ├── camera.js
│   │   └── camera.json
│   └── preview/
│       ├── preview.wxml
│       ├── preview.wxss
│       ├── preview.js
│       └── preview.json
├── utils/
│   └── image.js          — 图片裁剪、坐标映射工具函数
└── docs/
    └── superpowers/
        └── specs/
            └── 2026-05-23-AxisSnap-design.md
```

## 9. 未纳入 v1 的内容

以下功能在本次不做，后续版本再考虑：

- 修图功能（滤镜、调色、美颜）
- 拍照倒计时
- 前后摄像头切换（v1 默认后置）
- 照片列表/历史记录
- 分享功能
