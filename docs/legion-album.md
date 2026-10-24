# Die Legion: collectible album

Replaces only the chronicle player selector. The existing ranking and podium retain their layout and artwork. Four cards per page; all roster members are available, in the existing weekly-gain order. No data/history changes.

The approved concept is a dark emerald leather album with transparent sleeves and gold-framed portraits. Cards lift from their sleeves, turn 180 degrees to show saved item level and the selected period's actual observations, then settle back when closed. Pages support buttons, arrow keys and horizontal touch swipes; vertical movement remains scrolling. Reduced-motion preferences remove transitions and glints. Only the visible card face is keyboard accessible. Profile links use Siel; tapping the little chart opens the existing detailed chronicle.

## Assets

- `album-leather.webp`: generated empty leather album page, gold stitching and corner protectors, no baked-in data or cards.
- `album-frame.webp`: generated transparent gold filigree overlay, optimized to WebP with alpha preserved.
- `album-duo.webp`: two equal portrait panels regenerated from the approved album mockup (Stecher left, LordSanchez2 right). These are decorative character illustrations, not newly retrieved game screenshots. Existing portraits are used for the remaining players; portrait mapping stays attached to player identity.

Generated via the built-in image generation tool. Final prompts requested an orthographic empty green leather page; a transparent thin gold card frame; and a two-panel portrait sprite preserving the two characters from the approved design. Texture and portraits are independently layered under live HTML controls, so every statistic remains readable and updateable.

## Validation

- `node tests/check-album.mjs`
- `node tests/check-velvet.mjs`
- `node tests/check-progress.mjs`
- Browser inspection at 320px, 390px and desktop: no horizontal overflow, back content fits; flip/back, pagination across all ten players, profile targets and detailed chart links checked.
