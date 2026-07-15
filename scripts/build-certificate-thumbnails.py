from pathlib import Path
import fitz
from PIL import Image, ImageOps

root = Path.cwd()
source_dir = root / 'Certifications'
out_dir = root / 'assets' / 'certificates'
out_dir.mkdir(parents=True, exist_ok=True)

items = [
    ('professional-certificate', 'Professional Certificate', 'Online professional training', 'Alison_Certificate-5177-50298723.pdf'),
    ('network-access-control', 'Network Access Control', 'Fortinet training certificate', 'certificate_FortiNAC.pdf'),
    ('firewall-security', 'Firewall Security', 'Cisco security training', 'Cisco_Firewall_certificate.pdf'),
    ('cybersecurity-for-users', 'Cybersecurity for Users', 'Awareness training record', 'CYBER_SECURITY_FOR_USERS_BEBAIOSH.pdf'),
    ('fortigate-training', 'FortiGate Training', 'Network security training', 'fortigate.pdf'),
    ('training-certificate-1', 'Training Certificate', 'Professional training record', 'scan0001.jpg'),
    ('training-certificate-2', 'Training Certificate', 'Professional training record', 'scan0003.jpg'),
    ('training-certificate-3', 'Training Certificate', 'Professional training record', 'scan0004.jpg'),
    ('attendance-record-1', 'Attendance Record', 'Professional training attendance', 'Βεβαίωση παρακολούθησης - TSIRIGOTIS Georgios.pdf'),
    ('attendance-record-2', 'Attendance Record', 'Professional training attendance', 'ΒΕΒΑΙΩΣΗ ΠΑΡΑΚΟΛΟΥΘΗΣΗΣ_ΤΣΙΡΙΓΩΤΗΣ ΓΕΩΡΓΙΟΣ.pdf'),
    ('cybersecurity-awareness', 'Cybersecurity Awareness', 'KTPAE E-Learning', 'ΓΕΩΡΓΙΟΣ-ΤΣΙΡΙΓΩΤΗΣ-Cybersecurity-για-τον-χρήστη-KTPAE-Certificate-KTPAE-E-Learning.pdf'),
    ('fraud-corruption-awareness', 'Fraud & Corruption Awareness', 'KTPAE E-Learning', 'ΓΕΩΡΓΙΟΣ-ΤΣΙΡΙΓΩΤΗΣ-Εκπαίδευση-περί-Παρατυπιών-Απάτης-amp-Διαφθοράς-KTPAE-Certificate-KTPAE-E-Learning.pdf'),
    ('information-security-iso', 'Information Security ISO 27001:2022', 'KTPAE E-Learning', 'ΓΕΩΡΓΙΟΣ-ΤΣΙΡΙΓΩΤΗΣ-Εκπαίδευση-στην-Ασφάλεια-Πληροφοριών-–-ISO-270012022-KTPAE-Certificate-KTPAE-E-Learning.pdf'),
]

def fit_to_thumbnail(image, max_width=900):
    image = ImageOps.exif_transpose(image).convert('RGB')
    if image.height > image.width * 1.45:
        image = image.rotate(90, expand=True)
    scale = min(1, max_width / image.width)
    if scale < 1:
        image = image.resize((round(image.width * scale), round(image.height * scale)), Image.Resampling.LANCZOS)
    return image

for slug, title, meta, filename in items:
    src = source_dir / filename
    dst = out_dir / f'{slug}.jpg'
    if src.suffix.lower() == '.pdf':
        doc = fitz.open(src)
        page = doc[0]
        pix = page.get_pixmap(matrix=fitz.Matrix(1.7, 1.7), alpha=False)
        img = Image.frombytes('RGB', [pix.width, pix.height], pix.samples)
        doc.close()
    else:
        img = Image.open(src)
    img = fit_to_thumbnail(img)
    img.save(dst, quality=82, optimize=True, progressive=True)
    print(f'{dst.relative_to(root)} {img.width}x{img.height}')
