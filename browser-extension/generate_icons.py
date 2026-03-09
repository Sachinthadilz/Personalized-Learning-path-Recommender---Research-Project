"""
Icon Generator for Learning Activity Tracker Extension
Creates placeholder icons in different sizes
"""

from PIL import Image, ImageDraw, ImageFont
import os

def create_icon(size, filename):
    """Create a simple icon with the specified size"""
    
    # Create a new image with a gradient background
    img = Image.new('RGB', (size, size), color='white')
    draw = ImageDraw.Draw(img)
    
    # Draw a gradient background
    for i in range(size):
        # Purple gradient
        r = int(102 + (118 - 102) * (i / size))
        g = int(126 + (75 - 126) * (i / size))
        b = int(234 + (162 - 234) * (i / size))
        draw.rectangle([(0, i), (size, i+1)], fill=(r, g, b))
    
    # Draw a circle
    margin = size // 6
    draw.ellipse(
        [(margin, margin), (size - margin, size - margin)],
        fill='white',
        outline='white',
        width=2
    )
    
    # Draw text
    try:
        # Try to use a nice font
        font_size = size // 3
        font = ImageFont.truetype("arial.ttf", font_size)
    except:
        # Fallback to default font
        font = ImageFont.load_default()
    
    # Draw "📊" or "LA" text
    text = "LA"
    
    # Get text bbox to center it
    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    
    text_x = (size - text_width) // 2
    text_y = (size - text_height) // 2
    
    draw.text((text_x, text_y), text, fill=(102, 126, 234), font=font)
    
    # Save the image
    img.save(filename, 'PNG')
    print(f"Created {filename}")

def main():
    """Generate all required icon sizes"""
    
    # Create icons directory if it doesn't exist
    os.makedirs('icons', exist_ok=True)
    
    # Generate icons in required sizes
    sizes = {
        16: 'icons/icon16.png',
        48: 'icons/icon48.png',
        128: 'icons/icon128.png'
    }
    
    for size, filename in sizes.items():
        create_icon(size, filename)
    
    print("\n✅ All icons generated successfully!")
    print("Icons created in the 'icons' directory")

if __name__ == '__main__':
    main()
