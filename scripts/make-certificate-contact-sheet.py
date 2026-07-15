from pathlib import Path
from PIL import Image, ImageDraw

imgs = sorted((Path('assets') / 'certificates').glob('*.jpg'))
thumbs = []
for p in imgs:
    if p.name == 'contact-sheet.jpg':
        continue
    im = Image.open(p).convert('RGB')
    im.thumbnail((180, 140), Image.Resampling.LANCZOS)
    canvas = Image.new('RGB', (200, 170), 'white')
    canvas.paste(im, ((200 - im.width) // 2, 8))
    d = ImageDraw.Draw(canvas)
    d.text((8, 148), p.stem[:24], fill=(0, 0, 0))
    thumbs.append(canvas)

cols = 4
rows = (len(thumbs) + cols - 1) // cols
sheet = Image.new('RGB', (cols * 200, rows * 170), (240, 240, 240))
for i, thumb in enumerate(thumbs):
    sheet.paste(thumb, ((i % cols) * 200, (i // cols) * 170))
sheet.save('assets/certificates/contact-sheet.jpg', quality=90)
