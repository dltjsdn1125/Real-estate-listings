/**
 * PWA 아이콘 생성 스크립트
 * 
 * 사용법:
 * 1. /public/icon-source.png (512x512) 파일 준비
 * 2. npm install sharp
 * 3. node scripts/generate-icons.js
 */

const sharp = require('sharp')
const fs = require('fs')
const path = require('path')

const sizes = [72, 96, 128, 144, 152, 192, 384, 512]
const sourcePath = path.join(__dirname, '../public/icon-source.png')
const outputDir = path.join(__dirname, '../public/icons')

// icons 디렉토리 생성
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true })
}

// 아이콘 생성
async function generateIcons() {
  if (!fs.existsSync(sourcePath)) {
    console.error('❌ icon-source.png 파일을 /public/ 폴더에 준비해주세요.')
    console.log('📝 icon-source.png는 512x512 크기의 PNG 파일이어야 합니다.')
    return
  }

  console.log('🎨 아이콘 생성 중...')

  for (const size of sizes) {
    try {
      await sharp(sourcePath)
        .resize(size, size)
        .png()
        .toFile(path.join(outputDir, `icon-${size}x${size}.png`))
      
      console.log(`✅ icon-${size}x${size}.png 생성 완료`)
    } catch (error) {
      console.error(`❌ icon-${size}x${size}.png 생성 실패:`, error)
    }
  }

  console.log('\n✨ 모든 아이콘 생성 완료!')
  console.log(`📁 출력 경로: ${outputDir}`)
}

generateIcons()

