from __future__ import annotations

import math
import random
from dataclasses import dataclass
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageEnhance, ImageFilter, ImageFont


ROOT = Path(r"E:\炖时光")
MINI_ROOT = ROOT / "miniprogram"
SEASONAL_DIR = MINI_ROOT / "assets" / "seasonal"
LEGACY_SEASONAL_DIR = ROOT / "assets" / "seasonal"
FOOD_DIR = MINI_ROOT / "assets" / "images"
OUT_SIZE = (1500, 800)

BRAND_FONT = Path(r"C:\Windows\Fonts\STXINGKA.TTF")
TERM_FONT = Path(r"C:\Windows\Fonts\msyhbd.ttc")
DECOR_FONT = Path(r"C:\Windows\Fonts\STKAITI.TTF")


@dataclass(frozen=True)
class TermSpec:
    key: str
    name: str
    motif: str
    palette: tuple[str, str, str]
    dish_index: int


TERMS: list[TermSpec] = [
    TermSpec("lichun", "立春", "sprout", ("#d6c17d", "#628d52", "#93bf62"), 0),
    TermSpec("yushui", "雨水", "rain", ("#7e857d", "#5d7f73", "#9fc0bf"), 1),
    TermSpec("jingzhe", "惊蛰", "blossom", ("#b88973", "#745c57", "#efc5b0"), 2),
    TermSpec("chunfen", "春分", "willow", ("#91a868", "#607753", "#d9dfb3"), 3),
    TermSpec("qingming", "清明", "mugwort", ("#7b8f64", "#4c6148", "#d0d7b7"), 4),
    TermSpec("guyu", "谷雨", "wheat", ("#9d7b4b", "#617f59", "#dac98f"), 5),
    TermSpec("lixia", "立夏", "lotus", ("#6f8d67", "#8ba888", "#d6d6b0"), 6),
    TermSpec("xiaoman", "小满", "cherry", ("#9b704f", "#7c9d4f", "#dfb66c"), 7),
    TermSpec("mangzhong", "芒种", "grain", ("#8f7d4e", "#667b58", "#d9bf73"), 8),
    TermSpec("xiazhi", "夏至", "summer", ("#6d8269", "#4f6c62", "#e8d58f"), 9),
    TermSpec("xiaoshu", "小暑", "lotus_pod", ("#798c74", "#5e7564", "#e5c37f"), 0),
    TermSpec("dashu", "大暑", "mung", ("#6c8657", "#506341", "#d1b66e"), 1),
    TermSpec("liqiu", "立秋", "ginkgo", ("#8f714d", "#6f7b51", "#d9b56a"), 2),
    TermSpec("chushu", "处暑", "grape", ("#7b6173", "#87624f", "#d4ab76"), 3),
    TermSpec("bailu", "白露", "dew", ("#718d8d", "#5b6d7c", "#d7e4da"), 4),
    TermSpec("qiufen", "秋分", "moon", ("#967653", "#707256", "#f0d89a"), 5),
    TermSpec("hanlu", "寒露", "persimmon", ("#915b3d", "#6f584f", "#edb16f"), 6),
    TermSpec("shuangjiang", "霜降", "hawthorn", ("#7e5348", "#84605a", "#d89a73"), 7),
    TermSpec("lidong", "立冬", "pine", ("#5f6657", "#7e6d51", "#d8b893"), 8),
    TermSpec("xiaoxue", "小雪", "snowberry", ("#7b726d", "#8b634d", "#ede8dc"), 9),
    TermSpec("daxue", "大雪", "plum_snow", ("#5e6870", "#8d6b5d", "#f0ece4"), 0),
    TermSpec("dongzhi", "冬至", "stove", ("#6e5d54", "#8e684a", "#e8c38a"), 1),
    TermSpec("xiaohan", "小寒", "tea_plum", ("#696763", "#886452", "#efe2d7"), 2),
    TermSpec("dahan", "大寒", "wintersweet", ("#675e57", "#7b5e4f", "#f3dfaa"), 3),
]


