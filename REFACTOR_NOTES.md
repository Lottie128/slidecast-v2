# Element-Based Architecture Refactor

## 🎯 What Changed

### Before (Old Architecture)
```
Slide {
  title: string          ← Fixed input
  content: string        ← Fixed input
  animation_type: string ← Applied to title+content only
  elements: []           ← "Extras" you could add
}
```

### After (New Architecture)
```
Slide {
  background_gradient: string
  background_image_url?: string
  elements: SlideElement[]  ← EVERYTHING is an element
}

SlideElement {
  type: 'text' | 'image' | 'shape'
  position: { x, y, width, height }
  content: string | imageUrl | etc
  animation: { type, startMs, durationMs }  ← Per-element control
}
```

---

## ✨ New Features

### 1. **Slide Templates** 🎨
Instead of blank canvas, users pick:
- **Title Slide** - Large title + subtitle
- **Title + Body** - Title with paragraph
- **Bullet Points** - Title + 3 bullet items
- **Two Column** - Side-by-side layout
- **Blank Canvas** - Full control

Templates auto-create elements in correct positions with smart defaults.

### 2. **Smart Text Type Selector** 📝
When adding text, choose:
- **Title** - 56px, bold, white, centered
- **Body** - 24px, normal, white, full width
- **Bullet** - 28px, starts with "•"
- **Caption** - 20px, gray, small
- **Custom** - Full manual control

Each type has preset font size, color, weight, position.

### 3. **Per-Element Animation** ⚡
Every element has its own animation:
- Fade In
- Slide In
- Scale In
- **Typing Effect** (for text only)
- None

You can stagger animations:
```
Title → Typing (0ms - 1000ms)
Bullet 1 → Fade (1200ms - 1500ms)
Bullet 2 → Fade (1600ms - 1900ms)
Image → Slide In (2000ms - 2500ms)
```

### 4. **Drag-to-Position** 🖱️
- Click element to select (blue outline)
- Drag anywhere on canvas to reposition
- Real-time position feedback
- Percentage-based positioning (responsive)

### 5. **Audio from All Text** 🎤
Generate Audio now:
1. Collects ALL text elements
2. Joins them: "Title. Body text. Bullet 1. Bullet 2."
3. Generates single narration track
4. Each text element can animate independently during playback

---

## 🎓 User Workflow

### Old Way (Confusing):
```
1. Edit title input ❌
2. Edit content input ❌
3. Choose animation (applies to both) ❌
4. Add extra elements as "bonus" ❌
```

### New Way (Clean):
```
1. Pick template (or blank) ✅
2. Elements auto-added with smart positions ✅
3. Click element → Edit text/position/animation ✅
4. Add more elements as needed ✅
5. Drag to reposition ✅
6. Generate audio (reads all text) ✅
```

---

## 💡 Why This Is Better

### Professional Design Tools Use This:
- **Figma** - Everything is a layer
- **Canva** - Element-based composition
- **PowerPoint** - Text boxes + images + shapes
- **DaVinci Resolve** - Timeline with tracks

### Benefits:
1. **Flexibility** - Unlimited text blocks, not just title+content
2. **Control** - Animate each element independently
3. **Scalability** - Easy to add shapes, videos, charts later
4. **Intuitive** - Matches user mental model from other tools
5. **Composable** - Mix and match elements freely

---

## 🔧 Technical Details

### Data Structure
```typescript
interface SlideElement {
  id: string;                    // Unique ID
  type: 'text' | 'image' | 'shape';
  
  // Position (percentage 0-100)
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex?: number;               // Layer order
  
  // Text-specific
  textContent?: string;
  textType?: 'title' | 'body' | 'bullet' | 'caption' | 'custom';
  fontSize?: number;
  color?: string;
  fontWeight?: string;
  
  // Image-specific
  imageUrl?: string;             // Data URL or Supabase path
  
  // Animation
  animation?: {
    type: 'fade-in' | 'slide-in' | 'scale-in' | 'typing' | 'none';
    startMs: number;             // When to start
    durationMs: number;          // How long
    delay?: number;              // Optional stagger
  };
}
```

### Audio Generation
```typescript
const textElements = elements.filter(el => el.type === 'text');
const textToSpeak = textElements
  .map(el => el.textContent)
  .join('. ');

// Result: "Title text. Body paragraph. Bullet one. Bullet two."
```

### Typing Animation
```typescript
// Only applies to elements with animation.type === 'typing'
if (element.animation.type === 'typing') {
  const msPerChar = duration / element.textContent.length;
  // Type character-by-character
  // Still respects LEAD_TIME_MS (600ms ahead of audio)
}
```

---

## 🚀 Next Phase Features

### Phase 1 (Polish Current):
- ✅ Keyboard shortcuts (DEL to delete, ESC to deselect)
- ✅ Copy/paste elements
- ✅ Duplicate element button
- ✅ Alignment guides (snap to grid)
- ✅ Multi-select (Shift+Click)

### Phase 2 (Advanced):
- ✅ Animation timeline view
- ✅ Stagger wizard ("Animate all bullets with 200ms delay")
- ✅ Element groups/layers panel
- ✅ Undo/redo

### Phase 3 (Video Export):
- ✅ Render each slide as mini-video
- ✅ Combine audio + element animations
- ✅ Export per-slide or full deck
- ✅ Add transitions between slides

---

## 📊 Migration Notes

### Database Schema (No Breaking Changes)
```sql
-- Old columns still exist for backward compatibility:
title TEXT,
content TEXT,
animation_type TEXT,

-- New column (already added in previous update):
elements JSONB,  -- Array of SlideElement objects

-- Migration strategy:
-- 1. Keep old columns for now
-- 2. New slides save to elements only
-- 3. Old slides load title/content into elements on first edit
-- 4. Remove old columns after full migration
```

### API Endpoints (Unchanged)
```
PATCH /api/projects/:projectId/slides/:slideId
Body: {
  elements: SlideElement[],
  backgroundGradient: string,
  backgroundImageUrl?: string
}

// Still accepts title/content for backward compatibility
```

---

## 🎉 User Experience Improvements

### Before:
"Where do I add a second title?"
"How do I make bullet points?"
"Why can't I move the text?"
"Animation applies to everything, not what I want"

### After:
"Oh, I just add another text element!"
"Bullet point type auto-formats it for me"
"I can drag text anywhere"
"Each element animates exactly how I want"

---

**Version**: 3.0.0 (Major Refactor)  
**Status**: Production Ready ✨  
**Breaking Changes**: None (backward compatible)  
**Deploy Time**: ~2-3 minutes via Render auto-deploy