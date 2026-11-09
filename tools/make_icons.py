#!/usr/bin/env python3
from PIL import Image, ImageDraw
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]/'public'
IVORY='#FAF7F0'; COLORS=['#E98980','#85B9D8','#9AC9AC']; INK='#353431'
def mark(draw,cx,cy,size):
    r=size*.17; gap=size*.04; start=cx-(r*3+gap*2)
    for i,color in enumerate(COLORS):
        x=start+r+i*(2*r+gap); y=cy-r*.35
        draw.ellipse((x-r,y-r,x+r,y+r),fill=color)
        draw.ellipse((x-r*.62,y-r*.72,x-r*.2,y-r*.3),fill='#FFFFFF')
    draw.rounded_rectangle((cx-size*.48,cy+size*.08,cx+size*.48,cy+size*.2),radius=size*.06,fill='#EEE9DE')
def make_icon(size,name,mask=False):
    im=Image.new('RGB',(size,size),IVORY); d=ImageDraw.Draw(im)
    inset=size*(.12 if mask else .04); radius=size*.22
    d.rounded_rectangle((inset,inset,size-inset,size-inset),radius=radius,fill=IVORY)
    mark(d,size/2,size/2,size*(.58 if mask else .7)); im.save(ROOT/'icons'/name)
def make_splash(w,h):
    im=Image.new('RGB',(w,h),IVORY); d=ImageDraw.Draw(im); s=min(w,h)*.25
    mark(d,w/2,h*.47,s)
    try:
        from PIL import ImageFont
        font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',max(24,int(min(w,h)*.04)))
    except OSError: font=ImageFont.load_default()
    label='COLOR FACTORY'; box=d.textbbox((0,0),label,font=font); d.text(((w-(box[2]-box[0]))/2,h*.57),label,font=font,fill=INK)
    im.save(ROOT/'splash'/f'splash-{w}x{h}.png')
(ROOT/'icons').mkdir(parents=True,exist_ok=True);(ROOT/'splash').mkdir(parents=True,exist_ok=True)
for size,name,mask in [(180,'icon-180.png',False),(192,'icon-192.png',False),(512,'icon-512.png',False),(192,'maskable-192.png',True),(512,'maskable-512.png',True),(32,'favicon-32.png',False)]:make_icon(size,name,mask)
svg='''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128"><rect width="128" height="128" rx="28" fill="#FAF7F0"/><circle cx="39" cy="55" r="19" fill="#E98980"/><circle cx="64" cy="55" r="19" fill="#85B9D8"/><circle cx="89" cy="55" r="19" fill="#9AC9AC"/><rect x="24" y="81" width="80" height="10" rx="5" fill="#EEE9DE"/></svg>'''
(ROOT/'icons'/'icon.svg').write_text(svg)
for w,h in [(1170,2532),(1179,2556),(1290,2796),(1284,2778),(1125,2436),(750,1334),(828,1792)]:make_splash(w,h)
