const fileDom = document.querySelector('.file')
const processDom = document.querySelector('.process')
const body = document.querySelector('body')
const canvas = document.querySelector('#canvas')
const context = canvas.getContext('2d')
const img = new Image()
let index = 1

fileDom.addEventListener('change', handleFiles, false)
processDom.addEventListener('change', handleProcess, false)

function handleFiles() {
  const file = fileDom.files[0]
  const url = URL.createObjectURL(file)
  
  img.src = url
  img.onload = () => {
    const width = img.width
    const height = img.height
    canvas.width = width
    canvas.height = height
    fileDom.style.width = width + 'px'
    fileDom.style.height = height + 'px'

    let timer = setInterval(() => {
      index++
      if (index > 15) {
        clearInterval(timer)
        timer = null
      }
      mosaic(img, index)
    }, 1000)
    

    URL.revokeObjectURL(url)
  }
}

function mosaic (img, size) {
  const width = img.width
  const height = img.height

  context.drawImage(img, 0, 0, width, height)
  const imageData = context.getImageData(0, 0, width, height)
  const pixels = imageData.data

  for (let x = 1; x < imageData.width / size; x++) {
    for (let y = 1; y < imageData.height / size; y++) {
      const tx = (size * x) - (size / 2)
      const ty = (size * y) - (size / 2)
      const pos = (Math.floor(ty - 1) * imageData.width * 4) + (Math.floor(tx -1) * 4)
      const red = pixels[pos]
      const green = pixels[pos+1]
      const blue = pixels[pos+2]

      context.fillStyle = `rgb(${red}, ${green}, ${blue})`
      context.fillRect(tx, ty, size, size)
    }
  }
}

function handleProcess() {
  const val = (processDom.value / 100) * 10  + 5
  mosaic(img, val)
}