def hex_rgba(value: str, alpha: int = 255) -> tuple[int, int, int, int]:
    value = value.lstrip("#")
    return tuple(int(value[i : i + 2], 16) for i in (0, 2, 4)) + (alpha,)


def pick_font(path: Path, size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(str(path), size=size)


def cover(image: Image.Image, size: tuple[int, int]) -> Image.Image:
    src_w, src_h = image.size
    dst_w, dst_h = size
    src_ratio = src_w / src_h
    dst_ratio = dst_w / dst_h

    if src_ratio > dst_ratio:
        new_h = dst_h
        new_w = int(new_h * src_ratio)
    else:
        new_w = dst_w
        new_h = int(new_w / src_ratio)

    resized = image.resize((new_w, new_h), Image.Resampling.LANCZOS)
    left = (new_w - dst_w) // 2
    top = (new_h - dst_h) // 2
    return resized.crop((left, top, left + dst_w, top + dst_h))


def make_gradient(size: tuple[int, int], start: tuple[int, int, int], end: tuple[int, int, int], horizontal: bool = False) -> Image.Image:
    width, height = size
    layer = Image.new("RGBA", size)
    draw = ImageDraw.Draw(layer)
    length = width if horizontal else height

    for i in range(length):
      ratio = i / max(1, length - 1)
      color = tuple(int(start[idx] * (1 - ratio) + end[idx] * ratio) for idx in range(3)) + (255,)
      if horizontal:
          draw.line((i, 0, i, height), fill=color)
      else:
          draw.line((0, i, width, i), fill=color)

    return layer


def add_paper_texture(base: Image.Image) -> None:
    width, height = base.size
    random.seed(20260628)
    noise = Image.effect_noise((width, height), 18).convert("L")
    texture = Image.new("RGBA", (width, height), (255, 248, 240, 0))
    texture.putalpha(noise.point(lambda p: int(p * 0.16)))
    base.alpha_composite(texture)


def paint_blobs(base: Image.Image, palette: tuple[str, str, str]) -> None:
    width, height = base.size
    blob_layer = Image.new("RGBA", base.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(blob_layer)
    colors = [hex_rgba(palette[0], 86), hex_rgba(palette[1], 70), hex_rgba(palette[2], 84)]
    shapes = [
        (-60, 40, 560, 460, colors[0]),
        (910, -120, 1540, 360, colors[2]),
        (880, 420, 1560, 930, colors[1]),
        (260, 510, 760, 940, colors[1]),
    ]
    for left, top, right, bottom, color in shapes:
        draw.ellipse((left, top, right, bottom), fill=color)
    softened = blob_layer.filter(ImageFilter.GaussianBlur(32))
    base.alpha_composite(softened)


def draw_brush_arc(draw: ImageDraw.ImageDraw, box: tuple[int, int, int, int], color: tuple[int, int, int, int], width: int, start: int, end: int) -> None:
    draw.arc(box, start=start, end=end, fill=color, width=width)


def draw_sprout(draw: ImageDraw.ImageDraw, x: int, y: int, scale: float, color: tuple[int, int, int, int]) -> None:
    stem = int(70 * scale)
    draw.line((x, y, x, y - stem), fill=color, width=max(3, int(6 * scale)))
    leaf_color = color[:3] + (min(255, color[3] + 15),)
    draw.ellipse((x - 54 * scale, y - stem - 16 * scale, x - 2 * scale, y - stem + 36 * scale), fill=leaf_color)
    draw.ellipse((x + 2 * scale, y - stem - 30 * scale, x + 60 * scale, y - stem + 24 * scale), fill=leaf_color)


def draw_raindrops(draw: ImageDraw.ImageDraw, points: list[tuple[int, int]], scale: float, color: tuple[int, int, int, int]) -> None:
    for x, y in points:
        size = int(20 * scale)
        draw.polygon([(x, y - size), (x - size // 2, y + size // 3), (x, y + size), (x + size // 2, y + size // 3)], fill=color)
        draw.ellipse((x - size // 2, y - size // 2, x + size // 2, y + size // 2), fill=color)


def draw_flower(draw: ImageDraw.ImageDraw, x: int, y: int, scale: float, petal: tuple[int, int, int, int], core: tuple[int, int, int, int]) -> None:
    radius = int(16 * scale)
    offset = int(18 * scale)
    for dx, dy in [(-offset, 0), (offset, 0), (0, -offset), (0, offset), (-offset // 2, -offset // 2)]:
        draw.ellipse((x + dx - radius, y + dy - radius, x + dx + radius, y + dy + radius), fill=petal)
    draw.ellipse((x - radius, y - radius, x + radius, y + radius), fill=core)


def draw_branch_leaves(draw: ImageDraw.ImageDraw, x: int, y: int, scale: float, color: tuple[int, int, int, int]) -> None:
    branch = color[:3] + (140,)
    draw.line((x, y, x + 220 * scale, y - 120 * scale), fill=branch, width=max(3, int(7 * scale)))
    for idx in range(6):
        px = x + (40 + idx * 32) * scale
        py = y - (16 + idx * 18) * scale
        draw.ellipse((px - 40 * scale, py - 18 * scale, px + 14 * scale, py + 18 * scale), fill=color)


def draw_wheat(draw: ImageDraw.ImageDraw, x: int, y: int, scale: float, color: tuple[int, int, int, int]) -> None:
    for shift in [0, 34, 68]:
        sx = x + shift * scale
        draw.line((sx, y, sx + 18 * scale, y - 220 * scale), fill=color, width=max(3, int(5 * scale)))
        for idx in range(6):
            py = y - (42 + idx * 28) * scale
            draw.ellipse((sx - 20 * scale, py - 8 * scale, sx + 10 * scale, py + 8 * scale), fill=color)
            draw.ellipse((sx + 6 * scale, py - 10 * scale, sx + 28 * scale, py + 10 * scale), fill=color)


def draw_lotus_leaf(draw: ImageDraw.ImageDraw, x: int, y: int, scale: float, color: tuple[int, int, int, int]) -> None:
    draw.ellipse((x - 130 * scale, y - 70 * scale, x + 130 * scale, y + 70 * scale), fill=color)
    vein = color[:3] + (200,)
    draw.line((x, y + 72 * scale, x, y - 70 * scale), fill=vein, width=max(3, int(4 * scale)))
    for angle in range(-60, 61, 30):
        rad = math.radians(angle)
        draw.line((x, y, x + math.cos(rad) * 110 * scale, y - math.sin(rad) * 58 * scale), fill=vein, width=max(2, int(3 * scale)))


def draw_berries(draw: ImageDraw.ImageDraw, x: int, y: int, scale: float, berry: tuple[int, int, int, int], stem: tuple[int, int, int, int]) -> None:
    draw.line((x, y, x + 86 * scale, y - 90 * scale), fill=stem, width=max(3, int(5 * scale)))
    for idx, (dx, dy) in enumerate([(0, 0), (30, -18), (62, -34), (42, -72), (88, -56)]):
        r = int((18 + (idx % 2) * 3) * scale)
        cx = x + dx * scale
        cy = y + dy * scale
        draw.ellipse((cx - r, cy - r, cx + r, cy + r), fill=berry)


def draw_grapes(draw: ImageDraw.ImageDraw, x: int, y: int, scale: float, grape: tuple[int, int, int, int], stem: tuple[int, int, int, int]) -> None:
    draw.line((x, y, x + 60 * scale, y - 120 * scale), fill=stem, width=max(3, int(5 * scale)))
    radius = int(18 * scale)
    offsets = [(0, 0), (22, -20), (46, -5), (10, -38), (34, -45), (58, -30), (20, -68), (42, -70), (34, -96)]
    for dx, dy in offsets:
        cx = x + dx * scale
        cy = y + dy * scale
        draw.ellipse((cx - radius, cy - radius, cx + radius, cy + radius), fill=grape)


def draw_ginkgo(draw: ImageDraw.ImageDraw, x: int, y: int, scale: float, color: tuple[int, int, int, int]) -> None:
    pts = [
        (x, y),
        (x - 90 * scale, y - 30 * scale),
        (x - 56 * scale, y - 112 * scale),
        (x, y - 150 * scale),
        (x + 56 * scale, y - 112 * scale),
        (x + 90 * scale, y - 30 * scale),
    ]
    draw.polygon(pts, fill=color)
    draw.line((x, y + 60 * scale, x, y - 50 * scale), fill=color[:3] + (180,), width=max(3, int(5 * scale)))


def draw_moon(draw: ImageDraw.ImageDraw, x: int, y: int, scale: float, color: tuple[int, int, int, int]) -> None:
    size = int(120 * scale)
    draw.ellipse((x - size, y - size, x + size, y + size), fill=color)
    mask = Image.new("L", (size * 2 + 1, size * 2 + 1), 0)
    md = ImageDraw.Draw(mask)
    md.ellipse((0, 0, size * 2, size * 2), fill=255)
    md.ellipse((int(size * 0.4), 0, int(size * 2.2), int(size * 2)), fill=0)


def draw_persimmon(draw: ImageDraw.ImageDraw, x: int, y: int, scale: float, fruit: tuple[int, int, int, int], leaf: tuple[int, int, int, int]) -> None:
    draw.ellipse((x - 38 * scale, y - 30 * scale, x + 38 * scale, y + 30 * scale), fill=fruit)
    draw.rectangle((x - 8 * scale, y - 44 * scale, x + 8 * scale, y - 22 * scale), fill=leaf)
    for dx, dy in [(-18, -26), (18, -26), (-8, -42), (8, -42)]:
        draw.polygon([(x + dx * scale, y + dy * scale), (x + (dx - 10) * scale, y + (dy - 12) * scale), (x + (dx + 10) * scale, y + (dy - 10) * scale)], fill=leaf)


def draw_pine(draw: ImageDraw.ImageDraw, x: int, y: int, scale: float, needle: tuple[int, int, int, int], cone: tuple[int, int, int, int]) -> None:
    for idx in range(4):
        draw.line((x, y - idx * 28 * scale, x + 200 * scale, y - 80 * scale - idx * 18 * scale), fill=needle, width=max(3, int(4 * scale)))
        draw.line((x + 36 * scale, y - idx * 20 * scale, x + 184 * scale, y + 28 * scale - idx * 10 * scale), fill=needle, width=max(3, int(4 * scale)))
    draw.ellipse((x + 130 * scale, y - 18 * scale, x + 182 * scale, y + 62 * scale), fill=cone)


def draw_snow_dots(draw: ImageDraw.ImageDraw, points: list[tuple[int, int]], scale: float, color: tuple[int, int, int, int]) -> None:
    radius = int(5 * scale)
    for x, y in points:
        draw.ellipse((x - radius, y - radius, x + radius, y + radius), fill=color)
        draw.line((x - 10 * scale, y, x + 10 * scale, y), fill=color, width=max(1, int(2 * scale)))
        draw.line((x, y - 10 * scale, x, y + 10 * scale), fill=color, width=max(1, int(2 * scale)))


def draw_winter_stove(draw: ImageDraw.ImageDraw, x: int, y: int, scale: float, color: tuple[int, int, int, int]) -> None:
    draw.rounded_rectangle((x, y, x + 220 * scale, y + 120 * scale), radius=int(22 * scale), fill=color)
    draw.ellipse((x + 32 * scale, y + 32 * scale, x + 82 * scale, y + 82 * scale), fill=(255, 215, 148, 180))
    for shift in [0, 32, 66]:
        draw.arc((x + 116 * scale + shift * 0.4, y - 48 * scale + shift * 0.2, x + 166 * scale + shift * 0.4, y + 18 * scale + shift * 0.2), start=180, end=320, fill=(255, 245, 230, 190), width=max(2, int(4 * scale)))


def apply_motif(draw: ImageDraw.ImageDraw, spec: TermSpec, width: int, height: int) -> None:
    primary = hex_rgba(spec.palette[2], 160)
    secondary = hex_rgba(spec.palette[0], 138)
    dark = hex_rgba(spec.palette[1], 180)

    if spec.motif == "sprout":
        draw_sprout(draw, 1120, 640, 1.5, primary)
        draw_branch_leaves(draw, 1010, 290, 1.0, secondary)
    elif spec.motif == "rain":
        draw_branch_leaves(draw, 970, 260, 0.85, secondary)
        draw_raindrops(draw, [(1150, 250), (1210, 340), (1270, 220), (1330, 320), (1390, 250)], 1.4, primary)
    elif spec.motif == "blossom":
        draw_branch_leaves(draw, 980, 420, 0.9, dark)
        for point in [(1120, 270), (1240, 220), (1360, 300), (1270, 360)]:
            draw_flower(draw, point[0], point[1], 1.4, primary, secondary)
    elif spec.motif == "willow":
        draw_branch_leaves(draw, 980, 230, 1.2, primary)
        draw_branch_leaves(draw, 1120, 250, 1.0, secondary)
    elif spec.motif == "mugwort":
        for offset in [1020, 1170, 1310]:
            draw_sprout(draw, offset, 650, 1.2, primary)
    elif spec.motif in {"wheat", "grain"}:
        draw_wheat(draw, 1100, 650, 1.0, primary)
    elif spec.motif == "lotus":
        draw_lotus_leaf(draw, 1220, 260, 1.0, primary)
        draw_lotus_leaf(draw, 1350, 410, 0.82, secondary)
    elif spec.motif == "cherry":
        draw_berries(draw, 1120, 620, 1.0, primary, dark)
        draw_wheat(draw, 1250, 650, 0.8, secondary)
    elif spec.motif == "summer":
        draw_lotus_leaf(draw, 1180, 250, 0.95, secondary)
        draw_persimmon(draw, 1360, 560, 1.1, primary, dark)
        draw_raindrops(draw, [(1250, 190), (1330, 150)], 1.0, (255, 245, 214, 110))
    elif spec.motif == "lotus_pod":
        draw_lotus_leaf(draw, 1180, 260, 0.92, secondary)
        for cx, cy in [(1330, 290), (1380, 360)]:
            draw.ellipse((cx - 44, cy - 44, cx + 44, cy + 44), fill=primary)
            for dx, dy in [(-12, -12), (12, -12), (-6, 8), (18, 10)]:
                draw.ellipse((cx + dx - 8, cy + dy - 8, cx + dx + 8, cy + dy + 8), fill=(90, 96, 60, 180))
    elif spec.motif == "mung":
        for idx in range(14):
            cx = 1120 + (idx % 4) * 54
            cy = 420 + (idx // 4) * 54
            draw.ellipse((cx - 22, cy - 18, cx + 22, cy + 18), fill=primary)
    elif spec.motif == "ginkgo":
        draw_ginkgo(draw, 1230, 620, 1.1, primary)
        draw_ginkgo(draw, 1360, 500, 0.85, secondary)
    elif spec.motif == "grape":
        draw_grapes(draw, 1140, 640, 1.1, primary, dark)
    elif spec.motif == "dew":
        draw_branch_leaves(draw, 980, 260, 0.9, secondary)
        draw_raindrops(draw, [(1200, 260), (1310, 220), (1410, 310)], 1.15, primary)
    elif spec.motif == "moon":
        draw.ellipse((1160, 150, 1400, 390), fill=hex_rgba(spec.palette[2], 95))
        draw_branch_leaves(draw, 1030, 520, 0.9, secondary)
        for point in [(1340, 180), (1290, 220), (1380, 240), (1230, 250)]:
            draw_flower(draw, point[0], point[1], 1.0, primary, secondary)
    elif spec.motif == "persimmon":
        for point in [(1160, 520), (1260, 440), (1360, 560)]:
            draw_persimmon(draw, point[0], point[1], 1.2, primary, secondary)
    elif spec.motif == "hawthorn":
        draw_berries(draw, 1160, 640, 1.2, primary, secondary)
        draw_snow_dots(draw, [(1240, 260), (1330, 220), (1410, 300)], 1.1, (255, 255, 255, 140))
    elif spec.motif == "pine":
        draw_pine(draw, 1040, 410, 1.0, secondary, primary)
    elif spec.motif == "snowberry":
        draw_berries(draw, 1140, 650, 1.0, primary, secondary)
        draw_snow_dots(draw, [(1200, 190), (1310, 150), (1420, 250), (1370, 340)], 1.2, (255, 255, 255, 150))
    elif spec.motif == "plum_snow":
        draw_branch_leaves(draw, 980, 450, 0.7, dark)
        for point in [(1150, 260), (1280, 200), (1380, 290)]:
            draw_flower(draw, point[0], point[1], 1.25, primary, secondary)
        draw_snow_dots(draw, [(1220, 160), (1330, 140), (1410, 200), (1290, 320)], 1.15, (255, 255, 255, 160))
    elif spec.motif == "stove":
        draw_winter_stove(draw, 1080, 470, 1.0, dark)
        draw_branch_leaves(draw, 1060, 260, 0.7, secondary)
    elif spec.motif == "tea_plum":
        draw_flower(draw, 1200, 220, 1.2, primary, secondary)
        draw_flower(draw, 1330, 300, 1.0, primary, secondary)
        draw_branch_leaves(draw, 1030, 470, 0.8, dark)
        draw_raindrops(draw, [(1280, 500), (1380, 450)], 0.8, (255, 245, 230, 100))
    elif spec.motif == "wintersweet":
        draw_branch_leaves(draw, 1020, 460, 0.75, dark)
        for point in [(1180, 250), (1270, 220), (1360, 280), (1410, 360)]:
            draw_flower(draw, point[0], point[1], 1.05, primary, secondary)


def add_food_panel(canvas: Image.Image, photo_path: Path, palette: tuple[str, str, str]) -> None:
    panel = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(panel)
    x, y, w, h = 900, 130, 470, 520
    shadow_color = hex_rgba("#2f1a10", 80)
    draw.rounded_rectangle((x + 16, y + 22, x + w + 16, y + h + 22), radius=42, fill=shadow_color)

    photo = Image.open(photo_path).convert("RGB")
    photo = cover(photo, (w, h))
    photo = ImageEnhance.Color(photo).enhance(1.08)
    photo = ImageEnhance.Contrast(photo).enhance(1.04)
    photo = photo.filter(ImageFilter.GaussianBlur(0.3))
    photo_rgba = photo.convert("RGBA")

    mask = Image.new("L", (w, h), 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, w, h), radius=42, fill=255)
    photo_rgba.putalpha(mask)
    panel.alpha_composite(photo_rgba, (x, y))

    border = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    bd = ImageDraw.Draw(border)
    bd.rounded_rectangle((x - 2, y - 2, x + w + 2, y + h + 2), radius=44, outline=hex_rgba("#fff8ef", 210), width=4)
    accent = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    ad = ImageDraw.Draw(accent)
    ad.arc((x - 16, y - 12, x + 250, y + 190), start=160, end=308, fill=hex_rgba(palette[2], 178), width=6)
    ad.arc((x + 160, y + h - 118, x + w + 22, y + h + 46), start=12, end=162, fill=hex_rgba(palette[0], 160), width=6)

    canvas.alpha_composite(panel)
    canvas.alpha_composite(border)
    canvas.alpha_composite(accent)


def draw_text_block(canvas: Image.Image, spec: TermSpec) -> None:
    brand_font = pick_font(BRAND_FONT, 112)
    term_font = pick_font(TERM_FONT, 34)
    decor_font = pick_font(DECOR_FONT, 58)
    layer = Image.new("RGBA", canvas.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)

    panel_box = (88, 458, 760, 720)
    draw.rounded_rectangle(panel_box, radius=38, fill=(26, 16, 11, 120))
    draw.rounded_rectangle((88, 458, 760, 720), radius=38, outline=(255, 244, 232, 42), width=2)

    shadow = (18, 10, 6, 168)
    white = (255, 249, 241, 255)
    term_color = (255, 244, 228, 205)
    faint = (255, 241, 226, 54)

    draw.text((126, 508), "炖时光", font=brand_font, fill=shadow)
    draw.text((118, 496), "炖时光", font=brand_font, fill=white)

    draw.text((124, 638), spec.name, font=decor_font, fill=faint)
    term_w = draw.textbbox((0, 0), spec.name, font=term_font)[2]
    draw.text((1360 - term_w, 88), spec.name, font=term_font, fill=(24, 16, 10, 120))
    draw.text((1352 - term_w, 80), spec.name, font=term_font, fill=term_color)

    canvas.alpha_composite(layer)


def build_banner(spec: TermSpec, base_photo: Path, dish_photo: Path) -> Image.Image:
    background = Image.open(base_photo).convert("RGB")
    background = cover(background, OUT_SIZE)
    background = ImageEnhance.Color(background).enhance(0.82)
    background = ImageEnhance.Contrast(background).enhance(1.06)
    background = ImageEnhance.Brightness(background).enhance(0.92)
    background = background.filter(ImageFilter.GaussianBlur(4.8))
    canvas = background.convert("RGBA")

    warm_top = make_gradient(OUT_SIZE, hex_rgba(spec.palette[0])[:3], hex_rgba(spec.palette[1])[:3], horizontal=True)
    warm_top.putalpha(138)
    warm_bottom = make_gradient(OUT_SIZE, (25, 15, 9), hex_rgba(spec.palette[1])[:3], horizontal=False)
    warm_bottom.putalpha(118)
    vignette = Image.new("RGBA", OUT_SIZE, (0, 0, 0, 0))
    vd = ImageDraw.Draw(vignette)
    vd.rectangle((0, 0, OUT_SIZE[0], OUT_SIZE[1]), fill=(12, 7, 5, 0))
    vd.ellipse((-120, -80, 920, 1020), fill=(255, 245, 234, 28))
    vd.ellipse((720, -260, 1700, 820), fill=(255, 240, 220, 22))
    vignette = vignette.filter(ImageFilter.GaussianBlur(48))

    canvas.alpha_composite(warm_top)
    canvas.alpha_composite(warm_bottom)
    paint_blobs(canvas, spec.palette)
    canvas.alpha_composite(vignette)
    add_paper_texture(canvas)

    motif_layer = Image.new("RGBA", OUT_SIZE, (0, 0, 0, 0))
    motif_draw = ImageDraw.Draw(motif_layer)
    apply_motif(motif_draw, spec, *OUT_SIZE)
    motif_layer = motif_layer.filter(ImageFilter.GaussianBlur(0.4))
    canvas.alpha_composite(motif_layer)

    add_food_panel(canvas, dish_photo, spec.palette)

    steam = Image.new("RGBA", OUT_SIZE, (0, 0, 0, 0))
    sd = ImageDraw.Draw(steam)
    for idx in range(3):
        left = 975 + idx * 56
        sd.arc((left, 86 - idx * 6, left + 80, 220), start=180, end=320, fill=(255, 248, 236, 118), width=5)
    steam = steam.filter(ImageFilter.GaussianBlur(3))
    canvas.alpha_composite(steam)

    draw_text_block(canvas, spec)
    final = canvas.convert("RGB")
    return final


def main() -> None:
    SEASONAL_DIR.mkdir(parents=True, exist_ok=True)
    LEGACY_SEASONAL_DIR.mkdir(parents=True, exist_ok=True)

    dish_images = sorted([path for path in FOOD_DIR.glob("dish-*.jpg")])
    if not dish_images:
        raise SystemExit("No dish images found.")

    for spec in TERMS:
        base_photo = SEASONAL_DIR / f"{spec.key}.jpg"
        if not base_photo.exists():
            base_photo = dish_images[spec.dish_index % len(dish_images)]
        dish_photo = dish_images[spec.dish_index % len(dish_images)]
        banner = build_banner(spec, base_photo, dish_photo)
        output_path = SEASONAL_DIR / f"{spec.key}.jpg"
        banner.save(output_path, quality=92, subsampling=0)
        banner.save(LEGACY_SEASONAL_DIR / f"{spec.key}.jpg", quality=92, subsampling=0)
        print(f"generated {output_path}")


if __name__ == "__main__":
    main()
