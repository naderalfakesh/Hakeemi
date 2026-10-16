import AppKit
import Foundation

// Renders every raster brand asset from the single vector source
// assets/brand/hakeemi-mark.svg. Run from the repository root on macOS:
//   swift scripts/render-brand-assets.swift

let root = URL(fileURLWithPath: FileManager.default.currentDirectoryPath)
let glyphSource = root.appendingPathComponent("assets/brand/hakeemi-mark.svg")
let imagesDirectory = root.appendingPathComponent("assets/images")

let brandTeal = "#0A6765"
let brandMint = "#72D2CA"
let white = "#FFFFFF"
let deepTeal = "#062421"

// Glyph mark space as a fraction of the tile side; matches BrandMark in the app.
let tileGlyphRatio: CGFloat = 0.78
let tileCornerRatio: CGFloat = 0.22
let tileTiltDegrees: CGFloat = 5

func color(_ hex: String) -> NSColor {
  var value: UInt64 = 0
  Scanner(string: String(hex.dropFirst())).scanHexInt64(&value)
  return NSColor(
    srgbRed: CGFloat((value >> 16) & 0xff) / 255,
    green: CGFloat((value >> 8) & 0xff) / 255,
    blue: CGFloat(value & 0xff) / 255,
    alpha: 1
  )
}

func loadGlyph(tint: String) -> NSImage {
  guard let svg = try? String(contentsOf: glyphSource, encoding: .utf8),
    let data = svg.replacingOccurrences(of: white, with: tint).data(using: .utf8),
    let image = NSImage(data: data)
  else {
    fatalError("Cannot load \(glyphSource.path)")
  }
  return image
}

struct Canvas {
  let rep: NSBitmapImageRep
  let size: CGFloat
  let context: NSGraphicsContext

  init(size: Int) {
    guard
      let rep = NSBitmapImageRep(
        bitmapDataPlanes: nil, pixelsWide: size, pixelsHigh: size, bitsPerSample: 8,
        samplesPerPixel: 4, hasAlpha: true, isPlanar: false, colorSpaceName: .deviceRGB,
        bytesPerRow: 0, bitsPerPixel: 0),
      let context = NSGraphicsContext(bitmapImageRep: rep)
    else {
      fatalError("Cannot create a \(size) px canvas")
    }
    rep.size = NSSize(width: size, height: size)
    self.rep = rep
    self.size = CGFloat(size)
    self.context = context
    context.cgContext.setAllowsAntialiasing(true)
    context.cgContext.interpolationQuality = .high
  }

  func draw(_ body: (CGContext) -> Void) {
    NSGraphicsContext.saveGraphicsState()
    NSGraphicsContext.current = context
    body(context.cgContext)
    NSGraphicsContext.restoreGraphicsState()
  }

  func fill(_ hex: String) {
    draw { cg in
      cg.setFillColor(color(hex).cgColor)
      cg.fill(CGRect(x: 0, y: 0, width: size, height: size))
    }
  }

  // A rounded square centred on the canvas, optionally tilted like the in-app tile.
  func tile(side: CGFloat, hex: String, tiltDegrees: CGFloat) {
    draw { cg in
      cg.saveGState()
      cg.translateBy(x: size / 2, y: size / 2)
      cg.rotate(by: tiltDegrees * .pi / 180)
      let rect = CGRect(x: -side / 2, y: -side / 2, width: side, height: side)
      let path = CGPath(
        roundedRect: rect, cornerWidth: side * tileCornerRatio,
        cornerHeight: side * tileCornerRatio, transform: nil)
      cg.setFillColor(color(hex).cgColor)
      cg.addPath(path)
      cg.fillPath()
      cg.restoreGState()
    }
  }

  // The glyph scaled so its 100-unit mark space spans `markSpace` points.
  func glyph(markSpace: CGFloat, tint: String, tiltDegrees: CGFloat = 0) {
    let image = loadGlyph(tint: tint)
    draw { cg in
      cg.saveGState()
      cg.translateBy(x: size / 2, y: size / 2)
      cg.rotate(by: tiltDegrees * .pi / 180)
      image.draw(
        in: CGRect(x: -markSpace / 2, y: -markSpace / 2, width: markSpace, height: markSpace),
        from: .zero, operation: .sourceOver, fraction: 1)
      cg.restoreGState()
    }
  }

  func write(_ name: String) {
    guard let png = rep.representation(using: .png, properties: [:]) else {
      fatalError("Cannot encode \(name)")
    }
    let url = imagesDirectory.appendingPathComponent(name)
    try! png.write(to: url)
    print("wrote \(name) \(Int(size))x\(Int(size))")
  }
}

func tileAsset(name: String, tileHex: String, glyphHex: String) {
  // 512 px canvas with a 5/6 tile: at splash imageWidth 96 dp the tile is 80 dp,
  // the size BrandMark uses on the launch gate so the hand-off lines up.
  let canvas = Canvas(size: 512)
  let side = canvas.size * 5 / 6
  canvas.tile(side: side, hex: tileHex, tiltDegrees: tileTiltDegrees)
  canvas.glyph(markSpace: side * tileGlyphRatio, tint: glyphHex, tiltDegrees: tileTiltDegrees)
  canvas.write(name)
}

// App icon (iOS legacy slot, stores, web): full-bleed teal, platform masks the corners.
let icon = Canvas(size: 1024)
icon.fill(brandTeal)
icon.glyph(markSpace: icon.size * 0.72, tint: white)
icon.write("icon.png")

// Android adaptive icon layers; the glyph stays inside the 66 % safe zone.
let foreground = Canvas(size: 512)
foreground.glyph(markSpace: foreground.size * 0.66, tint: white)
foreground.write("android-icon-foreground.png")
foreground.write("android-icon-monochrome.png")

let background = Canvas(size: 512)
background.fill(brandTeal)
background.write("android-icon-background.png")

// Native splash marks, light and dark, identical to the in-app BrandMark tile.
tileAsset(name: "splash-icon.png", tileHex: brandTeal, glyphHex: white)
tileAsset(name: "splash-icon-dark.png", tileHex: brandMint, glyphHex: deepTeal)

// In-app glyph, tinted at runtime by BrandMark.
let runtimeGlyph = Canvas(size: 256)
runtimeGlyph.glyph(markSpace: runtimeGlyph.size, tint: white)
runtimeGlyph.write("brand-glyph.png")

// Web favicon: a straight tile on a transparent canvas.
let favicon = Canvas(size: 48)
favicon.tile(side: favicon.size, hex: brandTeal, tiltDegrees: 0)
favicon.glyph(markSpace: favicon.size * 0.72, tint: white)
favicon.write("favicon.png")
