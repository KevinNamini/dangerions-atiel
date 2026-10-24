# Die Legion: collectible album

The album follows directly after the ranking. The old introductory “Euer Aufstieg” section is removed; the detailed observation chart is collapsed under “Statistiken” after the album and opens when a card’s little chart is tapped. Period controls live under “Zeitraum & Quellen”. The existing ranking and podium retain their layout; portraits remain bound to player identity. Four cards per page; all roster members are available, in the existing weekly-gain order. No data/history changes.

The approved concept is a dark emerald leather album with transparent sleeves and gold-framed portraits. Cards lift from their sleeves, turn 180 degrees to show saved item level and the selected period's actual observations, then settle back when closed. Pages support buttons, arrow keys and horizontal touch swipes; vertical movement remains scrolling. Reduced-motion preferences remove transitions and glints. Only the visible card face is keyboard accessible. Profile links use Siel; tapping the little chart opens the existing detailed chronicle.

## Assets

- `album-leather.webp`: generated empty leather album page, gold stitching and corner protectors, no baked-in data or cards.
- `album-frame.webp`: generated transparent gold filigree overlay, optimized to WebP with alpha preserved.
- `album-duo.webp`: two equal portrait panels regenerated from the approved album mockup (Stecher left, LordSanchez2 right). These are decorative character illustrations, not newly retrieved game screenshots. The main three players retain their existing portrait artwork. Five additional profile-matched portrait illustrations complete the collection; their identity mapping also covers ranking thumbnails and future podium positions.

Generated via the built-in image generation tool. Final prompts requested an orthographic empty green leather page; a transparent thin gold card frame; and a two-panel portrait sprite preserving the two characters from the approved design. Texture and portraits are independently layered under live HTML controls, so every statistic remains readable and updateable.

## Validation

- `node tests/check-album.mjs`
- `node tests/check-velvet.mjs`
- `node tests/check-progress.mjs`
- Browser inspection at 320px, 390px and desktop: no horizontal overflow, back content fits; flip/back, pagination across all ten players, profile targets and detailed chart links checked.

## Portrait completion and sleeve fix · 24 October 2026

All sleeve layers (outer plastic border/shadow, seam and translucent front layer) are hidden while a card is lifted/flipped. The card’s own gold frame remains visible. Closing a card restores its pocket.

Five new 1024×1536 WebP assets generated with the built-in image-generation tool (not the CLI): `FumosLee-hero.webp`, `BrouceLee-hero.webp`, `Roctopus-hero.webp`, `S7onedMonkey-hero.webp`, `Mocro-hero.webp`. Source identity references: the existing NC profile images for the first four and the public NC profile image for Mocro (`gameServerKey=2322`, `charKey=653584895922290394`). They are decorative interpretations, not current equipment observations. Game data is unchanged.

Shared prompt: “Create one premium vertical 2:3 portrait for the Dangerions collectible album. Preserve the profile reference’s character face, gender, hairstyle, headgear and major costume features. Use the existing velvet portraits and album duo as style references only: cinematic realistic fantasy, intricate engraved metal, warm gold rim light, dark green forest and golden bokeh, close chest-up framing. No text, frames, numbers or interface.” Character-specific constraints:

- FumosLee: tall split silver helmet, wing motif, oval blue gem, chainmail obscuring eyes, royal blue and silver armor; do not invent a face.
- BrouceLee: swept-back black hair, grey moustache, gold winged brow circlet, graphite armor and high collar.
- Roctopus: dark hair in loose bun, pale smooth face, silver-black mask over viewer-right eye, broad white fur collar and navy armor.
- S7onedMonkey: platinum swept-up undercut, light stubble, asymmetric black and ivory-gold filigree mask, cream high-collared clothing.
- Mocro: adult female character, straight black fringe and long hair, pale skin, light eyes, openwork gold hair ornaments, fitted black-gold armor.

Validated 320px and 390px mobile layouts and desktop, hidden sleeve layers when flipped/restoration on return, five loaded new portrait assets, page navigation and the relocated detailed statistics.
