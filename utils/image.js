/**
 * 将屏幕上的小框坐标映射为原图上的裁剪像素坐标
 * @param {Object} box - 小框信息 { x, y, width, height } 单位 rpx
 * @param {Object} screen - 图片显示区域尺寸 { width, height } 单位 px，非设备屏幕尺寸
 * @param {Object} image - 图片信息 { width, height } 单位 px
 * @returns {Object} { x, y, width, height } 像素坐标
 */
function mapCropCoords(box, screen, image) {
  if (!box || !screen || !image) {
    throw new TypeError('参数不能为空')
  }
  if (screen.width <= 0 || screen.height <= 0) {
    throw new RangeError('屏幕尺寸必须为正数')
  }
  if (box.width <= 0 || box.height <= 0) {
    throw new RangeError('裁剪框尺寸必须为正数')
  }

  const ratio = 750 / screen.width
  const boxPx = {
    x: Math.max(0, box.x / ratio),
    y: Math.max(0, box.y / ratio),
    width: box.width / ratio,
    height: box.height / ratio
  }

  const scaleX = image.width / screen.width
  const scaleY = image.height / screen.height

  const cropW = Math.min(
    Math.floor(boxPx.width * scaleX),
    image.width - Math.round(boxPx.x * scaleX)
  )
  const cropH = Math.min(
    Math.floor(boxPx.height * scaleY),
    image.height - Math.round(boxPx.y * scaleY)
  )

  return {
    x: Math.round(boxPx.x * scaleX),
    y: Math.round(boxPx.y * scaleY),
    width: Math.max(1, cropW),
    height: Math.max(1, cropH)
  }
}

/**
 * 使用离屏 Canvas 从原图中裁剪出横屏图
 * Canvas 物理像素 = outputSize * dpr（超采样），输出 destWidth/destHeight = CSS 像素，
 * 高 DPR 设备上获得更锐利的缩略图
 * @param {string} srcPath - 竖屏原图临时路径
 * @param {Object} cropRect - 裁剪区域 { x, y, width, height } 像素，必须为正
 * @param {Object} outputSize - 输出尺寸 { width, height } 像素，16:9
 * @returns {Promise<string>} 裁剪后的横屏图临时路径
 */
function cropLandscape(srcPath, cropRect, outputSize) {
  return new Promise((resolve, reject) => {
    if (!srcPath || !cropRect || !outputSize) {
      reject(new TypeError('参数不能为空'))
      return
    }
    if (cropRect.width <= 0 || cropRect.height <= 0
        || outputSize.width <= 0 || outputSize.height <= 0) {
      reject(new RangeError('裁剪区域和输出尺寸必须为正数'))
      return
    }

    const query = wx.createSelectorQuery()
    query.select('#cropCanvas')
      .fields({ node: true, size: true })
      .exec((res) => {
        if (!res || !res[0] || !res[0].node) {
          reject(new Error('Canvas 节点未找到，请在页面放置 <canvas type="2d" id="cropCanvas">'))
          return
        }

        const canvas = res[0].node
        const ctx = canvas.getContext('2d')
        const dpr = wx.getSystemInfoSync().pixelRatio || 1

        canvas.width = outputSize.width * dpr
        canvas.height = outputSize.height * dpr
        ctx.scale(dpr, dpr)

        const img = canvas.createImage()
        img.onload = () => {
          try {
            ctx.drawImage(
              img,
              cropRect.x, cropRect.y, cropRect.width, cropRect.height,
              0, 0, outputSize.width, outputSize.height
            )
          } catch (e) {
            reject(e)
            return
          }

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
        img.onerror = () => reject(new Error('图片加载失败'))
        img.src = srcPath
      })
  })
}

module.exports = {
  mapCropCoords,
  cropLandscape
}
