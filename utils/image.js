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
