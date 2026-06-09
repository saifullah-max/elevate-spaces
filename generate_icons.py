from PIL import Image, ImageDraw
import os

# Ensure public directory exists
os.makedirs('public', exist_ok=True)

# Define icon configurations
icons = [
    {
        'name': 'icon-192.png',
        'size': (192, 192),
        'text': 'ES',
        'bg_color': '#6366f1',
        'text_color': '#FFFFFF',
        'font_size': 80
    },
    {
        'name': 'icon-512.png',
        'size': (512, 512),
        'text': 'ES',
        'bg_color': '#6366f1',
        'text_color': '#FFFFFF',
        'font_size': 220
    },
    {
        'name': 'icon-maskable-192.png',
        'size': (192, 192),
        'text': 'ES',
        'bg_color': '#6366f1',
        'text_color': '#FFFFFF',
        'font_size': 80
    },
    {
        'name': 'icon-maskable-512.png',
        'size': (512, 512),
        'text': 'ES',
        'bg_color': '#6366f1',
        'text_color': '#FFFFFF',
        'font_size': 220
    },
    {
        'name': 'icon-upload-96.png',
        'size': (96, 96),
        'text': '⬆',
        'bg_color': '#FFFFFF',
        'text_color': '#6366f1',
        'font_size': 60
    },
    {
        'name': 'icon-history-96.png',
        'size': (96, 96),
        'text': '⏱',
        'bg_color': '#FFFFFF',
        'text_color': '#6366f1',
        'font_size': 60
    },
]

# Create each icon
for icon_config in icons:
    img = Image.new('RGBA', icon_config['size'], color=icon_config['bg_color'])
    draw = ImageDraw.Draw(img)
    
    # Get text dimensions for centering
    text = icon_config['text']
    bbox = draw.textbbox((0, 0), text, font=None)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    
    x = (icon_config['size'][0] - text_width) // 2
    y = (icon_config['size'][1] - text_height) // 2 - 5
    
    draw.text((x, y), text, fill=icon_config['text_color'], font=None)
    
    output_path = os.path.join('public', icon_config['name'])
    img.save(output_path)
    print(f'✓ Created {icon_config["name"]}')

print('\nAll icons created successfully!')
